#!/usr/bin/env python3
"""bk_static.py — tiny, strict static server for the PUBLIC status page and (v0.6, 20 Nov 2026) the founder's optional public
website (v0.5, 19 Nov 2026: + the founder's /bk-approve page; v0.3 18 Nov). MIT licence.

Replaces `python -m http.server` (which lists folders and follows symlinks — one symlink to /data would have published
the Library and the diary). This server:
  * serves ONLY regular files under one folder (default /data/site/public, written only by bk_status.py as the infra
    user — citizens cannot write there);
  * never follows a symlink (every path component is checked with lstat), never lists a folder, never serves dotfiles;
  * GET/HEAD only; /health answers 200 with the supervisor's state (Nimbuz health check, works even when the agents are
    stopped, the disk is low or the backup is unreachable);
  * --login-helper mode: serves /bk-login ONCE (the dsh login link written by the supervisor to a 0600 file), then 410.
    Route it in Cloudflare as agent.<domain>/bk-login (path rule) so the SAME Access app protects it.
  * v0.5, same helper, same port: /bk-approve = the FOUNDER-ONLY approvals page. It lists the citizens' pending approval
    requests with their full text and records Approve/Reject through the Library's admin port (the only way an approval
    is recorded; no citizen token can do it). A request is refused (403) unless ALL of these hold:
      - it came through cloudflared: the connecting socket belongs to the infra user (BK_APPROVE_PEER_UIDS, set by the
        supervisor; checked in /proc/net/tcp) — so a citizen's shell cannot curl 127.0.0.1 with a forged header;
      - Cloudflare Access authenticated a PERSON: header Cf-Access-Authenticated-User-Email present, no service-token
        headers (Cf-Access-Client-Id / -Secret);
      - that email is in BK_FOUNDER_EMAILS (comma-separated; empty = the page refuses everyone);
      - POST only: a valid CSRF token (HMAC of email + request + text hash + time, 1 h) and, if the browser sent one, an
        Origin equal to the page's own host.
  * v0.6 — the founder's PUBLIC WEBSITE (optional): if --www DIR (the supervisor passes BK_SITE_DIR, default
    /opt/bk/site/www: the kit's site/www/ folder, root-owned and read-only in the image) is a real folder with an
    index.html when the server starts, that folder is served at / and the status page moves to /status/ (/status.json
    and /health keep working at their old paths). Same rules for both folders: regular files only, no symlinks, no
    dotfiles, no listings, GET/HEAD only. Each folder has its own Content-Security-Policy (the status page keeps the
    strict one; the website may load its own scripts, styles, fonts and images — never anything from another site) and
    its own caching (status: no-cache; website pages 5 min, assets longer). Without a website everything is as in v0.5
    (the status page at /); /status/ also works then, so links to it never break.
Tested: tests/test_static_status.py, tests/test_approve.py.
"""
import argparse, hashlib, hmac, html, json, os, secrets, stat, sys, threading, time, urllib.error, urllib.parse, urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import unquote, urlsplit

TYPES = {".html": "text/html; charset=utf-8", ".json": "application/json", ".css": "text/css; charset=utf-8",
         ".txt": "text/plain; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg",
         ".jpeg": "image/jpeg", ".gif": "image/gif", ".ico": "image/x-icon", ".webp": "image/webp",
         # v0.6: what a founder's website and the guide's download folder need
         ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8", ".woff2": "font/woff2",
         ".woff": "font/woff", ".zip": "application/zip", ".pdf": "application/pdf", ".xml": "application/xml",
         ".webmanifest": "application/manifest+json", ".sha256": "text/plain; charset=utf-8",
         ".md": "text/plain; charset=utf-8", ".yml": "text/plain; charset=utf-8", ".yaml": "text/plain; charset=utf-8",
         ".py": "text/plain; charset=utf-8", ".sh": "text/plain; charset=utf-8", ".cypher": "text/plain; charset=utf-8",
         ".example": "text/plain; charset=utf-8", "": "text/plain; charset=utf-8"}   # "" = no extension (LICENSE, Dockerfile, SHA256SUMS)
SECURITY = {"X-Content-Type-Options": "nosniff", "X-Frame-Options": "DENY", "Referrer-Policy": "no-referrer",
            "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; img-src 'self'"}
STATUS_CSP = SECURITY["Content-Security-Policy"]
# v0.6: the founder's website. Own files only ('self'): no inline scripts, no other sites, no frames, no forms that post.
WWW_CSP = ("default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; "
           "connect-src 'self'; manifest-src 'self'; form-action 'none'; base-uri 'none'; frame-ancestors 'none'")
WWW_SHORT = {".html", ".xml", ".txt", ".sha256", ".json", ".webmanifest", ""}     # pages and small text: 5 minutes
WWW_MEDIUM = {".js", ".mjs", ".css"}                                               # code: 1 hour (not renamed on updates)
# everything else (fonts, images, zips, downloads): 1 day


def www_cache(path):
    ext = os.path.splitext(path)[1].lower()
    return "public, max-age=300" if ext in WWW_SHORT else ("public, max-age=3600" if ext in WWW_MEDIUM else "public, max-age=86400")


def ctype(path):
    return TYPES.get(os.path.splitext(path)[1].lower(), "application/octet-stream")


def www_root(path):
    """The website folder if it may be served (a real folder, not a symlink, with a regular index.html), else None."""
    if not path:
        return None
    path = os.path.abspath(path)
    try:
        if not stat.S_ISDIR(os.lstat(path).st_mode) or not stat.S_ISREG(os.lstat(os.path.join(path, "index.html")).st_mode):
            return None
    except OSError:
        return None
    return path


def resolve(root, url_path):
    """Return the absolute path of a servable regular file, or None. No symlinks anywhere, no dotfiles, no folders."""
    path = unquote(urlsplit(url_path).path)
    if "\x00" in path or "\\" in path:
        return None
    parts = [p for p in path.split("/") if p]
    if any(p.startswith(".") for p in parts):
        return None
    cur = root
    try:
        if stat.S_ISLNK(os.lstat(root).st_mode):
            return None
        for p in parts:
            cur = os.path.join(cur, p)
            st = os.lstat(cur)
            if stat.S_ISLNK(st.st_mode):
                return None
        st = os.lstat(cur)
        if stat.S_ISDIR(st.st_mode):
            cur = os.path.join(cur, "index.html")
            st = os.lstat(cur)
        return cur if stat.S_ISREG(st.st_mode) else None
    except OSError:
        return None


def _hex_addr(ip, port):
    a = "".join(f"{int(x):02X}" for x in reversed(ip.split(".")))
    return f"{a}:{port:04X}"


def peer_uid(client, server_port, proc_net="/proc/net/tcp"):
    """uid owning the CLIENT end of this loopback TCP connection (Linux /proc/net/tcp), or None if not found."""
    want_local, want_rem = _hex_addr(client[0], client[1]), _hex_addr("127.0.0.1", server_port)
    try:
        lines = open(proc_net).read().splitlines()[1:]
    except OSError:
        return None
    for ln in lines:
        f = ln.split()
        if len(f) > 7 and f[1] == want_local and f[2] == want_rem:
            return int(f[7])
    return None


def approve_config(env=None):
    """The /bk-approve settings from the environment (the supervisor gives the login helper exactly these)."""
    env = os.environ if env is None else env
    uids = {int(x) for x in (env.get("BK_APPROVE_PEER_UIDS") or "").split(",") if x.strip().isdigit()}
    return {"admin": env.get("BK_LIBRARY_ADMIN", "http://127.0.0.1:7802"), "token": env.get("LIBRARY_ADMIN_TOKEN", ""),
            "founders": {e.strip().lower() for e in (env.get("BK_FOUNDER_EMAILS") or "").split(",") if "@" in e},
            "peer_uids": uids or None, "secret": secrets.token_bytes(32), "csrf_ttl": int(env.get("BK_APPROVE_CSRF_TTL_S", 3600))}


PAGE_CSS = ("body{font:16px system-ui;max-width:52rem;margin:1.5rem auto;padding:0 1rem;color:#222}"
            "pre{white-space:pre-wrap;background:#f5f2ea;border:1px solid #ddd;padding:.8rem;border-radius:6px}"
            ".req{border:1px solid #ccc;border-radius:8px;padding:.8rem 1rem;margin:1rem 0}"
            "button{font-size:1rem;padding:.4rem 1.2rem;margin-right:.6rem;border-radius:6px;border:1px solid #888;cursor:pointer}"
            ".ok{background:#e3f4e1}.no{background:#fbe4e4}small{color:#666}")


def make_handler(root, state_file, login_file=None, approve=None, www=None):
    """root = the status page folder; www = the website folder (already checked by www_root) or None."""
    class H(BaseHTTPRequestHandler):
        server_version = "babykalki"
        sys_version = ""

        def _send(self, code, body, ctype="text/plain; charset=utf-8", head=False, extra=None):
            self.send_response(code)
            for k, v in {**SECURITY, "Content-Type": ctype, "Content-Length": str(len(body)), "Cache-Control": "no-cache", **(extra or {})}.items():
                self.send_header(k, v)
            self.end_headers()
            if not head:
                self.wfile.write(body)

        def _get(self, head):
            if login_file is not None:
                if approve is not None and self._is_approve():
                    return self._approve_get(head)
                return self._login(head)
            path = urlsplit(self.path).path
            if path == "/health":
                try:
                    st = json.load(open(state_file))
                except Exception:
                    st = {"state": "STARTING"}
                return self._send(200, json.dumps({"ok": True, **{k: st.get(k) for k in ("state", "detail", "at")}}).encode(),
                                  "application/json", head)
            if path == "/status":                                   # v0.6: relative links on the status page need the slash
                return self._send(301, b"", extra={"Location": "/status/"}, head=head)
            if path.startswith("/status/") or (www and path == "/status.json"):
                # the status page: always at /status/ (v0.6), and at / too when there is no website (v0.5 behaviour)
                p = resolve(root, self.path[len("/status"):] if path.startswith("/status/") else self.path)
                return self._file(p, head, STATUS_CSP, "no-cache")
            if not www:
                return self._file(resolve(root, self.path), head, STATUS_CSP, "no-cache")
            p = resolve(www, self.path)
            if not p:                                              # the website's own 404 page, if it has one
                nf = resolve(www, "/404.html")
                if nf:
                    with open(nf, "rb") as f:
                        return self._send(404, f.read(), "text/html; charset=utf-8", head,
                                          extra={"Content-Security-Policy": WWW_CSP, "Cache-Control": "public, max-age=300"})
            return self._file(p, head, WWW_CSP, www_cache(p) if p else "no-cache")

        def _file(self, p, head, csp, cache):
            if not p:
                return self._send(404, b"not found\n", head=head)
            with open(p, "rb") as f:
                body = f.read()
            self._send(200, body, ctype(p), head, extra={"Content-Security-Policy": csp, "Cache-Control": cache})

        def _login(self, head):
            if urlsplit(self.path).path != "/bk-login":
                return self._send(404, b"not found\n", head=head)
            if not self.headers.get("Cf-Access-Authenticated-User-Email"):
                # Cloudflare Access adds this header. Missing = Access is not in front of this route: refuse.
                # (A plausibility check that catches set-up mistakes; the real lock is the Access policy itself.)
                return self._send(403, b"Cloudflare Access is not protecting this address. Fix Access first.\n", head=head)
            try:
                link = open(login_file).read().strip()
            except OSError:
                return self._send(410, b"Gone: the login link was already shown (or dsh has not printed one yet).\n"
                                       b"Restarting dsh creates a new one.\n", head=head)
            if head:
                return self._send(200, b"", "text/html; charset=utf-8", True)
            os.remove(login_file)               # one shot
            body = (f'<!doctype html><meta name="viewport" content="width=device-width"><title>dsh login</title>'
                    f'<body style="font:18px system-ui;max-width:40rem;margin:2rem auto;padding:0 1rem">'
                    f'<p>Your one-time dsh login link (shown once, never logged):</p>'
                    f'<p><a style="font-size:1.2em" rel="noreferrer" href="{html.escape(link)}">Open dsh and sign in</a></p>'
                    f'<p>dsh swaps it for a cookie. If you lose it, restart dsh to get a new one.</p>').encode()
            self._send(200, body, "text/html; charset=utf-8", extra={"Cache-Control": "no-store"})

        # ---- v0.5: /bk-approve, the founder-only approvals page ----
        def _is_approve(self):
            p = urlsplit(self.path).path
            return p == "/bk-approve" or p.startswith("/bk-approve/")

        def _who(self):
            """The founder's email, or (None, reason). Every check must pass; see the module docstring."""
            if approve["peer_uids"] is not None:
                uid = peer_uid(self.client_address, self.server.server_address[1])
                if uid not in approve["peer_uids"]:
                    return None, "not through the Cloudflare tunnel (local connection from another user)"
            if self.headers.get("Cf-Access-Client-Id") or self.headers.get("Cf-Access-Client-Secret"):
                return None, "a service token cannot approve; only the founder, signed in through Cloudflare Access"
            email = (self.headers.get("Cf-Access-Authenticated-User-Email") or "").strip().lower()
            if not email:
                return None, "Cloudflare Access is not protecting this address (no signed-in person)"
            if not approve["founders"]:
                return None, "BK_FOUNDER_EMAILS is not set, so nobody may approve. Set it to your Access email and restart"
            if email not in approve["founders"]:
                return None, "this signed-in person is not in BK_FOUNDER_EMAILS"
            return email, ""

        def _csrf(self, email, rid, sha, ts=None):
            ts = str(int(time.time())) if ts is None else ts
            mac = hmac.new(approve["secret"], f"{email}|{rid}|{sha}|{ts}".encode(), hashlib.sha256).hexdigest()
            return f"{ts}.{mac}"

        def _csrf_ok(self, token, email, rid, sha):
            ts, _, _mac = (token or "").partition(".")
            if not ts.isdigit() or time.time() - int(ts) > approve["csrf_ttl"] or int(ts) > time.time() + 60:
                return False
            return hmac.compare_digest(self._csrf(email, rid, sha, ts), token)

        def _admin(self, path, body=None):
            req = urllib.request.Request(approve["admin"] + path, data=None if body is None else json.dumps(body).encode(),
                                         headers={"X-Admin-Token": approve["token"], "Content-Type": "application/json"})
            try:
                with urllib.request.urlopen(req, timeout=10) as r:
                    return json.load(r)
            except urllib.error.HTTPError as e:
                try:
                    return json.load(e)
                except Exception:
                    return {"result": "ERROR", "reason": f"Library admin port answered {e.code}"}
            except Exception as e:
                return {"result": "ERROR", "reason": f"Library unreachable ({type(e).__name__})"}

        def _page(self, code, inner, head=False):
            body = (f'<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width">'
                    f'<title>Approvals — BabyKalki</title><style>{PAGE_CSS}</style><body>{inner}').encode()
            self._send(code, body, "text/html; charset=utf-8", head,
                       extra={"Cache-Control": "no-store", "Content-Security-Policy":
                              "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'"})

        def _deny(self, why, head=False):
            self._page(403, f"<h1>Not allowed</h1><p>{html.escape(why)}.</p>", head)

        def _approve_get(self, head):
            email, why = self._who()
            if not email:
                return self._deny(why, head)
            data = self._admin("/approvals/pending")
            if "pending" not in data:
                return self._page(502, f"<h1>Approvals</h1><p>{html.escape(str(data.get('reason', 'Library error')))}</p>", head)
            e = html.escape
            parts = [f"<h1>Approvals</h1><p><small>Signed in as {e(email)}. Only you can approve; the citizens can only ask. "
                     f"Read the WHOLE text: approving means exactly this text, nothing else.</small></p>"]
            if not data["pending"]:
                parts.append("<p><b>Nothing is waiting for you.</b></p>")
            for r in data["pending"]:
                rid, sha = str(r.get("id", "")), str(r.get("draft_sha256", ""))
                parts.append(
                    f'<div class="req"><p><b>{e(str(r.get("item", "")))}</b><br><small>{e(rid)} · asked by '
                    f'{e(str(r.get("requested_by", "?")))} at {e(str(r.get("at", "")))}</small></p>'
                    f'<pre>{e(str(r.get("draft_text", "")))}</pre>'
                    + (f'<p><small>Note from the citizen: {e(str(r.get("note")))}</small></p>' if r.get("note") else "")
                    + f'<p><small>SHA-256 ({e(str(r.get("canon") or ""))}): {e(sha)}</small></p>'
                    f'<form method="post" action="/bk-approve/decide">'
                    f'<input type="hidden" name="request_id" value="{e(rid)}"><input type="hidden" name="sha" value="{e(sha)}">'
                    f'<input type="hidden" name="csrf" value="{e(self._csrf(email, rid, sha))}">'
                    f'<button class="ok" name="decision" value="approved">Approve</button>'
                    f'<button class="no" name="decision" value="rejected">Reject</button></form></div>')
            if data.get("recent"):
                parts.append("<h2>Recent decisions</h2><ul>" + "".join(
                    f'<li>{e(str(d.get("at", "")))} — {e(str(d.get("decision", "")))} — {e(str(d.get("item", "")))} '
                    f'<small>({e(str(d.get("id", "")))} for {e(str(d.get("request", "")))})</small></li>'
                    for d in reversed(data["recent"])) + "</ul>")
            self._page(200, "".join(parts), head)

        def _approve_post(self):
            if urlsplit(self.path).path != "/bk-approve/decide":
                return self._send(404, b"not found\n")
            email, why = self._who()
            if not email:
                return self._deny(why)
            origin = self.headers.get("Origin")
            if origin and origin != "null" and urlsplit(origin).netloc != (self.headers.get("Host") or ""):
                return self._deny("this form was sent from another site")
            n = int(self.headers.get("Content-Length") or 0)
            if n > 16384:
                return self._send(413, b"too large\n")
            f = urllib.parse.parse_qs(self.rfile.read(n).decode("utf-8", "replace"))
            g = lambda k: (f.get(k) or [""])[0]   # noqa: E731
            rid, sha, decision = g("request_id"), g("sha"), g("decision")
            if not self._csrf_ok(g("csrf"), email, rid, sha):
                return self._deny("the form expired or was not made by this page (CSRF check). Reload /bk-approve")
            res = self._admin("/approvals/decide", {"request_id": rid, "decision": decision, "founder": email, "shown_sha256": sha})
            e = html.escape
            if res.get("result") == "DECIDED":
                return self._page(200, f"<h1>Recorded</h1><p>{e(res['decision'])} — {e(res['request'])} → decision "
                                       f"<b>{e(res['id'])}</b>. The Warden sees it in list_approvals.</p>"
                                       f'<p><a href="/bk-approve">Back to approvals</a></p>')
            return self._page(409, f"<h1>Not recorded</h1><p>{e(str(res.get('reason', res)))}</p>"
                                   f'<p><a href="/bk-approve">Back to approvals</a></p>')

        def do_GET(self):
            self._get(False)

        def do_HEAD(self):
            self._get(True)

        def _no(self):
            self._send(405, b"method not allowed\n")

        def do_POST(self):
            if login_file is not None and approve is not None and self._is_approve():
                return self._approve_post()
            self._no()

        do_PUT = do_DELETE = do_PATCH = do_OPTIONS = _no

        def list_directory(self, path):     # belt and braces: never
            return None

        def log_message(self, fmt, *a):
            pass

    return H


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("--root", default="/data/site/public"); ap.add_argument("--host", default="0.0.0.0")
    ap.add_argument("--port", type=int, default=8080); ap.add_argument("--state", default="/data/run/supervisor-state.json")
    ap.add_argument("--login-helper", help="serve /bk-login once from this file (0600, infra user)")
    ap.add_argument("--www", help="v0.6: the founder's website folder; served at / if it has an index.html (status page → /status/)")
    ap.add_argument("--approve", action="store_true", help="v0.5: also serve the founder-only /bk-approve page (login helper only)")
    a = ap.parse_args(argv)
    appr = approve_config() if (a.approve and a.login_helper) else None
    www = None if a.login_helper else www_root(a.www)
    srv = ThreadingHTTPServer((a.host, a.port), make_handler(os.path.abspath(a.root), a.state, a.login_helper, appr, www))
    what = "login helper" if a.login_helper else (f"website {www} at / + status page {a.root} at /status/" if www
                                                  else f"status page {a.root} at / (no website{' in ' + a.www if a.www else ''})")
    print(f"static: serving {what} on {a.host}:{a.port}", flush=True)
    srv.serve_forever()


if __name__ == "__main__":
    main()
