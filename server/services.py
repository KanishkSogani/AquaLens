import pandas as pd
import numpy as np

# WHO/EPA water quality standards (mg/L)
STANDARDS = {
    "Lead": 0.01, "Cadmium": 0.003, "Arsenic": 0.01, "Mercury": 0.001, 
    "Chromium": 0.05, "Nickel": 0.07, "Copper": 2.0, "Zinc": 3.0,
    "Iron": 0.3, "Manganese": 0.4, "Aluminum": 0.2, "Antimony": 0.02,
    "Selenium": 0.04, "Uranium": 0.03, "Thallium": 0.001
}

def process_csv_data(df):
    """Process CSV data and calculate HMPI"""
    # Validate required columns
    required_columns = ['Latitude', 'Longitude', 'City']
    missing_columns = [col for col in required_columns if col not in df.columns]
    
    if missing_columns:
        raise ValueError(f"CSV must contain the following required columns: {missing_columns}")
    
    # Check if any metal columns are present
    available_metals = [metal for metal in STANDARDS.keys() if metal in df.columns]
    if not available_metals:
        raise ValueError(f"CSV must contain at least one heavy metal column. Expected columns: {list(STANDARDS.keys())}")
    
    print(f"Found {len(available_metals)} metal columns: {available_metals}")
    print("City column found - using provided city names")
    
    # Calculate HMPI
    df = calculate_hmpi(df)
    
    return df

def clean_metal_data(df):
    """Clean and validate metal concentration data"""
    for metal in STANDARDS.keys():
        if metal in df.columns:
            # Convert to numeric, coercing errors to NaN
            df[metal] = pd.to_numeric(df[metal], errors='coerce')
            # Remove negative values and infinite values
            df[metal] = df[metal].where((df[metal] >= 0) & np.isfinite(df[metal]))
    return df

def calculate_hmpi(df):
    """Calculate HMPI using Prasad & Bose formula"""
    df = clean_metal_data(df)
    hmpi_values = []
    classifications = []
    
    for _, row in df.iterrows():
        total_weighted = 0
        total_weights = 0
        
        # Calculate for each available metal
        for metal, standard in STANDARDS.items():
            if metal in df.columns and pd.notna(row[metal]) and row[metal] > 0:
                concentration = float(row[metal])
                # Ensure concentration is a valid number
                if not np.isfinite(concentration):
                    continue
                    
                sub_index = (concentration / standard) * 100
                weight = 1 / standard
                
                # Check if calculations are valid
                if np.isfinite(sub_index) and np.isfinite(weight):
                    total_weighted += sub_index * weight
                    total_weights += weight
        
        # Calculate HMPI
        if total_weights > 0:
            hmpi = total_weighted / total_weights
            # Ensure HMPI is a valid number
            if not np.isfinite(hmpi):
                hmpi = None
                classification = "No Data"
            else:
                # Classify pollution level
                if hmpi < 100:
                    classification = "Low Pollution"
                elif hmpi < 200:
                    classification = "Moderate Pollution"
                elif hmpi < 300:
                    classification = "High Pollution"
                else:
                    classification = "Very High Pollution"
        else:
            hmpi = None
            classification = "No Data"
        
        # Safely append values, ensuring no NaN
        if hmpi is not None and np.isfinite(hmpi):
            hmpi_values.append(round(float(hmpi), 2))
        else:
            hmpi_values.append(None)
        classifications.append(classification)
    
    df["HMPI"] = hmpi_values
    df["Classification"] = classifications
    return df

def get_summary_stats(df):
    """Generate summary statistics for the analysis"""
    # Filter for valid HMPI data (not None and not NaN)
    valid_data = df[df['HMPI'].notna() & df['HMPI'].apply(lambda x: x is not None)]
    
    if len(valid_data) == 0:
        return {"error": "No valid HMPI data"}
    
    # Count by classification
    class_counts = df['Classification'].value_counts().to_dict()
    
    # Available metals
    available_metals = [metal for metal in STANDARDS.keys() if metal in df.columns]
    
    # Ensure all numeric values are finite
    hmpi_values = valid_data['HMPI'].values
    hmpi_min = float(np.min(hmpi_values)) if len(hmpi_values) > 0 else 0
    hmpi_max = float(np.max(hmpi_values)) if len(hmpi_values) > 0 else 0
    hmpi_median = float(np.median(hmpi_values)) if len(hmpi_values) > 0 else 0
    
    return {
        "total_samples": len(df),
        "valid_samples": len(valid_data),
        "hmpi_range": {
            "min": hmpi_min,
            "max": hmpi_max,
            "median": hmpi_median
        },
        "pollution_counts": {
            "low": class_counts.get("Low Pollution", 0),
            "moderate": class_counts.get("Moderate Pollution", 0),
            "high": class_counts.get("High Pollution", 0),
            "very_high": class_counts.get("Very High Pollution", 0)
        },
        "metals_tested": available_metals,
        "metals_count": len(available_metals)
    }
