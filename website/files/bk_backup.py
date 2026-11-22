#!/usr/bin/env python3
"""bk_backup.py — BabyKalki off-site backups to Cloudflare R2 with rclone (v0.5, 19 Nov 2026: + /data/community in the state tar; otherwise v0.3, 18 Nov). MIT licence.

Tested: tests/test_backup.py with rclone v1.76.0 against a LOCAL folder standing in for R2 and a dead S3 endpoint for
"unreachable"; on Nimbuz (18 Nov 2026) against a MinIO bucket standing in for R2. Not yet run against real R2.

v0.3 — the BOOT LEASE (single writer across rolling restarts). Nimbuz starts the new copy ~20 s BEFORE it stops the old
one, so for a moment two copies of BabyKalki run. Only the copy that holds `lease.json` in the bucket may restore, push
or run agents:
  * lease.json = {holder, acquired_at, heartbeat_at, released}. holder = hostname + a random boot nonce (BK_LEASE_HOLDER,
    set by the supervisor).
  * `lease-acquire`: free if absent, released, stale (heartbeat older than BK_LEASE_STALE_S, default 90 s) or already
    mine. Otherwise exit 7 (the supervisor shows WAITING_FOR_LEASE and retries). After writing, it waits
    BK_LEASE_CONFIRM_S (5 s) and reads the lease back: if another copy wrote in between, the later writer wins and the
    other gets exit 7. R2/S3 has no compare-and-swap, so this is a cheap race guard, not a lock — good enough for "an old
    copy that is shutting down" vs "a new copy that is starting", which is the case it is for.
  * `lease-heartbeat` (supervisor, every BK_LEASE_HEARTBEAT_S = 30 s) and `lease-release` (after the final snapshot)
    only touch a lease this copy holds; otherwise exit 8 (LEASE_LOST). Both are read-then-write, so (v0.5r2) the write
    must LAND within 0.9 × BK_LEASE_CONFIRM_S of the read starting: the read may take at most 0.4 × CONFIRM (else the
    write is skipped, exit 3) and the upload is cut off when that 0.9 × CONFIRM budget runs out (exit 3). Any write that overwrites a copy
    which took the lease meanwhile therefore lands before that copy's read-back, which sees it and backs off (exit 7) —
    without this bound a slow heartbeat could land AFTER the read-back: both copies would think they hold the lease, and
    the new one would later stop for good (LEASE_LOST) while the old one shuts down. A skipped heartbeat is harmless:
    the lease only goes stale after BK_LEASE_STALE_S (90 s).
  * A push re-checks the lease just before it writes the COMPLETE marker (v0.5r2): a copy that lost the lease while
    uploading leaves an incomplete snapshot (ignored by restore, pruned later), never a new COMPLETE one; exit 8.
  * `restore`, `cycle` and `final` refuse (exit 8) unless this copy holds the lease. Restore runs AFTER the lease is
    acquired, so it picks up the old copy's FINAL snapshot.

Rules (each one is a fix from the v0.1 review):
  * rclone COPY, never sync — nothing on the off-site copy is ever deleted by a push (only `prune` deletes, by age).
  * Off-site unreachable ⇒ refuse: `restore` exits 3, the supervisor does not start the agents, the status page says so.
  * Reachable and truly EMPTY ⇒ fresh start (marker says "fresh"). Data present but no complete snapshot ⇒ refuse (exit 5)
    unless BK_ALLOW_FRESH_START=1 — a human decides.
  * A snapshot counts only with its COMPLETE marker, written LAST after the upload was checked. Restore takes the newest
    COMPLETE snapshot, verifies every file's SHA-256 against its manifest, imports the Library and compares fact counts and
    a digest of all facts with the manifest. Any failure ⇒ that snapshot is quarantined, the partial database removed, the
    next older one tried — never a crash loop, never a silent empty start.
  * /data/RESTORED is written only after a verified restore (or a verified-empty remote). `push`/`cycle` refuse without it.
  * The diary is pushed only if no local file is SHORTER than its off-site copy (a cut or emptied diary never overwrites).
  * ONE timer: the supervisor runs `cycle` every BK_BACKUP_EVERY_MIN (default 15; use 5 on Nimbuz) minutes = snapshot →
    push → check → COMPLETE → prune; and `final` on shutdown. Worst-case loss ≈ one interval: an out-of-memory kill gets
    no SIGTERM and so no final snapshot.
  * Prune keeps: newest 48 + newest per day for 14 days + newest per week for 8 weeks; incomplete uploads >2 h old go.

What a snapshot holds: Library export + manifest, changes.jsonl (audit log), approvals.jsonl, and state.tar.gz with
/data/dsh (dsh sessions, schedules, web-login signing state — exact file list TO VERIFY on dsh rc.3), /data/home
(connector sign-ins), /data/registers, /data/cards, /data/citizens/*/work, /data/community (v0.5: the community desk's
Telegram offset, moderation state and counts — so a restore never replays handled updates). The diary and rotated logs are copied
alongside (diary/, logs/); each snapshot's manifest carries the diary's head-hash ANCHORS.

Commands: restore | cycle | final | prune | restore-test | status | lease-acquire | lease-heartbeat | lease-release | lease-show
(exit 0 = OK; 3 unreachable, 4 failed, 5 inconsistent, 6 not restored, 7 lease held by another copy, 8 this copy does not hold the lease)
Env: BK_DATA=/data  BK_REMOTE (default r2:$BK_BUCKET)  RCLONE_CONFIG_R2_*  LIBRARY_ADMIN_TOKEN  BK_LIBRARY_PYTHON
     BK_LEASE_HOLDER  BK_LEASE_STALE_S=90  BK_LEASE_CONFIRM_S=5
"""
import datetime as dt, hashlib, json, os, shutil, socket, subprocess, sys, tarfile, time, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from bk_chain import anchors as chain_anchors, verify as chain_verify  # noqa: E402

D = os.environ.get("BK_DATA", "/data")
REMOTE = os.environ.get("BK_REMOTE") or "r2:" + os.environ.get("BK_BUCKET", "babykalki-backups")
RCLONE = os.environ.get("BK_RCLONE", "rclone")
FLAGS = os.environ.get("BK_RCLONE_FLAGS", "--retries 3 --low-level-retries 3 --contimeout 15s --timeout 120s").split()
PY = os.environ.get("BK_LIBRARY_PYTHON", sys.executable)
ADMIN = os.environ.get("BK_LIBRARY_ADMIN", "http://127.0.0.1:7802")
MARKER = os.path.join(D, "RESTORED")
RUN = os.path.join(D, "run")
STATE = os.path.join(RUN, "backup-state.json")
QUAR = os.path.join(RUN, "quarantined-snapshots.txt")
STATE_PARTS = ["dsh", "home", "registers", "cards", "citizens", "community", "librarian-dsh"]   # v0.5: + community desk offset/counts, Librarian round sessions
EXCLUDE = {"node_modules", ".cache", ".npm", "cache", "Cache", ".venv", "__pycache__"}
EXIT_UNREACHABLE, EXIT_FAILED, EXIT_INCONSISTENT, EXIT_NOT_RESTORED, EXIT_LEASE_BUSY, EXIT_NO_LEASE = 3, 4, 5, 6, 7, 8
LEASE = "lease.json"


def log(*a):
    print(f"[backup {dt.datetime.now(dt.timezone.utc):%H:%M:%SZ}]", *a, flush=True)


def now_iso():
    return dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def set_state(state, detail="", **extra):
    os.makedirs(RUN, exist_ok=True)
    old = {}
    try:
        old = json.load(open(STATE))
    except Exception:
        pass
    old.update({"state": state, "detail": detail, "at": now_iso(), **extra})
    tmp = STATE + ".tmp"
    json.dump(old, open(tmp, "w"), indent=1)
    os.replace(tmp, STATE)


def write_marker(obj):
    os.makedirs(D, exist_ok=True)
    tmp = MARKER + ".tmp"
    json.dump(obj, open(tmp, "w"), indent=1)
    os.replace(tmp, MARKER)


class RcloneError(Exception):
    pass


class LeaseLostError(Exception):
    pass


def rc(*args, check=True, capture=True, timeout=3600):
    p = subprocess.run([RCLONE, *args, *FLAGS], capture_output=capture, text=True, timeout=timeout)
    if check and p.returncode != 0:
        raise RcloneError(f"rclone {args[0]} failed ({p.returncode}): {(p.stderr or '').strip()[-400:]}")
    return p


def remote(path=""):
    return REMOTE.rstrip("/") + ("/" + path if path else "") if not REMOTE.endswith(":") else REMOTE + path


def sha_file(p):
    h = hashlib.sha256()
    with open(p, "rb") as f:
        for b in iter(lambda: f.read(1 << 20), b""):
            h.update(b)
    return h.hexdigest()


# ---------- remote listing ----------
def probe():
    """Top-level listing. Raises RcloneError when the off-site copy cannot be reached (or the bucket is missing)."""
    return [x.strip("/") for x in rc("lsf", remote(), "--max-depth", "1").stdout.split()]


def complete_snapshots(top):
    if "snapshots" not in top:
        return [], []
    out = rc("lsf", remote("snapshots"), "-R", "--max-depth", "2").stdout.split()
    names = sorted({x.split("/")[0] for x in out if x.endswith("/") and x.count("/") == 1})
    done = sorted({x.split("/")[0] for x in out if x.endswith("/COMPLETE")})
    return done, [n for n in names if n not in done]


def quarantined():
    return set(open(QUAR).read().split()) if os.path.exists(QUAR) else set()


def quarantine(name, why):
    os.makedirs(RUN, exist_ok=True)
    with open(QUAR, "a") as f:
        f.write(name + "\n")
    log(f"QUARANTINED {name}: {why}")


# ---------- the boot lease ----------
def holder():
    return os.environ.get("BK_LEASE_HOLDER") or socket.gethostname() + "-manual"


def parse_iso(t):
    try:
        return dt.datetime.strptime(t, "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=dt.timezone.utc)
    except (TypeError, ValueError):
        return None


def lease_read(top=None):
    """The remote lease as a dict, or None when there is none. Raises RcloneError when the off-site copy is unreachable."""
    top = probe() if top is None else top
    if LEASE not in top:
        return None
    try:
        return json.loads(rc("cat", remote(LEASE)).stdout)
    except ValueError:
        return {"holder": None, "corrupt": True}


def lease_write(obj, timeout=3600):
    os.makedirs(RUN, exist_ok=True)
    tmp = os.path.join(RUN, "lease-out.json")
    json.dump(obj, open(tmp, "w"), indent=1)
    rc("copyto", tmp, remote(LEASE), "--ignore-times", timeout=timeout)     # always upload (size can repeat; the content differs)


def confirm_s():
    return float(os.environ.get("BK_LEASE_CONFIRM_S", 5))


def lease_rewrite(lease, t_read, what):
    """Write back a lease we read at t_read (monotonic) — bounded so the write lands within 0.9 × BK_LEASE_CONFIRM_S of
    the read starting, i.e. before any copy that took the lease meanwhile reads it back (see the module docstring).
    Returns None when written, else the exit code."""
    c = confirm_s()
    took = time.monotonic() - t_read
    if took > 0.4 * c:
        log(f"{what} skipped: reading the lease took {took:.1f} s (> {0.4 * c:.1f} s) — a late write could overwrite a copy "
            f"that took the lease meanwhile; trying again next time")
        return EXIT_UNREACHABLE
    try:
        lease_write(lease, timeout=max(0.1, 0.9 * c - (time.monotonic() - t_read)))
    except subprocess.TimeoutExpired:
        log(f"{what} cut off: the lease upload did not finish within {0.9 * c:.1f} s of the read; trying again next time")
        return EXIT_UNREACHABLE
    return None


def lease_age(lease):
    t = parse_iso((lease or {}).get("heartbeat_at"))
    return None if t is None else (dt.datetime.now(dt.timezone.utc) - t).total_seconds()


def lease_free(lease, me):
    """(free?, why) — free when absent, released, corrupt, stale, or already ours."""
    if lease is None:
        return True, "no lease yet"
    if lease.get("corrupt"):
        return True, "lease unreadable — taking it"
    if lease.get("holder") == me:
        return True, "already mine"
    if lease.get("released"):
        return True, "released by " + str(lease.get("holder"))
    age, stale = lease_age(lease), float(os.environ.get("BK_LEASE_STALE_S", 90))
    if age is None or age > stale:
        return True, f"stale (last heartbeat {'?' if age is None else int(age)} s ago > {int(stale)} s)"
    return False, f"held by another copy (last heartbeat {int(age)} s ago)"


def holds_lease(top=None):
    lease = lease_read(top)
    return bool(lease) and lease.get("holder") == holder() and not lease.get("released")


def cmd_lease_acquire():
    me = holder()
    try:
        lease = lease_read()
        free, why = lease_free(lease, me)
        if not free:
            log(f"lease: {why} — waiting (it is still running or writing its final backup)")
            set_state("LEASE_BUSY", "another copy is still running — waiting for its final backup")
            return EXIT_LEASE_BUSY
        t = now_iso()
        claim = {"holder": me, "acquired_at": t if (lease or {}).get("holder") != me else lease.get("acquired_at", t),
                 "heartbeat_at": t, "released": False, "version": "0.3"}
        try:
            lease_write(claim)
        except RcloneError:                      # one retry: a transient upload error (or two copies writing the same
            time.sleep(0.5)                      # object at once on some backends) must not look like "off-site down";
            lease_write(claim)                   # the read-back below still decides who holds the lease
        time.sleep(confirm_s())
        back = lease_read()
    except RcloneError as e:
        log("OFF-SITE UNREACHABLE — cannot take the lease:", e)
        set_state("UNREACHABLE", "off-site backup unreachable; agents not started")
        return EXIT_UNREACHABLE
    if not back or back.get("holder") != me:
        log("lease: another copy wrote the lease at the same moment — it wins; waiting")
        set_state("LEASE_BUSY", "another copy is still running — waiting for its final backup")
        return EXIT_LEASE_BUSY
    log(f"lease ACQUIRED by {me} ({why})")
    return 0


def cmd_lease_heartbeat():
    me = holder()
    t_read = time.monotonic()
    try:
        lease = lease_read()
        if not lease or lease.get("holder") != me or lease.get("released"):
            log(f"LEASE LOST: the lease now says {None if not lease else lease.get('holder')}"
                f"{' (released)' if lease and lease.get('released') else ''} — this copy must stop writing")
            set_state("LEASE_LOST", "another copy holds the lease; this copy stopped its agents and backups")
            return EXIT_NO_LEASE
        lease["heartbeat_at"] = now_iso()
        bad = lease_rewrite(lease, t_read, "lease heartbeat")
        if bad is not None:
            return bad
    except RcloneError as e:
        log("lease heartbeat failed (off-site unreachable):", e)
        return EXIT_UNREACHABLE
    return 0


def cmd_lease_release():
    me = holder()
    t_read = time.monotonic()
    try:
        lease = lease_read()
        if not lease or lease.get("holder") != me:
            log(f"lease-release: not ours ({None if not lease else lease.get('holder')}) — left untouched")
            return EXIT_NO_LEASE
        lease.update(released=True, released_at=now_iso())
        bad = lease_rewrite(lease, t_read, "lease-release")
        if bad is not None:
            log("the lease was not released — it goes stale on its own")
            return bad
    except RcloneError as e:
        log("lease-release failed (off-site unreachable) — it goes stale on its own:", e)
        return EXIT_UNREACHABLE
    log(f"lease RELEASED by {me}")
    return 0


# ---------- restore ----------
def safe_extract(tar_path, dest):
    with tarfile.open(tar_path) as t:
        for m in t.getmembers():
            target = os.path.realpath(os.path.join(dest, m.name))
            if m.name.startswith("/") or ".." in m.name.split("/") or not target.startswith(os.path.realpath(dest) + os.sep):
                raise RuntimeError(f"unsafe path in state.tar.gz: {m.name}")
            if (m.issym() or m.islnk()) and (os.path.isabs(m.linkname) or ".." in m.linkname.split("/")):
                raise RuntimeError(f"unsafe link in state.tar.gz: {m.name} -> {m.linkname}")
        t.extractall(dest)


def try_restore(name, top):
    stage = os.path.join(D, "restore-staging", name)
    shutil.rmtree(stage, ignore_errors=True)
    os.makedirs(stage)
    rc("copy", remote("snapshots/" + name), stage)
    man = json.load(open(os.path.join(stage, "manifest.json")))
    for rel, meta in man["files"].items():
        p = os.path.join(stage, rel)
        if not os.path.exists(p) or sha_file(p) != meta["sha256"]:
            raise RuntimeError(f"downloaded file does not match the manifest: {rel}")
    warnings = []
    if "diary" in top:                     # 1) the diary (copy never deletes local files)
        os.makedirs(os.path.join(D, "diary"), exist_ok=True)
        rc("copy", remote("diary"), os.path.join(D, "diary"))
        for rel, anc in man.get("diary_anchors", {}).items():
            r = chain_verify(os.path.join(D, "diary", rel), anc)
            if not r["ok"]:
                warnings.append(f"diary {rel}: {r['problems'][0]}")
    if os.path.exists(os.path.join(stage, "state.tar.gz")):   # 2) dsh state, sign-ins, registers, work folders
        safe_extract(os.path.join(stage, "state.tar.gz"), D)
    lib_dir = os.path.join(D, "library")   # 3) the Library LAST: it appears (atomic rename) only after counts match
    os.makedirs(lib_dir, exist_ok=True)
    p = subprocess.run([PY, os.path.join(HERE, "library_svc.py"), "--import-snapshot", stage,
                        "--db", os.path.join(lib_dir, "library.lbug")], capture_output=True, text=True)
    if p.returncode != 0:
        raise RuntimeError(f"Library import failed: {(p.stderr or p.stdout).strip()[-300:]}")
    stats = json.loads(p.stdout.strip().splitlines()[-1])
    shutil.rmtree(stage, ignore_errors=True)
    return stats, warnings


def cmd_restore():
    lib_db = os.path.join(D, "library", "library.lbug")
    if os.path.exists(lib_db):
        if not os.path.exists(MARKER):
            write_marker({"kind": "local-existing", "at": now_iso()})
        log("local Library present — no restore needed"); set_state("OK", "local data present")
        return 0
    try:
        top = probe()
    except RcloneError as e:
        log("OFF-SITE UNREACHABLE — refusing to start with an empty Library:", e)
        set_state("UNREACHABLE", "off-site backup unreachable; agents not started")
        return EXIT_UNREACHABLE
    try:
        mine = holds_lease(top)
    except RcloneError as e:
        log("OFF-SITE UNREACHABLE while checking the lease:", e)
        set_state("UNREACHABLE", "off-site backup unreachable; agents not started")
        return EXIT_UNREACHABLE
    if not mine:
        log("REFUSED: this copy does not hold the lease (run lease-acquire first) — not restoring")
        set_state("NO_LEASE", "restore refused: this copy does not hold the lease")
        return EXIT_NO_LEASE
    data_top = [x for x in top if x != LEASE]          # the lease alone does not make the bucket "non-empty"
    done, partial = complete_snapshots(top)
    cands = [n for n in reversed(done) if n not in quarantined()]
    if not done:
        if not data_top:
            write_marker({"kind": "fresh", "at": now_iso(), "note": "off-site copy reachable and empty"})
            log("off-site copy is reachable and EMPTY — fresh start"); set_state("OK", "fresh start")
            return 0
        if os.environ.get("BK_ALLOW_FRESH_START") == "1":
            write_marker({"kind": "fresh-forced", "at": now_iso(), "remote_had": data_top})
            log("no COMPLETE snapshot; BK_ALLOW_FRESH_START=1 — starting fresh (off-site data left untouched)")
            set_state("OK", "fresh start forced by founder")
            return 0
        log(f"off-site copy has data ({data_top}) but no COMPLETE snapshot (incomplete: {partial}) — refusing")
        set_state("INCONSISTENT", "off-site data but no complete snapshot; set BK_ALLOW_FRESH_START=1 to override")
        return EXIT_INCONSISTENT
    for name in cands:
        try:
            stats, warnings = try_restore(name, top)
        except RcloneError as e:            # the network, not the snapshot: do not quarantine, do not start
            set_state("UNREACHABLE", f"lost the off-site copy during restore: {e}")
            log("OFF-SITE LOST DURING RESTORE — not starting:", e)
            return EXIT_UNREACHABLE
        except (RuntimeError, OSError, ValueError, KeyError, tarfile.TarError) as e:
            quarantine(name, e)
            continue
        write_marker({"kind": "snapshot", "snapshot": name, "at": now_iso(), "facts_live": stats.get("facts_live"),
                   "warnings": warnings})
        log(f"restored {name}: {stats.get('facts_total')} facts ({stats.get('facts_live')} live)" +
            (f"; WARNINGS: {warnings}" if warnings else ""))
        set_state("OK" if not warnings else "RESTORED_WITH_WARNINGS", "; ".join(warnings), restored_from=name)
        return 0
    set_state("RESTORE_FAILED", "every complete snapshot failed verification; agents not started")
    return EXIT_FAILED


# ---------- snapshot + push ----------
def library_snapshot():
    req = urllib.request.Request(ADMIN + "/snapshot", method="POST", headers={"X-Admin-Token": os.environ.get("LIBRARY_ADMIN_TOKEN", "")})
    return json.load(urllib.request.urlopen(req, timeout=300))["dir"]


def add_state_tar(snap):
    def filt(ti):
        return None if set(ti.name.split("/")) & EXCLUDE or ti.name.endswith((".sock", ".lock")) else ti
    with tarfile.open(os.path.join(snap, "state.tar.gz"), "w:gz") as t:
        for part in STATE_PARTS:
            p = os.path.join(D, part)
            if os.path.exists(p):
                t.add(p, arcname=part, filter=filt)


def write_manifest(snap):
    files = {}
    for d, _, fs in os.walk(snap):
        for fn in fs:
            p = os.path.join(d, fn)
            rel = os.path.relpath(p, snap)
            if rel not in ("manifest.json", "COMPLETE"):
                files[rel] = {"sha256": sha_file(p), "size": os.path.getsize(p)}
    diary = os.path.join(D, "diary")
    anc = {os.path.relpath(k, diary): v for k, v in chain_anchors(diary).items()} if os.path.isdir(diary) else {}
    lib = json.load(open(os.path.join(snap, "library-manifest.json")))
    man = {"version": "0.3", "name": os.path.basename(snap), "created_at": now_iso(), "library": lib,
           "files": files, "diary_anchors": anc}
    json.dump(man, open(os.path.join(snap, "manifest.json"), "w"), indent=1)
    os.makedirs(RUN, exist_ok=True)
    json.dump({"snapshot": man["name"], "at": man["created_at"], "anchors": anc}, open(os.path.join(RUN, "last-anchors.json"), "w"), indent=1)
    return man


def push_diary():
    diary = os.path.join(D, "diary")
    if not os.path.isdir(diary):
        return
    top = probe()
    remote_sizes = {}
    if "diary" in top:
        remote_sizes = {x["Path"]: x["Size"] for x in json.loads(rc("lsjson", remote("diary"), "-R", "--files-only").stdout or "[]")}
    shorter = []
    for d, _, fs in os.walk(diary):
        for fn in fs:
            rel = os.path.relpath(os.path.join(d, fn), diary)
            if rel in remote_sizes and os.path.getsize(os.path.join(d, fn)) < remote_sizes[rel]:
                shorter.append(rel)
    missing = [r for r in remote_sizes if not os.path.exists(os.path.join(diary, r))]
    if shorter:
        raise RuntimeError(f"local diary file(s) SHORTER than the off-site copy: {shorter} — not pushing the diary")
    rc("copy", diary, remote("diary"))
    if missing:
        log(f"note: {len(missing)} off-site diary file(s) are missing locally (kept off-site): {missing[:5]}")


def push_logs():
    arch = os.path.join(D, "log", "archive")
    if os.path.isdir(arch) and os.listdir(arch):
        rc("copy", arch, remote("logs"), "--immutable")


def upload_snapshot(snap, man):
    name = os.path.basename(snap)
    rc("copy", snap, remote("snapshots/" + name), "--immutable")
    rc("check", snap, remote("snapshots/" + name), "--one-way")      # size + hash of every file, or fail
    if not holds_lease():                                             # v0.5r2: lost the lease while uploading?
        raise LeaseLostError(f"another copy took the lease while {name} was uploading — not marking it COMPLETE")
    marker = os.path.join(snap, "COMPLETE")
    open(marker, "w").write(hashlib.sha256(open(os.path.join(snap, "manifest.json"), "rb").read()).hexdigest() + "\n")
    rc("copyto", marker, remote(f"snapshots/{name}/COMPLETE"))       # written LAST


def prune_local(keep=4):
    b = os.path.join(D, "backups")
    snaps = sorted(x for x in os.listdir(b) if x.startswith("snap-")) if os.path.isdir(b) else []
    for old in snaps[:-keep]:
        shutil.rmtree(os.path.join(b, old), ignore_errors=True)


def parse_name(n):
    try:
        return dt.datetime.strptime(n, "snap-%Y%m%dT%H%M%SZ").replace(tzinfo=dt.timezone.utc)
    except ValueError:
        return None


def prune_plan(done, partial, now=None, keep_recent=48, days=14, weeks=8):
    now = now or dt.datetime.now(dt.timezone.utc)
    dated = sorted(((parse_name(n), n) for n in done if parse_name(n)), reverse=True)
    keep = {n for _, n in dated[:keep_recent]}
    seen_day, seen_week = set(), set()
    for t, n in dated:
        if (now - t).days < days and t.date() not in seen_day:
            seen_day.add(t.date()); keep.add(n)
        wk = t.isocalendar()[:2]
        if (now - t).days < weeks * 7 and wk not in seen_week:
            seen_week.add(wk); keep.add(n)
    if dated:
        keep.add(dated[0][1])
    drop = [n for n in done if n not in keep]
    drop += [n for n in partial if parse_name(n) and (now - parse_name(n)).total_seconds() > 7200]
    return sorted(keep), sorted(drop)


def cmd_prune():
    done, partial = complete_snapshots(probe())
    keep, drop = prune_plan(done, partial)
    for n in drop:
        rc("purge", remote("snapshots/" + n))
    log(f"prune: kept {len(keep)}, deleted {len(drop)}")
    return 0


def cmd_cycle(final=False):
    if not os.path.exists(MARKER):
        log("REFUSED: /data/RESTORED is missing — never push before a verified restore")
        set_state("NOT_RESTORED", "push refused: no verified restore yet")
        return EXIT_NOT_RESTORED
    try:
        if not holds_lease():
            log("REFUSED: this copy does not hold the lease — another copy is the writer; not pushing")
            set_state("LEASE_LOST", "push refused: another copy holds the lease")
            return EXIT_NO_LEASE
        snap = library_snapshot()
        add_state_tar(snap)
        man = write_manifest(snap)
        upload_snapshot(snap, man)
        push_diary()
        push_logs()
        if not final:
            cmd_prune()
        prune_local()
    except LeaseLostError as e:
        log("REFUSED:", e)
        set_state("LEASE_LOST", "push stopped: another copy took the lease during the upload")
        return EXIT_NO_LEASE
    except (RcloneError, RuntimeError, OSError, ValueError) as e:
        log("PUSH FAILED:", e)
        set_state("PUSH_FAILED", str(e)[:300])
        return EXIT_FAILED
    set_state("OK", "pushed", last_push=now_iso(), last_snapshot=os.path.basename(snap),
              facts_live=man["library"].get("facts_live"))
    log(f"pushed {os.path.basename(snap)} ({man['library'].get('facts_live')} live facts)")
    return 0


def cmd_restore_test():
    """Weekly drill against the OFF-SITE copy: download the newest COMPLETE snapshot, verify every file, import into a
    scratch database, compare counts + digest with the manifest. 0 facts = FAIL."""
    result = {"at": now_iso(), "ok": False}
    try:
        done, _ = complete_snapshots(probe())
        if not done:
            raise RuntimeError("no COMPLETE snapshot off-site")
        name = done[-1]
        scratch = os.path.join(D, "restore-test", name)
        shutil.rmtree(os.path.dirname(scratch), ignore_errors=True)
        os.makedirs(scratch)
        rc("copy", remote("snapshots/" + name), scratch)
        man = json.load(open(os.path.join(scratch, "manifest.json")))
        for rel, meta in man["files"].items():
            if sha_file(os.path.join(scratch, rel)) != meta["sha256"]:
                raise RuntimeError(f"file does not match manifest: {rel}")
        p = subprocess.run([PY, os.path.join(HERE, "library_svc.py"), "--restore-test", scratch,
                            "--db", os.path.join(os.path.dirname(scratch), "scratch.lbug")], capture_output=True, text=True)
        if p.returncode != 0:
            raise RuntimeError((p.stderr or p.stdout).strip()[-300:])
        got = json.loads(p.stdout.strip().splitlines()[-1])
        result.update(ok=True, snapshot=name, facts_total=got["facts_total"], facts_live=got["facts_live"])
        shutil.rmtree(os.path.dirname(scratch), ignore_errors=True)
    except Exception as e:
        result["error"] = str(e)[:400]
    finally:
        shutil.rmtree(os.path.join(D, "restore-test"), ignore_errors=True)
    os.makedirs(os.path.join(D, "log"), exist_ok=True)
    json.dump(result, open(os.path.join(D, "log", "restore-test.json"), "w"), indent=1)
    print(("RESTORE TEST: OK — " + f"{result.get('snapshot')}: {result.get('facts_total')} facts, counts and digest match")
          if result["ok"] else "RESTORE TEST: FAIL — " + result.get("error", "?"))
    return 0 if result["ok"] else 1


def main(argv):
    cmd = argv[0] if argv else ""
    if cmd == "restore":
        return cmd_restore()
    if cmd in ("cycle", "final"):
        return cmd_cycle(final=cmd == "final")
    if cmd == "prune":
        return cmd_prune()
    if cmd == "restore-test":
        return cmd_restore_test()
    if cmd == "lease-acquire":
        return cmd_lease_acquire()
    if cmd == "lease-heartbeat":
        return cmd_lease_heartbeat()
    if cmd == "lease-release":
        return cmd_lease_release()
    if cmd == "lease-show":
        print(json.dumps(lease_read(), indent=1)); return 0
    if cmd == "status":
        print(open(STATE).read() if os.path.exists(STATE) else "{}"); return 0
    print(__doc__); return 2


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
