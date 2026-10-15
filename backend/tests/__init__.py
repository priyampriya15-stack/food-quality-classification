"""Backend test package.

Bootstraps Python sys.path so tests can execute seamlessly from either the project root
or the backend/ subfolder.
"""

import sys
from pathlib import Path

# Ensure project root (containing 'backend') is in sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))
