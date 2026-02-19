import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Upload, Plus, Check, AlertCircle } from "lucide-react";
import { authenticatedFetch } from "@/lib/api";
import { clearAuthData } from "@/lib/auth";
import { useRequireAuth } from "@/lib/useRequireAuth";

interface DescriptionType {
  description_type_id: string;
  name: string;
  type: "categorical" | "numerical";
  reward: number;
}

interface FormData {
  title: string;
  domain: string;
  intent: string;
  algorithm: string;
  method: string;
  model: string;
}

interface Description {
  description_type_id: string;
  value: string;
}

export default function CreateExperiment() {
  const navigate = useNavigate();
  const { isLoading } = useRequireAuth();
  const [activeTab, setActiveTab] = useState<"manual" | "csv">("manual");
  const [descriptionTypes, setDescriptionTypes] = useState<DescriptionType[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [descriptions, setDescriptions] = useState<Description[]>([]);
  const [selectedDescType, setSelectedDescType] = useState("");
  const [descValue, setDescValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvSubmitting, setCsvSubmitting] = useState(false);
  const [csvError, setCsvError] = useState("");
  const [csvSuccess, setCsvSuccess] = useState("");
  const [addMissingTypes, setAddMissingTypes] = useState(false);
  const [domains, setDomains] = useState<{ domain: string; experiment_count: number }[]>([]);
  const [formData, setFormData] = useState<FormData>({
    title: "",
    domain: "",
    intent: "",
    algorithm: "",
    method: "",
    model: "",
  });

  useEffect(() => {
    fetchDescriptionTypes();
  }, []);

  const fetchDescriptionTypes = async () => {
    try {
      setLoadingTypes(true);
      const response = await authenticatedFetch("/experiment/get_experiment_description_types");

      if (response.status === 401) {
        clearAuthData();
        navigate("/login", { replace: true });
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to fetch description types");
      }

      const data = await response.json();
      setDescriptionTypes(data.data || []);
    } catch (err) {
      console.error("Failed to load description types:", err);
    } finally {
      setLoadingTypes(false);
    }
  };

  useEffect(() => {
    const fetchDomains = async () => {
      try {
        const response = await authenticatedFetch("/experiment/get_domains_with_counts", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (response.status === 401) {
          clearAuthData();
          navigate("/login", { replace: true });
          return;
        }

        if (!response.ok) throw new Error("Failed to fetch domains");

        const data = await response.json();
        const list = data.data || [];
        const filtered = list.filter((item: { domain: string; }) => {
          const first = item.domain.charAt(0);
          return first === first.toLowerCase();
        });
        setDomains(filtered || []);
      } catch (err) {
        console.error(err);
        alert("Failed to load domains from server.");
      }
    };

    fetchDomains();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddDescription = () => {
    if (!selectedDescType || !descValue.trim()) {
      setError("Please select a field and enter a value");
      return;
    }

    const newDesc: Description = {
      description_type_id: selectedDescType,
      value: descValue,
    };

    setDescriptions([...descriptions, newDesc]);
    setSelectedDescType("");
    setDescValue("");
    setError("");
  };

  const handleRemoveDescription = (index: number) => {
    setDescriptions(descriptions.filter((_, i) => i !== index));
  };

  const handleSubmitExperiment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.title || !formData.domain) {
      setError("Title and domain are required");
      return;
    }

    setSubmitting(true);

    try {
      const response = await authenticatedFetch("/experiment/add_experiment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          domain: formData.domain,
          intent: formData.intent,
          algorithm: formData.algorithm,
          method: formData.method,
          model: formData.model,
          descriptions,
        }),
      });

      if (response.status === 401) {
        clearAuthData();
        navigate("/login", { replace: true });
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to create experiment");
      }

      setSuccess("Experiment created successfully!");
      setFormData({
        title: "",
        domain: "",
        intent: "",
        algorithm: "",
        method: "",
        model: "",
      });
      setDescriptions([]);

      setTimeout(() => {
        navigate("/explorer");
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create experiment");
    } finally {
      setSubmitting(false);
    }
  };

  const MAX_FILE_SIZE = 1 * 1024 * 1024;
  const handleCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      setCsvError("Please select a CSV file");
      setCsvFile(null);
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setCsvError("File size must not exceed 1 MB.");
      setCsvFile(null);
      return;
    }
    
    setCsvFile(file);
    setCsvError("");
  };

  const handleUploadCsv = async () => {
    if (!csvFile) {
      setCsvError("Please select a CSV file");
      return;
    }

    setCsvSubmitting(true);
    setCsvError("");
    setCsvSuccess("");

    try {
      const formData = new FormData();
      formData.append("file", csvFile as File);
      formData.append("add_non_existing_description_types", addMissingTypes ? "true" : "false");

      const response = await authenticatedFetch("/experiment/add-uc5-dataset", {
        method: "POST",
        body: formData,

      });

      if (response.status === 401) {
        clearAuthData();
        navigate("/login", { replace: true });
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to upload CSV");
      }

      const data = await response.json();
      setCsvSuccess(data.message || "CSV uploaded successfully!");
      setCsvFile(null);

      const fileInput = document.getElementById("csv-input") as HTMLInputElement;
      if (fileInput) fileInput.value = "";

      setTimeout(() => navigate("/explorer"), 2000);

    } catch (err) {
      setCsvError(err instanceof Error ? err.message : "Failed to upload CSV");
    } finally {
      setCsvSubmitting(false);
    }
  };

  if (isLoading || loadingTypes) {
    return (
      <Layout isLoggedIn>
        <div className="min-h-[calc(100vh-11.45rem)] flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout isLoggedIn>
      <div className="min-h-[calc(100vh-11.45rem)] px-4 py-8 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-blue-950">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Create Experiment</h1>
            <p className="text-muted-foreground mt-2">
              Add a new experiment manually or upload a CSV file with multiple experiments
            </p>
          </div>
          <div className="flex gap-2 mb-8 bg-white dark:bg-slate-900 rounded-lg p-1 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setActiveTab("manual")}
              className={`flex-1 py-3 px-4 rounded-md font-medium transition-all ${
                activeTab === "manual"
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                  : "text-foreground hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <Plus className="inline-block w-4 h-4 mr-2" />
              Manual Entry
            </button>
            <button
              onClick={() => setActiveTab("csv")}
              className={`flex-1 py-3 px-4 rounded-md font-medium transition-all ${
                activeTab === "csv"
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                  : "text-foreground hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <Upload className="inline-block w-4 h-4 mr-2" />
              CSV Upload
            </button>
          </div>
          {activeTab === "manual" && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-8">
              <form onSubmit={handleSubmitExperiment} className="space-y-6">
                {error && (
                  <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
                  </div>
                )}

                {success && (
                  <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-green-700 dark:text-green-200">{success}</p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    required
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Anomaly Detection on Medical Data"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Domain <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      name="domain"
                      required
                      value={formData.domain}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors appearance-none"
                    >
                      <option value="">Select domain...</option>
                      {domains.map((d) => (
                        <option key={d.domain} value={d.domain}>
                          {d.domain}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-2.5 pointer-events-none text-muted-foreground">
                      ▼
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Intent
                    </label>
                    <input
                      type="text"
                      name="intent"
                      value={formData.intent}
                      onChange={handleInputChange}
                      placeholder="Anomaly Detection"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Algorithm
                    </label>
                    <input
                      type="text"
                      name="algorithm"
                      value={formData.algorithm}
                      onChange={handleInputChange}
                      placeholder="CNN"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Method
                    </label>
                    <input
                      type="text"
                      name="method"
                      value={formData.method}
                      onChange={handleInputChange}
                      placeholder="Binary Classification"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Model
                    </label>
                    <input
                      type="text"
                      name="model"
                      value={formData.model}
                      onChange={handleInputChange}
                      placeholder="CNN_1"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors"
                    />
                  </div>
                </div>
                <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Description Values</h3>
                  <div className="space-y-3 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Select Field
                      </label>
                      <div className="relative">
                        <select
                          value={selectedDescType}
                          onChange={(e) => setSelectedDescType(e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors appearance-none"
                        >
                          <option value="">Choose a field...</option>
                          {descriptionTypes.map((type) => (
                            <option key={type.description_type_id} value={type.description_type_id}>
                              {type.name} ({type.type})
                            </option>
                          ))}
                        </select>
                        <div className="absolute right-3 top-2.5 pointer-events-none text-muted-foreground">
                          ▼
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Value
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={descValue}
                          onChange={(e) => setDescValue(e.target.value)}
                          placeholder="Enter value"
                          className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors"
                        />
                        <button
                          type="button"
                          onClick={handleAddDescription}
                          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          Add
                        </button>
                      </div>
                    </div>
                  </div>
                  {descriptions.length > 0 && (
                    <div className="space-y-2">
                      {descriptions.map((desc, idx) => {
                        const descType = descriptionTypes.find(
                          (t) => t.description_type_id == desc.description_type_id
                        );
                     
                        return (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"
                          >
                            <span className="text-sm text-foreground">
                              <span className="font-medium">{descType?.name}:</span> {desc.value}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveDescription(idx)}
                              className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium text-sm"
                            >
                              Remove
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-slate-400 disabled:to-slate-400 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      Create Experiment
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
          {activeTab === "csv" && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-8">
              <div className="space-y-6">
                {csvError && (
                  <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700 dark:text-red-200">{csvError}</p>
                  </div>
                )}

                {csvSuccess && (
                  <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-green-700 dark:text-green-200">{csvSuccess}</p>
                  </div>
                )}
                <div>
                  <label htmlFor="csv-input" className="block">
                    <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-12 text-center hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all cursor-pointer">
                      <Upload className="w-12 h-12 text-slate-400 dark:text-slate-500 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        Upload CSV File
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Drag and drop your CSV file here, or click to select
                      </p>
                      {csvFile && (
                        <div className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-4">
                          Selected: {csvFile.name}
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        CSV format (UC5 dataset compatible)
                      </p>
                    </div>
                    <input
                      id="csv-input"
                      type="file"
                      accept=".csv"
                      onChange={handleCsvFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
                <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-800 p-4 rounded-lg">
                  <input
                    type="checkbox"
                    id="add-missing-types"
                    checked={addMissingTypes}
                    onChange={(e) => setAddMissingTypes(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <label htmlFor="add-missing-types" className="text-sm text-foreground">
                    Check whether to add non-existing description types found in the dataset.
                  </label>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">
                    CSV Format Requirements
                  </h4>
                  <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1 list-disc list-inside">
                    <li>Must be a valid CSV file</li>
                    <li>Compatible with UC5 dataset format</li>
                    <li>Will be processed and added as experiments</li>
                  </ul>
                </div>
                <button
                  onClick={handleUploadCsv}
                  disabled={csvSubmitting || !csvFile}
                  className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-slate-400 disabled:to-slate-400 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  {csvSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      Upload CSV
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
