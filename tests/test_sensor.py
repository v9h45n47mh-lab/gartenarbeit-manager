"""Real account entities, live state updates, lifecycle and write-target identity."""
import importlib
from types import SimpleNamespace
import unittest
from unittest.mock import AsyncMock

from test_adapter import ACCOUNT_IDS, MAPPING, PAUL, VERA, Store, gm, payload

sensor = importlib.import_module('gm_component.sensor')


class AccountSensorTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        Store.records = {}
        self.hass = SimpleNamespace(data={})
        self.entry = SimpleNamespace(entry_id='garden-config', data={'users':MAPPING}, options={})
        self.manager = gm.Manager(self.hass, self.entry)
        self.hass.data[gm.DOMAIN] = self.manager
        self.entities = []
        await sensor.async_setup_entry(self.hass, self.entry, self.entities.extend)
        for entity in self.entities:
            entity.hass = self.hass
            entity.entity_id = ACCOUNT_IDS[entity.child]
            await entity.async_added_to_hass()

    async def asyncTearDown(self):
        for entity in self.entities:
            if entity.child in self.manager.account_entity_ids:
                await entity.async_will_remove_from_hass()

    async def test_entities_expose_actual_balance_and_no_booking_details(self):
        paul = next(e for e in self.entities if e.child=='Paul')
        self.assertEqual(self.manager.account_entity_ids, ACCOUNT_IDS)
        self.assertEqual(paul._attr_unique_id, 'garden-config_paul')
        self.assertEqual(paul.native_value, 0)
        await self.manager.mutate(VERA,0,'add',payload())
        self.assertEqual(paul.native_value, 15)
        report=payload('worked',minutes=30)
        await self.manager.mutate(PAUL,1,'add',report)
        self.assertEqual(paul.native_value, 15)
        await self.manager.mutate(VERA,2,'approve',{'id':report['request_id'],'minutes':20})
        self.assertEqual(paul.native_value, -5)
        self.assertEqual(paul.writes, 3)
        self.assertFalse(hasattr(paul,'extra_state_attributes'))

    async def test_failed_save_does_not_publish_a_sensor_update(self):
        self.manager.store.async_save=AsyncMock(side_effect=OSError('disk'))
        with self.assertRaises(OSError):
            await self.manager.mutate(VERA,0,'add',payload())
        for entity in self.entities:
            self.assertEqual(entity.native_value,0)
            self.assertEqual(getattr(entity,'writes',0),0)

    async def test_removed_account_cannot_still_be_used_as_target(self):
        paul=next(e for e in self.entities if e.child=='Paul')
        await paul.async_will_remove_from_hass()
        with self.assertRaises(ValueError):
            self.manager.mutation_target(PAUL,'add',payload('worked'),ACCOUNT_IDS['Paul'])

    async def test_live_entity_rename_updates_card_and_backend_target(self):
        paul=next(e for e in self.entities if e.child=='Paul')
        paul.entity_id='sensor.pauls_garden_account'
        self.assertEqual(self.manager.snapshot(PAUL)['balances'][0]['entity_id'],paul.entity_id)
        self.assertEqual(self.manager.mutation_target(PAUL,'add',payload('worked'),paul.entity_id),paul.entity_id)
        with self.assertRaises(PermissionError):
            self.manager.mutation_target(PAUL,'add',payload('worked'),ACCOUNT_IDS['Paul'])

    async def test_unload_failure_keeps_manager_available(self):
        self.hass.config_entries=SimpleNamespace(async_unload_platforms=AsyncMock(return_value=False))
        self.assertFalse(await gm.async_unload_entry(self.hass,self.entry))
        self.assertIs(self.hass.data[gm.DOMAIN],self.manager)

    async def test_platform_is_forwarded_on_setup(self):
        self.hass.config_entries=SimpleNamespace(async_forward_entry_setups=AsyncMock())
        self.entry.add_update_listener=lambda listener:lambda:None
        self.entry.async_on_unload=lambda cancel:None
        self.assertTrue(await gm.async_setup_entry(self.hass,self.entry))
        self.hass.config_entries.async_forward_entry_setups.assert_awaited_once_with(self.entry,['sensor'])


if __name__=='__main__':unittest.main()
