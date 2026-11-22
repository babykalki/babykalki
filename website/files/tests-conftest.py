import os, sys

_here = os.path.dirname(os.path.abspath(__file__))
# Works in the source tree (tests/ next to files/) and in the zip (v0.4: files at the zip root, tests/ next to them).
FILES = os.path.abspath(os.path.join(_here, "..", "files"))
if not os.path.exists(os.path.join(FILES, "library_svc.py")):
    FILES = os.path.abspath(os.path.join(_here, ".."))
sys.path.insert(0, FILES)
os.environ.setdefault("PYTHONDONTWRITEBYTECODE", "1")
