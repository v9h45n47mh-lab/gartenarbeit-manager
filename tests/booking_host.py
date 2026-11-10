"""JSON-lines test transport for the real adapter using the in-memory HA stores."""
import asyncio
import json
import sys
from types import SimpleNamespace

from test_adapter import ACCOUNT_IDS, MAPPING, Store, gm


async def main():
    Store.records = {}
    hass = SimpleNamespace(data={})
    entry = SimpleNamespace(data={"users": MAPPING}, options={})
    manager = gm.Manager(hass, entry)
    manager.account_entities = {child: SimpleNamespace(entity_id=eid) for child, eid in ACCOUNT_IDS.items()}
    hass.data[gm.DOMAIN] = manager
    handlers = {gm.DOMAIN + "/" + name: getattr(gm, "ws_" + name)
                for name in ("get", "add", "update", "approve", "photo")}

    def result(mid, data):
        print(json.dumps({"id": mid, "result": data}), flush=True)

    def error(mid, code, message):
        print(json.dumps({"id": mid, "error": {"code": code, "message": message}}), flush=True)

    for line in sys.stdin:
        envelope = json.loads(line)
        msg = envelope["message"]
        try:
            if envelope.get("reload"):
                manager = gm.Manager(hass, entry)
                await manager.load()
                manager.account_entities = {child: SimpleNamespace(entity_id=eid) for child, eid in ACCOUNT_IDS.items()}
                hass.data[gm.DOMAIN] = manager
            connection = SimpleNamespace(
                user=SimpleNamespace(id=envelope["user"], is_active=True, is_admin=False,
                                     permissions=SimpleNamespace(check_entity=lambda *args: True)),
                send_result=result, send_error=error)
            await handlers[msg["type"]](hass, connection, msg)
        except Exception as exc:
            error(msg["id"], "test_transport_error", str(exc))


if __name__ == "__main__":
    asyncio.run(main())
