import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Shield,
  BarChart3,
  Upload,
  Map,
  ArrowRight,
  CheckCircle,
} from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  const features = [
    {
      icon: BarChart3,
      title: "Research Dashboard",
      description:
        "Comprehensive overview of your research data with interactive charts and analytics.",
    },
    {
      icon: Upload,
      title: "Data Upload",
      description:
        "Easy CSV upload and manual data entry with validation and processing.",
    },
    {
      icon: Map,
      title: "Geospatial Mapping",
      description:
        "Interactive maps with location-based data visualization and filtering.",
    },
  ];

  const benefits = [
    "Secure government-grade authentication",
    "Real-time data processing and validation",
    "Advanced geospatial visualization tools",
    "Collaborative research environment",
    "Compliance with federal data standards",
  ];

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center shadow-government">
                <Shield className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">AquaLens</h1>
                <p className="text-xs text-muted-foreground">
                  Water Quality Research Platform
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Link to="/login">
                <Button
                  variant="outline"
                  className="transition-smooth hover:bg-primary hover:text-primary-foreground"
                >
                  Sign In
                </Button>
              </Link>
              <Link to="/signup">
                <Button className="bg-gradient-primary hover:bg-primary-hover transition-smooth shadow-government">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <div className="mb-8">
            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
              AquaLens Water Quality
              <span className="bg-gradient-hero bg-clip-text text-transparent">
                {" "}
                Research Platform
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              Advanced water quality data management platform for researchers.
              Upload, analyze, and visualize your water quality research data
              with enterprise-grade security and compliance.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/signup">
                <Button
                  size="lg"
                  className="bg-gradient-primary hover:bg-primary-hover transition-smooth shadow-government text-base px-8"
                >
                  Start Water Quality Research
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/login">
                <Button
                  size="lg"
                  variant="outline"
                  className="transition-smooth hover:bg-accent hover:text-accent-foreground text-base px-8"
                >
                  Existing User Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Powerful Research Tools
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Everything you need to manage, analyze, and visualize your
              government research data
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="shadow-card hover:shadow-government transition-all duration-300 hover:-translate-y-1 border-l-4 border-l-primary"
              >
                <CardHeader>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 px-4 bg-card/50">
        <div className="container mx-auto max-w-4xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-6">
                Built for Government Research
              </h2>
              <p className="text-muted-foreground mb-8 text-lg leading-relaxed">
                Our platform meets the highest standards for security,
                compliance, and data integrity required by government research
                institutions.
              </p>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                    <span className="text-foreground">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <Card className="shadow-government">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2 text-primary" />
                    Sample Dashboard
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-success/10 rounded-lg">
                    <span className="text-sm font-medium">Active Projects</span>
                    <span className="text-lg font-bold text-success">24</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg">
                    <span className="text-sm font-medium">Data Points</span>
                    <span className="text-lg font-bold text-primary">
                      45.2K
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-accent/10 rounded-lg">
                    <span className="text-sm font-medium">Map Locations</span>
                    <span className="text-lg font-bold text-accent">1,856</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-3xl">
          <h2 className="text-4xl font-bold text-foreground mb-6">
            Ready to Transform Your Research?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
            Join leading government researchers who trust our platform for their
            critical data management needs.
          </p>
          <Link to="/signup">
            <Button
              size="lg"
              className="bg-gradient-primary hover:bg-primary-hover transition-smooth shadow-government text-lg px-12 py-6"
            >
              Create Your Account
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary text-primary-foreground py-12 px-4">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <Shield className="h-6 w-6" />
              <div>
                <h3 className="font-bold">Government Research Portal</h3>
                <p className="text-sm text-primary-foreground/80">
                  Secure. Compliant. Reliable.
                </p>
              </div>
            </div>
            <div className="text-sm text-primary-foreground/80">
              © 2024 Government Research Portal. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
