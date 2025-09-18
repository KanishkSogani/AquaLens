import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, Upload, Map, Users, Database, TrendingUp, FileText, Calendar } from "lucide-react";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const stats = [
    { title: "Total Datasets", value: "1,247", change: "+12%", icon: Database },
    { title: "Active Researchers", value: "89", change: "+5%", icon: Users },
    { title: "Data Points", value: "45.2K", change: "+23%", icon: BarChart3 },
    { title: "Map Locations", value: "1,856", change: "+8%", icon: Map },
  ];

  const recentActivity = [
    { action: "Dataset uploaded", user: "Dr. Sarah Johnson", time: "2 hours ago", icon: Upload },
    { action: "Map data updated", user: "Prof. Michael Chen", time: "4 hours ago", icon: Map },
    { action: "Report generated", user: "Dr. Emily Davis", time: "6 hours ago", icon: FileText },
    { action: "New research project", user: "Dr. Robert Wilson", time: "1 day ago", icon: Calendar },
  ];

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Research Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's your research portal overview.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
            <Card key={stat.title} className="shadow-card hover:shadow-government transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-5 w-5 text-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                <p className="text-xs text-success flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {stat.change} from last month
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-primary" />
                Quick Actions
              </CardTitle>
              <CardDescription>
                Common tasks for researchers
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
                <Button variant="outline" className="w-full justify-start transition-smooth hover:bg-accent hover:text-accent-foreground">
                  <Map className="h-4 w-4 mr-2" />
                  View Data on Map
                </Button>
              </Link>
              <Button variant="outline" className="w-full justify-start transition-smooth hover:bg-muted">
                <FileText className="h-4 w-4 mr-2" />
                Generate Report
              </Button>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="lg:col-span-2 shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-primary" />
                Recent Activity
              </CardTitle>
              <CardDescription>
                Latest actions in the research portal
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-muted/50 transition-smooth">
                    <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center">
                      <activity.icon className="h-5 w-5 text-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{activity.action}</p>
                      <p className="text-xs text-muted-foreground">by {activity.user}</p>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {activity.time}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;