"""Diary (babykalki-diary.mjs, run with node) + bk_chain.py: stored-bytes hashing, anchors, torn tails, redaction."""
import json, os, subprocess
import pytest
from conftest import FILES
from bk_chain import ChainWriter, anchors, redact, verify

DIARY = os.path.join(FILES, "babykalki-diary.mjs")


def node_write(root, events, extra_cfg=None, hashes="/nonexistent"):
    js = ("import {createDiary} from '" + DIARY + "'; import {readFileSync} from 'node:fs';"
          "const [root, evs, cfg, hf] = JSON.parse(readFileSync(0, 'utf8'));"
          "const d = createDiary({root, hashesFile: hf, ...cfg});"
          "for (const [s, e] of evs) d.record(s, e);"
          "d.flush();")
    r = subprocess.run(["node", "--input-type=module", "-e", js], input=json.dumps([str(root), events, extra_cfg or {}, hashes]),
                       capture_output=True, text=True)
    assert r.returncode == 0, r.stderr


def ev(data, cwd="/data/citizens/warden/work", typ="tool/result", seq=1):
    return [{"id": "s1", "cwd": cwd}, {"type": typ, "seq": seq, "time": "2026-11-17T10:00:00Z", "data": data}]


def diary_file(root, who="warden"):
    d = root / who
    return d / sorted(os.listdir(d))[0]


def test_js_writer_python_verifier_agree_on_awkward_values(tmp_path):
    js_lone = "\ud800"   # lone surrogate: passed to node via a JSON escape
    events = [ev({"x": 1.5e-7}), ev({"big": 1e21, "neg": -0.0}), ev({"s": "emoji 🙂 and हिन्दी"}),
              ev({"s": "quote \" backslash \\ newline \n tab \t"}), ev({"nested": {"a": [1, 2, {"b": None}]}})]
    raw = json.dumps([str(tmp_path), events, {}, "/nonexistent"]).replace("emoji", "lone \\ud800 emoji")
    js = ("import {createDiary} from '" + DIARY + "';const [root, evs, cfg, hf] = JSON.parse(process.argv[1]);"
          "const d = createDiary({root, hashesFile: hf}); for (const [s, e] of evs) d.record(s, e); d.flush();")
    r = subprocess.run(["node", "--input-type=module", "-e", js, raw], capture_output=True, text=True)
    assert r.returncode == 0, r.stderr
    f = diary_file(tmp_path)
    res = verify(str(f))
    assert res["ok"], res["problems"]
    assert res["lines"] == 5
    assert b"1.5e-7" in f.read_bytes()            # JS spelling kept; the Python verifier hashes the stored bytes


def test_edit_delete_and_truncation_detection(tmp_path):
    node_write(tmp_path, [ev({"n": i}, seq=i) for i in range(6)])
    f = diary_file(tmp_path)
    good = f.read_bytes()
    anc = anchors(str(tmp_path))[str(f)]
    assert anc["lines"] == 6
    lines = good.split(b"\n")
    f.write_bytes(good.replace(b'"n":3', b'"n":9'))
    assert any("edited" in p for p in verify(str(f))["problems"])
    f.write_bytes(b"\n".join(lines[:2] + lines[3:]))
    assert any("removed" in p for p in verify(str(f))["problems"])
    f.write_bytes(b"\n".join(lines[:4]) + b"\n")       # cut-off tail: the chain itself still looks fine …
    assert verify(str(f))["ok"]
    r = verify(str(f), anc)                            # … but the off-site anchor catches it
    assert not r["ok"] and r["problems"][0].startswith("TRUNCATED")


def test_rewrite_after_anchor_detected(tmp_path):
    node_write(tmp_path, [ev({"n": i}, seq=i) for i in range(3)])
    f = diary_file(tmp_path)
    anc = anchors(str(tmp_path))[str(f)]
    lines = f.read_bytes().split(b"\n")[:-1]
    # attacker rewrites line 2 and re-chains everything after it
    body = json.loads(lines[1])["body"]; body["data"] = {"n": "forged"}
    f.write_bytes(lines[0] + b"\n")
    w = ChainWriter(str(f)); w.append(body); w.append(json.loads(lines[2])["body"]); w.close()
    assert verify(str(f))["ok"]                        # a re-chained file verifies on its own …
    assert any(p.startswith("REWRITTEN") for p in verify(str(f), anc)["problems"])   # … not against the anchor


def test_torn_tail_recovered_and_chain_continues(tmp_path):
    node_write(tmp_path, [ev({"n": 1})])
    f = diary_file(tmp_path)
    with open(f, "ab") as h:
        h.write(b'{"prev":"abc","hash":"de')           # crash in the middle of a write
    assert not verify(str(f))["ok"]
    node_write(tmp_path, [ev({"n": 2})])
    res = verify(str(f))
    assert res["ok"], res["problems"]
    assert b"torn-tail-recovered" in f.read_bytes()


def test_secrets_fingerprinted_hex_kept(tmp_path):
    tg = "123456789:AAH" + "a1B2c3D4e5" * 3 + "f6"
    sha = "3f9c2a7d41b0e8c6a5d4f3e2b1a0c9d8e7f6a5b4"
    hf = tmp_path / "hashes"
    import hashlib
    own = "MyR2SecretValue-0123456789abcdef"
    hf.write_text(hashlib.sha256(own.encode()).hexdigest() + "\n")
    node_write(tmp_path / "d", [ev({"out": f"token {tg} commit {sha} env {own}"})], hashes=str(hf))
    text = diary_file(tmp_path / "d").read_text()
    assert tg not in text and own not in text and sha in text
    assert "[SECRET:telegram-bot-token:" in text and "[SECRET:exact-match:" in text


def test_unmapped_and_traversal(tmp_path):
    node_write(tmp_path, [ev({"a": 1}, cwd="/somewhere/else"), ev({"a": 2}, cwd="/data/citizens/../../etc")])
    assert sorted(os.listdir(tmp_path)) == ["_unmapped"]


def test_big_event_truncated_with_hash(tmp_path):
    node_write(tmp_path, [ev({"blob": "z" * 300000})], {"maxEventBytes": 10000})
    body = json.loads(diary_file(tmp_path).read_text())["body"]
    assert body["truncated"] is True and body["original_bytes"] > 300000 and len(body["original_sha256"]) == 64


def test_batch_of_2000_events_one_chain(tmp_path):
    node_write(tmp_path, [ev({"i": i}, seq=i) for i in range(2000)])
    assert verify(str(diary_file(tmp_path)))["lines"] == 2000


def test_error_log_keeps_message(tmp_path):
    (tmp_path / "warden").write_text("not a dir")     # citizen folder blocked by a file
    node_write(tmp_path, [ev({"a": 1})])
    log = (tmp_path / "DIARY-ERRORS.log").read_text()
    assert "EEXIST" in log or "ENOTDIR" in log


def test_redaction_tombstone_keeps_chain(tmp_path):
    node_write(tmp_path, [ev({"mail": "From asha@example.com: my phone is 98xxxxxx " + "p" * 300}, seq=i) for i in range(3)])
    f = diary_file(tmp_path)
    anc = anchors(str(tmp_path))[str(f)]
    size = f.stat().st_size
    redact(str(f), 2)
    assert f.stat().st_size == size
    assert verify(str(f), anc)["ok"]
    line2 = f.read_text().split("\n")[1]
    assert "asha" not in line2 and '"tomb":{"body_sha256":' in line2
    with pytest.raises(ValueError, match="too short"):
        w = ChainWriter(str(tmp_path / "short.jsonl")); w.append({"a": 1}); w.close()
        redact(str(tmp_path / "short.jsonl"), 1)


def test_python_change_log_same_format(tmp_path):
    w = ChainWriter(str(tmp_path / "changes.jsonl"))
    for i in range(5):
        w.append({"who": "librarian", "action": "commit", "payload": {"x": 1.5e-7, "i": i, "s": "\ud800"}})
    w.close()
    assert verify(str(tmp_path / "changes.jsonl"))["ok"]
    r = subprocess.run(["python3", os.path.join(FILES, "bk_chain.py"), "verify-dir", str(tmp_path)], capture_output=True, text=True)
    assert r.returncode == 0 and "OK" in r.stdout
