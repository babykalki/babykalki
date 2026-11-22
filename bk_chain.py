#!/usr/bin/env python3
"""bk_chain.py — BabyKalki's append-only, hash-chained log format (v0.3, 18 Nov 2026 — unchanged since v0.2, 17 Nov). MIT licence.

ONE format for the diary (written by babykalki-diary.mjs), the Library change log (changes.jsonl) and the
approvals register (approvals.jsonl). Each line is exactly:

    {"prev":"<64 hex>","hash":"<64 hex>","body":<the event as JSON>}
    hash = sha256( prev + sha256(<body bytes exactly as stored>) )

We hash the STORED BYTES, never a re-serialisation, so JS and Python agree on floats (1.5e-7), lone surrogates, etc.
A redacted line becomes  {"prev":…,"hash":…,"tomb":{"body_sha256":"<sha256 of the original body>"},"pad":"   "}
— same length, written in place, so the chain still verifies and proves a line was there (erasure route, DPDP).

What a chain can and cannot prove:
  * it shows edits, inserted/removed lines and torn writes anywhere in the file;
  * it shows a cut-off tail ONLY against an ANCHOR (lines + hash) kept somewhere else — the backup pushes anchors
    off-site with every snapshot and the morning briefing prints them;
  * it does NOT stop someone with write access from rewriting the file and re-chaining it after the last anchor.

CLI:
  bk_chain.py verify FILE [--anchors anchors.json]   exit 0 = intact; 1 = broken / truncated against an anchor
  bk_chain.py verify-dir DIR [--anchors anchors.json]
  bk_chain.py anchors DIR [DIR …]                    print {path: {lines, bytes, hash}} for every *.jsonl
  bk_chain.py redact FILE LINE                       replace one line's body by a tombstone (needs founder approval!)
"""
import hashlib, json, os, re, sys

ZERO = "0" * 64
LINE = re.compile(rb'^\{"prev":"([0-9a-f]{64})","hash":"([0-9a-f]{64})","(body|tomb)":(.*)\}$', re.S)


def sha(b):
    return hashlib.sha256(b).hexdigest()


def link(prev, body_sha):
    return sha((prev + body_sha).encode())


def make_line(prev, body_bytes):
    h = link(prev, sha(body_bytes))
    return b'{"prev":"' + prev.encode() + b'","hash":"' + h.encode() + b'","body":' + body_bytes + b"}\n", h


def encode_body(obj):
    # ensure_ascii keeps lone surrogates and odd characters representable; we hash these exact bytes.
    return json.dumps(obj, ensure_ascii=True, separators=(",", ":"), default=str).encode("ascii")


def parse(raw):
    """raw = one line without the trailing newline -> (prev, hash, kind, body_sha) or None if malformed."""
    m = LINE.match(raw)
    if not m:
        return None
    prev, h, kind, rest = m.group(1).decode(), m.group(2).decode(), m.group(3).decode(), m.group(4)
    if kind == "body":
        return prev, h, kind, sha(rest)
    try:
        t = json.loads(raw.decode("utf-8"))["tomb"]["body_sha256"]
    except Exception:
        return None
    return prev, h, kind, t if re.fullmatch(r"[0-9a-f]{64}", t or "") else None


def last_hash(path):
    """Hash of the last COMPLETE valid line, and whether the file ends with a torn (incomplete) write."""
    if not os.path.exists(path) or os.path.getsize(path) == 0:
        return ZERO, b""
    size = os.path.getsize(path)
    with open(path, "rb") as f:
        back = min(size, 1 << 20)
        f.seek(size - back)
        chunk = f.read()
    torn = b""
    if not chunk.endswith(b"\n"):
        cut = chunk.rfind(b"\n")
        torn = chunk[cut + 1:]
        chunk = chunk[:cut + 1]
    for raw in reversed(chunk.rstrip(b"\n").split(b"\n")):
        p = parse(raw)
        if p:
            return p[1], torn
    return ZERO, torn


class ChainWriter:
    """Append-only writer. Remembers the last hash in memory (no re-reading the log on every write)."""

    def __init__(self, path, fsync=True):
        self.path, self.fsync = path, fsync
        os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)
        self.prev, torn = last_hash(path)
        self.f = open(path, "ab")
        if torn:   # an earlier write was cut off: keep the bytes, say so in the chain, continue
            self.f.write(b"\n")
            self.append({"event": "torn-tail-recovered", "torn_sha256": sha(torn), "torn_len": len(torn)})

    def append(self, obj):
        line, h = make_line(self.prev, encode_body(obj))
        self.f.write(line)
        self.f.flush()
        if self.fsync:
            os.fsync(self.f.fileno())
        self.prev = h
        return h

    def close(self):
        self.f.close()


def verify(path, anchor=None):
    """Return dict(ok, lines, hash, problems). anchor = {"lines": N, "hash": H} from an off-site copy."""
    prev, n, problems, torn_pending, at_anchor = ZERO, 0, [], None, None
    data = open(path, "rb").read() if os.path.exists(path) else b""
    raws = data.split(b"\n")
    if raws and raws[-1] == b"":
        raws.pop()
    elif raws:
        problems.append(f"line {len(raws)}: last line is incomplete (torn write, no newline yet)")
        raws.pop()
    for i, raw in enumerate(raws, 1):
        p = parse(raw)
        if p is None:
            if raw.strip() == b"" and torn_pending is None:
                problems.append(f"line {i}: empty line"); continue
            torn_pending = (i, sha(raw), len(raw))
            continue
        lp, lh, kind, bsha = p
        if torn_pending:
            ok_torn = False
            if kind == "body":
                try:
                    b = json.loads(raw.decode())["body"]
                    ok_torn = b.get("event") == "torn-tail-recovered" and b.get("torn_sha256") == torn_pending[1]
                except Exception:
                    pass
            if not ok_torn:
                problems.append(f"line {torn_pending[0]}: not a valid chain line (edited or corrupted)")
            torn_pending = None
        if lp != prev:
            problems.append(f"line {i}: does not follow the line before it (a line was removed, inserted or reordered)")
        if link(lp, bsha) != lh:
            problems.append(f"line {i}: content does not match its hash (the line was edited)")
        prev, n = lh, n + 1
        if anchor and i == anchor.get("lines"):
            at_anchor = lh
    if torn_pending:
        problems.append(f"line {torn_pending[0]}: not a valid chain line (edited or corrupted)")
    if anchor and anchor.get("lines"):
        if len(raws) < anchor["lines"]:
            problems.append(f"TRUNCATED: the off-site anchor saw {anchor['lines']} lines, the file has {len(raws)}")
        elif at_anchor != anchor.get("hash"):
            problems.append(f"REWRITTEN: line {anchor['lines']} no longer has the hash the off-site anchor recorded")
    return {"ok": not problems, "lines": n, "hash": prev, "problems": problems}


def head(path):
    h, _ = last_hash(path)
    n = 0
    with open(path, "rb") as f:
        for _ in f:
            n += 1
    return {"lines": n, "bytes": os.path.getsize(path), "hash": h}


def anchors(*roots):
    out = {}
    for root in roots:
        if os.path.isfile(root):
            out[os.path.abspath(root)] = head(root); continue
        for d, _, files in os.walk(root):
            for fn in sorted(files):
                if fn.endswith(".jsonl"):
                    p = os.path.join(d, fn)
                    out[os.path.abspath(p)] = head(p)
    return out


def redact(path, line_no):
    """Replace line `line_no` (1-based) by a same-length tombstone, in place. Returns the original body's sha256."""
    with open(path, "r+b") as f:
        off = 0
        for i, raw in enumerate(f, 1):
            if i == line_no:
                break
            off += len(raw)
        else:
            raise ValueError(f"no line {line_no}")
        body = raw.rstrip(b"\n")
        p = parse(body)
        if not p:
            raise ValueError(f"line {line_no} is not a valid chain line")
        if p[2] == "tomb":
            return p[3]
        prev, h, _, bsha = p
        stub = b'{"prev":"' + prev.encode() + b'","hash":"' + h.encode() + b'","tomb":{"body_sha256":"' + bsha.encode() + b'"},"pad":"'
        pad = len(body) - len(stub) - 2
        if pad < 0:
            raise ValueError(f"line {line_no} is too short to hold a tombstone ({len(body)} bytes)")
        new = stub + b" " * pad + b'"}'
        assert len(new) == len(body)
        f.seek(off); f.write(new); f.flush(); os.fsync(f.fileno())
        return bsha


def main(argv):
    import argparse
    ap = argparse.ArgumentParser()
    ap.add_argument("cmd", choices=["verify", "verify-dir", "anchors", "redact"])
    ap.add_argument("paths", nargs="+"); ap.add_argument("--anchors")
    a = ap.parse_args(argv)
    if a.cmd == "anchors":
        print(json.dumps(anchors(*a.paths), indent=1)); return 0
    if a.cmd == "redact":
        print("tombstone written; original body sha256:", redact(a.paths[0], int(a.paths[1]))); return 0
    anc = json.load(open(a.anchors)) if a.anchors else {}
    files = a.paths if a.cmd == "verify" else sorted(anchors(*a.paths))
    bad = 0
    for p in files:
        r = verify(p, anc.get(os.path.abspath(p)) or anc.get(p))
        if r["ok"]:
            print(f"OK      {p}: {r['lines']} lines, chain intact, last hash {r['hash'][:12]}…")
        else:
            bad += 1
            print(f"BROKEN  {p}:"); [print("   ", x) for x in r["problems"][:20]]
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
