"""v0.5: no data to DeepSeek. dsh's session telemetry is forced OFF in its env (and in the image) unless the founder
sets BK_ALLOW_TELEMETRY=1; the status page says so. The live supervisor check is in test_supervisor.py (life cycle)."""
import os
from conftest import FILES
import bk_supervisor as S
import bk_status


def sup(monkeypatch, env, tmp_path):
    monkeypatch.setattr(S, "E", env); monkeypatch.setattr(S, "D", str(tmp_path))
    s = S.Supervisor.__new__(S.Supervisor)
    s.tokens, s.hashes_file, s.desk_token = {"warden": "w" * 40}, "/run/bk/secret-hashes", "d" * 40
    return s


def test_dsh_env_forces_telemetry_off_even_if_the_founder_sets_it(monkeypatch, tmp_path):
    env = sup(monkeypatch, {"PATH": "/usr/bin", "DSH_TELEMETRY_MODE": "FEEDBACK_ONLY",
                            "DSH_TELEMETRY_OTLP_URL": "https://collector.example.com/v1/logs"}, tmp_path).dsh_env()
    assert env["DSH_TELEMETRY_MODE"] == "DISABLED"
    assert env["DSH_TELEMETRY_OTLP_URL"] == "http://127.0.0.1:9/"          # the exact sink verified on rc.3 (TELEMETRY-OFF.md)
    assert env["DSH_TELEMETRY_DISABLED"] == "1"


def test_bk_allow_telemetry_1_is_the_only_way_back_on(monkeypatch, tmp_path):
    env = sup(monkeypatch, {"PATH": "/usr/bin", "BK_ALLOW_TELEMETRY": "1", "DSH_TELEMETRY_MODE": "FEEDBACK_ONLY"}, tmp_path).dsh_env()
    assert env["DSH_TELEMETRY_MODE"] == "FEEDBACK_ONLY" and "DSH_TELEMETRY_OTLP_URL" not in env
    for v in ("0", "yes", "true", ""):
        assert S.telemetry_env({"BK_ALLOW_TELEMETRY": v})["DSH_TELEMETRY_MODE"] == "DISABLED"


def test_image_and_docs_ship_telemetry_off():
    docker = open(os.path.join(FILES, "Dockerfile")).read()
    assert "DSH_TELEMETRY_MODE=DISABLED" in docker and "DSH_TELEMETRY_OTLP_URL=http://127.0.0.1:9/" in docker
    assert "# 0) Privacy: nothing goes back to DeepSeek" in open(os.path.join(FILES, "cordis.patch.yml")).read()
    envx = next(p for p in (os.path.join(FILES, "env.example"), os.path.join(FILES, ".env.example")) if os.path.exists(p))
    assert "DSH_TELEMETRY_MODE=DISABLED" in open(envx).read()          # (in the zip it is .env.example)
    tpl = open(os.path.join(FILES, "site", "status-template.html")).read()
    page, vals = bk_status.render(tpl, {"telemetry": "OFF", "system_state": "RUNNING"})
    assert vals["telemetry"] == "OFF" and "Telemetry to DeepSeek (dsh)</td><td>OFF" in page
    assert bk_status.clean({"telemetry": "anything else"})["telemetry"] == "—"
