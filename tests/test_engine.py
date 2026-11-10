"""Accounting, input validation, and authorization regressions."""
import base64
from copy import deepcopy
from datetime import date
import importlib.util
from pathlib import Path
import unittest
from uuid import uuid4

spec = importlib.util.spec_from_file_location('engine', Path(__file__).parents[1]/'custom_components/gartenarbeit_manager/engine.py')
e = importlib.util.module_from_spec(spec)
spec.loader.exec_module(e)
MAPPING={'Vera':'v','Manuel':'m','Maximilian':'max','Paul':'p'}
VERA=e.actor_for('v',MAPPING)
MANUEL=e.actor_for('m',MAPPING)
MAX=e.actor_for('max',MAPPING)
PAUL=e.actor_for('p',MAPPING)
TODAY=date(2026,11,10)
NOW='2026-11-10T09:00:00+00:00'

def payload(kind='assigned',child='Paul',minutes=15,**extra):
    return {'request_id':str(uuid4()),'kind':kind,'child':child,'minutes':minutes,'date':TODAY.isoformat(),'reason':'Gartenarbeit',**extra}

class LedgerTests(unittest.TestCase):
    def setUp(self):
        self.data=e.empty_data()
    def add(self,kind='assigned',actor=VERA,**kw):
        p=payload(kind,**kw)
        self.data=e.add_entry(self.data,p,actor,TODAY,NOW)
        return self.data['entries'][-1]
    def balance(self,actor=VERA,child='Paul'):
        return next(b for b in e.snapshot(self.data,actor,TODAY)['balances'] if b['child']==child)
    def test_assigned_and_correction_steps(self):
        for n in (5,10,15): self.add(minutes=n)
        for n in (-15,-10,-5,5,10,15): self.add('correction',minutes=n)
        self.assertEqual(self.balance()['remaining'],30)
    def test_free_corrections_apply_immediately_and_remain_editable(self):
        self.add(minutes=15)
        row=self.add('correction',minutes=-37)
        self.assertEqual(self.balance()['remaining'],-22)
        self.assertEqual(self.balance()['corrections'],-37)
        edit={'id':row['id'],'minutes':23,'date':TODAY.isoformat(),'reason':'Korrigierter Wert'}
        self.data=e.update_entry(self.data,edit,MANUEL,TODAY,NOW)
        self.assertEqual(self.balance()['remaining'],38)
        self.assertEqual(self.balance()['corrections'],23)
        changed=self.data['entries'][-1]
        self.assertEqual(changed['history'][-1]['before']['minutes'],-37)
        self.assertEqual(changed['review_status'],'approved')
    def test_free_correction_boundaries(self):
        for n in (-1440,-61,-1,1,23,1440):
            with self.subTest(n=n):
                self.assertEqual(e.values(payload('correction',minutes=n),'correction',TODAY)['minutes'],n)
    def test_pending_does_not_change_balance(self):
        self.add();self.add('worked',PAUL,minutes=30)
        self.assertEqual(self.balance()['remaining'],15)
        self.assertEqual(self.balance()['pending'],30)
        self.assertEqual(self.balance()['worked'],0)
    def test_approval_credits_adjusted_minutes_and_negative_balance(self):
        self.add();row=self.add('worked',PAUL,minutes=30)
        self.data=e.approve_entry(self.data,{'id':row['id'],'minutes':20},MANUEL,NOW)
        b=self.balance();self.assertEqual((b['remaining'],b['worked'],b['pending']),(-5,20,0))
        r=self.data['entries'][-1];self.assertEqual(r['reported_minutes'],30)
        self.assertEqual(r['reviewed_by'],'Manuel');self.assertEqual(r['reviewed_at'],NOW)
    def test_approved_cannot_be_approved_twice(self):
        row=self.add('worked',PAUL)
        self.data=e.approve_entry(self.data,{'id':row['id'],'minutes':15},VERA,NOW)
        with self.assertRaises(ValueError): e.approve_entry(self.data,{'id':row['id'],'minutes':15},VERA,NOW)
    def test_child_cannot_assign_correct_or_approve(self):
        for kind in ('assigned','correction'):
            with self.assertRaises(PermissionError): self.add(kind,PAUL)
        row=self.add('worked',PAUL)
        with self.assertRaises(PermissionError):e.approve_entry(self.data,{'id':row['id'],'minutes':10},PAUL,NOW)
    def test_child_cannot_report_for_other_child_or_spoof_parent(self):
        with self.assertRaises(PermissionError):self.add('worked',PAUL,child='Maximilian')
        with self.assertRaises(PermissionError):self.add('worked',VERA)
    def test_parent_cannot_change_kind_or_child_on_edit(self):
        row=self.add()
        for changes in ({'child':'Maximilian'},{'kind':'worked'}):
            with self.assertRaises(ValueError):e.update_entry(self.data,{'id':row['id'],'minutes':10,'date':TODAY.isoformat(),'reason':'Neu',**changes},VERA,TODAY,NOW)
    def test_only_own_pending_work_editable_by_child(self):
        row=self.add('worked',PAUL)
        edit={'id':row['id'],'minutes':23,'date':TODAY.isoformat(),'reason':'Unkraut gejätet'}
        changed=e.update_entry(self.data,edit,PAUL,TODAY,NOW)
        self.assertEqual(changed['entries'][-1]['reported_minutes'],23)
        self.assertEqual(self.data['entries'][-1]['minutes'],-15)
        with self.assertRaises(ValueError):e.update_entry(self.data,edit,MAX,TODAY,NOW)
        self.data=e.approve_entry(changed,{'id':row['id'],'minutes':20},VERA,NOW)
        with self.assertRaises(PermissionError):e.update_entry(self.data,edit,PAUL,TODAY,NOW)
    def test_same_name_after_user_remapping_cannot_edit_old_report(self):
        row=self.add('worked',PAUL)
        replacement={'id':'new-paul','name':'Paul','parent':False}
        self.assertFalse(e.can_edit(replacement,row))
    def test_parent_edit_retains_original_report_and_updates_approver(self):
        row=self.add('worked',PAUL,minutes=30)
        edit={'id':row['id'],'minutes':25,'date':TODAY.isoformat(),'reason':'Geprüft'}
        self.data=e.update_entry(self.data,edit,VERA,TODAY,NOW)
        self.assertEqual(self.data['entries'][-1]['reported_minutes'],30)
        self.data=e.approve_entry(self.data,{'id':row['id'],'minutes':20},VERA,NOW)
        edit['minutes']=18
        self.data=e.update_entry(self.data,edit,MANUEL,TODAY,NOW)
        r=self.data['entries'][-1]
        self.assertEqual((r['reported_minutes'],r['reviewed_by'],len(r['history'])),(30,'Manuel',3))
        self.assertEqual(self.balance()['remaining'],-18)
    def test_snapshot_limits_children_and_hides_internal_identifiers(self):
        self.add(child='Maximilian');self.add(child='Paul');self.add('worked',PAUL)
        out=e.snapshot(self.data,PAUL,TODAY)
        self.assertEqual([b['child'] for b in out['balances']],['Paul'])
        self.assertTrue(all(r['child']=='Paul' for r in out['entries']))
        for r in out['entries']:
            self.assertFalse(set(r)&{'actor_id','photo_id','request_hash'})
        self.assertEqual(out['entries'][0]['review_status'],'pending')
    def test_repeated_request_is_idempotent(self):
        p=payload();self.data=e.add_entry(self.data,p,VERA,TODAY,NOW)
        self.assertEqual(e.add_entry(self.data,p,VERA,TODAY,NOW),self.data)
        self.assertTrue(e.duplicate(self.data,p,VERA))
        with self.assertRaises(ValueError):e.duplicate(self.data,{**p,'minutes':5},VERA)
        with self.assertRaises(ValueError):e.duplicate(self.data,p,MANUEL)
    def test_invalid_minutes(self):
        for n in (True,False,0,1.2,'5',None,1441,-1441):
            with self.subTest(n=n),self.assertRaises(ValueError): e.values(payload('worked',minutes=n),'worked',TODAY)
        for n in (1,20,-5):
            with self.assertRaises(ValueError):e.values(payload(minutes=n),'assigned',TODAY)
        for n in (True,False,0,1.2,-1.2,'5',None,1441,-1441):
            with self.assertRaises(ValueError):e.values(payload('correction',minutes=n),'correction',TODAY)
    def test_dates_reasons_and_identifiers(self):
        for day in ('2026-11-11','2026-02-30','2019-12-31','2026-1-01','bad',None):
            with self.subTest(day=day),self.assertRaises(ValueError):e.values(payload(date=day),'assigned',TODAY)
        for reason in ('','   ','x'*501,None):
            with self.assertRaises(ValueError):e.values(payload(reason=reason),'assigned',TODAY)
        for eid in (None,'../file','not-a-uuid'):
            with self.assertRaises(ValueError):e.entry_id(eid)
    def test_approval_limits(self):
        row=self.add('worked',PAUL)
        for minutes in (0,1441,1.5,True,'5'):
            with self.assertRaises(ValueError):e.approve_entry(self.data,{'id':row['id'],'minutes':minutes},VERA,NOW)
    def test_boundary_dates_and_work_minutes(self):
        for day in ('2020-01-01','2024-02-29',TODAY.isoformat()):
            for minutes in (1,1440):self.assertEqual(e.values(payload('worked',date=day,minutes=minutes),'worked',TODAY)['minutes'],-minutes)
    def test_photo_preserved_removed_replaced(self):
        p=payload('worked');self.data=e.add_entry(self.data,p,PAUL,TODAY,NOW,'old-photo')
        edit={'id':p['request_id'],'minutes':15,'date':TODAY.isoformat(),'reason':'Neu'}
        self.assertEqual(e.update_entry(self.data,edit,PAUL,TODAY,NOW)['entries'][0]['photo_id'],'old-photo')
        self.assertIsNone(e.update_entry(self.data,{**edit,'photo':None},PAUL,TODAY,NOW)['entries'][0]['photo_id'])
        self.assertEqual(e.update_entry(self.data,{**edit,'photo':'new'},PAUL,TODAY,NOW,'new-photo')['entries'][0]['photo_id'],'new-photo')
    def test_photo_signatures_and_size(self):
        valid='data:image/png;base64,'+base64.b64encode(b'\x89PNG\r\n\x1a\n'+b'0'*100).decode()
        self.assertEqual(e.validate_photo(valid),valid)
        self.assertIsNone(e.validate_photo(None))
        for val in ('data:image/svg+xml;base64,AAAA','data:image/png;base64,AAAA',valid.replace('png','jpeg'),'x'*1_400_001,True):
            with self.assertRaises(ValueError):e.validate_photo(val)
    def test_mapping_and_admin(self):
        with self.assertRaises(PermissionError):e.actor_for('unknown',MAPPING)
        self.assertTrue(e.actor_for('admin',MAPPING,True)['parent'])
        with self.assertRaises(ValueError):e.validate_mapping({**MAPPING,'Paul':'max'})
        with self.assertRaises(ValueError):e.validate_mapping(MAPPING,{'v','m','max'})
        self.assertFalse(e.actor_for('p',MAPPING,True)['parent'])
    def test_mutations_never_change_the_input(self):
        before=deepcopy(self.data);e.add_entry(self.data,payload(),VERA,TODAY,NOW)
        self.assertEqual(self.data,before)

if __name__=='__main__':unittest.main()
