from __future__ import annotations

from pathlib import Path


ROOT_API_DIR = Path(__file__).resolve().parents[2] / "api"

# Make `uvicorn api.main:app` work when launched from inside `ml/` by
# redirecting this package to the real top-level API source directory.
__path__ = [str(ROOT_API_DIR)]
