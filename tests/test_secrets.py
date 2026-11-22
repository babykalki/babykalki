"""Secret filter: the review's false positives must PASS, every secret type must be CAUGHT. Synthetic values only."""
import hashlib, json, os, subprocess, sys
import pytest
from conftest import FILES
from bk_secrets import Scanner

PAT = os.path.join(FILES, "secret-patterns.json")


def sc(**env):
    return Scanner(PAT, hashes_file=None, env=env)


FALSE_POSITIVES = [
    "https://github.com/cloudflare/cloudflared/releases/download/2026.11.1/cloudflared-linux-amd64",
    "https://example.com/blog/how-to-build-a-startup-with-ai-agents-in-2026-a-complete-guide-for-indian-founders",
    "fixed in commit 3f9c2a7d41b0e8c6a5d4f3e2b1a0c9d8e7f6a5b4 and merged",
    "sha256 of the zip: 70e083ff5e3ae9d43d441368e3756c81e54751c4f9d8b08aa5b96b25988eb76f",
    "The GitHub token: expires every 90 days",
    "Password = must be rotated quarterly",
    "secret_name: RCLONE_CONFIG_R2_SECRET_ACCESS_KEY",
    "secret_name: BK_GITHUB_TOKEN",
    "set ZAI_API_KEY in Nimbuz Secrets",
    "api_key=ZAI_API_KEY",
    "token_expiry: 2026-12-01T00:00:00Z",
    "Call me at 9876543210: I am free after lunch today, ok?",
    "desk-top-organiser-for-small-offices-2026",
    "R2 endpoint https://abc123.r2.cloudflarestorage.com",
]

FAKE = {
    "zai-api-key": "0123456789abcdef0123456789abcdef" "." "A1b2C3d4E5f6G7h8",
    "anthropic-openai-key": "sk-" "ant-api03-AbCdEfGhIjKlMnOpQrStUvWxYz012345",
    "github-token": "ghp_" + "A1b2C3d4E5" * 3 + "F6g7H8",
    "github-fine-grained": "github_pat_11ABCDEFG0123456789_" + "abcDEF0123" * 5,
    "telegram-bot-token": "123456789:AAH" + "a1B2c3D4e5" * 3 + "f6",   # 35 chars after the colon
    "google-oauth-access": "ya29.a0AfB_byC" + "x1Y2z3" * 6,
    "google-oauth-refresh": "1//0g" + "Ab1Cd2Ef3G" * 4,
    "google-api-key": "AIza" + "SyA1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6Q",
    "meta-access-token": "EAAG" + "m0PxZBc1Df2Gh3Ij4Kl5Mn6Op7Qr8St9Uv0Wx1Yz2" + "AbCd",
    "jwt": "eyJhbGciOiJIUzI1NiJ9" "." "eyJzdWIiOiIxMjM0NTY3ODkwIn0" "." "dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U",
    "cloudflare-tunnel-token": "eyJh" "IjoiMGE1YjNjNGQ1ZTZmN2E4YjljMGQxZTJmM2E0YjVjNmQiLCJ0IjoiMTIzNDU2NzgtOWFiYy1kZWYwLTEyMzQtNTY3ODlhYmNkZWYwIiwicyI6Ik1qTTBOVFkzT0RrdyJ9",
    "aws-access-key-id": "AKIA" "IOSFODNN7EXAMPLE",
    "slack-token": "xox" "b-1234567890-abcdefghij",
    "stripe-secret": "sk_live_" + "a1B2c3D4e5F6g7H8i9J0k1L2",
    "private-key-block": "-----BEGIN OPENSSH PRIVATE" " KEY-----\nb3Blbn\n-----END OPENSSH PRIVATE KEY-----",
    "url-credentials": "https://admin:" "hunter2pass@db.example.com/x",
    "dsh-login-token": "https://agent.example.com/?token=" "Zx9_kL2mN4pQ6rS8tU0vW",
}


@pytest.mark.parametrize("text", FALSE_POSITIVES)
def test_false_positives_pass(text):
    assert sc().check(text) == [], text


@pytest.mark.parametrize("kind,value", sorted(FAKE.items()))
def test_each_secret_type_is_caught(kind, value):
    found = sc().check(f"note: here it is {value} done")
    assert found, (kind, value)


def test_r2_hex_keys_caught_by_exact_match_and_assignment_not_by_bare_pattern():
    key_id, secret = "a3f1" * 8, "9c0d" * 16       # R2 shapes: 32 hex / 64 hex
    plain = sc()
    assert plain.check(f"the id is {key_id}") == []          # bare hex alone is NOT flagged (git SHAs, sha256 sums)
    assert plain.check(f"RCLONE_CONFIG_R2_SECRET_ACCESS_KEY={secret}")  # key=value rule
    s = sc(RCLONE_CONFIG_R2_ACCESS_KEY_ID=key_id, RCLONE_CONFIG_R2_SECRET_ACCESS_KEY=secret)
    assert s.check(f"the id is {key_id}") == ["exact-match"]
    assert s.check(f"pasted:{secret}.") == ["exact-match"]


def test_exact_match_from_hash_file(tmp_path):
    v = "Zq8-unusual-but-real-value-77"
    hf = tmp_path / "h"; hf.write_text(hashlib.sha256(v.encode()).hexdigest() + "\n")
    s = Scanner(PAT, hashes_file=str(hf), env={})
    assert s.check(f"see {v}") == ["exact-match"]
    assert s.check("see something-else-entirely-1234") == []


def test_redact_keeps_text_and_fingerprints():
    s = sc()
    out = s.redact("token " + FAKE["telegram-bot-token"] + " end")
    assert FAKE["telegram-bot-token"] not in out and out.startswith("token [SECRET:telegram-bot-token:") and out.endswith(" end")


def test_cli_precommit_exit_codes(tmp_path):
    clean = tmp_path / "c.txt"; clean.write_text("\n".join(FALSE_POSITIVES))
    dirty = tmp_path / "d.txt"; dirty.write_text("x\nGH=" + FAKE["github-token"] + "\n")
    env_file = tmp_path / ".env"; env_file.write_text("ZAI_API_KEY" "=Qq1Ww2Ee3Rr4Tt5Yy6\n")
    leak = tmp_path / "l.txt"; leak.write_text("oops Qq1Ww2Ee3Rr4Tt5Yy6\n")
    run = lambda f, *x: subprocess.run([sys.executable, os.path.join(FILES, "bk_secrets.py"), "scan", str(f), *x], capture_output=True, text=True)
    assert run(clean).returncode == 0
    r = run(dirty); assert r.returncode == 1 and FAKE["github-token"] not in r.stdout + r.stderr
    assert run(leak).returncode == 0                       # unknown without the .env …
    assert run(leak, "--env-file", str(env_file)).returncode == 1   # … caught with it


def test_js_and_python_agree():
    """babykalki-diary.mjs loads the same JSON; both must flag the same samples."""
    samples = FALSE_POSITIVES + [f"x {v} y" for v in FAKE.values()]
    js = ("import {loadScanner} from '" + os.path.join(FILES, "babykalki-diary.mjs") + "';"
          "const s=loadScanner({hashesFile:'/nonexistent'});const xs=JSON.parse(process.argv[1]);"
          "console.log(JSON.stringify(xs.map(t=>s.find(t).length>0)))")
    r = subprocess.run(["node", "--input-type=module", "-e", js, json.dumps(samples)], capture_output=True, text=True)
    assert r.returncode == 0, r.stderr
    py = [bool(sc().find(t)) for t in samples]
    assert json.loads(r.stdout) == py


def test_every_shipped_file_passes_its_own_filter():
    """The zip must pass the founder's pre-commit check: no file (tests included) may look like it holds a secret."""
    tests_dir = os.path.dirname(os.path.abspath(__file__))
    s, bad = sc(), []
    for top in (FILES, tests_dir):
        for d, dirs, fs in os.walk(top):
            dirs[:] = [x for x in dirs if not x.startswith((".", "__pycache__"))]
            for fn in fs:
                if fn.endswith((".pyc",)):
                    continue
                for n, line in enumerate(open(os.path.join(d, fn), encoding="utf-8", errors="replace"), 1):
                    if s.find(line):
                        bad.append(f"{os.path.relpath(os.path.join(d, fn), top)}:{n}")
    assert bad == []
