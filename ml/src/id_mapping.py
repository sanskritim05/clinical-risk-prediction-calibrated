# ml/src/id_mapping.py
from __future__ import annotations

from pathlib import Path
import pandas as pd


ID_COLS = [
    "admission_type_id",
    "discharge_disposition_id",
    "admission_source_id",
]


def build_id_maps_from_raw_text(path: Path) -> dict:
    """
    Parse IDS_mapping.csv which is structured in blocks like:

        admission_type_id,description
        1,Emergency
        ...
        ,
        discharge_disposition_id,description
        ...

    Returns:
        {
            "admission_type_id": {1: "Emergency", ...},
            "discharge_disposition_id": {...},
            "admission_source_id": {...}
        }
    """
    maps: dict[str, dict[int, str]] = {}
    current_key: str | None = None

    lines = path.read_text(encoding="utf-8", errors="ignore").splitlines()

    for line in lines:
        line = line.strip()

        # Skip blank or separator rows
        if not line or line == ",":
            current_key = None
            continue

        # Detect block header like "admission_type_id,description"
        if line.endswith(",description"):
            key = line.split(",")[0].strip()
            if key in ID_COLS:
                current_key = key
                maps[current_key] = {}
            else:
                current_key = None
            continue

        # If we're not inside a recognized block, skip
        if current_key is None:
            continue

        # Parse data line like "1,Emergency"
        parts = line.split(",", 1)
        if len(parts) != 2:
            continue

        raw_id = parts[0].strip()
        desc = parts[1].strip().strip('"')

        if raw_id == "" or desc == "":
            continue

        try:
            idx = int(float(raw_id))
        except Exception:
            continue

        maps[current_key][idx] = desc

    # Remove empty mappings
    maps = {k: v for k, v in maps.items() if v}
    return maps


def apply_id_maps(df: pd.DataFrame, maps: dict) -> pd.DataFrame:
    """
    Replace numeric ID columns with human-readable labels.
    Unknown values become "Unknown" or "Unknown_<id>".
    """
    out = df.copy()

    for col, mp in maps.items():
        if col not in out.columns:
            continue

        series = pd.to_numeric(out[col], errors="coerce")

        out[col] = series.map(
            lambda x: mp.get(int(x), f"Unknown_{int(x)}") if pd.notna(x) else "Unknown"
        )

    return out