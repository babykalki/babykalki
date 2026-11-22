# BabyKalki — one container: dsh (citizens) + Library + backups + cloudflared + public status page.
# v1.0 (20 Nov 2026: unchanged since v0.7). v0.7 (20 Nov 2026: + the private dashboard — bk_dash.py and dash/, see below). v0.6 (20 Nov: + the optional public website — put it in site/www/, see README
# "Your public website"; no new build steps, site/ was already copied) BUILT on Nimbuz 20 Nov 2026 (serves the guide). v0.5 (19 Nov: + users `bkcomm` (community desk) and
# `bklib` (Librarian round), five new files, telemetry OFF) BUILT on Nimbuz 19–20 Nov 2026 (staging + a live instance). v0.4 BUILT and RUN on Nimbuz on 18 and 19 Nov 2026 (build
# ≈ 4.5–5 min; every checksum below passed) with real dsh 0.2.2-rc.3, MinIO standing in for Cloudflare R2, and on
# 19 Nov a real Z.ai key (six citizens answered). Every version and checksum below was read on 17 Nov 2026.
# Nimbuz builds from a zip ONLY when this Dockerfile is at the TOP of the zip (no folder around it).

# node:24-bookworm-slim, multi-arch index digest read from Docker Hub on 17 Nov 2026 (image created 2026-11-11).
# dsh needs node >=24.9.0 (npm engines). To update: docker buildx imagetools inspect node:24-bookworm-slim
FROM node:24-bookworm-slim@sha256:dc26ae92c9fb15cf6b1d63e20f0944b2efe0f115b20e00be48fb23fceb061c54

# Pinned versions (comments cannot follow a value on the same line in a Dockerfile):
#   dsh 0.2.2-rc.3 = newest release candidate on npm (dist-tag "next", 13 Nov 2026; "latest" is still 0.2.2-rc.1).
#     It brings its own @deepseek-ai/dsh-mcp-client 0.2.2-rc.3 — never `npm i @deepseek-ai/dsh-mcp-client` on its own:
#     that package's "latest" tag is a stale 0.0.1-rc.1.
#   cloudflared 2026.11.1, rclone v1.76.0 (6 Nov 2026), github-mcp-server v2.2.0 (github/github-mcp-server, official, 16 Nov 2026)
#   ladybug 0.22.3 (LadybugDB, PyPI) and mcp 2.3.0 (Model Context Protocol Python SDK) for the Library service.
ARG DSH_VERSION=0.2.2-rc.3
ARG CLOUDFLARED_VERSION=2026.11.1
ARG CLOUDFLARED_SHA256_AMD64=97bb3b02d23a5980fc9c15a1a270e692da1923f103f920d5b16d4931d5ab55e7
ARG CLOUDFLARED_SHA256_ARM64=b155cec3e48e489cfb8e5c602769fb8c771083018d8881d68b4d18a791567c5a
ARG RCLONE_VERSION=1.76.0
ARG RCLONE_SHA256_AMD64=b00f00b3266c3764413afe599d3ec316f6f43b3e0ea8a0bc1d186d2133e46df7
ARG RCLONE_SHA256_ARM64=ee169016675e23a69d77240565133ff7dbc9b33d16fa8f7053d4af39f1eaeb78
ARG GHMCP_VERSION=2.2.0
ARG GHMCP_SHA256_AMD64=157c5664b273e5070126d414f88cbab765630acde588f75dafdf9998c2235c51
ARG GHMCP_SHA256_ARM64=d21e4fca8603b59d99380f1c332aaea36d73033d52b389867adf2124ee150983
ARG LADYBUG_VERSION=0.22.3
ARG MCP_VERSION=2.3.0
ARG TARGETARCH=amd64

# Debian packages are NOT pinned by version on purpose: bookworm drops old versions when security fixes land, so a
# pinned build would break within weeks. The base image digest above fixes everything else. (For a byte-for-byte
# reproducible build, point apt at snapshot.debian.org for a fixed date.)
# tini = a real PID 1. python3 = supervisor, backups, status page. No rclone from apt (bookworm's 1.60 is too old for R2).
RUN apt-get update && apt-get install -y --no-install-recommends \
      tini python3 python3-venv ca-certificates curl unzip git jq procps hostname \
 && rm -rf /var/lib/apt/lists/*

# Downloads are checked against the SHA-256 published by each project; the build stops on any mismatch.
RUN set -e; case "${TARGETARCH}" in \
      amd64) CF=${CLOUDFLARED_SHA256_AMD64}; RC=${RCLONE_SHA256_AMD64}; GH=${GHMCP_SHA256_AMD64}; GA=x86_64 ;; \
      arm64) CF=${CLOUDFLARED_SHA256_ARM64}; RC=${RCLONE_SHA256_ARM64}; GH=${GHMCP_SHA256_ARM64}; GA=arm64 ;; \
      *) echo "unsupported arch ${TARGETARCH}"; exit 1 ;; esac; \
    cd /tmp; \
    curl -fsSL -o cloudflared "https://github.com/cloudflare/cloudflared/releases/download/${CLOUDFLARED_VERSION}/cloudflared-linux-${TARGETARCH}"; \
    echo "${CF}  cloudflared" | sha256sum -c -; install -m 0755 cloudflared /usr/local/bin/cloudflared; \
    curl -fsSL -o rclone.zip "https://github.com/rclone/rclone/releases/download/v${RCLONE_VERSION}/rclone-v${RCLONE_VERSION}-linux-${TARGETARCH}.zip"; \
    echo "${RC}  rclone.zip" | sha256sum -c -; unzip -q rclone.zip; install -m 0755 rclone-v${RCLONE_VERSION}-linux-${TARGETARCH}/rclone /usr/local/bin/rclone; \
    curl -fsSL -o ghmcp.tgz "https://github.com/github/github-mcp-server/releases/download/v${GHMCP_VERSION}/github-mcp-server_Linux_${GA}.tar.gz"; \
    echo "${GH}  ghmcp.tgz" | sha256sum -c -; tar -xzf ghmcp.tgz github-mcp-server; install -m 0755 github-mcp-server /usr/local/bin/; \
    rm -rf /tmp/*; cloudflared --version; rclone version | head -1

# dsh, pinned. Installed at build time (no slow npx resolution at boot).
RUN NODE_OPTIONS=--max-old-space-size=4096 npm install -g "@deepseek-ai/dsh@${DSH_VERSION}" \
 && npm cache clean --force && dsh --version

# The Library service (sole writer of library.lbug) in its own venv. Top-level packages pinned; their dependencies are
# resolved by pip at build time (a fully hash-locked requirements file is a v1.0 item).
RUN python3 -m venv /opt/library \
 && /opt/library/bin/pip install --no-cache-dir "ladybug==${LADYBUG_VERSION}" "mcp==${MCP_VERSION}"

# Two users: `node` (uid 1000, from the base image) runs dsh and the citizens; `bkinfra` runs the Library, status page,
# static server, cloudflared and the login helper. The agents' user cannot read bkinfra's process environment or write
# its folders. /opt/bk is root-owned and read-only for both.
# v0.5: a third user, `bkcomm`, runs ONLY the Telegram community desk (bk_telegram.py, stdlib Python): it holds the bot
# token and its own LLM key, and can read neither the citizens' nor the infra's files or process environments.
# v0.5: a fourth user, `bklib`, runs ONLY the Librarian round (headless dsh, every 10 min): the one process holding the
# Librarian's full Library token, so the citizens' web dsh (user node) can neither commit nor read that token.
RUN useradd --system --uid 10001 --no-create-home --shell /usr/sbin/nologin bkinfra \
 && useradd --system --uid 10002 --no-create-home --shell /usr/sbin/nologin bkcomm \
 && useradd --system --uid 10003 --no-create-home --shell /usr/sbin/nologin bklib
COPY --chown=root:root bk_supervisor.py bk_backup.py bk_static.py bk_status.py bk_secrets.py bk_chain.py \
     secret-patterns.json library_svc.py library-schema.cypher babykalki-diary.mjs cordis.patch.yml AGENTS.md \
     connections-register.yml bk_telegram.py community-kb.md bk_presets.py cordis.librarian.yml cordis.citizens.tpl.yml \
     bk_dash.py /opt/bk/
COPY --chown=root:root citizens/ /opt/bk/citizens/
# v0.7: the private dashboard — the dsh browser plugin template (dash/bk-dashboard/) and the founder's slash commands
# (dash/skills/). bk_supervisor.py fills the plugin in at every start into /run/bk/dash/ and copies the skills to $DSH_HOME/skills/.
COPY --chown=root:root dash/ /opt/bk/dash/
# site/ = the status page template and (v0.6, optional) site/www/ = your public website. If site/www/index.html exists,
# bk_static.py serves site/www/ at / and moves the status page to /status/. Read-only like everything in /opt/bk.
COPY --chown=root:root site/ /opt/bk/site/
RUN chmod -R a-w,a+rX /opt/bk && mkdir -p /data /run/bk

# All state lives under /data. On Nimbuz, application storage is EPHEMERAL (verified 18 Nov: a restart or a new build
# starts with an empty /data; only Nimbuz "Tools" get disks). The supervisor restores /data from the newest COMPLETE
# off-site snapshot at every start, and refuses to start the citizens if it cannot. Rolling restarts run the old and the
# new copy side by side for ~20 s; the boot lease (bk_backup.py) makes the new copy wait for the old one's final snapshot.
# v0.5: no data to DeepSeek — dsh's session telemetry (default FEEDBACK_ONLY) is OFF in the image, and bk_supervisor.py
# forces it off again in dsh's env (also pointing the OTLP URLs at a dead local port) unless BK_ALLOW_TELEMETRY=1.
ENV DSH_HOME=/data/dsh HOME=/data/home BK_DATA=/data BK_LIBRARY_PYTHON=/opt/library/bin/python BK_SHIP=/opt/bk \
    DSH_TELEMETRY_MODE=DISABLED DSH_TELEMETRY_OTLP_URL=http://127.0.0.1:9/ DSH_TELEMETRY_DISABLED=1

# The supervisor starts as root ONLY to hand each process its own user. Nimbuz ALLOWS root (verified 18 Nov):
# BK_SEPARATE_USERS=auto turned separation on, and the agents' user (uid 1000) could not see infra secrets, read infra
# processes' /proc/<pid>/environ or write the protected folders. If another host forbids root, set BK_SEPARATE_USERS=0:
# everything then runs as one user and /data/run/supervisor-state.json records "user_separation": false. (v0.2 said the
# status page shows this; it does not — corrected in v0.3.)
USER root
WORKDIR /data
# 8080 = public status page + /health for Nimbuz (verified: Nimbuz routes its public URL and health check to 8080, and
# the page is up before anything else, so a rolling restart can never deadlock). dsh listens on 127.0.0.1:3080 ONLY; the
# Library on 127.0.0.1:7801/7802; the login helper on 127.0.0.1:8081. Nothing but 8080 is exposed; the tunnel is
# outbound (cloudflared over QUIC works from Nimbuz). On SIGTERM Nimbuz allows ≈30 s before it kills the container: the
# supervisor stops dsh, writes the final snapshot (BK_FINAL_TIMEOUT 8 s) and releases the lease inside that.
EXPOSE 8080
ENTRYPOINT ["/usr/bin/tini", "--", "python3", "/opt/bk/bk_supervisor.py"]
