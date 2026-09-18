import os
import shutil
from pathlib import Path
from typing import BinaryIO, Union

# Base upload directory pointing to backend/uploads
UPLOADS_DIR = Path(__file__).resolve().parent.parent.parent / "uploads"


def get_case_upload_dir(case_id: Union[int, str]) -> Path:
    """Ensure and return the upload directory for a specific case."""
    case_dir = UPLOADS_DIR / str(case_id)
    case_dir.mkdir(parents=True, exist_ok=True)
    return case_dir


def save_upload_file(case_id: Union[int, str], filename: str, file_obj: Union[BinaryIO, bytes]) -> Path:
    """Save an uploaded file to backend/uploads/{case_id}/{filename} securely."""
    case_dir = get_case_upload_dir(case_id)
    # Sanitize filename to prevent directory traversal attacks (e.g. ../../evil.exe)
    safe_name = Path(filename).name.strip() or "uploaded_evidence"
    destination = case_dir / safe_name

    if isinstance(file_obj, bytes):
        with open(destination, "wb") as f:
            f.write(file_obj)
    else:
        with open(destination, "wb") as f:
            shutil.copyfileobj(file_obj, f)

    return destination
