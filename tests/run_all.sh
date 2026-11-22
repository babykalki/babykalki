#!/usr/bin/env bash
# BabyKalki v0.7 — run every automated test. Needs: python3 (3.10+), node (22+), rclone (v1.76.0 recommended).
# Optional: run as root (e.g. inside a throwaway container) to also test the two-user separation.
# Usage: bash tests/run_all.sh            (from the folder you unzipped the files into)
set -uo pipefail
cd "$(dirname "$0")/.."
V=.venv-tests
if [ ! -x "$V/bin/python" ]; then
  python3 -m venv "$V" && "$V/bin/pip" install -q "ladybug==0.22.3" "mcp==2.3.0" pytest || { echo "could not install test deps"; exit 2; }
fi
command -v node >/dev/null || echo "WARNING: node not found — diary tests will fail"
command -v rclone >/dev/null || [ -n "${BK_TEST_RCLONE:-}" ] || echo "WARNING: rclone not found — backup/supervisor tests will be skipped"
PYTHONDONTWRITEBYTECODE=1 "$V/bin/python" -m pytest -q tests "$@"
