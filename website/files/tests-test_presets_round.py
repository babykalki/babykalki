"""v0.5: citizen presets (bk_presets.py), the Librarian round's guards (lock, trigger, minimal env), telemetry rows.
The full round + approvals path with real users is in test_supervisor.py; presets were also checked against the real dsh
0.2.2-rc.3 (see the guide, L2 "Picking a citizen") — here we make sure a bad preset can never stop dsh from starting."""
import fcntl, os, re, threading
import pytest
from conftest import FILES
import bk_presets as P
import bk_supervisor as S

TPL = open(os.path.join(FILES, "cordis.citizens.tpl.yml")).read()


def test_six_presets_each_with_only_its_own_connector():
    out = P.render(TPL, "1", {"librarian": "# Self card\n- My name is Edith; I keep memory (F-1)\n"})
    rows = re.split(r"\n    - id: preset-bk-", out)[1:]
    assert [r.split("\n", 1)[0] for r in rows] == list(P.CITIZENS)
    for role, r in zip(P.CITIZENS, rows):
        servers = re.findall(r"serverName: (library-[a-z]+)", r)
        assert servers == [f"library-{role}"], (role, servers)
        tok = re.findall(r"process\.env\.(LIBRARY_TOKEN_[A-Z_]+)", r)
        assert tok == [P.TOKEN_ENV[role]]
        assert f"/data/citizens/{role}/AGENTS.md" in r and f"/data/citizens/{role}/work" in r
        assert re.search(r"id: tool-plugin-manager\n\s+name: \S+\n\s+disabled: true\b", r)
    assert '"Edith · Librarian"' in out and "LIBRARY_TOKEN_LIBRARIAN }" not in out      # web Librarian = desk token only
    for c in P.CITIZENS:                                                                # root rows switched off in mode 1
        assert f"- id: mcp-library-{c}\n  disabled: true" in out


def test_shared_mode_has_no_connectors_and_mode_0_nothing():
    out = P.render(TPL, "shared", {})
    assert "serverName" not in out and "disabled: true\n" in out and "- id: mcp-library-scout\n  disabled" not in out
    assert P.render(TPL, "0", {}) == ""
    assert P.mode({}) == "1" and P.mode({"BK_CITIZEN_PRESETS": "SHARED"}) == "shared" and P.mode({"BK_CITIZEN_PRESETS": "x"}) == "1"


@pytest.mark.parametrize("card,want", [
    ("- My name is Meera; I am the research guild (F-2)", "Meera · Scout"),
    ("- my name is Asha Rani and I am the scout", "Asha Rani · Scout"),
    ('- My name is "}\n  injected: true #', "Scout"),
    ("- My name is <script>alert(1)</script>", "Scout"),
    ("", "Scout"),
    ("- My name is " + "A" * 80, "A" * 32 + " · Scout"),
])
def test_display_name_from_card_is_sanitised(card, want):
    assert P.display_name(card, "scout") == want
    rendered = P.render(TPL, "1", {"scout": card})
    assert "injected: true" not in rendered and "<script>" not in rendered


def test_broken_template_raises_and_supervisor_falls_back_to_no_presets(monkeypatch, tmp_path):
    with pytest.raises(ValueError):
        P.render("no preset row here", "1", {})
    with pytest.raises(ValueError):
        P.render(TPL.replace("@@CONNECTOR@@\n", ""), "1", {})
    ship = tmp_path / "ship"; ship.mkdir()
    (ship / "cordis.citizens.tpl.yml").write_text("garbage")
    monkeypatch.setattr(S, "SHIP", str(ship)); monkeypatch.setattr(S, "D", str(tmp_path)); monkeypatch.setattr(S, "E", {})
    s = S.Supervisor.__new__(S.Supervisor)
    s.presets = {"mode": "1", "state": "OFF"}
    assert s.presets_text() == "" and s.presets["state"] == "ERROR"          # never raises, dsh still starts
    s.presets = {"mode": "0", "state": "OFF"}
    assert s.presets_text() == "" and s.presets["state"] == "OFF"


def test_dsh_crashing_twice_at_start_with_presets_turns_them_off(monkeypatch, tmp_path):
    monkeypatch.setattr(S, "E", {"BK_PRESETS_PROBATION_S": "60"})
    s = S.Supervisor.__new__(S.Supervisor)
    s.presets, s.dsh_early_exits = {"mode": "1", "state": "ON"}, 0
    synced = []
    s.sync_shipped = lambda: synced.append(1)

    class FakeP:
        returncode = 1

        def poll(self):
            return 1

    class FakeProc:
        wanted, started_at = True, S.time.time()

        def __init__(self):
            self.p = FakeP()

        def alive(self):
            return False
    s.procs = {"dsh": FakeProc()}
    s.presets_watch(); s.presets_watch()                     # the same exit is counted once
    assert s.dsh_early_exits == 1 and s.presets["state"] == "ON"
    s.procs = {"dsh": FakeProc()}
    s.presets_watch()
    assert s.presets["state"] == "FALLBACK" and synced == [1]
    assert s.presets_text() == ""                            # the next cordis.patch.yml has no presets


def mk_sup(monkeypatch, tmp_path, env):
    monkeypatch.setattr(S, "E", env); monkeypatch.setattr(S, "D", str(tmp_path))
    (tmp_path / "run" / "librarian-requests").mkdir(parents=True)
    s = S.Supervisor.__new__(S.Supervisor)
    s.tokens = {c: c * 10 for c in S.CITIZENS}
    s.lib_lock, s.lib_next, s.librarian = threading.Lock(), S.time.time() + 600, {"state": "IDLE"}
    return s


def test_round_env_is_minimal_and_web_dsh_has_no_librarian_token(monkeypatch, tmp_path):
    env = {"PATH": "/usr/bin", "ZAI_API_KEY": "z" * 40, "TUNNEL_TOKEN": "t" * 40, "LIBRARY_TOKEN_LIBRARIAN": "leak" * 10,
           "BK_TELEGRAM_BOT_TOKEN": "b" * 40, "BK_ALLOW_TELEMETRY": "1"}
    s = mk_sup(monkeypatch, tmp_path, env)
    s.hashes_file, s.desk_token = "/run/bk/secret-hashes", "d" * 40
    r = s.librarian_env()
    assert set(r) == {"PATH", "LANG", "TZ", "HOME", "DSH_HOME", "ZAI_API_KEY", "LIBRARY_TOKEN_LIBRARIAN", "DSH_PERMISSION_MODE",
                      "DSH_TELEMETRY_MODE", "DSH_TELEMETRY_OTLP_URL", "DSH_TELEMETRY_DISABLED"}
    assert r["LIBRARY_TOKEN_LIBRARIAN"] == "librarian" * 10 and r["DSH_TELEMETRY_MODE"] == "DISABLED"   # always off for the round
    assert r["DSH_HOME"] == r["HOME"] == os.path.join(str(tmp_path), "librarian-dsh")
    w = s.dsh_env()
    assert "LIBRARY_TOKEN_LIBRARIAN" not in w and w["LIBRARY_TOKEN_LIBRARIAN_DESK"] == "d" * 40     # even one set in the env
    assert "TUNNEL_TOKEN" not in w and "BK_TELEGRAM_BOT_TOKEN" not in w and w["LIBRARY_TOKEN_SCOUT"] == "scout" * 10


def test_round_lock_trigger_and_skip_when_nothing_pending(monkeypatch, tmp_path):
    s = mk_sup(monkeypatch, tmp_path, {"ZAI_API_KEY": "z" * 40})
    started = []
    monkeypatch.setattr(S.threading, "Thread", lambda target, args=(), daemon=None: type("T", (), {"start": lambda self: started.append(args)})())
    s.librarian_tick(stop=False)
    assert started == []                                           # not due, not asked
    trig = tmp_path / "run" / "librarian-requests" / "NOW"
    trig.write_text("asked")
    s.librarian_tick(stop=True)
    assert started == [] and trig.exists()                         # the off-switch wins; the request waits
    s.librarian_tick(stop=False)
    assert started == [("request",)] and not trig.exists()        # consumed once
    s.lib_lock.acquire()
    trig.write_text("asked")
    s.librarian_tick(stop=False)
    assert started == [("request",)] and trig.exists()            # a round is running: the next one waits
    assert s.librarian_round("request") is None                    # second round refused by the lock
    s.lib_lock.release()
    # the file lock (a second process) also refuses
    f = open(tmp_path / "run" / "librarian-round.lock", "w"); fcntl.flock(f, fcntl.LOCK_EX)
    pid = os.fork()
    if pid == 0:
        os._exit(0 if s.librarian_round("request") is None else 1)
    assert os.waitpid(pid, 0)[1] == 0
    f.close()
    # scheduled round with nothing pending: no model call at all
    s._admin_stats = lambda: {"proposals_pending": 0}
    s.users = type("U", (), {"on": False, "l": None})()
    r = s.librarian_round("schedule")
    assert r["state"] == "SKIPPED" and r["result"] == "nothing pending" and s.librarian["state"] == "SKIPPED"
    s.librarian = {"state": "OK", "result": "ROUND: committed 2", "last_at": "2026-11-19T22:00:00Z"}
    s.librarian_round("schedule")                                  # a skip keeps the last real round visible
    assert s.librarian["state"] == "OK" and s.librarian["last_check"] == "nothing pending"
    s._admin_stats = lambda: {}                                   # Library down: never run a round blind
    assert s.librarian_round("request")["result"] == "Library unreachable"
    monkeypatch.setattr(S, "E", {})
    assert s.librarian_round("request")["result"] == "no ZAI_API_KEY"


ROWS = ["session-telemetry-otel", "session-log-deepseek", "plugin-package-inventory-deepseek", "deepseek-account",
        "llm-deepseek-account", "web-search-deepseek", "desktop-product-telemetry", "product-analytics"]


@pytest.mark.parametrize("fn", ["cordis.patch.yml", "cordis.librarian.yml"])
def test_the_eight_privacy_rows_are_in_both_configs(fn):
    t = open(os.path.join(FILES, fn)).read()
    for row in ROWS:
        m = re.search(rf"^- id: {re.escape(row)}\b.*\n  (\S.*)$", t, re.M)
        assert m, (fn, row)
        want = "config: { enabled: false }" if row == "session-log-deepseek" else "disabled: true"
        assert m.group(1) == want, (fn, row, m.group(1))
    assert "PLACEHOLDER" not in t


def test_librarian_config_has_only_the_full_librarian_connector():
    t = open(os.path.join(FILES, "cordis.librarian.yml")).read()
    assert re.findall(r"serverName: (\S+),", t) == ["library-librarian"]
    assert re.findall(r"process\.env\.(LIBRARY_TOKEN_\w+)", t) == ["LIBRARY_TOKEN_LIBRARIAN"]
    web = open(os.path.join(FILES, "cordis.patch.yml")).read()
    assert "process.env.LIBRARY_TOKEN_LIBRARIAN }" not in web and "process.env.LIBRARY_TOKEN_LIBRARIAN_DESK" in web
