"""v0.4 (dry-run erratum B6): the private dashboard's hostname is BK_AGENT_HOST, default agent.<BK_DOMAIN>.
Pure functions of bk_supervisor — no rclone, no processes."""
import bk_supervisor as S


def test_default_is_agent_dot_domain():
    assert S.agent_host({"BK_DOMAIN": "example.com"}) == "agent.example.com"


def test_override_wins_and_is_normalised():
    env = {"BK_DOMAIN": "example.com", "BK_AGENT_HOST": "agent-bk.example.com"}
    assert S.agent_host(env) == "agent-bk.example.com"
    assert S.agent_host({"BK_AGENT_HOST": " https://bk-private.example.org/ "}) == "bk-private.example.org"
    assert S.agent_host({"BK_AGENT_HOST": "", "BK_DOMAIN": "example.com"}) == "agent.example.com"


def test_nothing_set_means_no_host():
    assert S.agent_host({}) == ""
    assert S.agent_host({"BK_DOMAIN": "  "}) == ""


def test_dsh_argv_uses_the_agent_host():
    a = S.dsh_default_argv({"BK_DOMAIN": "example.com", "BK_AGENT_HOST": "agent-bk.example.com"})
    assert a[:6] == ["dsh", "--profile", "web", "--no-open", "--port", "3080"]
    assert a[a.index("--public-url") + 1] == "https://agent-bk.example.com/"
    assert a[a.index("--trusted-host") + 1] == "agent-bk.example.com"
    assert "agent.example.com" not in " ".join(a)
    d = S.dsh_default_argv({"BK_DOMAIN": "example.com"})
    assert d[d.index("--trusted-host") + 1] == "agent.example.com"
    assert "--public-url" not in S.dsh_default_argv({})


def test_local_run_wins_and_never_doubles_flags():
    a = S.dsh_default_argv({"BK_LOCAL": "1", "BK_DOMAIN": "example.com"}, local_ip="172.17.0.2")
    assert a.count("--public-url") == 1 and a.count("--trusted-host") == 1
    assert a[a.index("--public-url") + 1] == "http://localhost:3080/" and a[a.index("--host") + 1] == "172.17.0.2"


def test_login_message_names_the_right_place():
    assert S.login_where("/run/bk/secret/dsh-login.url", {"BK_AGENT_HOST": "agent-bk.example.com"}) == \
        "https://agent-bk.example.com/bk-login"
    assert S.login_where("/x", {"BK_DOMAIN": "example.com"}) == "https://agent.example.com/bk-login"
    assert S.login_where("/x", {"BK_LOCAL": "1"}).endswith("(local run)")
    msg = S.login_where("/x", {})                  # e.g. on Nimbuz before a domain is set: NOT "(local run)"
    assert "local run" not in msg and "BK_AGENT_HOST" in msg
