"""Garden time ledger. Positive minutes are owed; negative minutes are credit.

This module has no HA dependency so authorization and accounting can be tested
independently. Mutations return copies; callers publish only after storage succeeds.
"""
from __future__ import annotations

import base64
import binascii
from copy import deepcopy
from datetime import date
import hashlib
import json
import re
from uuid import UUID

ADULTS = ("Vera", "Manuel")
CHILDREN = ("Maximilian", "Paul")
PEOPLE = (*ADULTS, *CHILDREN)
MAX_PHOTO_BYTES = 1024 * 1024


def empty_data():
    return {"revision": 0, "entries": []}


def validate_mapping(mapping, available=None):
    if not isinstance(mapping, dict) or set(mapping) != set(PEOPLE):
        raise ValueError("Bitte alle vier Familienmitglieder zuordnen.")
    if any(not isinstance(v, str) or not v for v in mapping.values()):
        raise ValueError("Bitte gültige Home-Assistant-Benutzer wählen.")
    if len(set(mapping.values())) != len(PEOPLE):
        raise ValueError("Jeder Person muss ein eigener Benutzer zugeordnet sein.")
    if available is not None and not set(mapping.values()).issubset(available):
        raise ValueError("Ein ausgewählter Benutzer ist nicht mehr verfügbar.")


def actor_for(user_id, mapping, is_admin=False):
    validate_mapping(mapping)
    for person, uid in mapping.items():
        if uid == user_id:
            return {"id": user_id, "name": person, "parent": person in ADULTS}
    if is_admin:
        return {"id": user_id, "name": "Administrator", "parent": True}
    raise PermissionError("Dein HA-Benutzer ist keiner Person im Gartenarbeit Manager zugeordnet.")


def require_parent(actor):
    if not actor["parent"]:
        raise PermissionError("Nur Vera und Manuel dürfen Zuweisungen, Korrekturen und Freigaben verwalten.")


def visible(actor, row):
    return actor["parent"] or row["child"] == actor["name"]


def can_edit(actor, row):
    return actor["parent"] or (
        row["kind"] == "worked" and row["review_status"] == "pending"
        and row["child"] == actor["name"] and row["actor_id"] == actor["id"]
    )


def entry_id(value):
    try:
        if not isinstance(value, str) or str(UUID(value)) != value:
            raise ValueError
    except (ValueError, TypeError, AttributeError):
        raise ValueError("Ungültige Buchungskennung.") from None
    return value


def values(payload, kind, today):
    day = payload.get("date")
    try:
        if not isinstance(day, str) or not re.fullmatch(r"\d{4}-\d{2}-\d{2}", day):
            raise ValueError
        parsed = date.fromisoformat(day)
        if not date(2020, 1, 1) <= parsed <= today:
            raise ValueError
    except (ValueError, TypeError):
        raise ValueError("Bitte ein gültiges Datum zwischen 01.01.2020 und heute wählen.") from None
    reason = payload.get("reason")
    if not isinstance(reason, str) or not 1 <= len(reason.strip()) <= 500:
        raise ValueError("Bitte eine Beschreibung mit 1 bis 500 Zeichen eingeben.")
    minutes = payload.get("minutes")
    if type(minutes) is not int or minutes == 0 or abs(minutes) > 1440:
        if kind == "correction":
            raise ValueError("Bitte ganze Minuten von −1440 bis +1440 außer 0 eingeben.")
        raise ValueError("Bitte ganze Minuten zwischen 1 und 1440 eingeben.")
    if kind == "assigned" and minutes not in (5, 10, 15):
        raise ValueError("Bitte 5, 10 oder 15 Minuten zuweisen.")
    if kind == "worked" and minutes < 1:
        raise ValueError("Bitte positive Arbeitsminuten eintragen.")
    return {"minutes": -minutes if kind == "worked" else minutes,
            "date": day, "reason": reason.strip()}


def validate_photo(value):
    """Validate compressed image data before it reaches HA storage."""
    if value is None or value == "":
        return None
    if not isinstance(value, str) or len(value) > 1_400_000:
        raise ValueError("Das aufbereitete Foto darf höchstens 1 MB groß sein.")
    match = re.fullmatch(r"data:(image/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})", value)
    if not match:
        raise ValueError("Bitte ein JPG-, PNG- oder WebP-Foto wählen.")
    try:
        raw = base64.b64decode(match[2], validate=True)
    except (binascii.Error, ValueError):
        raise ValueError("Das Foto konnte nicht gelesen werden.") from None
    signatures = {"image/jpeg": raw.startswith(b"\xff\xd8\xff"),
                  "image/png": raw.startswith(b"\x89PNG\r\n\x1a\n"),
                  "image/webp": raw[:4] == b"RIFF" and raw[8:12] == b"WEBP"}
    if not 64 <= len(raw) <= MAX_PHOTO_BYTES or not signatures[match[1]]:
        raise ValueError("Das Fotoformat oder die Fotogröße ist ungültig.")
    return value


def request_hash(payload):
    # Only semantic fields participate; unknown/client role fields are ignored.
    raw = {k: payload.get(k) for k in ("child", "kind", "minutes", "date", "reason", "photo")}
    return hashlib.sha256(json.dumps(raw, sort_keys=True, ensure_ascii=False).encode()).hexdigest()


def find_entry(data, eid, actor):
    entry_id(eid)
    row = next((r for r in data["entries"] if r["id"] == eid and visible(actor, r)), None)
    if row is None:
        raise ValueError("Buchung nicht gefunden.")
    return row


def duplicate(data, payload, actor):
    eid = entry_id(payload.get("request_id"))
    row = next((r for r in data["entries"] if r["id"] == eid), None)
    if row is None:
        return False
    if row["actor_id"] != actor["id"] or row["request_hash"] != request_hash(payload):
        raise ValueError("Diese Buchungskennung wurde bereits verwendet. Bitte das Formular erneut öffnen.")
    return True


def add_entry(data, payload, actor, today, now, photo_id=None):
    child, kind = payload.get("child"), payload.get("kind")
    if child not in CHILDREN or kind not in ("assigned", "worked", "correction"):
        raise ValueError("Bitte Kind und Buchungsart korrekt wählen.")
    if kind == "worked":
        if actor["parent"] or actor["name"] != child:
            raise PermissionError("Du kannst nur deine eigene Gartenarbeit melden.")
    else:
        require_parent(actor)
    if duplicate(data, payload, actor):
        return deepcopy(data)
    item = values(payload, kind, today)
    item.update(id=entry_id(payload["request_id"]), child=child, kind=kind,
                actor_id=actor["id"], actor_name=actor["name"], created_at=now,
                review_status="pending" if kind == "worked" else "approved",
                reported_minutes=payload["minutes"] if kind == "worked" else None,
                reviewed_by=None, reviewed_at=None, photo_id=photo_id,
                request_hash=request_hash(payload), history=[])
    result = deepcopy(data)
    result["entries"].append(item)
    return result


def update_entry(data, payload, actor, today, now, photo_id=None):
    row = find_entry(data, payload.get("id"), actor)
    if not can_edit(actor, row):
        raise PermissionError("Du kannst nur eigene, noch nicht freigegebene Gartenarbeit bearbeiten.")
    if payload.get("child", row["child"]) != row["child"] or payload.get("kind", row["kind"]) != row["kind"]:
        raise ValueError("Kind und Buchungsart bleiben beim Bearbeiten erhalten.")
    changes = values(payload, row["kind"], today)
    result = deepcopy(data)
    item = find_entry(result, row["id"], actor)
    item["history"].append({"action": "edited", "by": actor["name"], "at": now,
                            "before": {k: item[k] for k in ("minutes", "date", "reason", "review_status")}})
    item.update(changes)
    if "photo" in payload:
        item["photo_id"] = photo_id
    if item["kind"] == "worked":
        if not actor["parent"]:
            item["reported_minutes"] = -item["minutes"]
        if item["review_status"] == "approved":
            item.update(reviewed_by=actor["name"], reviewed_at=now)
    return result


def approve_entry(data, payload, actor, now):
    require_parent(actor)
    row = find_entry(data, payload.get("id"), actor)
    if row["kind"] != "worked":
        raise ValueError("Nur gemeldete Gartenarbeit kann freigegeben werden.")
    if row["review_status"] != "pending":
        raise ValueError("Diese Gartenarbeit wurde bereits freigegeben. Bitte Ansicht aktualisieren.")
    minutes = payload.get("minutes")
    if type(minutes) is not int or not 1 <= minutes <= 1440:
        raise ValueError("Bitte 1 bis 1440 ganze Minuten freigeben.")
    result = deepcopy(data)
    item = find_entry(result, row["id"], actor)
    item["history"].append({"action": "approved", "by": actor["name"], "at": now,
                            "before": {k: item[k] for k in ("minutes", "date", "reason", "review_status")}})
    item.update(minutes=-minutes, review_status="approved", reviewed_by=actor["name"], reviewed_at=now)
    return result


def snapshot(data, actor, today):
    entries = []
    for row in data["entries"]:
        if not visible(actor, row):
            continue
        item = {k: deepcopy(v) for k, v in row.items()
                if k not in ("actor_id", "request_hash", "photo_id")}
        item.update(photo=bool(row.get("photo_id")), can_edit=can_edit(actor, row),
                    can_approve=actor["parent"] and row["kind"] == "worked" and row["review_status"] == "pending")
        entries.append(item)
    entries.sort(key=lambda r: (r["review_status"] == "pending", r["date"], r["created_at"], r["id"]), reverse=True)
    balances = []
    for child in CHILDREN:
        if not actor["parent"] and actor["name"] != child:
            continue
        rows = [r for r in entries if r["child"] == child]
        approved = [r for r in rows if r["review_status"] == "approved"]
        balances.append({"child": child, "remaining": sum(r["minutes"] for r in approved),
                         "assigned": sum(r["minutes"] for r in approved if r["kind"] == "assigned"),
                         "worked": -sum(r["minutes"] for r in approved if r["kind"] == "worked"),
                         "corrections": sum(r["minutes"] for r in approved if r["kind"] == "correction"),
                         "pending": -sum(r["minutes"] for r in rows if r["review_status"] == "pending")})
    return {"revision": data["revision"], "today": today.isoformat(), "parent": actor["parent"],
            "person": actor["name"], "entries": entries, "balances": balances}
