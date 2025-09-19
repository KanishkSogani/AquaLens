import Navigation from "@/components/Navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart3,
  Upload,
  Map,
  Users,
  Database,
  TrendingUp,
  FileText,
  Calendar,
  PieChart,
  Download,
  Eye,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  PieChart as RechartsPieChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  Pie,
} from "recharts";

// API Configuration
const API_BASE_URL = "http://localhost:8001";

interface DatabaseStats {
  total_datasets: number;
  total_samples: number;
  total_cities: number;
  pollution_distribution?: {
    "Low Pollution": number;
    "Moderate Pollution": number;
    "High Pollution": number;
    "Very High Pollution": number;
  };
}

interface Dataset {
  id: number;
  name: string;
  description: string;
  total_samples: number;
  upload_date: string;
}

const Dashboard = () => {
  // State for real data
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch database stats
  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/database/stats`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        throw new Error("Failed to fetch stats");
      }
    } catch (err) {
      setError("Failed to load database statistics");
      console.error("Error fetching stats:", err);
    }
  };

  // Fetch datasets
  const fetchDatasets = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/datasets`);
      if (response.ok) {
        const data = await response.json();
        setDatasets(data.datasets || []);
      } else {
        throw new Error("Failed to fetch datasets");
      }
    } catch (err) {
      setError("Failed to load datasets");
      console.error("Error fetching datasets:", err);
    }
  };

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchStats(), fetchDatasets()]);
      setLoading(false);
    };
    loadData();
  }, []);

  // Generate report for selected dataset
  const generateReport = async () => {
    if (!selectedDataset) {
      alert("Please select a dataset first");
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/datasets/${selectedDataset}/report`
      );
      if (response.ok) {
        const report = await response.json();
        // For now, log the report. Later we can show it in a modal or navigate to a report page
        console.log("Generated Report:", report);
        alert("Report generated successfully! Check console for details.");
      } else {
        throw new Error("Failed to generate report");
      }
    } catch (err) {
      alert("Failed to generate report");
      console.error("Error generating report:", err);
    }
  };

  // Download dataset CSV
  const downloadDataset = async () => {
    if (!selectedDataset) {
      alert("Please select a dataset first");
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/datasets/${selectedDataset}/download`
      );
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `dataset_${selectedDataset}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        throw new Error("Failed to download dataset");
      }
    } catch (err) {
      alert("Failed to download dataset");
      console.error("Error downloading dataset:", err);
    }
  };

  // Prepare data for pie chart
  const pollutionData =
    stats && stats.pollution_distribution
      ? [
          {
            name: "Low Pollution",
            value: stats.pollution_distribution["Low Pollution"] || 0,
            color: "#22c55e",
          },
          {
            name: "Moderate Pollution",
            value: stats.pollution_distribution["Moderate Pollution"] || 0,
            color: "#f59e0b",
          },
          {
            name: "High Pollution",
            value: stats.pollution_distribution["High Pollution"] || 0,
            color: "#ef4444",
          },
          {
            name: "Very High Pollution",
            value: stats.pollution_distribution["Very High Pollution"] || 0,
            color: "#dc2626",
          },
        ].filter((item) => item.value > 0)
      : [];

  // Dashboard stats for cards
  const dashboardStats = stats
    ? [
        {
          title: "Total Datasets",
          value: stats.total_datasets.toString(),
          change: "Real Data",
          icon: Database,
        },
        {
          title: "Water Samples",
          value: stats.total_samples.toLocaleString(),
          change: "Analyzed",
          icon: BarChart3,
        },
        {
          title: "Cities Covered",
          value: stats.total_cities.toString(),
          change: "Locations",
          icon: Map,
        },
        {
          title: "Active Studies",
          value: datasets.length.toString(),
          change: "Ongoing",
          icon: FileText,
        },
      ]
    : [];

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Research Dashboard
          </h1>
          <p className="text-muted-foreground">
            Welcome back! Here's your research portal overview.
          </p>
        </div>

        {/* Stats Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="shadow-card animate-pulse">
                <CardHeader className="space-y-0 pb-2">
                  <div className="h-4 bg-muted rounded w-24"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-muted rounded w-16 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-20"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <div className="mb-8 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-destructive">{error}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {dashboardStats.map((stat) => (
              <Card
                key={stat.title}
                className="shadow-card hover:shadow-government transition-all duration-300 hover:-translate-y-1"
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <stat.icon className="h-5 w-5 text-accent" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    {stat.value}
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center mt-1">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {stat.change}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-primary" />
                Quick Actions
              </CardTitle>
              <CardDescription>
                Common tasks for water quality research
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link to="/data-upload">
                <Button className="w-full justify-start bg-gradient-primary hover:bg-primary-hover transition-smooth shadow-government">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload New Dataset
                </Button>
              </Link>
              <Link to="/map">
                <Button
                  variant="outline"
                  className="w-full justify-start transition-smooth hover:bg-accent hover:text-accent-foreground"
                >
                  <Map className="h-4 w-4 mr-2" />
                  View Data on Map
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Generate Report Section */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2 text-primary" />
                Generate Report
              </CardTitle>
              <CardDescription>
                Create detailed analysis reports for your datasets
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Dataset</label>
                <Select
                  value={selectedDataset}
                  onValueChange={setSelectedDataset}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a dataset" />
                  </SelectTrigger>
                  <SelectContent>
                    {datasets.map((dataset) => (
                      <SelectItem
                        key={dataset.id}
                        value={dataset.id.toString()}
                      >
                        {dataset.name} ({dataset.total_samples} samples)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={generateReport}
                  disabled={!selectedDataset}
                  className="flex-1"
                  variant="outline"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Report
                </Button>
                <Button
                  onClick={downloadDataset}
                  disabled={!selectedDataset}
                  className="flex-1"
                  variant="outline"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download CSV
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Pollution Distribution Chart */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <PieChart className="h-5 w-5 mr-2 text-primary" />
                Pollution Distribution
              </CardTitle>
              <CardDescription>
                Water quality classification across all samples
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : pollutionData.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Tooltip
                        formatter={(value: number) => [value, "Samples"]}
                        labelStyle={{ color: "#374151" }}
                      />
                      <Legend />
                      <Pie
                        data={pollutionData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pollutionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <PieChart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No pollution data available</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
