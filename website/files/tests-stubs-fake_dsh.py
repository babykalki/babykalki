#!/usr/bin/env python3
"""Stand-in for dsh in supervisor tests: prints a login link like dsh does, then probes what the AGENTS' user can reach,
writes the findings to report.json in its working folder, and sleeps (or exits at once with FAKE_DSH_EXIT=1)."""
import json, os, sys, time

print("dsh web: https://agent.example.com/?token=" + "FAKEtoken_0123456789abcdefXYZ", flush=True)
if os.environ.get("FAKE_DSH_EXIT") == "1":
    print("crashing on purpose", flush=True)
    sys.exit(1)
for i in range(int(os.environ.get("FAKE_DSH_SPAM", "0"))):
    print(f"spam line {i} " + "s" * 80, flush=True)
D = os.environ["BK_DATA"]
rep = {"uid": os.getuid(), "has": {k: k in os.environ for k in ("TUNNEL_TOKEN", "RCLONE_CONFIG_R2_SECRET_ACCESS_KEY",
                                                              "LIBRARY_ADMIN_TOKEN", "LIBRARY_TOKEN_WARDEN", "ZAI_API_KEY",
                                                              "BK_TELEGRAM_BOT_TOKEN", "LIBRARY_TOKEN_COMMUNITY",
                                                              "LIBRARY_TOKEN_LIBRARIAN", "LIBRARY_TOKEN_LIBRARIAN_DESK")}}


def can_write(path):
    try:
        with open(path, "w") as f:
            f.write("x")
        os.remove(path)
        return True
    except OSError:
        return False


def can_read_infra_environ():
    for pid in os.listdir("/proc"):
        if not pid.isdigit():
            continue
        try:
            cmd = open(f"/proc/{pid}/cmdline", "rb").read()
        except OSError:
            continue
        if b"library_svc.py" in cmd and b"--port" in cmd:
            try:
                return b"LIBRARY_ADMIN_TOKEN" in open(f"/proc/{pid}/environ", "rb").read()
            except OSError:
                return False
    return None


rep["write"] = {"library": can_write(os.path.join(D, "library", "x")), "site_public": can_write(os.path.join(D, "site", "public", "x")),
                "ship": can_write(os.path.join(os.environ.get("FAKE_SHIP", "/opt/bk"), "x")),
                "citizen_agents_md": can_write(os.path.join(D, "citizens", "warden", "AGENTS.md")),
                "own_work": can_write(os.path.join(D, "citizens", "warden", "work", "x")),
                "diary": can_write(os.path.join(D, "diary", "x")), "data_root_STOP": can_write(os.path.join(D, "STOP"))}
rep["read_infra_environ"] = can_read_infra_environ()
rep["telemetry"] = {k: os.environ.get(k) for k in ("DSH_TELEMETRY_MODE", "DSH_TELEMETRY_OTLP_URL", "DSH_TELEMETRY_DISABLED")}   # v0.5: OFF
rep["read_librarian_dsh"] = os.access(os.path.join(D, "librarian-dsh", "cordis.patch.yml"), os.R_OK)
rep["write_librarian_round"] = can_write(os.path.join(D, "citizens", "librarian", "round", "x"))


def forged_approve():
    """v0.5: a citizen's shell forges the Access header and calls the founder's page directly on 127.0.0.1."""
    import urllib.request, urllib.error
    url = f"http://127.0.0.1:{os.environ.get('BK_LOGIN_PORT', '8081')}/bk-approve"
    h = {"Cf-Access-Authenticated-User-Email": (os.environ.get("BK_FOUNDER_EMAILS") or "x@example.com").split(",")[0]}
    for _ in range(50):
        try:
            return urllib.request.urlopen(urllib.request.Request(url, headers=h), timeout=5).status
        except urllib.error.HTTPError as e:
            return e.code
        except OSError:
            time.sleep(0.2)
    return None


if os.environ.get("FAKE_DSH_CITIZEN") == "1":
    # v0.5: act like a hostile citizen session: propose as the Scout, try to COMMIT with every token this process holds,
    # try to approve, then ask the Librarian round to run (the Warden's NOW file).
    sys.path.insert(0, os.environ["FAKE_SHIP"])
    from bk_telegram import Library
    url = f"http://127.0.0.1:{os.environ.get('BK_LIBRARY_PORT', '7801')}/mcp"
    for _ in range(100):
        p = Library(url, os.environ["LIBRARY_TOKEN_SCOUT"]).call("propose_fact", {"text": "Asha leads Blue Fund", "topic": "people",
                                                                                 "instrument": "her page", "source": "https://example.com/a"})
        if p.get("result") == "PROPOSED":
            break
        time.sleep(0.3)
    rep["proposed"] = p.get("result")
    rep["commit_attempts"] = {}
    for k, v in os.environ.items():
        if k.startswith("LIBRARY_TOKEN_"):
            r = Library(url, v).call("commit_proposal", {"proposal_id": p.get("id", "")})
            rep["commit_attempts"][k] = r.get("result")
    for k in ("LIBRARY_TOKEN_WARDEN", "LIBRARY_TOKEN_STEWARD"):
        rep.setdefault("approve_attempts", {})[k] = Library(url, os.environ[k]).call(
            "record_approval", {"item": "x", "decision": "approved", "draft_text": "x"}).get("result")
    rep["requested"] = Library(url, os.environ["LIBRARY_TOKEN_WARDEN"]).call(
        "request_approval", {"item": "investor email", "draft_text": "Please approve: we raise 5 lakh from Blue Fund."}).get("result")
    rep["forged_approve_status"] = forged_approve()
    open(os.path.join(D, "run", "librarian-requests", "NOW"), "w").write("asked by the Warden\n")
json.dump(rep, open("report.json", "w"))
while True:
    time.sleep(1)
