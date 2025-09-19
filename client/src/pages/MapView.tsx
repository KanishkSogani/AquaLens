import Navigation from "@/components/Navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Map, Filter, Layers, Download, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import "mapbox-gl/dist/mapbox-gl.css";

const MapView = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const isInitializedRef = useRef(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Water HMPI sample data points - static data doesn't need useMemo
  const waterHMPIData = [
    {
      coordinates: [-74.006, 40.7128] as [number, number],
      title: "Hudson River - NYC",
      hmpiValue: 3.2,
      riskLevel: "High",
      lastUpdated: "2024-09-15",
      waterBody: "Hudson River",
      searchTerms: ["new york", "nyc", "hudson", "manhattan"],
    },
    {
      coordinates: [-118.2437, 34.0522] as [number, number],
      title: "Santa Monica Bay",
      hmpiValue: 2.1,
      riskLevel: "Moderate",
      lastUpdated: "2024-09-16",
      waterBody: "Pacific Ocean",
      searchTerms: ["los angeles", "la", "santa monica", "california"],
    },
    {
      coordinates: [-87.6298, 41.8781] as [number, number],
      title: "Lake Michigan - Chicago",
      hmpiValue: 1.8,
      riskLevel: "Low",
      lastUpdated: "2024-09-17",
      waterBody: "Lake Michigan",
      searchTerms: ["chicago", "illinois", "lake michigan", "chi"],
    },
    {
      coordinates: [-95.3698, 29.7604] as [number, number],
      title: "Galveston Bay",
      hmpiValue: 4.1,
      riskLevel: "Critical",
      lastUpdated: "2024-09-14",
      waterBody: "Gulf of Mexico",
      searchTerms: ["houston", "galveston", "texas", "gulf"],
    },
    {
      coordinates: [-75.1652, 39.9526] as [number, number],
      title: "Delaware River",
      hmpiValue: 2.8,
      riskLevel: "Moderate",
      lastUpdated: "2024-09-16",
      waterBody: "Delaware River",
      searchTerms: ["philadelphia", "philly", "delaware", "pennsylvania"],
    },
    {
      coordinates: [-122.4194, 37.7749] as [number, number],
      title: "San Francisco Bay",
      hmpiValue: 2.3,
      riskLevel: "Moderate",
      lastUpdated: "2024-09-17",
      waterBody: "San Francisco Bay",
      searchTerms: ["san francisco", "sf", "bay area", "california"],
    },
    {
      coordinates: [-80.1918, 25.7617] as [number, number],
      title: "Biscayne Bay - Miami",
      hmpiValue: 3.7,
      riskLevel: "High",
      lastUpdated: "2024-09-15",
      waterBody: "Atlantic Ocean",
      searchTerms: ["miami", "florida", "biscayne", "south beach"],
    },
    {
      coordinates: [-71.0589, 42.3601] as [number, number],
      title: "Boston Harbor",
      hmpiValue: 1.9,
      riskLevel: "Low",
      lastUpdated: "2024-09-17",
      waterBody: "Atlantic Ocean",
      searchTerms: ["boston", "massachusetts", "harbor", "cape cod"],
    },
  ];

  // Helper function to get marker color based on HMPI risk level
  const getMarkerColor = (riskLevel: string) => {
    switch (riskLevel) {
      case "Low":
        return "#22c55e";
      case "Moderate":
        return "#f59e0b";
      case "High":
        return "#ef4444";
      case "Critical":
        return "#7c2d12";
      default:
        return "#6b7280";
    }
  };

  // Search functionality
  const handleSearch = () => {
    if (!searchQuery.trim() || !map.current) return;

    const query = searchQuery.toLowerCase().trim();
    const foundLocation = waterHMPIData.find(
      (location) =>
        location.searchTerms.some((term) => term.includes(query)) ||
        location.title.toLowerCase().includes(query) ||
        location.waterBody.toLowerCase().includes(query)
    );

    if (foundLocation) {
      // Close any open popups first
      markersRef.current.forEach((marker) => {
        if (marker.getPopup().isOpen()) {
          marker.getPopup().remove();
        }
      });

      map.current.flyTo({
        center: foundLocation.coordinates,
        zoom: 12,
        duration: 1500,
      });

      // Find and open the popup for this location after a small delay
      setTimeout(() => {
        const marker = markersRef.current.find((m) => {
          const lngLat = m.getLngLat();
          return (
            Math.abs(lngLat.lng - foundLocation.coordinates[0]) < 0.001 &&
            Math.abs(lngLat.lat - foundLocation.coordinates[1]) < 0.001
          );
        });

        if (marker) {
          marker.togglePopup();
        }
      }, 1600);
    } else {
      alert(
        `Location "${searchQuery}" not found. Try searching for: New York, Los Angeles, Chicago, Houston, Philadelphia, San Francisco, Miami, or Boston`
      );
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    if (map.current) {
      map.current.flyTo({
        center: [-98.5795, 39.8283],
        zoom: 4,
        duration: 1500,
      });
      // Close all popups
      markersRef.current.forEach((marker) => {
        if (marker.getPopup().isOpen()) {
          marker.togglePopup();
        }
      });
    }
  };

  // Initialize map only once
  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      if (!mapContainer.current || isInitializedRef.current || !isMounted)
        return;

      try {
        const mapboxgl = await import("mapbox-gl");
        mapboxgl.default.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

        map.current = new mapboxgl.default.Map({
          container: mapContainer.current,
          style: "mapbox://styles/mapbox/light-v11",
          center: [-98.5795, 39.8283],
          zoom: 4,
          pitch: 0,
          bearing: 0,
          antialias: true,
        });

        map.current.addControl(
          new mapboxgl.default.NavigationControl(),
          "top-right"
        );

        // Wait for map to fully load before adding markers
        map.current.on("load", () => {
          if (isMounted && map.current) {
            // Add markers after a short delay to ensure map is fully rendered
            setTimeout(() => {
              addMarkers(mapboxgl);
              isInitializedRef.current = true;
            }, 100);
          }
        });

        // Also add markers when style loads (backup)
        map.current.on("styledata", () => {
          if (isMounted && map.current && !isInitializedRef.current) {
            setTimeout(() => {
              addMarkers(mapboxgl);
              isInitializedRef.current = true;
            }, 100);
          }
        });
      } catch (error) {
        console.error("Error initializing map:", error);
      }
    };

    // Function to add markers to the map
    const addMarkers = (mapboxgl: any) => {
      if (!map.current) return;

      // Clear existing markers
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];

      // Add new markers
      waterHMPIData.forEach((point) => {
        const popup = new mapboxgl.default.Popup({
          offset: 25,
          closeButton: true,
          closeOnClick: false,
        }).setHTML(
          `<div class="p-3 min-w-[200px]">
            <h3 class="font-semibold text-sm mb-2">${point.title}</h3>
            <div class="space-y-1">
              <p class="text-xs"><span class="font-medium">HMPI Value:</span> ${
                point.hmpiValue
              }</p>
              <p class="text-xs"><span class="font-medium">Risk Level:</span> 
                <span class="px-2 py-1 rounded text-white text-xs ml-1" style="background-color: ${getMarkerColor(
                  point.riskLevel
                )}">${point.riskLevel}</span>
              </p>
              <p class="text-xs"><span class="font-medium">Water Body:</span> ${
                point.waterBody
              }</p>
              <p class="text-xs text-gray-500">Last Updated: ${
                point.lastUpdated
              }</p>
            </div>
          </div>`
        );

        const marker = new mapboxgl.default.Marker({
          color: getMarkerColor(point.riskLevel),
          scale: 0.9,
        })
          .setLngLat(point.coordinates)
          .setPopup(popup)
          .addTo(map.current);

        markersRef.current.push(marker);
      });
    };

    init().catch((error) => {
      console.error("Error initializing map:", error);
    });

    // Cleanup function
    return () => {
      isMounted = false;
      if (map.current) {
        markersRef.current.forEach((marker) => marker.remove());
        map.current.remove();
        map.current = null;
        isInitializedRef.current = false;
      }
    };
  }, []); // Empty dependency array - only run once

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Water Quality HMPI Map
          </h1>
          <p className="text-muted-foreground">
            Interactive map showing Human and Marine Pollution Index (HMPI)
            values for water bodies
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* HMPI Legend & Controls */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Layers className="h-5 w-5 mr-2 text-primary" />
                HMPI Legend
              </CardTitle>
              <CardDescription>
                Water quality risk levels and controls
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* HMPI Risk Level Legend */}
              <div className="space-y-3">
                <label className="text-sm font-medium">Risk Levels</label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded-full bg-green-500"></div>
                    <span className="text-sm">Low (0.0 - 2.0)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded-full bg-amber-500"></div>
                    <span className="text-sm">Moderate (2.1 - 3.0)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded-full bg-red-500"></div>
                    <span className="text-sm">High (3.1 - 4.0)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: "#7c2d12" }}
                    ></div>
                    <span className="text-sm">Critical (4.1+)</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Time Period</label>
                <Select defaultValue="last-week">
                  <SelectTrigger className="transition-smooth">
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="last-week">Last Week</SelectItem>
                    <SelectItem value="last-month">Last Month</SelectItem>
                    <SelectItem value="last-quarter">Last Quarter</SelectItem>
                    <SelectItem value="last-year">Last Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Search Location</label>
                <div className="flex space-x-2">
                  <Input
                    placeholder="Try: Miami, NYC, Chicago, etc."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-1 transition-smooth"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleSearch}
                    disabled={!searchQuery.trim()}
                    className="transition-smooth hover:bg-primary hover:text-primary-foreground"
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                  {searchQuery && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={clearSearch}
                      className="transition-smooth hover:bg-muted"
                    >
                      Clear
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Available: New York, LA, Chicago, Houston, Philadelphia, San
                  Francisco, Miami, Boston
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Filter by Risk Level
                </label>
                <Select defaultValue="all">
                  <SelectTrigger className="transition-smooth">
                    <SelectValue placeholder="Select risk level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="low">Low Risk Only</SelectItem>
                    <SelectItem value="moderate">Moderate Risk Only</SelectItem>
                    <SelectItem value="high">High Risk Only</SelectItem>
                    <SelectItem value="critical">Critical Risk Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3 pt-4">
                <Button
                  variant="outline"
                  className="w-full justify-start transition-smooth hover:bg-accent hover:text-accent-foreground"
                >
                  <Layers className="h-4 w-4 mr-2" />
                  Toggle Water Bodies
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start transition-smooth hover:bg-accent hover:text-accent-foreground"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export HMPI Data
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Map Container */}
          <Card className="lg:col-span-3 shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Map className="h-5 w-5 mr-2 text-primary" />
                Water Quality HMPI Map
              </CardTitle>
              <CardDescription>
                Real-time visualization of water quality monitoring stations and
                HMPI values
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="relative overflow-hidden rounded-b-lg">
                <div
                  ref={mapContainer}
                  className="w-full h-[600px]"
                  style={{
                    minHeight: "600px",
                    position: "relative",
                  }}
                ></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default MapView;
