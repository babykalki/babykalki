"""Backups B1–B4 with real rclone (v1.76.0): a local folder stands in for R2; a dead S3 endpoint stands in for
"R2 unreachable". Each test destroys /data and restores, or breaks something on purpose."""
import datetime as dt, json, os, shutil, socket, subprocess, sys, time
import pytest
from conftest import FILES
from bk_chain import ChainWriter, verify
from bk_secrets import Scanner
import library_svc as L
import bk_backup as B

RCLONE = os.environ.get("BK_TEST_RCLONE") or shutil.which("rclone") or "/workspace/.bk-tools/rclone"
PY = sys.executable
SCHEMA = os.path.join(FILES, "library-schema.cypher")
ADMIN = "admin-" + "q" * 30
HB = {"BK_LEASE_CONFIRM_S": "3"}       # v0.5r2: heartbeat/release must land within 0.9 × CONFIRM of their read (0.3 is too tight)


@pytest.fixture
def race(tmp_path):
    """Executable path to the race_rclone.py stand-in (written here: unzipping may drop exec bits)."""
    w = tmp_path / "race-rclone"
    w.write_text(f'#!/bin/sh\nexec "{PY}" "{os.path.join(os.path.dirname(os.path.abspath(__file__)), "stubs", "race_rclone.py")}" "$@"\n')
    w.chmod(0o755)
    return str(w)
pytestmark = pytest.mark.skipif(not os.path.exists(RCLONE), reason="rclone binary not found (set BK_TEST_RCLONE)")


def free_port():
    s = socket.socket(); s.bind(("127.0.0.1", 0)); p = s.getsockname()[1]; s.close(); return p


class Box:
    """One fake BabyKalki: tmp/data (= /data) and tmp/remote (= the R2 bucket)."""

    def __init__(self, tmp):
        self.tmp, self.data, self.remote = tmp, tmp / "data", tmp / "remote"
        self.remote.mkdir(exist_ok=True)
        self.aport = free_port()
        self.env = {**os.environ, "BK_DATA": str(self.data), "BK_REMOTE": str(self.remote), "BK_RCLONE": RCLONE,
                    "BK_LIBRARY_PYTHON": PY, "LIBRARY_ADMIN_TOKEN": ADMIN, "BK_LIBRARY_ADMIN": f"http://127.0.0.1:{self.aport}",
                    "BK_RCLONE_FLAGS": "--retries 1 --low-level-retries 1 --contimeout 2s --timeout 10s",
                    "BK_SECRET_HASHES_FILE": "/nonexistent", "BK_MIN_FREE_MB": "1",
                    "BK_LEASE_HOLDER": "copy-A", "BK_LEASE_CONFIRM_S": "0.3"}
        self.proc = None

    def bk(self, *args, **env):
        p = subprocess.run([PY, os.path.join(FILES, "bk_backup.py"), *args], env={**self.env, **env}, capture_output=True, text=True, timeout=300)
        p.out = p.stdout + p.stderr
        return p

    def restore(self, **env):
        """What the supervisor does at boot: take the lease, then restore."""
        a = self.bk("lease-acquire", **env)
        return a if a.returncode != 0 else self.bk("restore", **env)

    def lease(self):
        p = self.remote / "lease.json"
        return json.loads(p.read_text()) if p.exists() else None

    def lib(self):
        d = self.data
        (d / "library").mkdir(parents=True, exist_ok=True)
        return L.Library(str(d / "library" / "library.lbug"), SCHEMA, str(d / "cards"), str(d / "citizens"), str(d / "backups"),
                         str(d / "RESTORED"), min_free_mb=1, scanner=Scanner(os.path.join(FILES, "secret-patterns.json"), hashes_file=None, env={}),
                         diary_root=str(d / "diary"))

    def populate(self, n=5):
        lib = self.lib()
        ids = []
        for i in range(n):
            p = lib.propose_fact(f"Fact number {i} about our market", "market", "read it", f"https://example.com/{i}", "scout")["id"]
            ids.append(lib.commit_proposal(p, "librarian")["id"])
        p = lib.propose_fact("Fact number 0 corrected", "market", "re-read", "https://example.com/0b", "scout")["id"]
        lib.commit_proposal(p, "librarian", supersedes=ids[0], reason="correction")
        lib.retire_fact(ids[1], "no longer true", "librarian")
        lib.add_task("ship pricing page", "builder", "2026-12-01", "warden")
        lib.request_approval("post #1", "Post number one, exact text", "", "warden")
        lib.c.close(); lib.db.close(); lib.log.close(); lib.approvals.close()
        for who in ("warden", "scout"):
            w = ChainWriter(str(self.data / "diary" / who / "2026-11.jsonl"), fsync=False)
            for i in range(20):
                w.append({"type": "msg", "seq": i, "data": f"{who} event {i} " + "d" * 120})
            w.close()
        (self.data / "dsh" / "sessions").mkdir(parents=True, exist_ok=True)
        (self.data / "dsh" / "sessions" / "s1.json").write_text('{"session":"s1"}')
        (self.data / "dsh" / "schedules.json").write_text('[{"cron":"30 2 * * *","who":"warden"}]')
        (self.data / "dsh" / "node_modules").mkdir(exist_ok=True); (self.data / "dsh" / "node_modules" / "big.js").write_text("x")
        (self.data / "home").mkdir(exist_ok=True); (self.data / "home" / "connector-signin.json").write_text("{}")
        (self.data / "registers").mkdir(exist_ok=True); (self.data / "registers" / "connections-register.yml").write_text("- id: CONN-x\n")
        (self.data / "log" / "archive").mkdir(parents=True, exist_ok=True); (self.data / "log" / "archive" / "dsh-20261117T1000Z.log").write_text("line\n")

    def start_library(self):
        d = self.data
        self.proc = subprocess.Popen([PY, os.path.join(FILES, "library_svc.py"), "--db", str(d / "library" / "library.lbug"),
                                      "--cards", str(d / "cards"), "--citizens", str(d / "citizens"), "--backups", str(d / "backups"),
                                      "--restored-marker", str(d / "RESTORED"), "--diary", str(d / "diary"),
                                      "--port", str(free_port()), "--admin-port", str(self.aport)],
                                     env=self.env, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        for _ in range(100):
            try:
                socket.create_connection(("127.0.0.1", self.aport), 0.2).close(); return
            except OSError:
                time.sleep(0.1)
        raise RuntimeError("library did not start")

    def stop_library(self):
        if self.proc:
            self.proc.terminate(); self.proc.wait(10); self.proc = None

    def cycle(self):
        self.start_library()
        try:
            return self.bk("cycle")
        finally:
            self.stop_library()

    def destroy(self):
        shutil.rmtree(self.data)

    def snaps(self):
        p = self.remote / "snapshots"
        return sorted(os.listdir(p)) if p.exists() else []


@pytest.fixture
def box(tmp_path):
    b = Box(tmp_path)
    yield b
    b.stop_library()


def first_boot_with_data(box):
    assert box.restore().returncode == 0             # empty remote → fresh
    box.populate()
    r = box.cycle()
    assert r.returncode == 0, r.out
    return box.snaps()[-1]


# ---------------------------------------------------------------------------------------------------------------
def test_no_sync_anywhere():
    src = open(os.path.join(FILES, "bk_backup.py")).read()
    assert '"sync"' not in src and "'sync'" not in src


def test_fresh_start_only_on_reachable_empty_remote(box):
    r = box.restore()
    assert r.returncode == 0 and json.load(open(box.data / "RESTORED"))["kind"] == "fresh"


def test_unreachable_remote_refuses_start_and_push(box):
    dead = {"BK_REMOTE": "dead:bucket", "RCLONE_CONFIG_DEAD_TYPE": "s3", "RCLONE_CONFIG_DEAD_PROVIDER": "Cloudflare",
            "RCLONE_CONFIG_DEAD_ENDPOINT": "http://127.0.0.1:9", "RCLONE_CONFIG_DEAD_ACCESS_KEY_ID": "x",
            "RCLONE_CONFIG_DEAD_SECRET_ACCESS_KEY": "y", "RCLONE_CONFIG_DEAD_NO_CHECK_BUCKET": "true"}
    r = box.restore(**dead)
    assert r.returncode == B.EXIT_UNREACHABLE, r.out
    assert not (box.data / "RESTORED").exists() and not (box.data / "library" / "library.lbug").exists()
    assert json.load(open(box.data / "run" / "backup-state.json"))["state"] == "UNREACHABLE"
    r = box.bk("cycle", **dead)
    assert r.returncode == B.EXIT_NOT_RESTORED and "REFUSED" in r.out


def test_destroy_data_and_restore_everything(box):
    name = first_boot_with_data(box)
    assert (box.remote / "snapshots" / name / "COMPLETE").exists()
    man = json.load(open(box.remote / "snapshots" / name / "manifest.json"))
    assert man["library"]["facts_total"] == 6 and man["library"]["facts_live"] == 4 and man["diary_anchors"]
    box.destroy()
    r = box.restore()
    assert r.returncode == 0, r.out
    marker = json.load(open(box.data / "RESTORED"))
    assert marker["kind"] == "snapshot" and marker["snapshot"] == name and marker["facts_live"] == 4
    assert (box.data / "dsh" / "schedules.json").read_text().startswith('[{"cron"')
    assert (box.data / "dsh" / "sessions" / "s1.json").exists() and (box.data / "home" / "connector-signin.json").exists()
    assert (box.data / "registers" / "connections-register.yml").exists()
    assert not (box.data / "dsh" / "node_modules").exists()            # caches are not backed up
    for f in ("changes.jsonl", "approvals.jsonl"):
        assert verify(str(box.data / "library" / f))["ok"]
    assert verify(str(box.data / "diary" / "warden" / "2026-11.jsonl"))["lines"] == 20
    lib = box.lib()
    assert lib.stats()["facts_live"] == 4 and lib.list_tasks()["total"] == 1
    lib.c.close(); lib.db.close()
    # the weekly drill runs against the OFF-SITE copy
    r = box.bk("restore-test")
    assert r.returncode == 0 and "counts and digest match" in r.out
    assert json.load(open(box.data / "log" / "restore-test.json"))["ok"] is True


def test_restore_test_fails_on_zero_facts(box):
    assert box.restore().returncode == 0
    assert box.cycle().returncode == 0                 # empty Library snapshot
    r = box.bk("restore-test")
    assert r.returncode == 1 and "0 facts" in r.out


def test_interrupted_upload_is_skipped(box):
    name = first_boot_with_data(box)
    newer = "snap-20991231T235959Z"
    shutil.copytree(box.remote / "snapshots" / name, box.remote / "snapshots" / newer)
    os.remove(box.remote / "snapshots" / newer / "COMPLETE")       # upload cut off before COMPLETE
    box.destroy()
    assert box.restore().returncode == 0
    assert json.load(open(box.data / "RESTORED"))["snapshot"] == name


def _second_snapshot(box):
    first = first_boot_with_data(box)
    time.sleep(1.1)
    assert box.cycle().returncode == 0
    second = box.snaps()[-1]
    assert second != first
    return first, second


def test_corrupt_download_quarantined_older_used(box):
    first, second = _second_snapshot(box)
    victim = next((box.remote / "snapshots" / second / "library").iterdir())
    victim.write_bytes(victim.read_bytes() + b"corruption")
    box.destroy()
    r = box.restore()
    assert r.returncode == 0, r.out
    assert json.load(open(box.data / "RESTORED"))["snapshot"] == first
    assert second in open(box.data / "run" / "quarantined-snapshots.txt").read()


def test_failed_import_no_crash_loop_no_empty_start(box):
    name = first_boot_with_data(box)
    snap = box.remote / "snapshots" / name
    lm = json.load(open(snap / "library-manifest.json")); lm["facts_live"] = 999
    json.dump(lm, open(snap / "library-manifest.json", "w"))
    man = json.load(open(snap / "manifest.json"))              # hashes consistent → the IMPORT check must catch it
    man["files"]["library-manifest.json"]["sha256"] = B.sha_file(str(snap / "library-manifest.json"))
    json.dump(man, open(snap / "manifest.json", "w"))
    box.destroy()
    for _ in range(2):                                          # running it again gives the same clean refusal
        r = box.restore()
        assert r.returncode == B.EXIT_FAILED, r.out
        assert not (box.data / "RESTORED").exists()
        assert not (box.data / "library" / "library.lbug").exists()
        assert not (box.data / "library" / "library.lbug.importing").exists()
        assert json.load(open(box.data / "run" / "backup-state.json"))["state"] == "RESTORE_FAILED"
    with pytest.raises(SystemExit, match="NOT RESTORED"):      # and the Library refuses to start empty
        box.lib()


def test_remote_lost_during_restore(box, tmp_path):
    first_boot_with_data(box)
    box.destroy()
    wrapper = tmp_path / "flaky-rclone"
    wrapper.write_text(f'#!/bin/sh\ncase "$1" in copy|copyto) echo "network down" >&2; exit 1;; esac\nexec {RCLONE} "$@"\n')
    wrapper.chmod(0o755)
    assert box.bk("lease-acquire").returncode == 0
    r = box.bk("restore", BK_RCLONE=str(wrapper))
    assert r.returncode == B.EXIT_UNREACHABLE, r.out
    assert not (box.data / "RESTORED").exists() and not (box.data / "library" / "library.lbug").exists()
    assert not (box.data / "run" / "quarantined-snapshots.txt").exists()   # the snapshot is fine; the network wasn't
    r = box.bk("cycle")
    assert r.returncode == B.EXIT_NOT_RESTORED                 # and nothing is pushed over the good copy


def test_inconsistent_remote_needs_a_human(box):
    (box.remote / "snapshots" / "snap-20261117T100000Z").mkdir(parents=True)
    (box.remote / "snapshots" / "snap-20261117T100000Z" / "manifest.json").write_text("{}")
    r = box.restore()
    assert r.returncode == B.EXIT_INCONSISTENT and not (box.data / "RESTORED").exists()
    r = box.restore(BK_ALLOW_FRESH_START="1")
    assert r.returncode == 0 and json.load(open(box.data / "RESTORED"))["kind"] == "fresh-forced"
    assert (box.remote / "snapshots" / "snap-20261117T100000Z" / "manifest.json").exists()   # left untouched


def test_shortened_diary_never_overwrites_offsite(box):
    first_boot_with_data(box)
    remote_file = box.remote / "diary" / "warden" / "2026-11.jsonl"
    size = remote_file.stat().st_size
    local = box.data / "diary" / "warden" / "2026-11.jsonl"
    local.write_bytes(local.read_bytes()[: size // 2])
    r = box.cycle()
    assert r.returncode == B.EXIT_FAILED and "SHORTER" in r.out
    assert remote_file.stat().st_size == size


def test_prune_plan_policy():
    now = dt.datetime(2026, 11, 17, 12, 0, tzinfo=dt.timezone.utc)
    names = [(now - dt.timedelta(minutes=15 * i)).strftime("snap-%Y%m%dT%H%M%SZ") for i in range(96 * 70)]   # 70 days
    keep, drop = B.prune_plan(names, [], now=now)
    assert names[0] in keep and len(keep) + len(drop) == len(names)
    days = {n[5:13] for n in keep}
    assert len([n for n in keep if n in names[:48]]) == 48
    assert len(days) >= 14 and len(keep) <= 48 + 14 + 8 + 2
    old_partial = (now - dt.timedelta(hours=3)).strftime("snap-%Y%m%dT%H%M%SZ")
    new_partial = (now - dt.timedelta(minutes=30)).strftime("snap-%Y%m%dT%H%M%SZ")
    _, drop = B.prune_plan(names[:5], [old_partial, new_partial], now=now)
    assert old_partial in drop and new_partial not in drop


def test_prune_on_the_remote(box):
    now = dt.datetime.now(dt.timezone.utc)
    names = [(now - dt.timedelta(minutes=15 * i)).strftime("snap-%Y%m%dT%H%M%SZ") for i in range(60)]
    for n in names:
        (box.remote / "snapshots" / n).mkdir(parents=True)
        (box.remote / "snapshots" / n / "COMPLETE").write_text("x\n")
    keep, _ = B.prune_plan(names, [])
    r = box.bk("prune")
    assert r.returncode == 0, r.out
    assert box.snaps() == sorted(keep) and len(keep) < 60


# --------------------------------------------------------------------------------------------------------------- v0.3
# The boot lease: one writer at a time, even while Nimbuz runs the old and the new copy side by side.
def _write_lease(box, holder, age_s=0, released=False):
    t = (dt.datetime.now(dt.timezone.utc) - dt.timedelta(seconds=age_s)).strftime("%Y-%m-%dT%H:%M:%SZ")
    (box.remote / "lease.json").write_text(json.dumps({"holder": holder, "acquired_at": t, "heartbeat_at": t, "released": released}))


def test_lease_acquire_on_empty_bucket_and_fresh_start(box):
    r = box.bk("lease-acquire")
    assert r.returncode == 0 and "ACQUIRED" in r.out, r.out
    lease = box.lease()
    assert lease["holder"] == "copy-A" and lease["released"] is False and lease["heartbeat_at"]
    r = box.bk("restore")                               # the lease alone does not make the bucket "non-empty"
    assert r.returncode == 0 and json.load(open(box.data / "RESTORED"))["kind"] == "fresh", r.out


def test_lease_refused_while_another_copy_is_fresh(box):
    _write_lease(box, "copy-OLD", age_s=5)
    r = box.bk("lease-acquire")
    assert r.returncode == B.EXIT_LEASE_BUSY and "held by another copy" in r.out, r.out
    assert box.lease()["holder"] == "copy-OLD"                       # untouched
    assert json.load(open(box.data / "run" / "backup-state.json"))["state"] == "LEASE_BUSY"
    r = box.bk("restore")                                            # and no restore without it
    assert r.returncode == B.EXIT_NO_LEASE and not (box.data / "RESTORED").exists()


def test_lease_taken_over_when_stale_or_released(box):
    _write_lease(box, "copy-OLD", age_s=200)                         # crashed copy: no heartbeat for 200 s > 90 s
    r = box.bk("lease-acquire")
    assert r.returncode == 0 and "stale" in r.out and box.lease()["holder"] == "copy-A", r.out
    _write_lease(box, "copy-OLD", age_s=200)
    r = box.bk("lease-acquire", BK_LEASE_STALE_S="300")              # same lease, longer stale limit → still busy
    assert r.returncode == B.EXIT_LEASE_BUSY, r.out
    _write_lease(box, "copy-OLD", age_s=1, released=True)            # old copy shut down cleanly
    r = box.bk("lease-acquire")
    assert r.returncode == 0 and "released by copy-OLD" in r.out and box.lease()["holder"] == "copy-A", r.out


def test_lease_same_holder_reacquires(box):
    assert box.bk("lease-acquire").returncode == 0
    first = box.lease()["acquired_at"]
    time.sleep(1.1)
    r = box.bk("lease-acquire")
    assert r.returncode == 0 and "already mine" in r.out
    assert box.lease()["acquired_at"] == first and box.lease()["heartbeat_at"] >= first


def test_lease_race_one_winner(box):
    """Two copies take a free lease at the same instant: the later write wins, the other one backs off."""
    env = {**box.env, "BK_LEASE_CONFIRM_S": "2"}
    ps = [subprocess.Popen([PY, os.path.join(FILES, "bk_backup.py"), "lease-acquire"], env={**env, "BK_LEASE_HOLDER": h},
                           stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True) for h in ("copy-X", "copy-Y")]
    codes = sorted(p.wait(60) for p in ps)
    assert codes == [0, B.EXIT_LEASE_BUSY], codes
    assert box.lease()["holder"] in ("copy-X", "copy-Y")


def test_push_refused_without_the_lease(box):
    name = first_boot_with_data(box)
    _write_lease(box, "copy-NEW", age_s=0)                           # a newer copy took over
    time.sleep(1.1)
    r = box.cycle()
    assert r.returncode == B.EXIT_NO_LEASE and "does not hold the lease" in r.out, r.out
    assert box.snaps() == [name]                                     # nothing pushed
    assert json.load(open(box.data / "run" / "backup-state.json"))["state"] == "LEASE_LOST"
    box.start_library()
    try:
        r = box.bk("final")
    finally:
        box.stop_library()
    assert r.returncode == B.EXIT_NO_LEASE and box.snaps() == [name]


def test_heartbeat_and_release_only_touch_our_own_lease(box):
    assert box.bk("lease-acquire").returncode == 0
    _write_lease(box, "copy-A", age_s=60)
    old = box.lease()["heartbeat_at"]
    assert box.bk("lease-heartbeat", **HB).returncode == 0
    assert box.lease()["heartbeat_at"] > old and box.lease()["released"] is False
    assert box.bk("lease-release", **HB).returncode == 0
    assert box.lease()["released"] is True and box.lease()["holder"] == "copy-A" and box.lease()["released_at"]
    assert box.bk("lease-heartbeat", **HB).returncode == B.EXIT_NO_LEASE    # released: no heartbeat revives it
    _write_lease(box, "copy-B", age_s=0)
    r = box.bk("lease-heartbeat", **HB)
    assert r.returncode == B.EXIT_NO_LEASE and "LEASE LOST" in r.out
    assert box.bk("lease-release", **HB).returncode == B.EXIT_NO_LEASE and box.lease()["holder"] == "copy-B"
    assert box.lease()["released"] is False


def test_new_copy_restores_the_old_copys_final_snapshot(box, tmp_path):
    """Rolling restart in miniature: A runs; B waits; A writes a fact, final snapshot, release; B restores THAT snapshot."""
    first_boot_with_data(box)                                        # A: 4 live facts off-site
    b_env = {"BK_DATA": str(tmp_path / "data-B"), "BK_LEASE_HOLDER": "copy-B"}
    assert box.bk("lease-acquire", **b_env).returncode == B.EXIT_LEASE_BUSY
    lib = box.lib()                                                  # A keeps working during the overlap
    p = lib.propose_fact("Written by the old copy just before SIGTERM", "market", "test", "https://example.com/late", "scout")["id"]
    lib.commit_proposal(p, "librarian")
    lib.c.close(); lib.db.close(); lib.log.close(); lib.approvals.close()
    time.sleep(1.1)
    box.start_library()
    try:
        assert box.bk("final").returncode == 0
    finally:
        box.stop_library()
    final = box.snaps()[-1]
    assert box.bk("lease-release", **HB).returncode == 0
    r = box.restore(**b_env)
    assert r.returncode == 0, r.out
    marker = json.load(open(tmp_path / "data-B" / "RESTORED"))
    assert marker["snapshot"] == final and marker["facts_live"] == 5
    assert box.lease()["holder"] == "copy-B" and box.lease()["released"] is False


def test_two_snapshots_in_one_second_do_not_collide(box):
    """v0.2 bug found while testing v0.3: a final snapshot taken in the same second as a cycle's failed with HTTP 500."""
    assert box.restore().returncode == 0
    lib = box.lib()
    try:
        a, b = lib.snapshot()["dir"], lib.snapshot()["dir"]
    finally:
        lib.c.close(); lib.db.close(); lib.log.close(); lib.approvals.close()
    assert a != b and B.parse_name(os.path.basename(b)) and os.path.isdir(a) and os.path.isdir(b)


# ---------------------------------------------------------------- v0.5r2: lease read-then-write races (found by a flaky supervisor test)
def test_slow_heartbeat_never_lands_after_the_new_copys_read_back(box, tmp_path, race):
    """Copy A's heartbeat reads the lease, then its upload stalls. Meanwhile copy B takes the (stale-looking) lease and
    reads it back after BK_LEASE_CONFIRM_S. Before v0.5r2 A's late write landed AFTER B's read-back: both copies believed
    they held the lease (B later stopped for good with LEASE_LOST). Now A's write is cut off inside 0.9 × CONFIRM, so
    exactly one copy holds the lease and the other one knows it."""
    assert box.bk("lease-acquire").returncode == 0
    _write_lease(box, "copy-A", age_s=120)                            # A has been stuck for a while: its lease looks stale
    mark = tmp_path / "a-is-writing"
    a = subprocess.Popen([PY, os.path.join(FILES, "bk_backup.py"), "lease-heartbeat"],
                         env={**box.env, **HB, "BK_RCLONE": race, "REAL_RCLONE": RCLONE, "RACE_SLOW_LEASE_WRITE": "5",
                              "RACE_MARK": str(mark)}, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    end = time.time() + 60
    while not mark.exists() and a.poll() is None and time.time() < end:
        time.sleep(0.05)
    b = box.bk("lease-acquire", BK_LEASE_HOLDER="copy-B", BK_DATA=str(tmp_path / "data-B"), **HB)   # B writes, waits 3 s, reads back
    a_out = a.communicate(timeout=60)[0]
    time.sleep(5.5)                                                   # anything A still had in flight would have landed by now
    holder = box.lease()["holder"]
    assert a.returncode == B.EXIT_UNREACHABLE and ("cut off" in a_out or "skipped" in a_out), a_out
    assert (b.returncode, holder) in ((0, "copy-B"), (B.EXIT_LEASE_BUSY, "copy-A")), (b.returncode, holder, b.out, a_out)


def test_heartbeat_skips_the_write_after_a_slow_read(box, race):
    assert box.bk("lease-acquire").returncode == 0
    before = box.lease()
    time.sleep(1.1)
    r = box.bk("lease-heartbeat", **HB, BK_RCLONE=race, REAL_RCLONE=RCLONE, RACE_SLOW_LEASE_READ="2")   # 2 s > 0.4 × 3 s
    assert r.returncode == B.EXIT_UNREACHABLE and "skipped" in r.out, r.out
    assert box.lease() == before                                      # nothing written
    assert box.bk("lease-heartbeat", **HB).returncode == 0 and box.lease()["heartbeat_at"] > before["heartbeat_at"]


def test_push_never_marks_complete_after_losing_the_lease_mid_upload(box, tmp_path, race):
    first = first_boot_with_data(box)
    t = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    steal = tmp_path / "foreign-lease.json"
    steal.write_text(json.dumps({"holder": "copy-NEW", "acquired_at": t, "heartbeat_at": t, "released": False}))
    time.sleep(1.1)
    box.start_library()
    try:
        r = box.bk("cycle", BK_RCLONE=race, REAL_RCLONE=RCLONE, RACE_STEAL_ON_CHECK=str(steal), RACE_REMOTE=str(box.remote))
    finally:
        box.stop_library()
    assert r.returncode == B.EXIT_NO_LEASE and "not marking it COMPLETE" in r.out, r.out
    done = [n for n in box.snaps() if (box.remote / "snapshots" / n / "COMPLETE").exists()]
    assert done == [first] and len(box.snaps()) == 2                  # the new upload stays incomplete (restore ignores it)
    assert json.load(open(box.data / "run" / "backup-state.json"))["state"] == "LEASE_LOST"
    assert box.lease()["holder"] == "copy-NEW"
