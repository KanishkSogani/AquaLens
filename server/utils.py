import pandas as pd
import numpy as np

# Import the standards from services to keep them in sync
from services import STANDARDS

def validate_csv(df):
    """
    Comprehensive validation of CSV file for HMPI analysis.
    Checks for required columns, data quality, and provides helpful feedback.
    Returns list of issues if found.
    """

    issues = []

    # Normalize column names to Title Case for consistency
    df.columns = df.columns.str.title()

    # Check for basic structure
    if df.empty:
        issues.append("CSV file is empty")
        return issues

    if len(df.columns) < 3:
        issues.append("CSV file must have at least 3 columns (coordinates + metal data)")

    # Required geographic columns
    required_geo = ["Latitude", "Longitude"]
    missing_geo = [col for col in required_geo if col not in df.columns]
    if missing_geo:
        issues.append(f"Missing geographic columns: {', '.join(missing_geo)}")

    # Validate geographic data if present
    for geo_col in required_geo:
        if geo_col in df.columns:
            # Check if numeric
            try:
                pd.to_numeric(df[geo_col], errors='coerce')
            except:
                issues.append(f"{geo_col} contains non-numeric values")
            
            # Check reasonable ranges
            if geo_col == "Latitude":
                invalid_lat = df[df[geo_col].notna() & ((df[geo_col] < -90) | (df[geo_col] > 90))]
                if not invalid_lat.empty:
                    issues.append(f"Invalid latitude values (must be between -90 and 90)")
            
            if geo_col == "Longitude":
                invalid_lon = df[df[geo_col].notna() & ((df[geo_col] < -180) | (df[geo_col] > 180))]
                if not invalid_lon.empty:
                    issues.append(f"Invalid longitude values (must be between -180 and 180)")

    # Check for heavy metal columns
    available_metals = [metal for metal in STANDARDS.keys() if metal in df.columns]
    
    if not available_metals:
        metal_names = ", ".join(list(STANDARDS.keys())[:8]) + "..."  # Show first 8
        issues.append(f"No heavy metal columns found. Supported metals: {metal_names}")
    else:
        # Validate metal data quality
        for metal in available_metals:
            col_data = df[metal]
            
            # Check for non-numeric values
            numeric_data = pd.to_numeric(col_data, errors='coerce')
            non_numeric_count = numeric_data.isna().sum() - col_data.isna().sum()
            if non_numeric_count > 0:
                issues.append(f"{metal}: {non_numeric_count} non-numeric values found")
            
            # Check for negative values
            if (numeric_data < 0).any():
                negative_count = (numeric_data < 0).sum()
                issues.append(f"{metal}: {negative_count} negative values found (concentrations must be ≥ 0)")
            
            # Check for extremely high values (likely errors)
            max_reasonable = STANDARDS[metal] * 1000  # 1000x the standard is suspicious
            if (numeric_data > max_reasonable).any():
                high_count = (numeric_data > max_reasonable).sum()
                issues.append(f"{metal}: {high_count} suspiciously high values (>{max_reasonable:.3f} mg/L)")
            
            # Check if all values are zero
            non_zero_count = (numeric_data > 0).sum()
            if non_zero_count == 0:
                issues.append(f"{metal}: All values are zero or missing")

    # Check sample ID if present
    if "Sampleid" in df.columns:
        duplicate_ids = df["Sampleid"].duplicated().sum()
        if duplicate_ids > 0:
            issues.append(f"Found {duplicate_ids} duplicate sample IDs")

    # General data quality checks
    if df.isnull().values.any():
        null_count = df.isnull().sum().sum()
        issues.append(f"Dataset contains {null_count} missing values")

    return issues


def get_data_info(df):
    """
    Provide helpful information about the uploaded dataset.
    """
    df.columns = df.columns.str.title()
    
    info = {
        "total_rows": len(df),
        "total_columns": len(df.columns),
        "columns": df.columns.tolist(),
        "available_metals": [metal for metal in STANDARDS.keys() if metal in df.columns],
        "missing_metals": [metal for metal in STANDARDS.keys() if metal not in df.columns],
        "has_coordinates": all(col in df.columns for col in ["Latitude", "Longitude"]),
        "sample_preview": df.head(3).to_dict('records') if len(df) > 0 else []
    }
    
    return info
