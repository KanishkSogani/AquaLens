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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, FileSpreadsheet, Plus, X, AlertCircle } from "lucide-react";
import { useState, useRef } from "react";

const DataUpload = () => {
  // CSV Upload state
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvFormData, setCsvFormData] = useState({
    name: "",
    description: "",
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Available metals for dropdown
  const availableMetals = [
    "Lead",
    "Cadmium",
    "Arsenic",
    "Mercury",
    "Chromium",
    "Nickel",
    "Copper",
    "Zinc",
    "Iron",
    "Manganese",
    "Aluminum",
    "Antimony",
    "Selenium",
    "Uranium",
    "Thallium",
  ];

  // Manual entry state
  const [manualFormData, setManualFormData] = useState({
    name: "",
    description: "",
  });
  const [manualRows, setManualRows] = useState([
    {
      sampleId: "",
      city: "",
      latitude: "",
      longitude: "",
      metals: {} as Record<string, string>,
    },
  ]);

  // State to control dropdown values for each row
  const [dropdownValues, setDropdownValues] = useState<Record<number, string>>({
    0: "",
  });

  // File upload handlers
  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === "text/csv") {
      setCsvFile(file);
    } else {
      alert("Please select a valid CSV file.");
    }
  };

  const handleCsvFormChange = (field: string, value: string) => {
    setCsvFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCsvSubmit = () => {
    if (!csvFormData.name.trim()) {
      alert("Dataset name is required");
      return;
    }
    if (!csvFile) {
      alert("Please select a CSV file");
      return;
    }
    // TODO: Implement CSV upload logic
    console.log("CSV Upload:", { ...csvFormData, file: csvFile });
  };

  // Manual entry handlers
  const handleManualFormChange = (field: string, value: string) => {
    setManualFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addRow = () => {
    const newIndex = manualRows.length;
    setManualRows([
      ...manualRows,
      {
        sampleId: "",
        city: "",
        latitude: "",
        longitude: "",
        metals: {},
      },
    ]);
    // Initialize dropdown value for the new row
    setDropdownValues((prev) => ({ ...prev, [newIndex]: "" }));
  };

  const removeRow = (index: number) => {
    if (manualRows.length > 1) {
      setManualRows(manualRows.filter((_, i) => i !== index));
      // Clean up dropdown values for removed rows and reindex
      const newDropdownValues: Record<number, string> = {};
      Object.entries(dropdownValues).forEach(([key, value]) => {
        const rowIndex = parseInt(key);
        if (rowIndex < index) {
          newDropdownValues[rowIndex] = value;
        } else if (rowIndex > index) {
          newDropdownValues[rowIndex - 1] = value;
        }
      });
      setDropdownValues(newDropdownValues);
    }
  };

  const updateRow = (index: number, field: string, value: string) => {
    const updated = [...manualRows];
    if (field === "metals") {
      // This will be handled by updateRowMetal function
      return;
    }
    updated[index] = { ...updated[index], [field]: value };
    setManualRows(updated);
  };

  const updateRowMetal = (rowIndex: number, metal: string, value: string) => {
    const updated = [...manualRows];
    // Always keep the metal in the object, even if empty, so user can enter value
    updated[rowIndex].metals[metal] = value;
    setManualRows(updated);
  };

  const addMetalToRow = (rowIndex: number, metal: string) => {
    if (metal && !(metal in manualRows[rowIndex].metals)) {
      updateRowMetal(rowIndex, metal, "");
      // Reset dropdown value to show placeholder
      setDropdownValues((prev) => ({ ...prev, [rowIndex]: "" }));
    }
  };

  const removeMetalFromRow = (rowIndex: number, metal: string) => {
    const updated = [...manualRows];
    delete updated[rowIndex].metals[metal];
    setManualRows(updated);
  };

  const validateManualEntry = () => {
    if (!manualFormData.name.trim()) {
      alert("Dataset name is required");
      return false;
    }

    for (const row of manualRows) {
      // Check if any metal has a value (non-empty and greater than 0)
      const hasMetalValues = Object.values(row.metals).some(
        (value) => value && value.trim() !== "" && parseFloat(value) >= 0
      );

      if (!hasMetalValues) {
        alert("Each row must have at least one metal concentration value");
        return false;
      }

      if (!row.city.trim() || !row.latitude.trim() || !row.longitude.trim()) {
        alert("City, latitude, and longitude are required for each row");
        return false;
      }
    }

    return true;
  };

  const handleManualSubmit = () => {
    if (!validateManualEntry()) {
      return;
    }
    // TODO: Implement manual entry submission logic
    console.log("Manual Entry:", { ...manualFormData, rows: manualRows });
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Data Upload
          </h1>
          <p className="text-muted-foreground">
            Upload your research data via CSV file or manual entry
          </p>
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
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="dataset-name">Dataset Name *</Label>
                      <Input
                        id="dataset-name"
                        placeholder="Environmental Data 2024"
                        value={csvFormData.name}
                        onChange={(e) =>
                          handleCsvFormChange("name", e.target.value)
                        }
                        className="transition-smooth"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">
                        Description (Optional)
                      </Label>
                      <Textarea
                        id="description"
                        placeholder="Brief description of the dataset..."
                        value={csvFormData.description}
                        onChange={(e) =>
                          handleCsvFormChange("description", e.target.value)
                        }
                        className="min-h-[100px] transition-smooth"
                      />
                    </div>

                    {/* File Upload Area */}
                    <div
                      className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-smooth cursor-pointer"
                      onClick={handleFileSelect}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <div className="w-16 h-16 bg-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center">
                        <FileSpreadsheet className="h-8 w-8 text-primary" />
                      </div>
                      {csvFile ? (
                        <div>
                          <h3 className="text-lg font-medium text-foreground mb-2">
                            File Selected
                          </h3>
                          <p className="text-muted-foreground mb-4">
                            {csvFile.name}
                          </p>
                          <Button
                            variant="outline"
                            className="transition-smooth hover:bg-primary hover:text-primary-foreground"
                          >
                            Change File
                          </Button>
                        </div>
                      ) : (
                        <div>
                          <h3 className="text-lg font-medium text-foreground mb-2">
                            Drop your CSV file here
                          </h3>
                          <p className="text-muted-foreground mb-4">
                            or click to browse files
                          </p>
                          <Button
                            variant="outline"
                            className="transition-smooth hover:bg-primary hover:text-primary-foreground"
                          >
                            Select CSV File
                          </Button>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground mt-3">
                        Supported format: .csv (max 50MB)
                      </p>
                    </div>

                    <Button
                      onClick={handleCsvSubmit}
                      className="w-full bg-gradient-primary hover:bg-primary-hover transition-smooth shadow-government"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Dataset
                    </Button>
                  </div>
                </TabsContent>

                {/* Manual Entry Tab */}
                <TabsContent value="manual" className="space-y-6">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="manual-dataset-name">
                        Dataset Name *
                      </Label>
                      <Input
                        id="manual-dataset-name"
                        placeholder="Manual Data Entry"
                        value={manualFormData.name}
                        onChange={(e) =>
                          handleManualFormChange("name", e.target.value)
                        }
                        className="transition-smooth"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="manual-description">
                        Description (Optional)
                      </Label>
                      <Textarea
                        id="manual-description"
                        placeholder="Brief description of the dataset..."
                        value={manualFormData.description}
                        onChange={(e) =>
                          handleManualFormChange("description", e.target.value)
                        }
                        className="min-h-[100px] transition-smooth"
                      />
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

                      {/* Data Entry Rows */}
                      <div className="space-y-6">
                        {manualRows.map((row, index) => (
                          <Card key={index} className="p-4">
                            <div className="space-y-4">
                              {/* Row Header */}
                              <div className="flex items-center justify-between">
                                <h4 className="text-sm font-medium">
                                  Sample {index + 1}
                                </h4>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeRow(index)}
                                  className="hover:bg-destructive hover:text-destructive-foreground transition-smooth"
                                  disabled={manualRows.length === 1}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>

                              {/* Basic Info Grid */}
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="space-y-2">
                                  <Label className="text-xs">
                                    Sample ID (Optional)
                                  </Label>
                                  <Input
                                    placeholder="S001"
                                    value={row.sampleId}
                                    onChange={(e) =>
                                      updateRow(
                                        index,
                                        "sampleId",
                                        e.target.value
                                      )
                                    }
                                    className="transition-smooth"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-xs">City *</Label>
                                  <Input
                                    placeholder="New York"
                                    value={row.city}
                                    onChange={(e) =>
                                      updateRow(index, "city", e.target.value)
                                    }
                                    className="transition-smooth"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-xs">Latitude *</Label>
                                  <Input
                                    placeholder="40.7128"
                                    value={row.latitude}
                                    onChange={(e) =>
                                      updateRow(
                                        index,
                                        "latitude",
                                        e.target.value
                                      )
                                    }
                                    className="transition-smooth"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-xs">Longitude *</Label>
                                  <Input
                                    placeholder="-74.0060"
                                    value={row.longitude}
                                    onChange={(e) =>
                                      updateRow(
                                        index,
                                        "longitude",
                                        e.target.value
                                      )
                                    }
                                    className="transition-smooth"
                                  />
                                </div>
                              </div>

                              {/* Metal Values Section */}
                              <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                  <Label className="text-sm font-medium">
                                    Heavy Metals * (Select and enter values)
                                  </Label>
                                  <Select
                                    value={dropdownValues[index] || ""}
                                    onValueChange={(metal) =>
                                      addMetalToRow(index, metal)
                                    }
                                  >
                                    <SelectTrigger className="w-52">
                                      <SelectValue placeholder="+ Add a metal" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {availableMetals
                                        .filter(
                                          (metal) => !(metal in row.metals)
                                        )
                                        .map((metal) => (
                                          <SelectItem key={metal} value={metal}>
                                            {metal}
                                          </SelectItem>
                                        ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                {/* Selected Metals - Clean Card Layout */}
                                {Object.keys(row.metals).length > 0 ? (
                                  <div className="space-y-3">
                                    {Object.entries(row.metals).map(
                                      ([metal, value]) => (
                                        <div
                                          key={metal}
                                          className="flex items-center gap-3 p-3 bg-slate-50 border rounded-lg hover:bg-slate-100 transition-colors"
                                        >
                                          <div className="flex-1">
                                            <Label className="text-sm font-medium text-slate-700 mb-1 block">
                                              {metal}
                                            </Label>
                                            <div className="flex items-center gap-2">
                                              <Input
                                                placeholder="0.000"
                                                value={value}
                                                onChange={(e) =>
                                                  updateRowMetal(
                                                    index,
                                                    metal,
                                                    e.target.value
                                                  )
                                                }
                                                className="h-9 bg-white"
                                                type="number"
                                                step="0.001"
                                                min="0"
                                              />
                                              <span className="text-xs text-slate-500 whitespace-nowrap">
                                                mg/L
                                              </span>
                                            </div>
                                          </div>
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                              removeMetalFromRow(index, metal)
                                            }
                                            className="h-9 w-9 p-0 hover:bg-red-100 hover:text-red-600 transition-colors"
                                          >
                                            <X className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      )
                                    )}
                                  </div>
                                ) : (
                                  <div className="flex items-center text-amber-600 text-sm py-3 px-4 bg-amber-50 border border-amber-200 rounded-lg">
                                    <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                                    No metals added yet. Use the dropdown above
                                    to add metals and their concentrations.
                                  </div>
                                )}
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>

                      <Button
                        onClick={handleManualSubmit}
                        className="w-full bg-gradient-primary hover:bg-primary-hover transition-smooth shadow-government"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Save Data Points
                      </Button>
                    </div>
                  </div>
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
