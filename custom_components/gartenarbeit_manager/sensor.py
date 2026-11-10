"""Real garden account balances, also used as the bounded write targets."""
from homeassistant.components.sensor import SensorEntity
from homeassistant.const import UnitOfTime
from homeassistant.helpers.dispatcher import async_dispatcher_connect

from .const import DOMAIN, SIGNAL_UPDATED
from .engine import CHILDREN, account_balance


async def async_setup_entry(hass, entry, async_add_entities):
    manager = hass.data[DOMAIN]
    async_add_entities([GardenAccount(manager, entry.entry_id, child) for child in CHILDREN])


class GardenAccount(SensorEntity):
    """Remaining minutes of one account: debt is positive, credit is negative."""

    _attr_should_poll = False
    _attr_native_unit_of_measurement = UnitOfTime.MINUTES
    _attr_icon = "mdi:leaf-circle-outline"

    def __init__(self, manager, entry_id, child):
        self.manager, self.child = manager, child
        self._attr_unique_id = f"{entry_id}_{child.lower()}"
        self._attr_name = f"Gartenarbeit {child}"

    @property
    def native_value(self):
        return account_balance(self.manager.data, self.child)["remaining"]

    async def async_added_to_hass(self):
        await super().async_added_to_hass()
        self.manager.account_entities[self.child] = self
        self.async_on_remove(async_dispatcher_connect(
            self.hass, SIGNAL_UPDATED, self.async_write_ha_state))

    async def async_will_remove_from_hass(self):
        if self.manager.account_entities.get(self.child) is self:
            self.manager.account_entities.pop(self.child, None)
        await super().async_will_remove_from_hass()
