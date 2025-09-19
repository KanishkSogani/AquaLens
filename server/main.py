import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import router

# Heavy Metal Pollution Index (HMPI) Analysis API
# Analyzes water quality data and calculates pollution indices
app = FastAPI(
    title="Heavy Metal Pollution Index (HMPI) API",
    description="Upload CSV files with heavy metal concentration data to calculate HMPI values and pollution classifications",
    version="2.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Register API routes
app.include_router(router)

@app.get("/")
def root():
    """Health check endpoint and API overview"""
    return {
        "message": "HMPI Analysis Server is running",
        "version": "2.0.0",
        "features": {
            "hmpi_calculation": "Enhanced with 15 heavy metals",
            "database_storage": "SQLite with location tracking",
            "mapbox_integration": "City-based HMPI lookups",
            "batch_processing": "Multiple sample analysis"
        },
        "endpoints": {
            "upload_csv": "/upload-csv/ (POST) - Upload and save dataset from CSV",
            "manual_dataset": "/datasets/manual (POST) - Create dataset manually",
            "list_datasets": "/datasets (GET) - Get all saved datasets",
            "generate_report": "/datasets/{id}/report (GET) - Generate report",
            "download_csv": "/datasets/{id}/download (GET) - Download enhanced CSV",
            "delete_dataset": "/datasets/{id} (DELETE) - Delete dataset",
            "city_lookup": "/city/{city_name} (GET)",
            "city_geocoding": "/geocode/{city_name} (GET)",
            "all_cities": "/cities/all (GET)",
            "nearby_search": "/cities/nearby/{city_name} (GET)",
            "compare_cities": "/compare/{city1}/{city2} (GET)",
            "database_stats": "/database/stats (GET) - Enhanced with city pollution levels",
            "docs": "/docs",
            "health": "/"
        },
        "workflow": {
            "option_1": "Upload CSV: POST /upload-csv",
            "option_2": "Manual entry: POST /datasets/manual",
            "step_2": "List saved datasets: GET /datasets", 
            "step_3": "Generate report: GET /datasets/{id}/report",
            "step_4": "Download CSV: GET /datasets/{id}/download",
            "step_5": "View enhanced stats: GET /database/stats",
            "step_6": "Analyze cities: GET /city/{name} or /compare/{city1}/{city2}"
        }
    }
