from pathlib import Path
from typing import List, Dict, Any, Tuple
import pandas as pd
from app.services.ingestion.normalizer import create_normalized_row


def _load_dataframe(file_path: Path) -> pd.DataFrame:
    suffix = file_path.suffix.lower()
    if suffix in [".xlsx", ".xls"]:
        try:
            return pd.read_excel(file_path)
        except Exception:
            # Fallback in case file is actually CSV or CSV named .xlsx
            return pd.read_csv(file_path)
    return pd.read_csv(file_path)


def _find_column(columns: List[str], variants: List[str]) -> List[str]:
    matches = []
    col_map = {c.strip().lower(): c for c in columns}
    for var in variants:
        for c_lower, c_orig in col_map.items():
            if var == c_lower or var in c_lower:
                if c_orig not in matches:
                    matches.append(c_orig)
    return matches


def _clean_scalar(val: Any) -> str:
    s = str(val).strip()
    if s.endswith(".0"):
        s = s[:-2]
    return s


def parse_telecom(file_path: Path) -> Tuple[List[Dict[str, Any]], int]:
    """Parse CDR / IPDR CSV or XLSX.
    Emits normalized rows for each phone, IMEI, IMSI, and IP address discovered.
    """
    df = _load_dataframe(file_path)
    row_count = len(df)
    if row_count == 0:
        return [], 0

    cols = list(df.columns)
    phone_cols = _find_column(cols, ["caller_number", "calling_number", "called_number", "dialled_number", "phone", "msisdn", "mobile", "a_party", "b_party"])
    imei_cols = _find_column(cols, ["imei", "imei_number", "device_imei"])
    imsi_cols = _find_column(cols, ["imsi", "imsi_number"])
    ip_cols = _find_column(cols, ["ip_address", "ip", "source_ip", "dest_ip", "client_ip", "ip_addr"])
    time_cols = _find_column(cols, ["timestamp", "call_time", "datetime", "date_time", "time", "call_date", "start_time"])
    tower_cols = _find_column(cols, ["tower_id", "cell_id", "tower", "cell", "location", "site_id"])

    normalized_rows = []
    records = df.to_dict(orient="records")

    for row_idx, row in enumerate(records):
        raw_extra = {str(k): (None if pd.isna(v) else v) for k, v in row.items()}
        
        # Extract timestamp
        row_time = None
        for tc in time_cols:
            val = row.get(tc)
            if pd.notna(val) and str(val).strip():
                row_time = str(val).strip()
                break

        # Extract tower/location into extra
        for tw in tower_cols:
            val = row.get(tw)
            if pd.notna(val) and str(val).strip():
                raw_extra["tower_id"] = str(val).strip()
                break

        # Phone numbers
        for pc in phone_cols:
            val = row.get(pc)
            if pd.notna(val):
                clean_val = _clean_scalar(val)
                if clean_val and clean_val.lower() not in ["nan", "none", "null"]:
                    normalized_rows.append(create_normalized_row("phone", clean_val, row_time, raw_extra, row_index=row_idx))

        # IMEI
        for ic in imei_cols:
            val = row.get(ic)
            if pd.notna(val):
                clean_val = _clean_scalar(val)
                if clean_val and clean_val.lower() not in ["nan", "none", "null"]:
                    normalized_rows.append(create_normalized_row("imei", clean_val, row_time, raw_extra, row_index=row_idx))

        # IMSI
        for im in imsi_cols:
            val = row.get(im)
            if pd.notna(val):
                clean_val = _clean_scalar(val)
                if clean_val and clean_val.lower() not in ["nan", "none", "null"]:
                    normalized_rows.append(create_normalized_row("imsi", clean_val, row_time, raw_extra, row_index=row_idx))

        # IP
        for ipc in ip_cols:
            val = row.get(ipc)
            if pd.notna(val):
                clean_val = str(val).strip()
                if clean_val and clean_val.lower() not in ["nan", "none", "null"]:
                    normalized_rows.append(create_normalized_row("ip_address", clean_val, row_time, raw_extra, row_index=row_idx))

    return normalized_rows, row_count
