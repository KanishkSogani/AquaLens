import sqlite3
import json
import pandas as pd
from datetime import datetime
from typing import Optional, Dict, List
from geopy.geocoders import Nominatim

class WaterQualityDB:
    """Simple SQLite database for water quality data"""
    
    def __init__(self, db_path="water_quality.db"):
        self.db_path = db_path
        self.geocoder = Nominatim(user_agent="water_quality_app")
        self.setup_database()
    
    def setup_database(self):
        """Create required tables"""
        with sqlite3.connect(self.db_path, timeout=30.0) as conn:
            # Enable WAL mode for better concurrent access
            conn.execute("PRAGMA journal_mode=WAL")
            conn.execute("PRAGMA synchronous=NORMAL")
            conn.execute("PRAGMA cache_size=10000")
            conn.execute("PRAGMA temp_store=memory")
            
            conn.execute("""
                CREATE TABLE IF NOT EXISTS cities (
                    id INTEGER PRIMARY KEY,
                    name TEXT NOT NULL,
                    state TEXT,
                    country TEXT,
                    latitude REAL NOT NULL,
                    longitude REAL NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            conn.execute("""
                CREATE TABLE IF NOT EXISTS samples (
                    id INTEGER PRIMARY KEY,
                    sample_id TEXT,
                    city_id INTEGER,
                    latitude REAL NOT NULL,
                    longitude REAL NOT NULL,
                    hmpi_value REAL,
                    classification TEXT,
                    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (city_id) REFERENCES cities (id)
                )
            """)
            
            conn.execute("""
                CREATE TABLE IF NOT EXISTS city_summary (
                    city_id INTEGER PRIMARY KEY,
                    latest_hmpi REAL,
                    latest_classification TEXT,
                    total_samples INTEGER,
                    last_updated TIMESTAMP,
                    FOREIGN KEY (city_id) REFERENCES cities (id)
                )
            """)
            
            conn.execute("""
                CREATE TABLE IF NOT EXISTS datasets (
                    id INTEGER PRIMARY KEY,
                    name TEXT NOT NULL UNIQUE,
                    description TEXT,
                    original_filename TEXT,
                    total_samples INTEGER,
                    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    enhanced_csv_data TEXT,
                    metadata TEXT
                )
            """)
            
            conn.execute("""
                CREATE TABLE IF NOT EXISTS dataset_samples (
                    id INTEGER PRIMARY KEY,
                    dataset_id INTEGER,
                    sample_id TEXT,
                    city_id INTEGER,
                    latitude REAL NOT NULL,
                    longitude REAL NOT NULL,
                    hmpi_value REAL,
                    classification TEXT,
                    raw_data TEXT,
                    FOREIGN KEY (dataset_id) REFERENCES datasets (id),
                    FOREIGN KEY (city_id) REFERENCES cities (id)
                )
            """)
    
    def get_city_coordinates(self, city_name):
        """Get coordinates for a city using geocoding"""
        try:
            location = self.geocoder.geocode(city_name, timeout=10)
            if location:
                return location.latitude, location.longitude, location.address
        except:
            pass
        return None, None, None
    
    def find_or_create_city(self, lat, lon):
        """Find existing city or create new one"""
        with sqlite3.connect(self.db_path) as conn:
            # Check if city exists nearby (within 0.05 degrees)
            cursor = conn.execute("""
                SELECT id FROM cities 
                WHERE ABS(latitude - ?) < 0.05 AND ABS(longitude - ?) < 0.05
                LIMIT 1
            """, (lat, lon))
            
            result = cursor.fetchone()
            if result:
                return result[0]
            
            # Create new city using reverse geocoding
            try:
                location = self.geocoder.reverse(f"{lat}, {lon}", timeout=10)
                if location and location.address:
                    address = location.raw.get('address', {})
                    city = address.get('city') or address.get('town') or 'Unknown City'
                    state = address.get('state', 'Unknown State')
                    country = address.get('country', 'Unknown Country')
                else:
                    city, state, country = 'Unknown City', 'Unknown State', 'Unknown Country'
            except:
                city, state, country = 'Unknown City', 'Unknown State', 'Unknown Country'
            
            cursor = conn.execute("""
                INSERT INTO cities (name, state, country, latitude, longitude)
                VALUES (?, ?, ?, ?, ?)
            """, (city, state, country, lat, lon))
            
            return cursor.lastrowid
    
    def save_samples(self, df, filename):
        """Save sample data to database"""
        batch_id = f"batch_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        # Use timeout and check for existing data to prevent locks
        try:
            with sqlite3.connect(self.db_path, timeout=30.0) as conn:
                conn.execute("BEGIN IMMEDIATE")  # Get exclusive lock immediately
                
                for _, row in df.iterrows():
                    # Find or create city within the same transaction
                    lat, lon = row['Latitude'], row['Longitude']
                    
                    # Check if city exists nearby (within 0.05 degrees)
                    cursor = conn.execute("""
                        SELECT id FROM cities 
                        WHERE ABS(latitude - ?) < 0.05 AND ABS(longitude - ?) < 0.05
                        LIMIT 1
                    """, (lat, lon))
                    
                    result = cursor.fetchone()
                    if result:
                        city_id = result[0]
                    else:
                        # Create new city - use provided City name (required)
                        if pd.notna(row['City']) and row['City'].strip():
                            # Use provided city name
                            city = str(row['City']).strip()
                            state = 'Unknown State'  # Can be enhanced later
                            country = 'Unknown Country'  # Can be enhanced later
                            print(f"Creating new city entry: {city}")
                        else:
                            raise ValueError(f"City name is required but empty/missing for sample at {lat}, {lon}")
                        
                        cursor = conn.execute("""
                            INSERT INTO cities (name, state, country, latitude, longitude)
                            VALUES (?, ?, ?, ?, ?)
                        """, (city, state, country, lat, lon))
                        city_id = cursor.lastrowid
                    
                    # Insert sample
                    conn.execute("""
                        INSERT INTO samples (sample_id, city_id, latitude, longitude, 
                                           hmpi_value, classification)
                        VALUES (?, ?, ?, ?, ?, ?)
                    """, (
                        row.get('Sampleid', f"S_{datetime.now().strftime('%Y%m%d_%H%M%S')}"),
                        city_id,
                        row['Latitude'],
                        row['Longitude'],
                        row.get('HMPI'),
                        row.get('Classification')
                    ))
                
                conn.commit()
            
            # Update summaries in separate connection
            self.update_city_summaries()
            return batch_id
            
        except sqlite3.OperationalError as e:
            if "locked" in str(e).lower():
                raise Exception("Database is currently busy. Please try again in a moment.")
            else:
                raise Exception(f"Database error: {str(e)}")
        except Exception as e:
            raise Exception(f"Error saving data: {str(e)}")
    
    def update_city_summaries(self):
        """Update city summary data"""
        try:
            with sqlite3.connect(self.db_path, timeout=30.0) as conn:
                conn.execute("BEGIN IMMEDIATE")
                
                conn.execute("DELETE FROM city_summary")
                
                conn.execute("""
                    INSERT INTO city_summary (city_id, latest_hmpi, latest_classification, 
                                            total_samples, last_updated)
                    SELECT 
                        s.city_id,
                        s.hmpi_value,
                        s.classification,
                        COUNT(*),
                        MAX(s.upload_date)
                    FROM samples s
                    WHERE s.hmpi_value IS NOT NULL
                    GROUP BY s.city_id
                """)
                
                conn.commit()
        except sqlite3.OperationalError as e:
            if "locked" not in str(e).lower():
                raise e
            # If locked, skip summary update for now
    
    def get_city_data(self, city_name):
        """Get comprehensive HMPI data for a city"""
        with sqlite3.connect(self.db_path) as conn:
            # Get city info and all samples
            cursor = conn.execute("""
                SELECT c.id, c.name, c.state, c.country, c.latitude, c.longitude
                FROM cities c
                WHERE LOWER(c.name) LIKE LOWER(?)
                LIMIT 1
            """, (f"%{city_name}%",))
            
            city_result = cursor.fetchone()
            
            if city_result:
                city_id, name, state, country, city_lat, city_lon = city_result
                
                # Get all samples for this city
                cursor = conn.execute("""
                    SELECT latitude, longitude, hmpi_value, classification, upload_date
                    FROM samples 
                    WHERE city_id = ? AND hmpi_value IS NOT NULL
                    ORDER BY upload_date DESC
                """, (city_id,))
                
                samples = cursor.fetchall()
                
                if samples:
                    # Calculate comprehensive statistics
                    hmpi_values = [s[2] for s in samples]
                    classifications = [s[3] for s in samples]
                    
                    # Classification counts
                    class_counts = {}
                    for classification in classifications:
                        class_counts[classification] = class_counts.get(classification, 0) + 1
                    
                    return {
                        "city": name,
                        "state": state,
                        "country": country,
                        "city_center": {"latitude": city_lat, "longitude": city_lon},
                        "has_data": True,
                        "statistics": {
                            "total_samples": len(samples),
                            "latest_hmpi": hmpi_values[0],
                            "latest_classification": classifications[0],
                            "hmpi_range": {
                                "min": min(hmpi_values),
                                "max": max(hmpi_values),
                                "average": round(sum(hmpi_values) / len(hmpi_values), 2)
                            },
                            "pollution_distribution": class_counts
                        },
                        "sample_locations": [
                            {
                                "latitude": s[0],
                                "longitude": s[1], 
                                "hmpi": s[2],
                                "classification": s[3],
                                "date": s[4]
                            } for s in samples[:10]  # Limit to latest 10 for performance
                        ],
                        "all_samples_count": len(samples)
                    }
                else:
                    return {
                        "city": name,
                        "state": state,
                        "country": country,
                        "city_center": {"latitude": city_lat, "longitude": city_lon},
                        "has_data": False,
                        "message": f"No water quality data available for {name}",
                        "source": "database"
                    }
        
        # Try geocoding if not in database
        lat, lon, address = self.get_city_coordinates(city_name)
        if lat and lon:
            return {
                "city": city_name,
                "latitude": lat,
                "longitude": lon,
                "address": address,
                "has_data": False,
                "message": f"Location found for {city_name}, but no water quality data available",
                "source": "geocoding"
            }
        
        return None
    
    def get_nearby_cities(self, city_name, radius_km=50):
        """Get cities within radius of target city"""
        # First get the target city coordinates
        target_city = self.get_city_data(city_name)
        if not target_city or not target_city.get('city_center'):
            return None
        
        target_lat = target_city['city_center']['latitude']
        target_lon = target_city['city_center']['longitude']
        
        # Convert km to degrees (approximate)
        radius_deg = radius_km / 111  # 1 degree ≈ 111 km
        
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute("""
                SELECT DISTINCT c.name, c.state, c.latitude, c.longitude,
                       COUNT(s.id) as sample_count,
                       AVG(s.hmpi_value) as avg_hmpi,
                       MAX(s.hmpi_value) as max_hmpi,
                       MIN(s.hmpi_value) as min_hmpi,
                       (ABS(c.latitude - ?) + ABS(c.longitude - ?)) * 111 as distance_km
                FROM cities c
                INNER JOIN samples s ON c.id = s.city_id
                WHERE ABS(c.latitude - ?) <= ? 
                AND ABS(c.longitude - ?) <= ?
                AND s.hmpi_value IS NOT NULL
                AND LOWER(c.name) != LOWER(?)
                GROUP BY c.id, c.name, c.state, c.latitude, c.longitude
                ORDER BY distance_km ASC
                LIMIT 10
            """, (target_lat, target_lon, target_lat, radius_deg, target_lon, radius_deg, city_name))
            
            nearby_cities = []
            for row in cursor.fetchall():
                name, state, lat, lon, samples, avg_hmpi, max_hmpi, min_hmpi, distance = row
                
                # Determine overall pollution level based on average
                if avg_hmpi < 100:
                    avg_classification = "Low Pollution"
                elif avg_hmpi < 200:
                    avg_classification = "Moderate Pollution"
                elif avg_hmpi < 300:
                    avg_classification = "High Pollution"
                else:
                    avg_classification = "Very High Pollution"
                
                nearby_cities.append({
                    "city": name,
                    "state": state,
                    "coordinates": {"latitude": lat, "longitude": lon},
                    "distance_km": round(distance, 1),
                    "water_quality": {
                        "sample_count": samples,
                        "average_hmpi": round(avg_hmpi, 2),
                        "hmpi_range": {"min": min_hmpi, "max": max_hmpi},
                        "average_classification": avg_classification
                    }
                })
            
            return {
                "target_city": target_city['city'],
                "search_radius_km": radius_km,
                "found_cities": len(nearby_cities),
                "nearby_cities": nearby_cities
            }

    def compare_cities(self, city1_name, city2_name):
        """Compare water quality between two cities"""
        city1_data = self.get_city_data(city1_name)
        city2_data = self.get_city_data(city2_name)
        
        if not city1_data or not city1_data.get('has_data'):
            return {"error": f"No data available for {city1_name}"}
        
        if not city2_data or not city2_data.get('has_data'):
            return {"error": f"No data available for {city2_name}"}
        
        city1_stats = city1_data['statistics']
        city2_stats = city2_data['statistics']
        
        # Determine which city is cleaner
        city1_avg = city1_stats['hmpi_range']['average']
        city2_avg = city2_stats['hmpi_range']['average']
        
        if city1_avg < city2_avg:
            cleaner_city = city1_data['city']
            pollution_difference = round(city2_avg - city1_avg, 2)
        elif city2_avg < city1_avg:
            cleaner_city = city2_data['city']
            pollution_difference = round(city1_avg - city2_avg, 2)
        else:
            cleaner_city = "Both cities have similar pollution levels"
            pollution_difference = 0
        
        return {
            "comparison": {
                "city1": {
                    "name": city1_data['city'],
                    "state": city1_data['state'],
                    "total_samples": city1_stats['total_samples'],
                    "average_hmpi": city1_stats['hmpi_range']['average'],
                    "hmpi_range": city1_stats['hmpi_range'],
                    "latest_classification": city1_stats['latest_classification'],
                    "pollution_distribution": city1_stats['pollution_distribution']
                },
                "city2": {
                    "name": city2_data['city'],
                    "state": city2_data['state'],
                    "total_samples": city2_stats['total_samples'],
                    "average_hmpi": city2_stats['hmpi_range']['average'],
                    "hmpi_range": city2_stats['hmpi_range'],
                    "latest_classification": city2_stats['latest_classification'],
                    "pollution_distribution": city2_stats['pollution_distribution']
                }
            },
            "analysis": {
                "cleaner_city": cleaner_city,
                "pollution_difference": pollution_difference,
                "difference_explanation": f"{cleaner_city} has {pollution_difference} points lower average HMPI" if pollution_difference > 0 else "Both cities have similar pollution levels"
            }
        }

    def get_all_cities(self):
        """Get all cities with HMPI data"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute("""
                SELECT c.name, c.state, c.latitude, c.longitude,
                       cs.latest_hmpi, cs.latest_classification, cs.total_samples
                FROM cities c
                INNER JOIN city_summary cs ON c.id = cs.city_id
                WHERE cs.latest_hmpi IS NOT NULL
                ORDER BY cs.latest_hmpi DESC
            """)
            
            return [
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
    
    def save_dataset(self, df, dataset_name, original_filename, description=""):
        """Save dataset with enhanced CSV data"""
        import json
        
        # Generate enhanced CSV content
        from io import StringIO
        csv_buffer = StringIO()
        df.to_csv(csv_buffer, index=False)
        enhanced_csv_content = csv_buffer.getvalue()
        
        # Prepare metadata
        metadata = {
            "columns": df.columns.tolist(),
            "metals_analyzed": [col for col in df.columns if col in ['Lead', 'Cadmium', 'Arsenic', 'Mercury', 'Chromium', 'Nickel', 'Copper', 'Zinc', 'Iron', 'Manganese']],
            "cities_count": df['City'].nunique() if 'City' in df.columns else 0,
            "pollution_distribution": df['Classification'].value_counts().to_dict() if 'Classification' in df.columns else {}
        }
        
        try:
            with sqlite3.connect(self.db_path, timeout=30.0) as conn:
                # Insert dataset record
                cursor = conn.execute("""
                    INSERT INTO datasets (name, description, original_filename, total_samples, enhanced_csv_data, metadata)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (
                    dataset_name,
                    description,
                    original_filename,
                    len(df),
                    enhanced_csv_content,
                    json.dumps(metadata)
                ))
                
                dataset_id = cursor.lastrowid
                
                # Save individual samples linked to dataset
                for _, row in df.iterrows():
                    lat, lon = row['Latitude'], row['Longitude']
                    
                    # Find or create city (reuse existing logic)
                    city_cursor = conn.execute("""
                        SELECT id FROM cities 
                        WHERE ABS(latitude - ?) < 0.05 AND ABS(longitude - ?) < 0.05
                        LIMIT 1
                    """, (lat, lon))
                    
                    city_result = city_cursor.fetchone()
                    if city_result:
                        city_id = city_result[0]
                    else:
                        # Create new city using provided City name
                        if pd.notna(row['City']) and row['City'].strip():
                            city = str(row['City']).strip()
                            state = 'Unknown State'
                            country = 'Unknown Country'
                        else:
                            raise ValueError(f"City name is required but empty/missing for sample at {lat}, {lon}")
                        
                        city_cursor = conn.execute("""
                            INSERT INTO cities (name, state, country, latitude, longitude)
                            VALUES (?, ?, ?, ?, ?)
                        """, (city, state, country, lat, lon))
                        city_id = city_cursor.lastrowid
                    
                    # Store sample data
                    raw_sample_data = row.to_dict()
                    conn.execute("""
                        INSERT INTO dataset_samples (dataset_id, sample_id, city_id, latitude, longitude, 
                                                   hmpi_value, classification, raw_data)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        dataset_id,
                        row.get('Sampleid', f"S_{datetime.now().strftime('%Y%m%d_%H%M%S')}"),
                        city_id,
                        lat, lon,
                        row.get('HMPI'),
                        row.get('Classification'),
                        json.dumps(raw_sample_data)
                    ))
                
                # Update city summaries
                self.update_city_summaries()
                
                return dataset_id
                
        except Exception as e:
            raise Exception(f"Error saving dataset: {str(e)}")

    def get_all_datasets(self):
        """Get list of all saved datasets"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute("""
                SELECT id, name, description, original_filename, total_samples, 
                       upload_date, metadata
                FROM datasets
                ORDER BY upload_date DESC
            """)
            
            datasets = []
            for row in cursor.fetchall():
                dataset_id, name, description, filename, samples, upload_date, metadata_str = row
                
                try:
                    metadata = json.loads(metadata_str) if metadata_str else {}
                except:
                    metadata = {}
                
                datasets.append({
                    "id": dataset_id,
                    "name": name,
                    "description": description,
                    "original_filename": filename,
                    "total_samples": samples,
                    "upload_date": upload_date,
                    "metadata": metadata
                })
            
            return datasets

    def get_dataset_report(self, dataset_id):
        """Generate comprehensive report for a specific dataset"""
        with sqlite3.connect(self.db_path) as conn:
            # Get dataset info
            cursor = conn.execute("""
                SELECT name, description, original_filename, total_samples, 
                       upload_date, enhanced_csv_data, metadata
                FROM datasets
                WHERE id = ?
            """, (dataset_id,))
            
            dataset_info = cursor.fetchone()
            if not dataset_info:
                return None
            
            name, description, filename, total_samples, upload_date, csv_data, metadata_str = dataset_info
            
            try:
                metadata = json.loads(metadata_str) if metadata_str else {}
            except:
                metadata = {}
            
            # Get samples with city information
            cursor = conn.execute("""
                SELECT ds.sample_id, ds.latitude, ds.longitude, ds.hmpi_value, 
                       ds.classification, c.name as city_name, c.state, ds.raw_data
                FROM dataset_samples ds
                JOIN cities c ON ds.city_id = c.id
                WHERE ds.dataset_id = ?
                ORDER BY ds.hmpi_value DESC
            """, (dataset_id,))
            
            samples = []
            for row in cursor.fetchall():
                sample_id, lat, lon, hmpi, classification, city, state, raw_data_str = row
                
                try:
                    raw_data = json.loads(raw_data_str) if raw_data_str else {}
                except:
                    raw_data = {}
                
                samples.append({
                    "sample_id": sample_id,
                    "city": city,
                    "state": state,
                    "coordinates": {"latitude": lat, "longitude": lon},
                    "hmpi": hmpi,
                    "classification": classification,
                    "raw_data": raw_data
                })
            
            # Calculate statistics
            hmpi_values = [s["hmpi"] for s in samples if s["hmpi"] is not None]
            
            statistics = {}
            if hmpi_values:
                statistics = {
                    "hmpi_range": {
                        "min": min(hmpi_values),
                        "max": max(hmpi_values),
                        "average": round(sum(hmpi_values) / len(hmpi_values), 2),
                        "median": sorted(hmpi_values)[len(hmpi_values)//2]
                    },
                    "pollution_distribution": metadata.get("pollution_distribution", {}),
                    "cities_analyzed": metadata.get("cities_count", 0),
                    "metals_analyzed": metadata.get("metals_analyzed", [])
                }
            
            return {
                "dataset_info": {
                    "id": dataset_id,
                    "name": name,
                    "description": description,
                    "original_filename": filename,
                    "total_samples": total_samples,
                    "upload_date": upload_date
                },
                "statistics": statistics,
                "samples": samples,
                "enhanced_csv": csv_data,
                "download_filename": f"report_{name.replace(' ', '_')}.csv"
            }

    def delete_dataset(self, dataset_id):
        """Delete a dataset and its samples"""
        with sqlite3.connect(self.db_path, timeout=30.0) as conn:
            conn.execute("DELETE FROM dataset_samples WHERE dataset_id = ?", (dataset_id,))
            conn.execute("DELETE FROM datasets WHERE id = ?", (dataset_id,))
            conn.commit()
            return True

    def get_stats(self):
        """Get database statistics"""
        with sqlite3.connect(self.db_path) as conn:
            cities = conn.execute("SELECT COUNT(*) FROM cities").fetchone()[0]
            # Count from dataset_samples table instead of samples table
            samples = conn.execute("SELECT COUNT(*) FROM dataset_samples").fetchone()[0]
            # Count cities that have data in dataset_samples
            cities_with_data = conn.execute("""
                SELECT COUNT(DISTINCT city_id) FROM dataset_samples 
                WHERE hmpi_value IS NOT NULL
            """).fetchone()[0]
            datasets = conn.execute("SELECT COUNT(*) FROM datasets").fetchone()[0]
            
            # Get pollution distribution from dataset_samples
            pollution_dist_result = conn.execute("""
                SELECT classification, COUNT(*) as count 
                FROM dataset_samples 
                WHERE classification IS NOT NULL 
                GROUP BY classification
            """).fetchall()
            
            pollution_distribution = {}
            for row in pollution_dist_result:
                pollution_distribution[row[0]] = row[1]
            
            return {
                "total_cities": cities,
                "total_samples": samples,
                "cities_with_data": cities_with_data,
                "total_datasets": datasets,
                "pollution_distribution": pollution_distribution
            }

# Global database instance
db = WaterQualityDB()