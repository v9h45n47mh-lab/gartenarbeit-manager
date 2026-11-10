"""Map family members to actual HA users."""
try:
    import probatio as vol
except ImportError:
    import voluptuous as vol
from homeassistant import config_entries
from homeassistant.core import callback

from .const import DOMAIN, TITLE
from .engine import PEOPLE, validate_mapping


async def active_users(hass):
    return {u.id: u.name or u.id for u in await hass.auth.async_get_users()
            if u.is_active and not u.system_generated}


def user_schema(users, defaults):
    fields = {}
    for person in PEOPLE:
        default = defaults.get(person)
        if default not in users:
            matches = [uid for uid, name in users.items() if name.casefold() == person.casefold()]
            default = matches[0] if len(matches) == 1 else None
        fields[vol.Required(person, **({"default": default} if default else {}))] = vol.In(users)
    return vol.Schema(fields)


class ConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    VERSION = 1

    async def async_step_user(self, user_input=None):
        await self.async_set_unique_id(DOMAIN)
        self._abort_if_unique_id_configured()
        users = await active_users(self.hass)
        errors = {}
        if user_input is not None:
            try:
                validate_mapping(user_input, users)
            except ValueError:
                errors["base"] = "invalid_users"
            else:
                return self.async_create_entry(title=TITLE, data={"users": user_input})
        return self.async_show_form(step_id="user", data_schema=user_schema(users, user_input or {}), errors=errors)

    @staticmethod
    @callback
    def async_get_options_flow(config_entry):
        return OptionsFlow()


class OptionsFlow(config_entries.OptionsFlow):
    async def async_step_init(self, user_input=None):
        users = await active_users(self.hass)
        errors = {}
        if user_input is not None:
            try:
                validate_mapping(user_input, users)
            except ValueError:
                errors["base"] = "invalid_users"
            else:
                return self.async_create_entry(title="", data={"users": user_input})
        defaults = user_input or self.config_entry.options.get("users", self.config_entry.data["users"])
        return self.async_show_form(step_id="init", data_schema=user_schema(users, defaults), errors=errors)
