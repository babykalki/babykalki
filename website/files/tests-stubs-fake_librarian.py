#!/usr/bin/env python3
"""Stand-in for the Librarian round's headless dsh (v0.5 supervisor tests): records what it was given (uid, cwd, env NAMES),
then commits every pending proposal with the ONE token it has, like the real round, and prints the ROUND line.
argv: <library port> <ship dir> <the round prompt>"""
import json, os, sys
port, ship = sys.argv[1], sys.argv[2]
sys.path.insert(0, ship)
from bk_telegram import Library   # noqa: E402
rep = {"uid": os.getuid(), "cwd": os.getcwd(), "env": sorted(os.environ), "prompt_starts": sys.argv[3][:40] if len(sys.argv) > 3 else ""}
lib = Library(f"http://127.0.0.1:{port}/mcp", os.environ.get("LIBRARY_TOKEN_LIBRARIAN", ""))
n = 0
for p in (lib.call("list_proposals", {}).get("proposals") or []):
    n += lib.call("commit_proposal", {"proposal_id": p["id"]}).get("result") == "COMMITTED"
json.dump(rep, open("round-report.json", "w"))
if os.environ.get("FAKE_ROUND_SLEEP"):
    import time
    time.sleep(float(os.environ["FAKE_ROUND_SLEEP"]))
print("thinking about proposals …")
print(f"ROUND: committed {n}, rejected 0, superseded 0, cards 0, left pending 0")
