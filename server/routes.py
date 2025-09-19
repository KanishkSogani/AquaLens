from fastapi import APIRouter, File, UploadFile, HTTPException, Query
from fastapi.responses import StreamingResponse
import pandas as pd
import numpy as np
import base64
from io import StringIO
from services import process_csv_data, get_summary_stats
from database import db

router = APIRouter()

def clean_for_json(data):
    """Clean data to ensure JSON serialization compatibility"""
    if isinstance(data, dict):
        return {k: clean_for_json(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [clean_for_json(item) for item in data]
    elif pd.isna(data) or (isinstance(data, float) and not np.isfinite(data)):
        return None
    else:
        return data

@router.post("/upload-csv")
async def upload_csv(
    file: UploadFile = File(...),
    dataset_name: str = Query(..., description="Name for this dataset"),
    description: str = Query("", description="Optional description for the dataset")
):
    """Upload CSV file and save as named dataset (no immediate download)"""
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files allowed")
    
    # Validate dataset name
    if not dataset_name.strip():
        raise HTTPException(status_code=400, detail="Dataset name is required")
    
    try:
        content = await file.read()
        df = pd.read_csv(StringIO(content.decode('utf-8')))
        
        # Process the CSV data (add HMPI calculations)
        processed_df = process_csv_data(df)
        
        # Save as named dataset
        dataset_id = db.save_dataset(processed_df, dataset_name.strip(), file.filename, description.strip())
        
        # Generate summary stats
        summary_stats = get_summary_stats(processed_df)
        
        return {
            "message": "Dataset uploaded and processed successfully",
            "dataset_id": dataset_id,
            "dataset_name": dataset_name,
            "description": description if description.strip() else "No description provided",
            "original_filename": file.filename,
            "total_samples": len(processed_df),
            "summary": clean_for_json(summary_stats)
        }
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing CSV: {str(e)}")

@router.get("/datasets")
async def get_datasets():
    """Get list of all saved datasets"""
    datasets = db.get_all_datasets()
    return {"datasets": clean_for_json(datasets)}

@router.get("/datasets/{dataset_id}/report")
async def generate_dataset_report(dataset_id: int):
    """Generate comprehensive report for a specific dataset"""
    report = db.get_dataset_report(dataset_id)
    
    if not report:
        raise HTTPException(status_code=404, detail=f"Dataset with ID {dataset_id} not found")
    
    # Remove the raw CSV from response to avoid large payload
    response_data = {
        "dataset_info": report["dataset_info"],
        "statistics": report["statistics"],
        "samples": report["samples"][:20],  # Limit samples in response for performance
        "total_samples_shown": min(20, len(report["samples"])),
        "total_samples": len(report["samples"]),
        "download_url": f"/datasets/{dataset_id}/download"
    }
    
    return clean_for_json(response_data)

@router.get("/datasets/{dataset_id}/download")
async def download_dataset_csv(dataset_id: int):
    """Download enhanced CSV file for a specific dataset"""
    report = db.get_dataset_report(dataset_id)
    
    if not report:
        raise HTTPException(status_code=404, detail=f"Dataset with ID {dataset_id} not found")
    
    # Create CSV response
    csv_content = report["enhanced_csv"]
    filename = report["download_filename"]
    
    # Return CSV as streaming response
    return StreamingResponse(
        StringIO(csv_content),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.delete("/datasets/{dataset_id}")
async def delete_dataset(dataset_id: int):
    """Delete a specific dataset"""
    success = db.delete_dataset(dataset_id)
    
    if success:
        return {"message": f"Dataset {dataset_id} deleted successfully"}
    else:
        raise HTTPException(status_code=404, detail=f"Dataset with ID {dataset_id} not found")

@router.get("/city/{city_name}")
async def get_city_hmpi(city_name: str):
    """Get HMPI data for a specific city"""
    city_data = db.get_city_data(city_name)
    
    if not city_data:
        raise HTTPException(status_code=404, detail=f"City '{city_name}' not found")
    
    return clean_for_json(city_data)

@router.get("/geocode/{city_name}")
async def geocode_city(city_name: str):
    """Get coordinates for a city using geocoding"""
    lat, lon, address = db.get_city_coordinates(city_name)
    
    if lat is None:
        raise HTTPException(status_code=404, detail=f"Could not find coordinates for '{city_name}'")
    
    return {
        "city": city_name,
        "latitude": lat,
        "longitude": lon,
        "address": address
    }

@router.get("/cities/all")
async def get_all_cities():
    """Get all cities with HMPI data"""
    cities_data = {"cities": db.get_all_cities()}
    return clean_for_json(cities_data)

@router.get("/cities/nearby/{city_name}")
async def get_nearby_cities_route(
    city_name: str,
    radius: int = Query(50, description="Search radius in kilometers", ge=5, le=200)
):
    """Find cities with water quality data near the specified city"""
    nearby_data = db.get_nearby_cities(city_name, radius)
    
    if not nearby_data:
        raise HTTPException(status_code=404, detail=f"City '{city_name}' not found")
    
    return clean_for_json(nearby_data)

@router.get("/compare/{city1}/{city2}")
async def compare_cities_route(city1: str, city2: str):
    """Compare water quality between two cities"""
    comparison_data = db.compare_cities(city1, city2)
    
    if "error" in comparison_data:
        raise HTTPException(status_code=404, detail=comparison_data["error"])
    
    return clean_for_json(comparison_data)

@router.get("/cities/nearby")
async def get_nearby_cities(
    latitude: float = Query(..., description="Latitude coordinate"),
    longitude: float = Query(..., description="Longitude coordinate"),
    radius: float = Query(0.1, description="Search radius in degrees")
):
    """Find cities with HMPI data within radius"""
    import sqlite3
    
    with sqlite3.connect(db.db_path) as conn:
        cursor = conn.execute("""
            SELECT c.name, c.state, c.latitude, c.longitude,
                   cs.latest_hmpi, cs.latest_classification, cs.total_samples
            FROM cities c
            INNER JOIN city_summary cs ON c.id = cs.city_id
            WHERE ABS(c.latitude - ?) <= ? AND ABS(c.longitude - ?) <= ?
            AND cs.latest_hmpi IS NOT NULL
            ORDER BY ABS(c.latitude - ?) + ABS(c.longitude - ?) ASC
            LIMIT 10
        """, (latitude, radius, longitude, radius, latitude, longitude))
        
        results = [
            {
                "city": row[0],
                "state": row[1],
                "latitude": row[2],
                "longitude": row[3],
                "hmpi": row[4],
                "classification": row[5],
                "samples": row[6]
            }
            for row in cursor.fetchall()
        ]
    
    return clean_for_json({
        "search_center": {"latitude": latitude, "longitude": longitude},
        "radius": radius,
        "cities": results
    })

@router.get("/database/stats")
async def get_database_stats():
    """Get database statistics"""
    stats_data = db.get_stats()
    return clean_for_json(stats_data)
