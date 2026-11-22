"""v0.5: the founder-only /bk-approve page (bk_static.py login helper) against a REAL Library admin port.
Citizens can only request_approval; this page is the one way a decision is recorded. With real users, the "only through
the tunnel's user" check is exercised end to end in test_supervisor.py; here the peer-uid rule is tested with our own uid."""
import json, os, re, socket, subprocess, sys, time, urllib.error, urllib.parse, urllib.request
import pytest
from conftest import FILES
import bk_static
import library_svc as L
from bk_secrets import Scanner


def free_port():
    s = socket.socket(); s.bind(("127.0.0.1", 0)); p = s.getsockname()[1]; s.close(); return p


def wait_port(port):
    for _ in range(100):
        try:
            socket.create_connection(("127.0.0.1", port), 0.2).close(); return
        except OSError:
            time.sleep(0.1)


def req(url, headers=None, data=None):
    try:
        r = urllib.request.urlopen(urllib.request.Request(url, data=data, headers=headers or {}), timeout=10)
        return r.status, r.read().decode()
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()


@pytest.fixture
def rig(tmp_path):
    d = tmp_path / "data"; (d / "library").mkdir(parents=True); (d / "RESTORED").write_text("fresh\n")
    lport, aport, hport = free_port(), free_port(), free_port()
    admin = "admin-" + "q" * 30
    toks = {c: f"tok-{c}-" + "x" * 30 for c in L.CITIZENS}
    lenv = {**os.environ, **{"LIBRARY_TOKEN_" + c.upper(): t for c, t in toks.items()}, "LIBRARY_ADMIN_TOKEN": admin,
            "BK_MIN_FREE_MB": "1", "BK_SECRET_HASHES_FILE": "/nonexistent"}
    lib = subprocess.Popen([sys.executable, os.path.join(FILES, "library_svc.py"), "--db", str(d / "library" / "library.lbug"),
                            "--cards", str(d / "cards"), "--citizens", str(d / "citizens"), "--backups", str(d / "backups"),
                            "--restored-marker", str(d / "RESTORED"), "--port", str(lport), "--admin-port", str(aport)],
                           env=lenv, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    procs = [lib]

    def helper(**extra):
        port = free_port()
        env = {**os.environ, "LIBRARY_ADMIN_TOKEN": admin, "BK_LIBRARY_ADMIN": f"http://127.0.0.1:{aport}",
               "BK_FOUNDER_EMAILS": "Founder@Example.com, cofounder@example.com", "BK_APPROVE_PEER_UIDS": str(os.getuid()), **extra}
        env = {k: v for k, v in env.items() if v is not None}
        link = tmp_path / f"login-{port}.url"; link.write_text("https://agent.example.com/?token=" + "z" * 20)
        procs.append(subprocess.Popen([sys.executable, os.path.join(FILES, "bk_static.py"), "--host", "127.0.0.1", "--port", str(port),
                                       "--login-helper", str(link), "--approve"], env=env, stdout=subprocess.DEVNULL))
        wait_port(port)
        return f"http://127.0.0.1:{port}"
    try:
        wait_port(aport); wait_port(lport)
        r = _first_request(lport, toks)
        yield {"helper": helper, "req": r, "toks": toks, "lport": lport}
    finally:
        for p in procs:
            p.terminate(); p.wait(5)


def _first_request(lport, toks):
    from bk_telegram import Library
    warden = Library(f"http://127.0.0.1:{lport}/mcp", toks["warden"])
    r = {}
    for _ in range(50):
        try:
            r = warden.call("request_approval", {"item": "LinkedIn post #1", "draft_text": "We are hiring <b>two</b> builders.\n"})
        except OSError:
            r = {}
        if r.get("result") == "REQUESTED":
            break
        time.sleep(0.2)
    assert r.get("result") == "REQUESTED", r
    return r


F = {"Cf-Access-Authenticated-User-Email": "founder@example.com"}


def form(page):
    g = lambda n: re.search(rf'name="{n}" value="([^"]+)"', page).group(1)   # noqa: E731
    return {"request_id": g("request_id"), "sha": g("sha"), "csrf": g("csrf")}


def test_page_lists_full_text_escaped_and_approves_with_csrf(rig):
    h = rig["helper"]()
    code, page = req(h + "/bk-approve", F)
    assert code == 200 and "We are hiring &lt;b&gt;two&lt;/b&gt; builders." in page and "<b>two</b>" not in page
    f = form(page)
    assert f["request_id"] == rig["req"]["id"] and f["sha"] == rig["req"]["draft_sha256"]
    body = urllib.parse.urlencode({**f, "decision": "approved"}).encode()
    code, out = req(h + "/bk-approve/decide", {**F, "Origin": urllib.parse.urlsplit(h).scheme + "://" + urllib.parse.urlsplit(h).netloc}, body)
    assert code == 200 and "Recorded" in out
    aid = re.search(r"<b>(A-[0-9a-f]{8})</b>", out).group(1)
    from bk_telegram import Library
    chk = Library(f"http://127.0.0.1:{rig['lport']}/mcp", rig["toks"]["reviewer"]).call(
        "check_approval", {"approval_id": aid, "text": "We are hiring <b>two</b> builders."})
    assert chk["result"] == "MATCH" and chk["authorises"] is True
    code, page = req(h + "/bk-approve", F)
    assert "Nothing is waiting" in page and aid in page


@pytest.mark.parametrize("hdr,why", [
    ({}, "not protecting"),
    ({"Cf-Access-Authenticated-User-Email": "mallory@example.com"}, "not in BK_FOUNDER_EMAILS"),
    ({**F, "Cf-Access-Client-Id": "abc.access"}, "service token"),
    ({**F, "Cf-Access-Client-Secret": "s3cr3t"}, "service token"),
])
def test_refuses_without_the_founders_access_identity(rig, hdr, why):
    h = rig["helper"]()
    for url, data in ((h + "/bk-approve", None), (h + "/bk-approve/decide", b"request_id=x&sha=y&csrf=z&decision=approved")):
        code, page = req(url, hdr, data)
        assert code == 403 and why in page


def test_csrf_origin_and_hash_checks(rig):
    h = rig["helper"]()
    f = form(req(h + "/bk-approve", F)[1])
    enc = lambda **k: urllib.parse.urlencode({**f, "decision": "approved", **k}).encode()   # noqa: E731
    assert req(h + "/bk-approve/decide", F, enc(csrf=""))[0] == 403
    assert req(h + "/bk-approve/decide", F, enc(csrf="1700000000." + "0" * 64))[0] == 403
    assert req(h + "/bk-approve/decide", {"Cf-Access-Authenticated-User-Email": "cofounder@example.com"}, enc())[0] == 403  # token bound to the email
    assert req(h + "/bk-approve/decide", {**F, "Origin": "https://evil.example.net"}, enc())[0] == 403
    code, out = req(h + "/bk-approve/decide", F, enc(sha="0" * 64))     # CSRF covers the hash → mismatch refused here
    assert code == 403
    assert "R-" in req(h + "/bk-approve", F)[1]                         # still pending


def test_empty_founder_list_refuses_everyone_and_wrong_peer_uid(rig):
    code, page = req(rig["helper"](BK_FOUNDER_EMAILS="") + "/bk-approve", F)
    assert code == 403 and "BK_FOUNDER_EMAILS is not set" in page
    h = rig["helper"](BK_APPROVE_PEER_UIDS="65530")                     # only "the tunnel's user" may connect
    code, page = req(h + "/bk-approve", F)
    assert code == 403 and "not through the Cloudflare tunnel" in page
    assert req(h + "/bk-login", F)[0] == 200                            # /bk-login is unchanged (v0.4 behaviour)


def test_peer_uid_reads_proc_net_tcp(tmp_path):
    srv = socket.socket(); srv.bind(("127.0.0.1", 0)); srv.listen(1)
    c = socket.create_connection(srv.getsockname()); conn, addr = srv.accept()
    assert bk_static.peer_uid(addr, srv.getsockname()[1]) == os.getuid()
    assert bk_static.peer_uid(("127.0.0.1", 1), srv.getsockname()[1]) is None
    fake = tmp_path / "tcp"; fake.write_text("  sl  local_address rem_address   st tx_queue rx_queue tr tm->when retrnsmt   uid\n"
                                             "   0: 0100007F:D431 0100007F:1F91 01 00000000:00000000 00:00000000 00000000  10001 0 1\n")
    assert bk_static.peer_uid(("127.0.0.1", 0xD431), 8081, str(fake)) == 10001
    c.close(); conn.close(); srv.close()
