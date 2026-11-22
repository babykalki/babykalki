"""Public site: strict static server (B6) + template-only status publisher (rule 1 exception)."""
import json, os, socket, subprocess, sys, time, urllib.error, urllib.request
import pytest
from conftest import FILES
import bk_status


def free_port():
    s = socket.socket(); s.bind(("127.0.0.1", 0)); p = s.getsockname()[1]; s.close(); return p


def get(url, headers=None):
    try:
        r = urllib.request.urlopen(urllib.request.Request(url, headers=headers or {}), timeout=5)
        return r.status, r.read().decode(), dict(r.headers)
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode(), dict(e.headers)


@pytest.fixture
def site(tmp_path):
    root = tmp_path / "public"; root.mkdir()
    (root / "index.html").write_text("<h1>status</h1>")
    (root / "ok.txt").write_text("fine")
    (root / ".env").write_text("SECRET=1")
    (root / "sub").mkdir(); (root / "sub" / "a.txt").write_text("a")
    private = tmp_path / "library"; private.mkdir(); (private / "facts.txt").write_text("PRIVATE FACTS")
    os.symlink(private, root / "lib")                    # a citizen's symlink to private data …
    os.symlink(private / "facts.txt", root / "facts.txt")
    state = tmp_path / "state.json"; state.write_text(json.dumps({"state": "STOPPED", "detail": "", "at": "2026-11-17T10:00:00Z"}))
    port = free_port()
    p = subprocess.Popen([sys.executable, os.path.join(FILES, "bk_static.py"), "--root", str(root), "--host", "127.0.0.1",
                          "--port", str(port), "--state", str(state)], stdout=subprocess.DEVNULL)
    for _ in range(50):
        try:
            socket.create_connection(("127.0.0.1", port), 0.2).close(); break
        except OSError:
            time.sleep(0.1)
    yield f"http://127.0.0.1:{port}"
    p.terminate(); p.wait(5)


def test_serves_files_and_health(site):
    assert get(site + "/")[0:2] == (200, "<h1>status</h1>")
    code, body, hdr = get(site + "/ok.txt")
    assert code == 200 and hdr["X-Content-Type-Options"] == "nosniff" and "Python" not in hdr.get("Server", "")
    code, body, _ = get(site + "/health")
    assert code == 200 and json.loads(body)["state"] == "STOPPED"


@pytest.mark.parametrize("path", ["/lib/facts.txt", "/lib/", "/facts.txt", "/.env", "/sub/", "/sub", "/../library/facts.txt",
                                  "/%2e%2e/library/facts.txt", "/sub/..%2f..%2flibrary/facts.txt", "/nope"])
def test_never_symlinks_listings_dotfiles_or_traversal(site, path):
    code, body, _ = get(site + path)
    assert code == 404 and "PRIVATE" not in body


def test_only_get_head(site):
    req = urllib.request.Request(site + "/ok.txt", data=b"x", method="POST")
    with pytest.raises(urllib.error.HTTPError) as e:
        urllib.request.urlopen(req)
    assert e.value.code == 405


def test_login_helper_one_shot(tmp_path):
    link = tmp_path / "dsh-login.url"; link.write_text("https://agent.example.com/?token=" "abcdefghijklmnop1234")
    os.chmod(link, 0o600)
    port = free_port()
    p = subprocess.Popen([sys.executable, os.path.join(FILES, "bk_static.py"), "--host", "127.0.0.1", "--port", str(port),
                          "--login-helper", str(link)], stdout=subprocess.DEVNULL)
    try:
        for _ in range(50):
            try:
                socket.create_connection(("127.0.0.1", port), 0.2).close(); break
            except OSError:
                time.sleep(0.1)
        u = f"http://127.0.0.1:{port}/bk-login"
        assert get(u)[0] == 403                                   # no Cloudflare Access header → refuse
        assert link.exists()
        acc = {"Cf-Access-Authenticated-User-Email": "founder@example.com"}
        code, body, hdr = get(u, acc)
        assert code == 200 and "abcdefghijklmnop1234" in body and hdr["Cache-Control"] == "no-store"
        assert not link.exists()
        assert get(u, acc)[0] == 410                              # shown once
        assert get(f"http://127.0.0.1:{port}/", acc)[0] == 404
    finally:
        p.terminate(); p.wait(5)


def test_status_template_whitelist(tmp_path):
    evil = {"system_state": "<script>alert(1)</script>", "backup_state": "OK", "facts_live": 12, "proposals_pending": "lots",
            "tasks_open": True, "tasks_overdue": 2, "connections": 3, "connections_red": 0, "diary_files": 6,
            "last_backup_at": "2026-11-17T10:00:00Z", "restore_test": "PASS", "restore_test_at": "yesterday <b>",
            "generated_at": "2026-11-17T10:05:00Z", "version": "v0.3",
            "detail": "Asha's phone is 98xxxx; ZAI key 0123456789abcdef0123456789abcdef" "." "A1b2C3d4E5f6G7h8"}
    out = tmp_path / "public"
    vals = bk_status.publish(str(out), os.path.join(FILES, "site", "status-template.html"), evil)
    page = (out / "index.html").read_text()
    assert "<script>" not in page and "Asha" not in page and "0123456789abcdef" not in page and "yesterday" not in page
    assert vals["facts_live"] == "12" and vals["proposals_pending"] == "—" and vals["tasks_open"] == "—"
    assert vals["system_state"] == "—" and ">12<" in page
    assert json.loads((out / "status.json").read_text()) == vals
    bad = tmp_path / "t.html"; bad.write_text("<p>{{detail}}</p>")
    with pytest.raises(SystemExit, match="not whitelisted"):
        bk_status.publish(str(out), str(bad), evil)


def test_status_page_shows_lease_states(tmp_path):
    for st, bk in (("WAITING_FOR_LEASE", "LEASE_BUSY"), ("LEASE_LOST", "LEASE_LOST"), ("LEASE_UNCONFIRMED", "OK")):
        vals = bk_status.publish(str(tmp_path / st), os.path.join(FILES, "site", "status-template.html"),
                                 {"system_state": st, "backup_state": bk, "version": "v0.4"})
        assert vals["system_state"] == st and vals["backup_state"] == bk and vals["version"] == "v0.4"
        assert st in (tmp_path / st / "index.html").read_text()


# ---------------------------------------------------------------- v0.6: the founder's public website (site/www/)
def start_static(root, state, www=None):
    port = free_port()
    argv = [sys.executable, os.path.join(FILES, "bk_static.py"), "--root", str(root), "--host", "127.0.0.1",
            "--port", str(port), "--state", str(state)] + (["--www", str(www)] if www is not None else [])
    p = subprocess.Popen(argv, stdout=subprocess.DEVNULL)
    for _ in range(50):
        try:
            socket.create_connection(("127.0.0.1", port), 0.2).close(); break
        except OSError:
            time.sleep(0.1)
    return p, f"http://127.0.0.1:{port}"


def get_raw(url, method="GET"):
    """No redirect following (urllib follows 301 by itself)."""
    import http.client
    u = urllib.parse.urlsplit(url)
    c = http.client.HTTPConnection(u.hostname, u.port, timeout=5)
    c.request(method, u.path + (("?" + u.query) if u.query else ""))
    r = c.getresponse()
    body = r.read()
    c.close()
    return r.status, body, {k.lower(): v for k, v in r.getheaders()}


import urllib.parse   # noqa: E402


@pytest.fixture
def website(tmp_path):
    status = tmp_path / "public"; status.mkdir()
    vals = bk_status.publish(str(status), os.path.join(FILES, "site", "status-template.html"),
                             {"system_state": "RUNNING", "backup_state": "OK", "facts_live": 7, "version": "v0.6"})
    www = tmp_path / "www"; www.mkdir()
    (www / "index.html").write_text("<h1>my startup</h1>")
    (www / "404.html").write_text("<h1>lost</h1>")
    (www / "app.js").write_text("console.log(1)")
    (www / "font.woff2").write_bytes(b"wOF2fake")
    (www / "files").mkdir()
    (www / "files" / "kit.zip").write_bytes(b"PK\x03\x04fake")
    (www / "files" / "kit.zip.sha256").write_text("abc  kit.zip\n")
    (www / "files" / "LICENSE").write_text("MIT")
    (www / "files" / "README.md").write_text("# hi")
    (www / "files" / "cordis.patch.yml").write_text("a: 1")
    (www / "files" / "bk_x.py").write_text("print(1)")
    (www / "files" / "d.mjs").write_text("export {}")
    (www / ".env").write_text("SECRET=1")
    (www / "status").mkdir(); (www / "status" / "index.html").write_text("SHADOWED")
    private = tmp_path / "library"; private.mkdir(); (private / "facts.txt").write_text("PRIVATE FACTS")
    os.symlink(private, www / "lib")
    os.symlink(private / "facts.txt", www / "facts.txt")
    os.symlink(private / "facts.txt", status / "leak.txt")
    state = tmp_path / "state.json"; state.write_text(json.dumps({"state": "RUNNING", "detail": "", "at": "2026-11-20T10:00:00Z"}))
    p, url = start_static(status, state, www)
    yield url, vals
    p.terminate(); p.wait(5)


def test_www_served_at_root_with_own_csp_and_cache(website):
    url, _ = website
    code, body, h = get_raw(url + "/")
    assert code == 200 and body == b"<h1>my startup</h1>" and h["content-type"].startswith("text/html")
    csp = h["content-security-policy"]
    assert "script-src 'self'" in csp and "font-src 'self'" in csp and "img-src 'self' data:" in csp
    assert "'unsafe-eval'" not in csp and "http" not in csp and "frame-ancestors 'none'" in csp
    assert "script-src 'self' 'unsafe-inline'" not in csp
    assert h["cache-control"] == "public, max-age=300" and h["x-content-type-options"] == "nosniff"
    code, _, h = get_raw(url + "/app.js")
    assert code == 200 and h["content-type"] == "text/javascript; charset=utf-8" and h["cache-control"] == "public, max-age=3600"
    code, _, h = get_raw(url + "/font.woff2")
    assert code == 200 and h["content-type"] == "font/woff2" and h["cache-control"] == "public, max-age=86400"


@pytest.mark.parametrize("path,ctype", [("/files/kit.zip", "application/zip"), ("/files/kit.zip.sha256", "text/plain; charset=utf-8"),
                                        ("/files/LICENSE", "text/plain; charset=utf-8"), ("/files/README.md", "text/plain; charset=utf-8"),
                                        ("/files/cordis.patch.yml", "text/plain; charset=utf-8"), ("/files/bk_x.py", "text/plain; charset=utf-8"),
                                        ("/files/d.mjs", "text/javascript; charset=utf-8")])
def test_www_content_types(website, path, ctype):
    code, _, h = get_raw(website[0] + path)
    assert code == 200 and h["content-type"] == ctype


def test_status_moves_to_status_with_strict_csp(website):
    url, vals = website
    code, body, h = get_raw(url + "/status/")
    assert code == 200 and b"RUNNING" in body and b"SHADOWED" not in body
    assert h["content-security-policy"] == "default-src 'none'; style-src 'unsafe-inline'; img-src 'self'"
    assert h["cache-control"] == "no-cache"
    code, _, h = get_raw(url + "/status")
    assert code == 301 and h["location"] == "/status/"
    for p in ("/status.json", "/status/status.json"):          # compatibility path + new path, same data
        code, body, h = get_raw(url + p)
        assert code == 200 and json.loads(body) == vals and h["cache-control"] == "no-cache"
        assert h["content-type"] == "application/json"
    code, body, _ = get_raw(url + "/health")
    assert code == 200 and json.loads(body)["state"] == "RUNNING"
    code, _, h = get_raw(url + "/status/", "HEAD")
    assert code == 200 and h["cache-control"] == "no-cache"


@pytest.mark.parametrize("path", ["/lib/facts.txt", "/lib/", "/facts.txt", "/.env", "/files/", "/files", "/../library/facts.txt",
                                  "/%2e%2e/library/facts.txt", "/files/..%2f..%2flibrary/facts.txt", "/status/leak.txt",
                                  "/status/../library/facts.txt", "/status/%2e%2e/www/index.html", "/status/.env", "/nope"])
def test_www_never_symlinks_listings_dotfiles_or_traversal(website, path):
    code, body, h = get_raw(website[0] + path)
    assert code == 404 and b"PRIVATE" not in body and b"SECRET" not in body
    if not path.startswith("/status/"):
        assert body == b"<h1>lost</h1>" and h["content-security-policy"].startswith("default-src 'none'; script-src 'self'")


def test_www_only_get_head(website):
    for m in ("POST", "PUT", "DELETE"):
        assert get_raw(website[0] + "/", m)[0] == 405


@pytest.mark.parametrize("variant", ["missing", "no-index", "symlink", "file"])
def test_no_website_keeps_v05_behaviour(tmp_path, variant):
    status = tmp_path / "public"; status.mkdir()
    bk_status.publish(str(status), os.path.join(FILES, "site", "status-template.html"), {"system_state": "STOPPED", "version": "v0.6"})
    www = tmp_path / "www"
    if variant == "no-index":
        www.mkdir(); (www / "about.html").write_text("ABOUT")
    elif variant == "symlink":
        real = tmp_path / "real"; real.mkdir(); (real / "index.html").write_text("VIA SYMLINK"); os.symlink(real, www)
    elif variant == "file":
        www.write_text("not a folder")
    state = tmp_path / "state.json"; state.write_text(json.dumps({"state": "STOPPED"}))
    p, url = start_static(status, state, www)
    try:
        code, body, h = get_raw(url + "/")
        assert code == 200 and b"STOPPED" in body and b"VIA SYMLINK" not in body
        assert h["content-security-policy"] == "default-src 'none'; style-src 'unsafe-inline'; img-src 'self'"
        assert h["cache-control"] == "no-cache"
        assert get_raw(url + "/status/")[0] == 200 and get_raw(url + "/status.json")[0] == 200
        assert get_raw(url + "/about.html")[0] == 404
        assert get_raw(url + "/health")[0] == 200
    finally:
        p.terminate(); p.wait(5)


def test_status_template_links_home_and_json(tmp_path):
    bk_status.publish(str(tmp_path / "o"), os.path.join(FILES, "site", "status-template.html"), {"version": "v0.6"})
    page = (tmp_path / "o" / "index.html").read_text()
    assert 'href="/status.json"' in page and 'href="/"' in page and "http" not in page.replace("http-equiv", "")


def test_status_publish_concurrently_and_icon(tmp_path):
    """v0.8 (erratum 26): two status updates at once used to share one temp file and one of them failed. + R1-42 icon."""
    import threading
    out, tpl, errs = tmp_path / "pub", os.path.join(FILES, "site", "status-template.html"), []

    def go(i):
        try:
            for _ in range(40):
                bk_status.publish(str(out), tpl, {"version": "v0.7", "facts_live": i})
        except Exception as e:                                   # noqa: BLE001
            errs.append(repr(e))
    ts = [threading.Thread(target=go, args=(i,)) for i in range(6)]
    [t.start() for t in ts]; [t.join() for t in ts]
    assert errs == []
    assert sorted(os.listdir(out)) == ["favicon.svg", "index.html", "status.json"]      # no temp files left behind
    assert (out / "favicon.svg").read_text().startswith("<svg") and 'rel="icon" href="favicon.svg"' in (out / "index.html").read_text()
