"""All applications ship exactly the reviewed protocol client."""
from pathlib import Path
import hashlib,json,unittest
class FamilyAccessClientTests(unittest.TestCase):
 def test_client_matches_protocol_lock(self):
  component=next((Path(__file__).resolve().parents[1]/'custom_components').glob('*/family_access.py')).parent
  lock=json.loads((component/'family-access-client.lock.json').read_text())
  self.assertEqual(lock['protocol'],1)
  self.assertEqual(hashlib.sha256((component/'family_access.py').read_bytes()).hexdigest(),lock['sha256'])
