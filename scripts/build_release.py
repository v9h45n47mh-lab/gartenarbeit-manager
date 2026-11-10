"""Validate distribution metadata and build deterministic integration archives."""
from pathlib import Path
import hashlib
import json
import zipfile

ROOT=Path(__file__).resolve().parents[1]
DOMAIN='gartenarbeit_manager'
component=ROOT/'custom_components'/DOMAIN
version=json.loads((component/'manifest.json').read_text())['version']
assert f'VERSION = "{version}"' in (component/'const.py').read_text()
assert f"GM_VERSION='{version}'" in (component/'frontend/card.js').read_text()
for filename in ('icon.png','icon@2x.png','dark_icon.png','dark_icon@2x.png'):
    assert (component/'brand'/filename).read_bytes()==(ROOT/'brand'/filename).read_bytes()
for filename in ('manifest.json','strings.json','translations/de.json'):
    json.loads((component/filename).read_text())
files=sorted(p for p in component.rglob('*') if p.is_file() and '__pycache__' not in p.parts and p.suffix!='.pyc')
out=ROOT/'dist';out.mkdir(exist_ok=True)
def archive(name,full):
    path=out/name
    with zipfile.ZipFile(path,'w',zipfile.ZIP_DEFLATED) as z:
        for p in files:
            info=zipfile.ZipInfo(str(p.relative_to(ROOT if full else component)),date_time=(2026,1,1,0,0,0));info.compress_type=zipfile.ZIP_DEFLATED;info.external_attr=0o100644<<16
            z.writestr(info,p.read_bytes())
    with zipfile.ZipFile(path) as z:assert z.testzip() is None
    return path
archives=[archive(f'Gartenarbeit_Manager_{version}.zip',True),archive(f'{DOMAIN}.zip',False)]
(out/'SHA256SUMS.txt').write_text(''.join(hashlib.sha256(p.read_bytes()).hexdigest()+'  '+p.name+'\n' for p in archives))
for p in archives:print(p.name,p.stat().st_size,'bytes')
