#!/usr/bin/env python3
"""bk_secrets.py — BabyKalki's ONE secret filter (v0.3, 18 Nov 2026 — unchanged since v0.2, 17 Nov). MIT licence.

Used by: library_svc.py (refuses writes), bk_chain.py / babykalki-diary.mjs (fingerprints in the diary — the JS
plugin reads the same secret-patterns.json), and your laptop's git pre-commit check (CLAUDE.md).

Three checks, in this order:
  1. EXACT MATCH against your own secret values. The values are never stored here: only their SHA-256 hashes,
     written at start-up by the supervisor (`hashes` command) to /run/bk/secret-hashes, or read from a local .env.
     This is what catches R2 keys (32/64 hex) without flagging every git SHA or SHA-256 sum in normal text.
  2. KNOWN FORMATS from secret-patterns.json (Z.ai, GitHub, Telegram, Google, Meta, JWT, Cloudflare tunnel, …).
  3. key = value: a key that names a secret followed by a value that looks like a key (>=16 chars, letters and digits).

CLI:
  bk_secrets.py scan [FILE|-] [--env-file .env]   exit 1 if anything looks like a secret (prints WHERE, never the value)
  bk_secrets.py hashes --out FILE                 write SHA-256 of secret-looking env values (one per line, 0644)
  bk_secrets.py redact [FILE|-]                   print the text with secrets replaced by [SECRET:<kind>:<fp>]
Pre-commit (laptop):  git diff --cached -U0 | python3 bk_secrets.py scan - --env-file .env
"""
import hashlib, json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
DEFAULT_PATTERNS = os.environ.get("BK_SECRET_PATTERNS", os.path.join(HERE, "secret-patterns.json"))
DEFAULT_HASHES = os.environ.get("BK_SECRET_HASHES_FILE", "/run/bk/secret-hashes")
CANDIDATE = re.compile(r"[A-Za-z0-9_\-.:+/=~]{8,}")


def _sha(s):
    return hashlib.sha256(s.encode("utf-8", "surrogatepass")).hexdigest()


class Scanner:
    def __init__(self, patterns_path=DEFAULT_PATTERNS, hashes_file=DEFAULT_HASHES, env=None, env_file=None):
        d = json.load(open(patterns_path, encoding="utf-8"))
        self.patterns = [(p["name"], re.compile(p["re"])) for p in d["patterns"]]
        a = d["assignment"]
        self.assign = re.compile("(" + a["key_re"] + ")" + a["sep_re"] + "(" + a["value_re"] + ")", re.I)
        self.value_skip = re.compile(a.get("value_skip_re", "(?!)"))
        self.env_name = re.compile(d["env_name_re"], re.I)
        self.min_len = int(d.get("min_exact_len", 12))
        self.hashes = set()
        if hashes_file and os.path.exists(hashes_file):
            self.hashes |= {l.strip() for l in open(hashes_file) if re.fullmatch(r"[0-9a-f]{64}", l.strip())}
        self.add_env(os.environ if env is None else env)
        if env_file:
            self.add_env(parse_env_file(env_file))

    def add_env(self, env):
        for k, v in env.items():
            if v and len(v) >= self.min_len and self.env_name.search(k) and not v.startswith(("http://", "https://")):
                self.hashes.add(_sha(v.strip()))

    def secret_hashes(self):
        return sorted(self.hashes)

    def find(self, text):
        """Return a list of (kind, start, end). Never returns the matched value itself to callers that log."""
        if not text:
            return []
        hits = []
        if self.hashes:
            for m in CANDIDATE.finditer(text):
                tok, base = m.group(0), m.start()
                parts = {(tok, 0)}
                for sep in "=:":                      # KEY=value, Bearer:value, …
                    off = 0
                    for piece in tok.split(sep):
                        parts.add((piece, off)); off += len(piece) + 1
                for piece, off in parts:
                    s = piece.rstrip(".,;:=")
                    if len(s) >= self.min_len and _sha(s) in self.hashes:
                        hits.append(("exact-match", base + off, base + off + len(s)))
        for name, rx in self.patterns:
            for m in rx.finditer(text):
                hits.append((name, m.start(), m.end()))
        for m in self.assign.finditer(text):
            v = m.group(2)
            if re.search(r"[A-Za-z]", v) and re.search(r"[0-9]", v) and not self.value_skip.match(v):
                hits.append(("key=value", m.start(2), m.end(2)))
        return _merge(hits)

    def check(self, *texts):
        """Return the kinds found (empty list = clean)."""
        kinds = []
        for t in texts:
            kinds += [k for k, _, _ in self.find(t or "")]
        return sorted(set(kinds))

    def redact(self, text):
        out, last = [], 0
        for kind, a, b in self.find(text):
            out.append(text[last:a]); out.append(f"[SECRET:{kind}:{_sha(text[a:b])[:8]}]"); last = b
        out.append(text[last:])
        return "".join(out)


def _merge(hits):
    hits.sort(key=lambda h: (h[1], -h[2]))
    out = []
    for h in hits:
        if out and h[1] < out[-1][2]:
            if h[2] > out[-1][2]:
                out[-1] = (out[-1][0], out[-1][1], h[2])
            continue
        out.append(h)
    return out


def parse_env_file(path):
    env = {}
    for line in open(path, encoding="utf-8"):
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        v = v.split(" #", 1)[0].strip().strip('"').strip("'")
        env[k.strip().removeprefix("export ").strip()] = v
    return env


def main(argv):
    import argparse
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("cmd", choices=["scan", "hashes", "redact"])
    ap.add_argument("file", nargs="?", default="-")
    ap.add_argument("--env-file"); ap.add_argument("--out"); ap.add_argument("--patterns", default=DEFAULT_PATTERNS)
    a = ap.parse_args(argv)
    sc = Scanner(a.patterns, env_file=a.env_file)
    if a.cmd == "hashes":
        tmp = a.out + ".tmp"
        with open(tmp, "w") as f:
            f.write("".join(h + "\n" for h in sc.secret_hashes()))
        os.chmod(tmp, 0o644); os.replace(tmp, a.out)
        print(f"wrote {len(sc.hashes)} secret hashes (values are not stored)", file=sys.stderr)
        return 0
    text = sys.stdin.read() if a.file == "-" else open(a.file, encoding="utf-8", errors="surrogateescape").read()
    if a.cmd == "redact":
        sys.stdout.write(sc.redact(text)); return 0
    found = 0
    for n, line in enumerate(text.splitlines(), 1):
        for kind, s, e in sc.find(line):
            found += 1
            print(f"line {n}, column {s + 1}: looks like a secret ({kind}) — value not shown")
    if found:
        print(f"REFUSED: {found} possible secret(s). Remove them and refer to secrets by NAME.", file=sys.stderr)
        return 1
    print("clean: no secrets found", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
