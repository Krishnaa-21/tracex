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
            return pd.read_csv(file_path, comment="#")
    return pd.read_csv(file_path, comment="#")


def _clean_scalar(val: Any) -> str:
    s = str(val).strip()
    if s.endswith(".0"):
        s = s[:-2]
    return s


def _find_column(columns: List[str], variants: List[str]) -> List[str]:
    matches = []
    col_map = {c.strip().lower(): c for c in columns}
    for var in variants:
        for c_lower, c_orig in col_map.items():
            if var == c_lower or var in c_lower:
                if c_orig not in matches:
                    matches.append(c_orig)
    return matches


def parse_bank_upi(file_path: Path) -> Tuple[List[Dict[str, Any]], int]:
    """Parse bank and UPI settlement CSV or XLSX.
    Emits normalized rows for each bank account and UPI handle found,
    storing amount and IFSC code in extra.
    """
    df = _load_dataframe(file_path)
    row_count = len(df)
    if row_count == 0:
        return [], 0

    cols = list(df.columns)
    acc_cols = _find_column(cols, ["account_number", "account_no", "acc_number", "acc_no", "account", "bank_account", "beneficiary_account", "remitter_account"])
    ifsc_cols = _find_column(cols, ["ifsc_code", "ifsc", "branch_ifsc"])
    upi_cols = _find_column(cols, ["upi_handle", "upi_id", "vpa", "beneficiary_vpa", "remitter_vpa", "upi"])
    amt_cols = _find_column(cols, ["amount", "txn_amount", "transaction_amount", "transfer_amount"])
    time_cols = _find_column(cols, ["transaction_time", "txn_time", "timestamp", "date", "txn_date", "transaction_date", "time"])

    normalized_rows = []
    records = df.to_dict(orient="records")

    for row_idx, row in enumerate(records):
        raw_extra = {str(k): (None if pd.isna(v) else v) for k, v in row.items()}

        row_time = None
        for tc in time_cols:
            val = row.get(tc)
            if pd.notna(val) and str(val).strip():
                row_time = str(val).strip()
                break

        ifsc_val = None
        for ic in ifsc_cols:
            val = row.get(ic)
            if pd.notna(val) and str(val).strip():
                ifsc_val = str(val).strip()
                break

        amount_val = None
        for ac in amt_cols:
            val = row.get(ac)
            if pd.notna(val):
                try:
                    amount_val = float(val)
                except (ValueError, TypeError):
                    amount_val = str(val).strip()
                break

        if ifsc_val is not None:
            raw_extra["ifsc_code"] = ifsc_val
        if amount_val is not None:
            raw_extra["amount"] = amount_val

        # Account numbers
        for ac_col in acc_cols:
            val = row.get(ac_col)
            if pd.notna(val):
                clean_val = _clean_scalar(val)
                if clean_val and clean_val.lower() not in ["nan", "none", "null"]:
                    normalized_rows.append(create_normalized_row("account", clean_val, row_time, raw_extra, row_index=row_idx))

        # UPI Handles
        for uc_col in upi_cols:
            val = row.get(uc_col)
            if pd.notna(val):
                clean_val = str(val).strip()
                if clean_val and "@" in clean_val and clean_val.lower() not in ["nan", "none", "null"]:
                    normalized_rows.append(create_normalized_row("upi_handle", clean_val, row_time, raw_extra, row_index=row_idx))

    return normalized_rows, row_count
