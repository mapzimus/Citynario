"""Stable content identifiers used by runs and traces."""

import hashlib
import json
from typing import Any


def content_id(prefix: str, value: Any) -> str:
    serialized = json.dumps(value, sort_keys=True, separators=(",", ":"), default=str)
    digest = hashlib.sha256(serialized.encode("utf-8")).hexdigest()[:16]
    return f"{prefix}_{digest}"
