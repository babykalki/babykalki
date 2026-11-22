"""Supervisor (M3/M6/M8 + B1 at boot): stand-in dsh and cloudflared; REAL Library, backups, rclone (local folder as R2),
static server, status page. With root, two real Linux users (agents vs infra) are created to test the separation."""
import glob, json, os, pwd, re, shutil, signal, socket, subprocess, sys, time, urllib.error, urllib.request
import pytest
from conftest import FILES

HERE = os.path.dirname(os.path.abspath(__file__))
RCLONE = os.environ.get("BK_TEST_RCLONE") or shutil.which("rclone") or "/workspace/.bk-tools/rclone"
BASE = os.environ.get("BK_TEST_DIR", "/workspace/.bk-test")
PY = sys.executable
ROOT = os.geteuid() == 0
pytestmark = pytest.mark.skipif(not os.path.exists(RCLONE), reason="rclone binary not found")


def ensure_users():
    if not ROOT:
        return False
    for u in ("node", "bkinfra", "bkcomm", "bklib"):
        try:
            pwd.getpwnam(u)
        except KeyError:
            subprocess.run(["useradd", "-r", "-M", "-s", "/usr/sbin/nologin", u], check=True)
    return True


SEPARATE = ensure_users()


def free_port():
    s = socket.socket(); s.bind(("127.0.0.1", 0)); p = s.getsockname()[1]; s.close(); return p


def get(url, headers=None):
    try:
        r = urllib.request.urlopen(urllib.request.Request(url, headers=headers or {}), timeout=5)
        return r.status, r.read().decode()
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()
    except OSError:
        return None, ""


class Sup:
    def __init__(self, name, remote=None, **env):
        self.dir = os.path.join(BASE, name)
        shutil.rmtree(self.dir, ignore_errors=True)
        os.makedirs(self.dir); os.chmod(BASE, 0o755); os.chmod(self.dir, 0o755)
        self.data, self.remote, self.runtime = (os.path.join(self.dir, x) for x in ("data", "remote", "run-bk"))
        if remote:                       # a second copy sharing the first one's bucket (rolling restart)
            self.remote = remote
        os.makedirs(self.remote, exist_ok=True)
        if SEPARATE:
            ip = pwd.getpwnam("bkinfra")
            shutil.chown(self.remote, ip.pw_uid, ip.pw_gid)
        self.ports = {k: free_port() for k in ("site", "lib", "admin", "login")}
        if env.pop("ROUND", None):         # v0.5: the Librarian round's stand-in needs the Library port
            env["BK_CMD_LIBRARIAN"] = json.dumps([PY, os.path.join(HERE, "stubs", "fake_librarian.py"), str(self.ports["lib"]), FILES])
        self.env = {**{k: v for k, v in os.environ.items() if not k.startswith(("BK_", "PYTEST"))},
                    "BK_DATA": self.data, "BK_SHIP": FILES, "BK_RUNTIME": self.runtime, "BK_LIBRARY_PYTHON": PY, "BK_PYTHON": PY,
                    "BK_REMOTE": self.remote, "BK_RCLONE": RCLONE, "BK_SEPARATE_USERS": "1" if SEPARATE else "0",
                    "BK_RCLONE_FLAGS": "--retries 1 --low-level-retries 1 --contimeout 2s --timeout 10s",
                    "BK_CMD_DSH": json.dumps([PY, os.path.join(HERE, "stubs", "fake_dsh.py")]),
                    "BK_CMD_TUNNEL": json.dumps([PY, "-c", "import os,time;print('Registered tunnel connection token_present=%s' % ('TUNNEL_TOKEN' in os.environ),flush=True);time.sleep(1e9)"]),
                    "TUNNEL_TOKEN": "eyJh" "IjoiZmFrZS1mYWtlLWZha2UtZmFrZS1mYWtlLWZha2UiLCJ0IjoiZmFrZSIsInMiOiJmYWtlZmFrZWZha2UifQ==",
                    "ZAI_API_KEY": "0123456789abcdef0123456789abcdef" "." "A1b2C3d4E5f6G7h8",
                    "RCLONE_CONFIG_R2_SECRET_ACCESS_KEY": "9c0d" * 16, "FAKE_SHIP": FILES,
                    "BK_SITE_PORT": str(self.ports["site"]), "BK_LIBRARY_PORT": str(self.ports["lib"]),
                    "BK_LIBRARY_ADMIN_PORT": str(self.ports["admin"]), "BK_LOGIN_PORT": str(self.ports["login"]),
                    "BK_TICK": "1", "BK_BACKUP_EVERY_MIN": "0.25", "BK_MIN_FREE_MB": "1", "BK_FINAL_TIMEOUT": "30",
                    "BK_MAX_RESTORE_BACKOFF": "5", "BK_DOMAIN": "example.com", "BK_LEASE_CONFIRM_S": "3",
                    "BK_LEASE_HEARTBEAT_S": "2", "BK_LEASE_RETRY_S": "1", **env}
        self.out = open(os.path.join(self.dir, "supervisor.out"), "w")
        self.p = subprocess.Popen([PY, os.path.join(FILES, "bk_supervisor.py")], env=self.env, stdout=self.out, stderr=subprocess.STDOUT)

    def state(self):
        try:
            return json.load(open(os.path.join(self.data, "run", "supervisor-state.json")))
        except Exception:
            return {}

    def wait(self, cond, secs=60):
        end = time.time() + secs
        while time.time() < end:
            if cond():
                return True
            time.sleep(0.5)
        return False

    def health(self):
        return get(f"http://127.0.0.1:{self.ports['site']}/health")

    def public(self):
        # /status/ = the status page with or without a website in site/www/ (v0.6); "/" is the website when there is one
        # (Robin's deploy zip), so the tests also pass when run from inside that zip (v0.8)
        return get(f"http://127.0.0.1:{self.ports['site']}/status/")[1]

    def report(self):
        p = os.path.join(self.data, "citizens", "warden", "work", "report.json")
        return json.load(open(p)) if os.path.exists(p) else None

    def stop(self):
        if self.p.poll() is None:
            self.p.send_signal(signal.SIGTERM)
            try:
                self.p.wait(60)
            except subprocess.TimeoutExpired:
                self.p.kill(); self.p.wait()
        self.out.close()
        return open(os.path.join(self.dir, "supervisor.out")).read()

    def lease(self):
        p = os.path.join(self.remote, "lease.json")
        return json.load(open(p)) if os.path.exists(p) else None

    def complete(self):
        return sorted(glob.glob(os.path.join(self.remote, "snapshots", "*", "COMPLETE")))

    def all_text(self):
        txt = open(os.path.join(self.dir, "supervisor.out"), errors="replace").read()
        for f in glob.glob(os.path.join(self.data, "log", "**", "*"), recursive=True):
            if os.path.isfile(f):
                txt += open(f, errors="replace").read()
        return txt


def test_full_life_cycle_separation_login_stop_backup_sigterm():
    s = Sup("life", DSH_TELEMETRY_MODE="FEEDBACK_ONLY")          # v0.5: a founder's env cannot turn telemetry back on
    try:
        assert s.wait(lambda: s.state().get("state") == "RUNNING" and s.report() is not None, 90), s.all_text()[-3000:]
        code, body = s.health()
        assert code == 200 and json.loads(body)["state"] == "RUNNING"
        assert s.wait(lambda: "RUNNING" in s.public(), 30)
        r = s.report()
        # M6: what the agents' user can and cannot reach
        assert r["has"] == {"TUNNEL_TOKEN": False, "RCLONE_CONFIG_R2_SECRET_ACCESS_KEY": False, "LIBRARY_ADMIN_TOKEN": False,
                            "LIBRARY_TOKEN_WARDEN": True, "ZAI_API_KEY": True, "BK_TELEGRAM_BOT_TOKEN": False,
                            "LIBRARY_TOKEN_COMMUNITY": False,
                            "LIBRARY_TOKEN_LIBRARIAN": False, "LIBRARY_TOKEN_LIBRARIAN_DESK": True}   # v0.5: no commit key in web dsh
        assert s.state()["community"]["state"] == "OFF"                     # v0.5: no bot token ⇒ no community desk
        assert r["telemetry"] == {"DSH_TELEMETRY_MODE": "DISABLED", "DSH_TELEMETRY_OTLP_URL": "http://127.0.0.1:9/",
                                  "DSH_TELEMETRY_DISABLED": "1"}
        assert s.state()["telemetry"] == "OFF" and "ignoring DSH_TELEMETRY_MODE=FEEDBACK_ONLY" in s.all_text()
        assert s.wait(lambda: "Telemetry to DeepSeek (dsh)</td><td>OFF" in s.public(), 30)
        if SEPARATE:
            assert r["uid"] == pwd.getpwnam("node").pw_uid
            assert r["read_infra_environ"] is False
            assert r["write"] == {"library": False, "site_public": False, "ship": False, "citizen_agents_md": False,
                                  "own_work": True, "diary": True, "data_root_STOP": False}
            assert r["read_librarian_dsh"] is False and r["write_librarian_round"] is False   # v0.5: the round's home is bklib's
        # M3: the login link is never logged; it waits in a 0600 file for the one-shot helper
        link = os.path.join(s.runtime, "secret", "dsh-login.url")
        assert s.wait(lambda: os.path.exists(link), 20)
        assert oct(os.stat(link).st_mode & 0o777) == "0o600"
        if SEPARATE:
            assert os.stat(link).st_uid == pwd.getpwnam("bkinfra").pw_uid
        assert "FAKEtoken_0123456789abcdefXYZ" not in s.all_text()
        assert "open https://agent.example.com/bk-login" in s.all_text()     # default agent.<BK_DOMAIN> (v0.4: BK_AGENT_HOST)
        assert "0123456789abcdef0123456789abcdef" "." "A1b2C3d4E5f6G7h8" not in s.all_text()
        lg = f"http://127.0.0.1:{s.ports['login']}/bk-login"
        acc = {"Cf-Access-Authenticated-User-Email": "founder@example.com"}
        code, body = get(lg, acc)
        assert code == 200 and "FAKEtoken_0123456789abcdefXYZ" in body
        assert get(lg, acc)[0] == 410
        # image updates reach existing data
        assert open(os.path.join(s.data, "dsh", "AGENTS.md")).read() == open(os.path.join(FILES, "AGENTS.md")).read()
        # M8: deterministic off-switch
        open(os.path.join(s.data, "STOP"), "w").write("founder\n")
        assert s.wait(lambda: s.state().get("state") == "STOPPED" and not s.state()["procs"]["dsh"]["alive"], 15)
        assert s.wait(lambda: "STOPPED" in s.public(), 20)
        assert json.loads(s.health()[1])["state"] == "STOPPED"
        os.remove(os.path.join(s.data, "STOP"))
        assert s.wait(lambda: s.state().get("state") == "RUNNING" and s.state()["procs"].get("dsh", {}).get("alive"), 20)
        # the Steward's stop request latches (agents cannot un-stop themselves)
        open(os.path.join(s.data, "citizens", "steward", "work", "STOP-REQUEST"), "w").write("quota exhausted\n")
        assert s.wait(lambda: s.state().get("state") == "STOPPED", 15)
        assert os.path.exists(os.path.join(s.data, "STOP"))
        os.remove(os.path.join(s.data, "STOP"))
        assert s.wait(lambda: s.state().get("state") == "RUNNING", 20)
        # one coordinated backup cycle → COMPLETE snapshot off-site, status page shows it
        assert s.wait(lambda: len(s.complete()) >= 1, 90), s.all_text()[-3000:]
        n = len(s.complete())
        assert s.wait(lambda: "OK" in s.public(), 40)
    finally:
        out = s.stop()
    # SIGTERM: final snapshot + push
    assert s.p.returncode == 0, out[-2000:]
    assert len(s.complete()) >= n + 1 or "final backup cut off" in out, out[-2000:]
    assert "stopped" in out
    assert s.lease()["released"] is True and "lease RELEASED" in out       # v0.3: the next copy may start at once


@pytest.mark.parametrize("extra,want,not_want", [
    ({"BK_AGENT_HOST": "agent-bk.example.com"}, "open https://agent-bk.example.com/bk-login", "agent.example.com/bk-login"),
    ({"BK_DOMAIN": ""}, "no BK_DOMAIN or BK_AGENT_HOST set", "(local run)"),
])
def test_login_message_follows_bk_agent_host(extra, want, not_want):
    """v0.4 (erratum B6): the log says where to open the one-shot login — BK_AGENT_HOST, default agent.<BK_DOMAIN>."""
    s = Sup("agenthost-" + ("host" if "BK_AGENT_HOST" in extra else "none"), **extra)
    try:
        link = os.path.join(s.runtime, "secret", "dsh-login.url")
        assert s.wait(lambda: os.path.exists(link) and want in s.all_text(), 90), s.all_text()[-3000:]
    finally:
        out = s.stop()
    assert want in out and not_want not in out
    assert "FAKEtoken_0123456789abcdefXYZ" not in out


def test_unreachable_backup_never_starts_agents():
    s = Sup("unreach", BK_REMOTE="dead:bucket", RCLONE_CONFIG_DEAD_TYPE="s3", RCLONE_CONFIG_DEAD_PROVIDER="Cloudflare",
            RCLONE_CONFIG_DEAD_ENDPOINT="http://127.0.0.1:9", RCLONE_CONFIG_DEAD_ACCESS_KEY_ID="x",
            RCLONE_CONFIG_DEAD_SECRET_ACCESS_KEY="y", RCLONE_CONFIG_DEAD_NO_CHECK_BUCKET="true")
    try:
        assert s.wait(lambda: s.state().get("state") == "WAITING_FOR_BACKUP", 60), s.all_text()[-2000:]
        time.sleep(8)
        assert s.state()["state"] == "WAITING_FOR_BACKUP" and "unreachable" in s.state()["detail"]
        assert s.health()[0] == 200 and s.report() is None
        assert not os.path.exists(os.path.join(s.data, "library", "library.lbug"))
        assert s.wait(lambda: "WAITING_FOR_BACKUP" in s.public(), 20)
    finally:
        s.stop()


def test_low_disk_still_serves_health():
    s = Sup("disk", BK_MIN_FREE_MB=str(10 ** 9))
    try:
        assert s.wait(lambda: s.state().get("state") == "DISK_LOW", 40)
        assert s.health()[0] == 200 and s.report() is None
    finally:
        s.stop()


def test_restart_backoff_and_log_rotation():
    s = Sup("backoff", FAKE_DSH_EXIT="1", BK_LOG_MAX_BYTES="600")
    try:
        assert s.wait(lambda: s.state().get("procs", {}).get("dsh", {}).get("restarts", 0) >= 3, 60)
    finally:
        out = s.stop()
    delays = [int(x.split("restart in ")[1].split(" s")[0]) for x in out.splitlines() if "[dsh]" in x and "restart in" in x]
    assert delays[:3] == [2, 4, 8], delays
    arch = glob.glob(os.path.join(s.data, "log", "archive", "dsh-*.log"))
    assert arch, "dsh log should have rotated"


# --------------------------------------------------------------------------------------------------------------- v0.3
def test_rolling_restart_new_copy_waits_for_old_copys_final_snapshot():
    """Nimbuz rolling restart: the new copy starts while the old one runs. It must wait (health page up, agents NOT
    started) until the old copy's final snapshot + lease release, then restore exactly that snapshot."""
    a = Sup("roll-a")
    b = None
    try:
        assert a.wait(lambda: a.state().get("state") == "RUNNING", 90), a.all_text()[-3000:]
        assert a.wait(lambda: len(a.complete()) >= 1, 90)
        b = Sup("roll-b", remote=a.remote, BK_BACKUP_EVERY_MIN="60")
        assert b.wait(lambda: b.state().get("state") == "WAITING_FOR_LEASE", 60), b.all_text()[-3000:]
        code, body = b.health()
        assert code == 200 and json.loads(body)["state"] == "WAITING_FOR_LEASE"
        assert "final backup" in json.loads(body)["detail"]
        time.sleep(5)                                               # several retries; old copy still the writer
        assert b.state()["state"] == "WAITING_FOR_LEASE" and b.report() is None
        assert not os.path.exists(os.path.join(b.data, "RESTORED"))
        holder_a = re.search(r"lease ACQUIRED by (\S+)", a.all_text()).group(1)
        assert a.state()["state"] == "RUNNING" and a.lease()["holder"] == holder_a and not a.lease()["released"]
        out_a = a.stop()                                            # SIGTERM to the old copy
        assert a.p.returncode == 0 and "lease RELEASED" in out_a, out_a[-2000:]
        final = sorted(os.path.basename(os.path.dirname(x)) for x in a.complete())[-1]
        assert b.wait(lambda: b.state().get("state") == "RUNNING", 90), b.all_text()[-3000:]
        marker = json.load(open(os.path.join(b.data, "RESTORED")))
        assert marker["kind"] == "snapshot" and marker["snapshot"] == final, (marker, final)
        holder_b = re.search(r"lease ACQUIRED by (\S+)", b.all_text()).group(1)
        assert holder_b != holder_a and b.lease()["holder"] == holder_b and b.lease()["released"] is False
    finally:
        if a.p.poll() is None:
            a.stop()
        if b:
            b.stop()


def test_lease_lost_stops_dsh_and_pushes():
    s = Sup("lost")
    try:
        assert s.wait(lambda: s.state().get("state") == "RUNNING" and s.state()["procs"].get("dsh", {}).get("alive"), 90), s.all_text()[-3000:]
        # Another copy takes the lease. It behaves like a real one (v0.5r2): our heartbeat is read-then-write, so it can
        # overwrite a lease written between its read and its write — a real copy sees that on its read-back and tries again;
        # so does this one. (A single write here made this test flaky under load: the heartbeat erased it ~1 run in 2.)
        def take_over():
            if (s.lease() or {}).get("holder") != "someone-else":
                t = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
                tmp = os.path.join(s.dir, "foreign-lease.json")
                json.dump({"holder": "someone-else", "acquired_at": t, "heartbeat_at": t, "released": False}, open(tmp, "w"))
                os.replace(tmp, os.path.join(s.remote, "lease.json"))      # atomic, like an object-store PUT
            return s.state().get("state") == "LEASE_LOST"
        assert s.wait(take_over, 60), s.all_text()[-3000:]
        assert s.lease()["holder"] == "someone-else"
        assert s.wait(lambda: not s.state()["procs"]["dsh"]["alive"], 15)
        n = len(s.complete())
        time.sleep(20)                                              # > one backup interval (15 s in tests)
        assert len(s.complete()) == n and s.state()["state"] == "LEASE_LOST"
        assert not s.state()["procs"]["dsh"]["alive"]
        assert json.loads(s.health()[1])["state"] == "LEASE_LOST"
        assert s.wait(lambda: "LEASE_LOST" in s.public(), 20)
    finally:
        out = s.stop()
    assert len(s.complete()) == n, "no final snapshot from a copy that lost the lease"
    assert s.lease()["holder"] == "someone-else" and s.lease()["released"] is False, "never release someone else's lease"
    assert "LEASE LOST" in out


# ---------------------------------------------------------------- v0.5: enforced commits (Librarian round) + founder approvals
def as_user(user, code, *args):
    """Run a tiny Python snippet as another Linux user (the infra user = what cloudflared runs as)."""
    kw = {"user": user} if SEPARATE else {}
    p = subprocess.run([PY, "-c", code, *args], capture_output=True, text=True, timeout=30, **kw)
    return p.stdout.strip() + p.stderr.strip()


HTTP = """
import sys, urllib.request, urllib.error, json
url, hdr, data = sys.argv[1], json.loads(sys.argv[2]), sys.argv[3].encode() if len(sys.argv) > 3 and sys.argv[3] else None
try:
    r = urllib.request.urlopen(urllib.request.Request(url, data=data, headers=hdr), timeout=10); print(r.status); print(r.read().decode())
except urllib.error.HTTPError as e:
    print(e.code); print(e.read().decode())
"""


def test_librarian_round_is_the_only_committer_and_only_the_founder_approves():
    s = Sup("round", FAKE_DSH_CITIZEN="1", BK_FOUNDER_EMAILS="Founder@Example.com", BK_CITIZEN_PRESETS="1",
            BK_LIBRARIAN_EVERY_MIN="60", ROUND="1")
    try:
        assert s.wait(lambda: s.state().get("state") == "RUNNING" and s.report() is not None and "forged_approve_status" in s.report(), 90), \
            s.all_text()[-3000:]
        r = s.report()
        assert r["proposed"] == "PROPOSED"
        # every token the web dsh holds was tried: none could commit, and the full librarian token is not among them
        assert "LIBRARY_TOKEN_LIBRARIAN" not in r["commit_attempts"] and "LIBRARY_TOKEN_LIBRARIAN_DESK" in r["commit_attempts"]
        assert set(r["commit_attempts"].values()) == {"REFUSED"}, r["commit_attempts"]
        assert all(v not in ("RECORDED", "DECIDED", "OK") for v in r["approve_attempts"].values()), r["approve_attempts"]
        if SEPARATE:
            assert r["forged_approve_status"] == 403          # a citizen's curl to 127.0.0.1 with a forged Access header
        # the Warden's NOW file triggered a round, which committed the Scout's proposal with the ONLY full token
        assert s.wait(lambda: s.state().get("librarian_round", {}).get("state") == "OK", 60), (s.state(), s.all_text()[-3000:])
        lr = s.state()["librarian_round"]
        assert lr["trigger"] == "request" and lr["result"].startswith("ROUND: committed 1")
        assert lr["pending_before"] == 1 and lr["pending_after"] == 0 and lr["facts_live_after"] == 1
        assert not os.path.exists(os.path.join(s.data, "run", "librarian-requests", "NOW"))
        rr = json.load(open(os.path.join(s.data, "citizens", "librarian", "round", "round-report.json")))
        assert rr["cwd"] == os.path.join(s.data, "citizens", "librarian", "round")
        assert set(rr["env"]) - {"PWD", "SHLVL", "_", "LC_CTYPE"} == {"PATH", "LANG", "TZ", "HOME", "DSH_HOME", "ZAI_API_KEY",
                                                                   "LIBRARY_TOKEN_LIBRARIAN", "DSH_PERMISSION_MODE",
                                                                   "DSH_TELEMETRY_MODE", "DSH_TELEMETRY_OTLP_URL", "DSH_TELEMETRY_DISABLED"}
        assert rr["prompt_starts"].startswith("Librarian round")
        if SEPARATE:
            assert rr["uid"] == pwd.getpwnam("bklib").pw_uid
            st = os.stat(os.path.join(s.data, "librarian-dsh"))
            assert st.st_uid == pwd.getpwnam("bklib").pw_uid and oct(st.st_mode & 0o777) == "0o700"
        assert "LIBRARY_TOKEN_LIBRARIAN" in open(os.path.join(s.data, "librarian-dsh", "cordis.patch.yml")).read()
        web = open(os.path.join(s.data, "dsh", "cordis.patch.yml")).read()
        assert "process.env.LIBRARY_TOKEN_LIBRARIAN }" not in web and "preset-bk-scout" in web     # presets rendered (mode 1)
        assert s.state()["citizen_presets"]["state"] == "ON" and s.state()["approvals"] == ("FOUNDER_ONLY" if SEPARATE else "ADVISORY")
        diary = glob.glob(os.path.join(s.data, "diary", "librarian-round", "*.jsonl"))
        assert diary and '"event":"librarian-round"' in open(diary[0]).read().replace(' ', '')
        assert s.wait(lambda: "Librarian round (commits): last result / at</td><td>OK 20" in s.public(), 30)
        # the founder's page: only through the tunnel's user, only the founder's Access email, CSRF on POST
        appr = f"http://127.0.0.1:{s.ports['login']}/bk-approve"
        founder = {"Cf-Access-Authenticated-User-Email": "founder@example.com"}
        lib_admin = f"http://127.0.0.1:{s.ports['admin']}"
        assert as_user("bkinfra", HTTP, appr, json.dumps({})).startswith("403")
        assert as_user("bkinfra", HTTP, appr, json.dumps({"Cf-Access-Authenticated-User-Email": "mallory@example.com"})).startswith("403")
        assert as_user("bkinfra", HTTP, appr, json.dumps({**founder, "Cf-Access-Client-Id": "x.access"})).startswith("403")
        if SEPARATE:
            assert get(appr, founder)[0] == 403                # root's own curl is not the tunnel either
        page = as_user("bkinfra", HTTP, appr, json.dumps(founder))
        assert page.startswith("200") and r["requested"] == "REQUESTED" and "Please approve: we raise 5 lakh" in page
        rid = re.search(r'name="request_id" value="([^"]+)"', page).group(1)
        sha = re.search(r'name="sha" value="([0-9a-f]{64})"', page).group(1)
        csrf = re.search(r'name="csrf" value="([^"]+)"', page).group(1)
        form = f"request_id={rid}&sha={sha}&decision=approved"
        bad = as_user("bkinfra", HTTP, appr + "/decide", json.dumps(founder), form + "&csrf=1.deadbeef")
        assert bad.startswith("403") and "CSRF" in bad
        other = as_user("bkinfra", HTTP, appr + "/decide", json.dumps({"Cf-Access-Authenticated-User-Email": "mallory@example.com"}),
                        form + "&csrf=" + csrf)
        assert other.startswith("403")
        ok = as_user("bkinfra", HTTP, appr + "/decide", json.dumps(founder), form + "&csrf=" + csrf)
        assert ok.startswith("200") and "Recorded" in ok, ok
        again = as_user("bkinfra", HTTP, appr + "/decide", json.dumps(founder), form + "&csrf=" + csrf)
        assert again.startswith("409") and "already approved" in again
        assert "Nothing is waiting" in as_user("bkinfra", HTTP, appr, json.dumps(founder))
    finally:
        out = s.stop()
    assert s.p.returncode == 0, out[-2000:]
