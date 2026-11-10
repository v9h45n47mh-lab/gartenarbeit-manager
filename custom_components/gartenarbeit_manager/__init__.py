"""Local garden time accounts with authenticated HA WebSocket operations."""
from __future__ import annotations

import asyncio
import logging
from pathlib import Path
from uuid import uuid4

try:
    import probatio as vol
except ImportError:
    import voluptuous as vol
from homeassistant.components import frontend, websocket_api
from homeassistant.components.http import StaticPathConfig
from homeassistant.auth.permissions.const import POLICY_CONTROL
from homeassistant.const import Platform
from homeassistant.helpers.dispatcher import async_dispatcher_send
from homeassistant.helpers.storage import Store
from homeassistant.util import dt as dt_util

from .const import DOMAIN, SIGNAL_UPDATED, TITLE, VERSION
from .engine import (actor_for, add_entry, approve_entry, duplicate, empty_data,
                     find_entry, snapshot, update_entry, validate_photo)

_LOGGER = logging.getLogger(__name__)
PLATFORMS = [Platform.SENSOR]


async def async_setup(hass, config):
    await hass.http.async_register_static_paths([StaticPathConfig(
        "/gartenarbeit-manager/card.js", str(Path(__file__).parent / "frontend" / "card.js"), False)])
    frontend.add_extra_js_url(hass, "/gartenarbeit-manager/card.js?v=" + VERSION)
    for command in (ws_get, ws_add, ws_update, ws_approve, ws_photo):
        websocket_api.async_register_command(hass, command)
    return True


async def async_setup_entry(hass, entry):
    manager = Manager(hass, entry)
    await manager.load()
    hass.data[DOMAIN] = manager
    try:
        await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    except Exception:
        hass.data.pop(DOMAIN, None)
        raise
    entry.async_on_unload(entry.add_update_listener(reload_entry))
    return True


async def reload_entry(hass, entry):
    await hass.config_entries.async_reload(entry.entry_id)


async def async_unload_entry(hass, entry):
    if not await hass.config_entries.async_unload_platforms(entry, PLATFORMS):
        return False
    manager = hass.data.get(DOMAIN)
    if manager:
        async with manager.lock:
            hass.data.pop(DOMAIN, None)
    return True


class Manager:
    def __init__(self, hass, entry):
        self.hass, self.entry = hass, entry
        self.data = empty_data()
        self.lock = asyncio.Lock()
        self.store = Store(hass, 1, DOMAIN)
        self.account_entities = {}

    async def load(self):
        self.data = await self.store.async_load() or empty_data()

    @property
    def account_entity_ids(self):
        return {child: entity.entity_id for child, entity in self.account_entities.items()
                if entity.entity_id}

    def today(self):
        return dt_util.as_local(dt_util.utcnow()).date()

    def actor(self, user):
        if not user or not user.is_active:
            raise PermissionError("Keine gültige Anmeldung.")
        mapping = self.entry.options.get("users", self.entry.data["users"])
        return actor_for(user.id, mapping, user.is_admin)

    def snapshot(self, actor):
        result = snapshot(self.data, actor, self.today())
        for balance in result["balances"]:
            balance["entity_id"] = self.account_entity_ids.get(balance["child"])
        return {**result, "version": VERSION}

    def mutation_target(self, actor, operation, payload, entity_id):
        """Bind the claimed HA resource to the account this write actually changes."""
        if operation == "add":
            child = payload.get("child")
        else:
            child = find_entry(self.data, payload.get("id"), actor)["child"]
        expected = self.account_entity_ids.get(child)
        if not expected:
            raise ValueError("Kontoentität nicht verfügbar. Integration und HA-Oberfläche neu laden.")
        if entity_id != expected:
            raise PermissionError("Das angegebene Ziel gehört nicht zum betroffenen Gartenzeitkonto.")
        return expected

    def photo_store(self, photo_id):
        return Store(self.hass, 1, DOMAIN + ".photo." + photo_id)

    async def photo(self, actor, eid):
        async with self.lock:
            row = find_entry(self.data, eid, actor)
            if not row.get("photo_id"):
                raise ValueError("Kein Foto vorhanden.")
            photo = await self.photo_store(row["photo_id"]).async_load()
            if not photo:
                raise ValueError("Das Foto ist nicht verfügbar.")
            return {"photo": photo["data"]}

    async def mutate(self, actor, revision, operation, payload):
        async with self.lock:
            # Retries after a lost acknowledgement must not create a second booking.
            if operation == "add" and duplicate(self.data, payload, actor):
                return self.snapshot(actor)
            if type(revision) is not int or revision != self.data["revision"]:
                raise ValueError("Die Daten wurden inzwischen geändert. Bitte das Formular schließen, aktualisieren und erneut prüfen.")
            now = dt_util.utcnow().isoformat()
            if operation == "approve" and "photo" in payload:
                raise ValueError("Bei einer Freigabe wird das vorhandene Foto beibehalten.")
            photo_id = str(uuid4()) if payload.get("photo") else None
            old_photo = None
            if operation == "add":
                result = add_entry(self.data, payload, actor, self.today(), now, photo_id)
            elif operation == "update":
                old_photo = find_entry(self.data, payload.get("id"), actor).get("photo_id")
                result = update_entry(self.data, payload, actor, self.today(), now, photo_id)
            elif operation == "approve":
                result = approve_entry(self.data, payload, actor, now)
            else:
                raise ValueError("Unbekannte Aktion.")
            # Authorization and accounting validation run before any file is written.
            photo = validate_photo(payload["photo"]) if "photo" in payload else None
            result["revision"] = self.data["revision"] + 1
            if photo:
                await self.photo_store(photo_id).async_save({"data": photo})
            try:
                await self.store.async_save(result)
            except Exception:
                if photo:
                    await self.cleanup_photo(photo_id)
                raise
            self.data = result
            async_dispatcher_send(self.hass, SIGNAL_UPDATED)
            # Immutable photo objects make ledger publication atomic. Cleanup failure
            # cannot turn an acknowledged booking into a failed request.
            if operation == "update" and "photo" in payload and old_photo:
                await self.cleanup_photo(old_photo)
            return self.snapshot(actor)

    async def cleanup_photo(self, photo_id):
        try:
            await self.photo_store(photo_id).async_remove()
        except Exception:
            _LOGGER.warning("Altes Gartenfoto konnte nicht entfernt werden")


async def respond(hass, connection, msg, operation=None):
    manager = hass.data.get(DOMAIN)
    if not manager:
        connection.send_error(msg["id"], "not_loaded", TITLE + " zuerst als Integration einrichten.")
        return
    try:
        actor = manager.actor(connection.user)
        if operation == "photo":
            result = await manager.photo(actor, msg["entry_id"])
        elif operation:
            target = manager.mutation_target(actor, operation, msg["entry"], msg.get("entity_id"))
            if not connection.user.permissions.check_entity(target, POLICY_CONTROL):
                raise PermissionError("Keine Bedienberechtigung für dieses Gartenzeitkonto.")
            result = await manager.mutate(actor, msg["revision"], operation, msg["entry"])
        else:
            result = manager.snapshot(actor)
        connection.send_result(msg["id"], result)
    except PermissionError as err:
        connection.send_error(msg["id"], "unauthorized", str(err))
    except (ValueError, TypeError, KeyError, OverflowError) as err:
        connection.send_error(msg["id"], "invalid_input", str(err))
    except Exception:
        _LOGGER.exception("Gartenarbeit konnte nicht verarbeitet werden")
        connection.send_error(msg["id"], "storage_error", "Speichern oder Laden fehlgeschlagen. Bitte HA-Protokoll prüfen.")


@websocket_api.websocket_command({vol.Required("type"): DOMAIN + "/get"})
@websocket_api.async_response
async def ws_get(hass, connection, msg):
    await respond(hass, connection, msg)


@websocket_api.websocket_command({vol.Required("type"): DOMAIN + "/add",
    vol.Required("entity_id"): str, vol.Required("revision"): vol.All(int, vol.Range(min=0)), vol.Required("entry"): dict})
@websocket_api.async_response
async def ws_add(hass, connection, msg):
    await respond(hass, connection, msg, "add")


@websocket_api.websocket_command({vol.Required("type"): DOMAIN + "/update",
    vol.Required("entity_id"): str, vol.Required("revision"): vol.All(int, vol.Range(min=0)), vol.Required("entry"): dict})
@websocket_api.async_response
async def ws_update(hass, connection, msg):
    await respond(hass, connection, msg, "update")


@websocket_api.websocket_command({vol.Required("type"): DOMAIN + "/approve",
    vol.Required("entity_id"): str, vol.Required("revision"): vol.All(int, vol.Range(min=0)), vol.Required("entry"): dict})
@websocket_api.async_response
async def ws_approve(hass, connection, msg):
    await respond(hass, connection, msg, "approve")


@websocket_api.websocket_command({vol.Required("type"): DOMAIN + "/photo", vol.Required("entry_id"): str})
@websocket_api.async_response
async def ws_photo(hass, connection, msg):
    await respond(hass, connection, msg, "photo")
