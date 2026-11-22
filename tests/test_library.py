"""Library truthfulness: B7 (no silent no-ops), M1 (recall), M5 (caller identity), M9 (tasks/connections), M10 (cards),
restore import checks. Real LadybugDB (`ladybug` 0.22.3)."""
import json, os, shutil, socket, subprocess, sys, time
import pytest
from conftest import FILES
from bk_chain import verify
from bk_secrets import Scanner
import library_svc as L

SCHEMA = os.path.join(FILES, "library-schema.cypher")


def mk(tmp, marker=True):
    d = tmp / "data"; (d / "library").mkdir(parents=True, exist_ok=True)
    if marker:
        (d / "RESTORED").write_text("fresh\n")
    return L.Library(str(d / "library" / "library.lbug"), SCHEMA, str(d / "cards"), str(d / "citizens"), str(d / "backups"),
                     str(d / "RESTORED"), min_free_mb=1, scanner=Scanner(os.path.join(FILES, "secret-patterns.json"), hashes_file=None, env={}),
                     diary_root=str(d / "diary"))


def fact(lib, text, topic="general", src="https://example.com/x", level="claimed", supersedes=None, reason=None):
    p = lib.propose_fact(text, topic, "read it on the page", src, "scout")["id"]
    return lib.commit_proposal(p, "librarian", level=level, supersedes=supersedes, reason=reason)["id"]


def loglines(lib):
    return open(lib.log.path, "rb").read().count(b"\n")


@pytest.fixture
def lib(tmp_path):
    return mk(tmp_path)


# ---------- startup ----------
def test_refuses_to_start_empty_without_restored_marker(tmp_path):
    with pytest.raises(SystemExit, match="NOT RESTORED"):
        mk(tmp_path, marker=False)


# ---------- B7: every write must change what it names ----------
def test_retire_and_verify_missing_or_nonlive_refused_and_not_logged(lib):
    n = loglines(lib)
    for call in (lambda: lib.retire_fact("F-00000000", "moot", "librarian"),
                 lambda: lib.verify_fact("F-00000000", "re-read", "librarian")):
        with pytest.raises(L.Refused, match="no fact"):
            call()
    f = fact(lib, "Our office is in Pune"); n = loglines(lib)
    lib.retire_fact(f, "moved", "librarian")
    with pytest.raises(L.Refused, match="retired, not live"):
        lib.retire_fact(f, "again", "librarian")
    with pytest.raises(L.Refused, match="retired, not live"):
        lib.verify_fact(f, "checked", "librarian")
    assert loglines(lib) == n + 1


def test_commit_with_missing_or_nonlive_supersedes_refused_atomically(lib):
    old = fact(lib, "Price is 10 USD")
    p = lib.propose_fact("Price is 12 USD", "pricing", "pricing page", "https://example.com/p", "scout")["id"]
    n, live_before = loglines(lib), lib.stats()["facts_live"]
    with pytest.raises(L.Refused, match="no fact 'F-deadbeef'"):
        lib.commit_proposal(p, "librarian", supersedes="F-deadbeef", reason="new price")
    with pytest.raises(L.Refused, match="needs a reason"):
        lib.commit_proposal(p, "librarian", supersedes=old)
    assert loglines(lib) == n and lib.stats()["facts_live"] == live_before
    assert [x["id"] for x in lib.list_proposals("librarian")["proposals"]] == [p]      # still pending
    new = lib.commit_proposal(p, "librarian", supersedes=old, reason="new price")["id"]
    p2 = lib.propose_fact("Price is 15 USD", "pricing", "pricing page", "https://example.com/p", "scout")["id"]
    with pytest.raises(L.Refused, match="superseded"):
        lib.commit_proposal(p2, "librarian", supersedes=old, reason="newer")     # old is no longer live
    assert lib.recall(old)["live_id"] == new


def test_reject_proposal(lib):
    p = lib.propose_fact("Moon is cheese", "science", "a dream", "dream://1", "scout")["id"]
    assert lib.reject_proposal(p, "no evidence", "librarian")["result"] == "REJECTED"
    assert lib.list_proposals("librarian")["proposals"] == []
    with pytest.raises(L.Refused):
        lib.reject_proposal(p, "again", "librarian")
    with pytest.raises(L.Refused):
        lib.commit_proposal(p, "librarian")


def test_supersede_chain_resolves_to_final_live_or_retired(lib):
    a = fact(lib, "CEO is A")
    b = fact(lib, "CEO is B", supersedes=a, reason="changed")
    c = fact(lib, "CEO is C", supersedes=b, reason="changed again")
    r = lib.recall(a); assert r["result"] == "SUPERSEDED" and r["live_id"] == c and r["chain"] == [a, b, c]
    x = fact(lib, "Office in Goa"); y = fact(lib, "Office in Kochi", supersedes=x, reason="moved")
    lib.retire_fact(y, "office closed", "librarian")
    r = lib.recall(x); assert r["result"] == "RETIRED" and r["retired_id"] == y and "live_id" not in r


def test_verify_can_raise_level_and_appends_instrument(lib):
    f = fact(lib, "We have 3 paying customers")
    lib.verify_fact(f, "checked Razorpay dashboard", "librarian", level="verified")
    got = lib.recall(f)["facts"][0]
    assert got["level"] == "verified" and got["instrument"].endswith("| checked Razorpay dashboard")


# ---------- M1: recall ----------
def test_recall_tokenwise_ranked_with_total_and_sources(lib):
    fact(lib, "Our investors are Asha Capital and Blue Fund", topic="fundraising", src="https://example.com/cap-table")
    fact(lib, "Blue Fund wants a monthly investor update", topic="fundraising")
    fact(lib, "The office cat is called Momo", topic="office")
    r = lib.recall("who are our investors")
    assert r["result"] == "FOUND" and r["total"] == 2
    assert r["facts"][0]["text"].startswith("Our investors")
    assert r["facts"][0]["sources"] == ["https://example.com/cap-table"]
    assert lib.recall("investor", topic="office")["result"] == "MISS"
    m = lib.recall("what is our burn rate")
    assert m["result"] == "MISS" and m["coverage"] == {"fundraising": 2, "office": 1}



def test_recall_order_does_not_depend_on_the_clock(lib, monkeypatch):
    """v0.4: v0.3 broke ties on equal word hits by time, so the order flipped when a second ticked between two writes
    (a flaky test, found while building v0.4). Word pairs in the query's order now rank first, whatever the clock says."""
    import datetime as dt
    t = [dt.datetime(2026, 11, 19, 10, 0, 0)]
    def fake_now():
        t[0] += dt.timedelta(seconds=5)          # every write is clearly later than the one before
        return t[0]
    monkeypatch.setattr(L, "now", fake_now)
    fact(lib, "Our investors are Asha Capital and Blue Fund", topic="fundraising")
    fact(lib, "Blue Fund wants a monthly investor update", topic="fundraising")
    r = lib.recall("who are our investors")
    assert r["result"] == "FOUND" and r["total"] == 2
    assert r["facts"][0]["text"].startswith("Our investors"), r["facts"]

def test_recall_limit_and_total(lib):
    for i in range(15):
        fact(lib, f"Competitor number {i} raised money")
    r = lib.recall("competitor raised", limit=5)
    assert r["total"] == 15 and r["shown"] == 5


# ---------- secrets on every text field incl. reasons ----------
def test_secret_filter_on_text_and_reasons(lib):
    with pytest.raises(L.Refused, match="secret"):
        lib.propose_fact("bot token 123456789:" "AAHa1B2c3D4e5a1B2c3D4e5a1B2c3D4e5f6", "x", "i", "s", "scout")
    f = fact(lib, "Fine fact")
    with pytest.raises(L.Refused, match="reason"):
        lib.retire_fact(f, "leaked ghp_" + "A1b2C3d4E5" * 4, "librarian")
    assert lib.recall(f)["result"] == "FOUND"
    # the review's false positives are accepted
    lib.propose_fact("The GitHub token: expires every 90 days", "github", "GitHub settings page", "https://github.com/settings/tokens", "steward")
    lib.propose_fact("Password = must be rotated quarterly", "policy", "our policy", "policy doc", "steward")
    lib.propose_fact("release 3f9c2a7d41b0e8c6a5d4f3e2b1a0c9d8e7f6a5b4", "builds", "git log", "https://github.com/cloudflare/cloudflared/releases/download/2026.11.1/cloudflared-linux-amd64", "builder")


# ---------- M5: roles ----------
def test_librarian_only_tools_refuse_others(lib):
    p = lib.propose_fact("X", "t", "i", "s", "scout")["id"]
    for who in ("warden", "scout", "builder", "reviewer", "steward"):
        for call in (lambda: lib.commit_proposal(p, who), lambda: lib.reject_proposal(p, "r", who),
                     lambda: lib.list_proposals(who), lambda: lib.render_card("scout", who)):
            with pytest.raises(L.Refused, match=r"is for librarian( only|, librarian_desk only)"):
                call()


# ---------- M10: cards ----------
def test_render_card_sanitises_and_writes_agents_local(lib, tmp_path):
    for bad in ("../etc", "scout/../../x", "Scout", "nobody"):
        with pytest.raises(L.Refused, match="unknown citizen"):
            lib.render_card(bad, "librarian")
    fact(lib, "My name is Meera", topic="card:scout")
    r = lib.render_card("scout", "librarian")
    card = (tmp_path / "data" / "citizens" / "scout" / "AGENTS.local.md").read_text()
    assert r["result"] == "WRITTEN" and "My name is Meera" in card
    assert (tmp_path / "data" / "cards" / "scout.md").read_text() == card


def test_card_cap_refuses(lib):
    for i in range(30):
        fact(lib, "a long line about who I am " + "x" * 60 + str(i), topic="card:warden")
    with pytest.raises(L.Refused, match="cap"):
        lib.render_card("warden", "librarian")


# ---------- M9: tasks + connections + approvals ----------
def test_tasks_need_owner_and_date(lib):
    with pytest.raises(L.Refused, match="owner"):
        lib.add_task("ship it", "nobody", "2026-12-01", "warden")
    with pytest.raises(L.Refused, match="date"):
        lib.add_task("ship it", "builder", "soon", "warden")
    with pytest.raises(L.Refused, match="add_task is for"):
        lib.add_task("ship it", "builder", "2026-12-01", "scout")
    t = lib.add_task("ship landing page", "builder", "2020-01-01", "warden")["id"]
    lt = lib.list_tasks()
    assert lt["total"] == 1 and lt["tasks"][0]["overdue"] is True
    with pytest.raises(L.Refused, match="only the owner"):
        lib.close_task(t, "done", "", "scout")
    lib.close_task(t, "done", "PR merged by founder", "builder")
    with pytest.raises(L.Refused, match="already done"):
        lib.close_task(t, "done", "", "warden")
    with pytest.raises(L.Refused, match="no task"):
        lib.close_task("T-00000000", "done", "", "warden")


def test_connections_register(lib):
    with pytest.raises(L.Refused, match="NAME"):
        lib.register_connection("CONN-github", {"service": "GitHub", "may_do": "PRs", "used_by": "builder",
                                                "secret_name": "ghp_" + "A1b2C3d4E5" * 4, "revoke_how": "revoke"}, "steward")
    with pytest.raises(L.Refused, match="kill it"):
        lib.register_connection("CONN-github", {"service": "GitHub", "secret_name": "BK_GITHUB_TOKEN"}, "steward")
    with pytest.raises(L.Refused, match="steward only"):
        lib.register_connection("CONN-x", {"service": "x", "may_do": "y", "used_by": "z", "revoke_how": "w"}, "warden")
    lib.register_connection("CONN-github", {"service": "GitHub", "may_do": "branches+PRs on one repo", "used_by": "builder",
                                            "secret_name": "BK_GITHUB_TOKEN", "revoke_how": "GitHub > tokens > revoke",
                                            "expires": "2027-02-15"}, "steward")
    with pytest.raises(L.Refused, match="already exists"):
        lib.register_connection("CONN-github", {"service": "GitHub", "may_do": "x", "used_by": "y", "revoke_how": "z"}, "steward")
    lib.update_connection("CONN-github", "status", "green", "steward")
    with pytest.raises(L.Refused, match="0"):
        lib.update_connection("CONN-nope", "status", "green", "steward")
    c = lib.list_connections()["connections"][0]
    assert c["status"] == "green" and c["secret_name"] == "BK_GITHUB_TOKEN" and isinstance(c["expires_in_days"], int)


def test_approvals_and_diary_redaction_need_approval(lib, tmp_path):
    from bk_chain import ChainWriter
    diary = tmp_path / "data" / "diary" / "warden"; diary.mkdir(parents=True)
    w = ChainWriter(str(diary / "2026-11.jsonl"))
    for i in range(3):
        w.append({"type": "mail", "data": f"Email from asha@example.com about pricing, number {i} " + "y" * 200})
    w.close()
    path = str(diary / "2026-11.jsonl")
    with pytest.raises(L.Refused, match="approval"):
        lib.redact_diary_line(path, 2, "A-00000000", "erasure request", "librarian")
    r = lib.request_approval("erase Asha's email from the diary", "Erase line 2 of diary/warden/2026-11.jsonl (Asha's email)",
                             "she asked by email", "warden")
    with pytest.raises(L.Refused, match="approval"):                     # a pending REQUEST authorises nothing
        lib.redact_diary_line(path, 2, r["id"], "erasure request", "librarian")
    a = lib.decide_approval(r["id"], "approved", "founder@example.com", r["draft_sha256"])["id"]
    with pytest.raises(L.Refused, match="librarian only"):
        lib.redact_diary_line(path, 2, a, "erasure request", "warden")
    with pytest.raises(L.Refused, match="diary folder"):
        lib.redact_diary_line("/etc/passwd", 1, a, "x", "librarian")
    r = lib.redact_diary_line(path, 2, a, "erasure request (DPDP)", "librarian")
    assert r["result"] == "REDACTED" and r["chain_ok_after"] is True
    text = open(path).read()
    assert "number 1" not in text and "number 0" in text and verify(path)["ok"]


def test_change_log_is_a_valid_chain_with_real_callers(lib):
    fact(lib, "One"); fact(lib, "Two")
    assert verify(lib.log.path)["ok"]
    whos = [json.loads(l)["body"]["who"] for l in open(lib.log.path)]
    assert whos == ["scout", "librarian", "scout", "librarian"]


# ---------- snapshot → import (restore) ----------
def test_snapshot_import_roundtrip_and_mismatch_refused(lib, tmp_path):
    fact(lib, "A"); b = fact(lib, "B"); fact(lib, "C", supersedes=b, reason="fix")
    lib.add_task("t", "warden", "2026-12-01", "warden")
    snap = lib.snapshot("snap-test")["dir"]
    target = tmp_path / "restored" / "library.lbug"
    got = L.import_snapshot(snap, str(target), SCHEMA)
    assert got["facts_total"] == 3 and got["facts_live"] == 2 and os.path.exists(target)
    # tamper with the manifest → import must refuse and leave NO database behind
    m = json.load(open(os.path.join(snap, "library-manifest.json"))); m["facts_live"] = 99
    json.dump(m, open(os.path.join(snap, "library-manifest.json"), "w"))
    t2 = tmp_path / "restored2" / "library.lbug"
    with pytest.raises(RuntimeError, match="does not match"):
        L.import_snapshot(snap, str(t2), SCHEMA)
    assert not os.path.exists(t2) and not os.path.exists(str(t2) + ".importing")


# ---------- over MCP, with per-citizen tokens ----------
def _free_port():
    s = socket.socket(); s.bind(("127.0.0.1", 0)); p = s.getsockname()[1]; s.close(); return p


def test_mcp_caller_identity_end_to_end(tmp_path):
    d = tmp_path / "data"; (d / "library").mkdir(parents=True); (d / "RESTORED").write_text("fresh\n")
    port, aport = _free_port(), _free_port()
    toks = {c: f"tok-{c}-" + "x" * 30 for c in L.CITIZENS}
    env = {**os.environ, **{"LIBRARY_TOKEN_" + c.upper(): t for c, t in toks.items()}, "LIBRARY_ADMIN_TOKEN": "admin-" + "y" * 30,
           "BK_MIN_FREE_MB": "1", "BK_SECRET_HASHES_FILE": "/nonexistent"}
    proc = subprocess.Popen([sys.executable, os.path.join(FILES, "library_svc.py"), "--db", str(d / "library" / "library.lbug"),
                             "--cards", str(d / "cards"), "--citizens", str(d / "citizens"), "--backups", str(d / "backups"),
                             "--restored-marker", str(d / "RESTORED"), "--port", str(port), "--admin-port", str(aport)],
                            env=env, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    try:
        import asyncio
        from mcp import ClientSession
        from mcp.client.streamable_http import streamable_http_client
        try:
            import httpx2 as httpx          # mcp 2.x ships httpx2
        except ImportError:
            import httpx

        async def call(token, tool, args):
            headers = {"X-Library-Token": token} if token else {}
            async with httpx.AsyncClient(headers=headers) as hc:
                async with streamable_http_client(f"http://127.0.0.1:{port}/mcp", http_client=hc) as (r, w, *_):
                    async with ClientSession(r, w) as s:
                        await s.initialize()
                        res = await s.call_tool(tool, args)
                        return json.loads(res.content[0].text)

        for _ in range(100):
            try:
                socket.create_connection(("127.0.0.1", port), 0.2).close(); break
            except OSError:
                time.sleep(0.1)
        run = lambda *a: asyncio.run(call(*a))
        assert run(None, "coverage", {})["result"] == "REFUSED"
        assert run("wrong-token-" + "z" * 20, "coverage", {})["result"] == "REFUSED"
        p = run(toks["scout"], "propose_fact", {"text": "Asha leads Blue Fund", "topic": "people:asha", "instrument": "her LinkedIn", "source": "https://example.com/asha"})
        assert p["result"] == "PROPOSED" and p["proposed_by"] == "scout"
        bad = run(toks["warden"], "commit_proposal", {"proposal_id": p["id"], "level": "verified"})
        assert bad["result"] == "REFUSED" and "librarian" in bad["reason"]
        ok = run(toks["librarian"], "commit_proposal", {"proposal_id": p["id"]})
        assert ok["result"] == "COMMITTED"
        r = run(toks["builder"], "recall", {"query": "who leads Blue Fund?"})
        assert r["result"] == "FOUND" and r["facts"][0]["sources"] == ["https://example.com/asha"]
        import urllib.request
        req = urllib.request.Request(f"http://127.0.0.1:{aport}/stats", headers={"X-Admin-Token": "admin-" + "y" * 30})
        assert json.load(urllib.request.urlopen(req))["facts_live"] == 1
        with pytest.raises(Exception):
            urllib.request.urlopen(f"http://127.0.0.1:{aport}/stats")
        whos = [json.loads(l)["body"]["who"] for l in open(d / "library" / "changes.jsonl")]
        assert whos == ["scout", "librarian"]
        # v0.5: no citizen token can approve. record_approval no longer exists; request_approval only requests.
        import urllib.error
        for c in L.CITIZENS:
            try:
                r = run(toks[c], "record_approval", {"item": "x", "decision": "approved", "draft_text": "x"})
            except Exception:
                r = {"result": "NO SUCH TOOL"}
            assert r.get("result") not in ("RECORDED", "DECIDED", "OK"), r
        rq = run(toks["warden"], "request_approval", {"item": "post #1", "draft_text": "Hello founders"})
        assert rq["result"] == "REQUESTED"
        assert run(toks["warden"], "list_approvals", {"status": "pending"})["total"] == 1
        dec = json.dumps({"request_id": rq["id"], "decision": "approved", "founder": "f@example.com", "shown_sha256": rq["draft_sha256"]}).encode()
        for hdr in ({}, {"X-Admin-Token": toks["warden"]}):                        # a citizen token is not the admin token
            with pytest.raises(urllib.error.HTTPError) as e:
                urllib.request.urlopen(urllib.request.Request(f"http://127.0.0.1:{aport}/approvals/decide", data=dec, headers=hdr))
            assert e.value.code == 403
        ok = json.load(urllib.request.urlopen(urllib.request.Request(f"http://127.0.0.1:{aport}/approvals/decide", data=dec,
                                                                     headers={"X-Admin-Token": "admin-" + "y" * 30})))
        assert ok["result"] == "DECIDED"
        assert run(toks["librarian"], "check_approval", {"approval_id": ok["id"], "text": "Hello founders"})["authorises"] is True
    finally:
        proc.terminate(); proc.wait(5)


# ---------- v0.5: approvals store the exact text (erratum 18) and ONLY the founder decides (CONNECTOR-SCOPING §4) ----------
def test_request_stores_exact_text_and_anyone_can_recompute(lib):
    import hashlib
    slate = "A) Asha, Bela, Chitra\r\nB) Dev, Esha, Farah  \n\n"
    r = lib.request_approval("naming slate", slate, "founder chose A", "warden")
    canon = "A) Asha, Bela, Chitra\nB) Dev, Esha, Farah"
    assert r["result"] == "REQUESTED" and r["canon"] == "bk-canon-1" and r["id"].startswith("R-")
    assert r["draft_sha256"] == hashlib.sha256(canon.encode()).hexdigest()
    a = lib.list_approvals("librarian")["approvals"][-1]
    assert a["draft_text"] == canon and a["status"] == "pending" and a["type"] == "request"
    pend = lib.check_approval(r["id"], "reviewer", text="A) Asha, Bela, Chitra\nB) Dev, Esha, Farah\n")
    assert pend["result"] == "MATCH" and pend["authorises"] is False            # pending: authorises nothing
    d = lib.decide_approval(r["id"], "approved", "founder@example.com", r["draft_sha256"])
    assert d["result"] == "DECIDED" and d["id"].startswith("A-")
    ok = lib.check_approval(d["id"], "reviewer", text="A) Asha, Bela, Chitra\nB) Dev, Esha, Farah\n")
    assert ok["result"] == "MATCH" and ok["your_text_matches"] is True and ok["authorises"] is True
    bad = lib.check_approval(d["id"], "librarian", text="A) Asha, Bela, Chitra\nB) Dev, Esha, Farha")
    assert bad["result"] == "MISMATCH" and bad["your_text_matches"] is False
    assert lib.list_approvals("warden", status="pending")["total"] == 0
    assert lib.check_approval(r["id"], "warden")["decision_id"] == d["id"]
    with pytest.raises(L.Refused, match="check_approval is for"):
        lib.check_approval(d["id"], "scout")
    with pytest.raises(L.Refused, match="already approved"):
        lib.decide_approval(r["id"], "rejected", "founder@example.com", r["draft_sha256"])


def test_citizens_cannot_approve_only_request(lib):
    assert not hasattr(lib, "record_approval")
    for who in ("scout", "builder", "reviewer", "librarian", "community"):
        with pytest.raises(L.Refused, match="request_approval is for"):
            lib.request_approval("x", "y", "", who)
    with pytest.raises(L.Refused, match="give draft_text"):
        lib.request_approval("post #2", "", "", "warden")
    with pytest.raises(L.Refused, match="secret"):
        lib.request_approval("post #3", "key ghp_" + "a1B2" * 9, "", "warden")
    r = lib.request_approval("post #2", "Hello world", "", "steward")
    with pytest.raises(L.Refused, match="hash mismatch"):                       # the page must show exactly this text
        lib.decide_approval(r["id"], "approved", "founder@example.com", "b" * 64)
    with pytest.raises(L.Refused, match="approved or rejected"):
        lib.decide_approval(r["id"], "edit", "founder@example.com", r["draft_sha256"])
    with pytest.raises(L.Refused, match="no approval request"):
        lib.decide_approval("R-00000000", "approved", "founder@example.com", r["draft_sha256"])
    assert lib.decide_approval(r["id"], "rejected", "founder@example.com", r["draft_sha256"])["decision"] == "rejected"
    assert lib.check_approval(r["id"], "warden")["status"] == "rejected"


def test_v04_approvals_load_as_legacy(lib):
    """Robin's live v0.4 Library holds approval A-c0d97183 with a hash but no text. It must load and say so honestly."""
    lib.approvals.append({"id": "A-c0d97183", "at": "2026-11-19T21:58:00Z", "recorded_by": "warden", "item": "naming slate",
                          "decision": "approved", "draft_sha256": "c" * 64, "note": "founder chose A"})
    v = lib.list_approvals("librarian")["approvals"][-1]
    assert v["id"] == "A-c0d97183" and v["status"] == "legacy" and v["legacy_note"] == "legacy, text not stored"
    c = lib.check_approval("A-c0d97183", "librarian")
    assert c["result"] == "NO_TEXT" and c["note"] == "legacy, text not stored" and c["authorises"] is False
    assert lib.stats()["approvals"] == 1 and lib.stats()["approvals_pending"] == 0
    assert lib.pending_approvals()["pending"] == []


def test_librarian_desk_reads_and_proposes_but_cannot_commit(lib):
    p = lib.propose_fact("Desk proposal", "t", "i", "https://example.com/d", "librarian_desk")
    assert p["result"] == "PROPOSED" and p["proposed_by"] == "librarian_desk"
    assert lib.list_proposals("librarian_desk")["proposals"][0]["id"] == p["id"]
    for call in (lambda: lib.commit_proposal(p["id"], "librarian_desk"), lambda: lib.reject_proposal(p["id"], "r", "librarian_desk"),
                 lambda: lib.render_card("scout", "librarian_desk"), lambda: lib.request_approval("x", "y", "", "librarian_desk")):
        with pytest.raises(L.Refused):
            call()
    assert L.SERVICE_ROLES["librarian_desk"] >= {"recall", "coverage", "list_proposals"}
    assert not L.SERVICE_ROLES["librarian_desk"] & {"commit_proposal", "reject_proposal", "render_card", "retire_fact", "verify_fact",
                                                    "redact_diary_line", "request_approval", "add_task"}
