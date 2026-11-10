"""HA adapter contract tests with in-memory HA stores (no running HA required)."""
import asyncio
import base64
from copy import deepcopy
from datetime import datetime, timezone
import importlib.util
from pathlib import Path
import sys
from types import ModuleType, SimpleNamespace
import unittest
from unittest.mock import AsyncMock
from uuid import uuid4

ROOT=Path(__file__).parents[1]
# Replace only HA runtime surfaces; accounting runs as the real component module.
def module(name,**attrs):
    m=ModuleType(name);m.__dict__.update(attrs);sys.modules[name]=m;return m
module('probatio',Required=lambda x:x,All=lambda *a:object,Range=lambda **kw:object)
module('homeassistant')
module('homeassistant.components')
module('homeassistant.components.frontend',add_extra_js_url=lambda *a:None)
module('homeassistant.components.websocket_api',websocket_command=lambda schema:lambda f:f,async_response=lambda f:f,async_register_command=lambda *a:None)
module('homeassistant.components.http',StaticPathConfig=lambda *a:a)
module('homeassistant.auth')
module('homeassistant.auth.permissions')
module('homeassistant.auth.permissions.const',POLICY_CONTROL='control',POLICY_READ='read')
module('homeassistant.const',Platform=SimpleNamespace(SENSOR='sensor'),UnitOfTime=SimpleNamespace(MINUTES='min'))
module('homeassistant.helpers')
def dispatcher_send(hass,signal):
    for listener in list(getattr(hass,'_signals',{}).get(signal,[])):listener()
def dispatcher_connect(hass,signal,listener):
    if not hasattr(hass,'_signals'):hass._signals={}
    listeners=hass._signals.setdefault(signal,[]);listeners.append(listener)
    return lambda:listeners.remove(listener)
module('homeassistant.helpers.dispatcher',async_dispatcher_send=dispatcher_send,async_dispatcher_connect=dispatcher_connect)
class SensorEntity:
    async def async_added_to_hass(self):self._removers=[]
    async def async_will_remove_from_hass(self):
        for remove in self._removers:remove()
    def async_on_remove(self,fn):self._removers.append(fn)
    def async_write_ha_state(self):self.writes=getattr(self,'writes',0)+1
module('homeassistant.components.sensor',SensorEntity=SensorEntity)
class Store:
    records={}
    def __init__(self,hass,version,key):self.key=key
    async def async_load(self):return deepcopy(self.records.get(self.key))
    async def async_save(self,data):self.records[self.key]=deepcopy(data)
    async def async_remove(self):self.records.pop(self.key,None)
module('homeassistant.helpers.storage',Store=Store)
module('homeassistant.util')
module('homeassistant.util.dt',utcnow=lambda:datetime(2026,11,10,9,tzinfo=timezone.utc),as_local=lambda x:x)
spec=importlib.util.spec_from_file_location('gm_component',ROOT/'custom_components/gartenarbeit_manager/__init__.py',submodule_search_locations=[str(ROOT/'custom_components/gartenarbeit_manager')])
gm=importlib.util.module_from_spec(spec);sys.modules[spec.name]=gm;spec.loader.exec_module(gm)
MAPPING={'Vera':'v','Manuel':'m','Maximilian':'max','Paul':'p'}
ACCOUNT_IDS={'Maximilian':'sensor.gartenarbeit_maximilian','Paul':'sensor.gartenarbeit_paul'}
VERA=gm.actor_for('v',MAPPING);PAUL=gm.actor_for('p',MAPPING);MAX=gm.actor_for('max',MAPPING)
PHOTO='data:image/png;base64,'+base64.b64encode(b'\x89PNG\r\n\x1a\n'+b'0'*100).decode()
def payload(kind='assigned',**kw):return {'request_id':str(uuid4()),'kind':kind,'child':'Paul','minutes':15,'date':'2026-11-10','reason':'Gartenarbeit',**kw}
class AdapterTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        Store.records={};self.hass=SimpleNamespace(data={})
        self.manager=gm.Manager(self.hass,SimpleNamespace(data={'users':MAPPING},options={}))
        self.manager.account_entities={child:SimpleNamespace(entity_id=eid) for child,eid in ACCOUNT_IDS.items()}
        self.hass.data[gm.DOMAIN]=self.manager
    async def test_storage_failure_never_publishes_new_balance(self):
        self.manager.store.async_save=AsyncMock(side_effect=OSError('disk'))
        with self.assertRaises(OSError):await self.manager.mutate(VERA,0,'add',payload())
        self.assertEqual(self.manager.data,gm.empty_data())
    async def test_photo_failure_never_publishes_booking(self):
        self.manager.photo_store=lambda key:SimpleNamespace(async_save=AsyncMock(side_effect=OSError('disk')))
        with self.assertRaises(OSError):await self.manager.mutate(PAUL,0,'add',payload('worked',photo=PHOTO))
        self.assertEqual(self.manager.data,gm.empty_data())
    async def test_ledger_failure_removes_new_photo(self):
        self.manager.store.async_save=AsyncMock(side_effect=OSError('disk'))
        with self.assertRaises(OSError):await self.manager.mutate(PAUL,0,'add',payload('worked',photo=PHOTO))
        self.assertEqual(Store.records,{})
    async def test_save_reload_preserves_bookings_and_photos(self):
        p=payload('worked',photo=PHOTO)
        await self.manager.mutate(PAUL,0,'add',p)
        reloaded=gm.Manager(self.hass,self.manager.entry);await reloaded.load()
        self.assertEqual(reloaded.data,self.manager.data)
        self.assertEqual((await reloaded.photo(PAUL,p['request_id']))['photo'],PHOTO)
        with self.assertRaises(ValueError):await reloaded.photo(MAX,p['request_id'])
    async def test_duplicate_retry_survives_lost_response_and_stale_revision(self):
        p=payload();await self.manager.mutate(VERA,0,'add',p)
        await self.manager.mutate(VERA,1,'add',payload())
        result=await self.manager.mutate(VERA,0,'add',p)
        self.assertEqual(result['revision'],2);self.assertEqual(len(result['entries']),2)
    async def test_parallel_tabs_cannot_overwrite_each_other(self):
        results=await asyncio.gather(self.manager.mutate(VERA,0,'add',payload()),self.manager.mutate(VERA,0,'add',payload()),return_exceptions=True)
        self.assertEqual(sum(isinstance(r,dict) for r in results),1)
        self.assertEqual(len(self.manager.data['entries']),1)
        self.assertEqual(self.manager.data['revision'],1)
    async def test_keep_and_remove_photo(self):
        p=payload('worked',photo=PHOTO);await self.manager.mutate(PAUL,0,'add',p)
        edit={'id':p['request_id'],'minutes':20,'date':'2026-11-10','reason':'Neu'}
        await self.manager.mutate(PAUL,1,'update',edit)
        self.assertEqual((await self.manager.photo(PAUL,p['request_id']))['photo'],PHOTO)
        await self.manager.mutate(PAUL,2,'update',{**edit,'photo':None})
        with self.assertRaises(ValueError):await self.manager.photo(PAUL,p['request_id'])
        self.assertEqual(list(Store.records),[gm.DOMAIN])
    async def test_approval_is_durable_and_does_not_touch_photo(self):
        p=payload('worked',photo=PHOTO);await self.manager.mutate(PAUL,0,'add',p)
        out=await self.manager.mutate(VERA,1,'approve',{'id':p['request_id'],'minutes':10})
        self.assertEqual(out['balances'][1]['remaining'],-10)
        self.assertEqual((await self.manager.photo(PAUL,p['request_id']))['photo'],PHOTO)
        with self.assertRaises(ValueError):await self.manager.mutate(VERA,2,'approve',{'id':p['request_id'],'minutes':20})
    async def test_unauthorized_mutation_writes_nothing(self):
        with self.assertRaises(PermissionError):await self.manager.mutate(PAUL,0,'add',payload(photo=PHOTO))
        self.assertEqual(Store.records,{})
    async def test_ws_commands_use_authenticated_user(self):
        connection=SimpleNamespace(user=SimpleNamespace(id='p',is_active=True,is_admin=False,permissions=SimpleNamespace(check_entity=lambda *a:True)),send_error=lambda *a:errors.append(a),send_result=lambda *a:results.append(a))
        errors=[];results=[]
        await gm.respond(self.hass,connection,{'id':1,'entity_id':ACCOUNT_IDS['Paul'],'revision':0,'entry':payload(),'actor':{'parent':True}},'add')
        self.assertEqual(errors[0][1],'unauthorized');self.assertEqual(results,[])
        connection.user.is_active=False
        await gm.respond(self.hass,connection,{'id':2})
        self.assertEqual(errors[-1][1],'unauthorized')
    async def test_unassigned_users_denied_and_admin_can_recover(self):
        with self.assertRaises(PermissionError):self.manager.actor(SimpleNamespace(id='other',is_active=True,is_admin=False))
        self.assertTrue(self.manager.actor(SimpleNamespace(id='admin',is_active=True,is_admin=True))['parent'])
    async def test_invalid_photo_does_not_write(self):
        with self.assertRaises(ValueError):await self.manager.mutate(PAUL,0,'add',payload('worked',photo='bad'))
        self.assertEqual(Store.records,{})
    async def test_write_target_must_be_the_actual_affected_account(self):
        p=payload('worked')
        self.assertEqual(self.manager.mutation_target(PAUL,'add',p,ACCOUNT_IDS['Paul']),ACCOUNT_IDS['Paul'])
        for target in (None,'sensor.unrelated',ACCOUNT_IDS['Maximilian']):
            with self.subTest(target=target),self.assertRaises(PermissionError):
                self.manager.mutation_target(PAUL,'add',p,target)
        await self.manager.mutate(PAUL,0,'add',p)
        for operation in ('update','approve'):
            with self.subTest(operation=operation),self.assertRaises(PermissionError):
                self.manager.mutation_target(VERA,operation,{'id':p['request_id'],'child':'Maximilian'},ACCOUNT_IDS['Maximilian'])
    async def test_websocket_requires_native_control_of_the_exact_account(self):
        results=[];errors=[];checked=[]
        def check(eid,key):checked.append((eid,key));return False
        user=SimpleNamespace(id='p',is_active=True,is_admin=False,permissions=SimpleNamespace(check_entity=check))
        connection=SimpleNamespace(user=user,send_error=lambda *a:errors.append(a),send_result=lambda *a:results.append(a))
        await gm.ws_add(self.hass,connection,{'id':1,'entity_id':ACCOUNT_IDS['Paul'],'revision':0,'entry':payload('worked')})
        self.assertEqual(checked,[(ACCOUNT_IDS['Paul'],'control')]);self.assertEqual(errors[0][1],'unauthorized')
        self.assertEqual(Store.records,{});self.assertEqual(results,[])
    async def test_renamed_accounts_use_the_registry_entity_id(self):
        self.manager.account_entities['Paul'].entity_id='sensor.pauls_garden_minutes'
        out=self.manager.snapshot(PAUL)
        self.assertEqual(out['balances'][0]['entity_id'],'sensor.pauls_garden_minutes')
        self.assertEqual(self.manager.mutation_target(PAUL,'add',payload('worked'),'sensor.pauls_garden_minutes'),'sensor.pauls_garden_minutes')
        with self.assertRaises(PermissionError):self.manager.mutation_target(PAUL,'add',payload('worked'),ACCOUNT_IDS['Paul'])
if __name__=='__main__':unittest.main()
