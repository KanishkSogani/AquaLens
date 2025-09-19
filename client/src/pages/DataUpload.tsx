import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, FileSpreadsheet, Plus, X } from "lucide-react";
import { useState } from "react";

const DataUpload = () => {
  const [manualRows, setManualRows] = useState([{ location: '', latitude: '', longitude: '', value: '' }]);

  const addRow = () => {
    setManualRows([...manualRows, { location: '', latitude: '', longitude: '', value: '' }]);
  };

  const removeRow = (index: number) => {
    if (manualRows.length > 1) {
      setManualRows(manualRows.filter((_, i) => i !== index));
    }
  };

  const updateRow = (index: number, field: string, value: string) => {
    const updated = [...manualRows];
    updated[index] = { ...updated[index], [field]: value };
    setManualRows(updated);
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Data Upload</h1>
          <p className="text-muted-foreground">Upload your research data via CSV file or manual entry</p>
        </div>

        <div className="max-w-4xl mx-auto">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Upload className="h-5 w-5 mr-2 text-primary" />
                Upload Dataset
              </CardTitle>
              <CardDescription>
                Choose your preferred method to add data to the research portal
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="csv" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="csv" className="flex items-center">
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    CSV Upload
                  </TabsTrigger>
                  <TabsTrigger value="manual" className="flex items-center">
                    <Plus className="h-4 w-4 mr-2" />
                    Manual Entry
                  </TabsTrigger>
                </TabsList>

                {/* CSV Upload Tab */}
                <TabsContent value="csv" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="dataset-name">Dataset Name</Label>
                      <Input 
                        id="dataset-name" 
                        placeholder="Environmental Data 2024"
                        className="transition-smooth"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select>
                        <SelectTrigger className="transition-smooth">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="environmental">Environmental</SelectItem>
                          <SelectItem value="health">Health Data</SelectItem>
                          <SelectItem value="transportation">Transportation</SelectItem>
                          <SelectItem value="agriculture">Agriculture</SelectItem>
                          <SelectItem value="energy">Energy</SelectItem>
                          <SelectItem value="climate">Climate</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea 
                      id="description" 
                      placeholder="Brief description of the dataset..."
                      className="min-h-[100px] transition-smooth"
                    />
                  </div>

                  {/* File Upload Area */}
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-smooth">
                    <div className="w-16 h-16 bg-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <FileSpreadsheet className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-lg font-medium text-foreground mb-2">Drop your CSV file here</h3>
                    <p className="text-muted-foreground mb-4">or click to browse files</p>
                    <Button variant="outline" className="transition-smooth hover:bg-primary hover:text-primary-foreground">
                      Select CSV File
                    </Button>
                    <p className="text-xs text-muted-foreground mt-3">
                      Supported format: .csv (max 50MB)
                    </p>
                  </div>

                  <Button className="w-full bg-gradient-primary hover:bg-primary-hover transition-smooth shadow-government">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Dataset
                  </Button>
                </TabsContent>

                {/* Manual Entry Tab */}
                <TabsContent value="manual" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="manual-dataset-name">Dataset Name</Label>
                      <Input 
                        id="manual-dataset-name" 
                        placeholder="Manual Data Entry"
                        className="transition-smooth"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="manual-category">Category</Label>
                      <Select>
                        <SelectTrigger className="transition-smooth">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="environmental">Environmental</SelectItem>
                          <SelectItem value="health">Health Data</SelectItem>
                          <SelectItem value="transportation">Transportation</SelectItem>
                          <SelectItem value="agriculture">Agriculture</SelectItem>
                          <SelectItem value="energy">Energy</SelectItem>
                          <SelectItem value="climate">Climate</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Manual Data Entry */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Data Points</Label>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={addRow}
                        className="transition-smooth hover:bg-accent hover:text-accent-foreground"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Row
                      </Button>
                    </div>

                    {/* Data Entry Table */}
                    <div className="space-y-3">
                      <div className="grid grid-cols-12 gap-2 text-sm font-medium text-muted-foreground">
                        <div className="col-span-3">Location</div>
                        <div className="col-span-2">Latitude</div>
                        <div className="col-span-2">Longitude</div>
                        <div className="col-span-4">Value</div>
                        <div className="col-span-1">Action</div>
                      </div>

                      {manualRows.map((row, index) => (
                        <div key={index} className="grid grid-cols-12 gap-2">
                          <Input 
                            placeholder="City, State"
                            value={row.location}
                            onChange={(e) => updateRow(index, 'location', e.target.value)}
                            className="col-span-3 transition-smooth"
                          />
                          <Input 
                            placeholder="40.7128"
                            value={row.latitude}
                            onChange={(e) => updateRow(index, 'latitude', e.target.value)}
                            className="col-span-2 transition-smooth"
                          />
                          <Input 
                            placeholder="-74.0060"
                            value={row.longitude}
                            onChange={(e) => updateRow(index, 'longitude', e.target.value)}
                            className="col-span-2 transition-smooth"
                          />
                          <Input 
                            placeholder="Data value"
                            value={row.value}
                            onChange={(e) => updateRow(index, 'value', e.target.value)}
                            className="col-span-4 transition-smooth"
                          />
                          <Button 
                            type="button"
                            variant="ghost" 
                            size="sm"
                            onClick={() => removeRow(index)}
                            className="col-span-1 hover:bg-destructive hover:text-destructive-foreground transition-smooth"
                            disabled={manualRows.length === 1}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button className="w-full bg-gradient-primary hover:bg-primary-hover transition-smooth shadow-government">
                    <Plus className="h-4 w-4 mr-2" />
                    Save Data Points
                  </Button>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default DataUpload;