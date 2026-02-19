import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Plus, Trash2, Edit2, GripVertical, Check } from "lucide-react";
import { authenticatedFetch } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { clearAuthData } from "@/lib/auth";

interface Constraint {
  id: string;
  name: string;
  type: "categorical" | "numerical";
  constraintType: "hard" | "soft";
  value?: string;
  min?: number;
  max?: number;
}

interface ConstraintField {
  description_type_id: number;
  name: string;
  type: "categorical" | "numerical";
  reward: number;
  options?: string[];
}

export default function Explorer() {
  const [domain, setDomain] = useState("");
  const [intent, setIntent] = useState("");
  const [algorithm, setAlgorithm] = useState("");
  const [availableFields, setAvailableFields] = useState<ConstraintField[]>([]);
  const [constraints, setConstraints] = useState<Constraint[]>([]);
  const [selectedField, setSelectedField] = useState<ConstraintField | null>(null);
  const [constraintType, setConstraintType] = useState<"hard" | "soft">("soft");
  const [categoricalValue, setCategoricalValue] = useState("");
  const [numericalMin, setNumericalMin] = useState<number | "">("");
  const [numericalMax, setNumericalMax] = useState<number | "">("");
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [method, setMethod] = useState<string>("");
  const [domains, setDomains] = useState<{ domain: string; experiment_count: number }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFields = async () => {
      try {
        const response = await authenticatedFetch("/experiment/get_experiment_description_types", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (response.status === 401) {
          clearAuthData();
          navigate("/login", { replace: true });
          return;
        }

        if (!response.ok) throw new Error("Failed to fetch description types");
        const data = await response.json();
        setAvailableFields(data.data);
      } catch (err) {
        console.error(err);
        alert("Failed to load fields from server.");
      }
    };

    fetchFields();
  }, []);

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

  const handleAddConstraint = () => {
    if (!selectedField) return;

    const newConstraint: Constraint = {
      id: editingId || Date.now().toString(),
      name: selectedField.name,
      type: selectedField.type,
      constraintType,
      ...(selectedField.type === "categorical" && { value: categoricalValue }),
      ...(selectedField.type === "numerical" && {
        min: numericalMin === "" ? undefined : numericalMin,
        max: numericalMax === "" ? undefined : numericalMax,
      }),
    };

    if (editingId) {
      setConstraints(constraints.map((c) => (c.id === editingId ? newConstraint : c)));
      setEditingId(null);
    } else {
      setConstraints([...constraints, newConstraint]);
    }

    resetForm();
  };

  const resetForm = () => {
    setSelectedField(null);
    setConstraintType("soft");
    setCategoricalValue("");
    setNumericalMin("");
    setNumericalMax("");
    setIsAdding(false);
  };

  const handleEditConstraint = (constraint: Constraint) => {
    const field = availableFields.find((f) => f.name === constraint.name);
    if (!field) return;
    setSelectedField(field);
    setConstraintType(constraint.constraintType);
    if (constraint.type === "categorical") {
      setCategoricalValue(constraint.value || "");
    } else {
      setNumericalMin(constraint.min || "");
      setNumericalMax(constraint.max || "");
    }
    setEditingId(constraint.id);
    setIsAdding(true);
  };

  const handleRemoveConstraint = (id: string) => {
    setConstraints(constraints.filter((c) => c.id !== id));
  };

  const handleDragStart = (id: string) => setDraggedId(id);
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = (targetId: string) => {
    if (!draggedId || draggedId === targetId) return;
    const draggedIndex = constraints.findIndex((c) => c.id === draggedId);
    const targetIndex = constraints.findIndex((c) => c.id === targetId);
    const newConstraints = [...constraints];
    [newConstraints[draggedIndex], newConstraints[targetIndex]] = [
      newConstraints[targetIndex],
      newConstraints[draggedIndex],
    ];
    setConstraints(newConstraints);
    setDraggedId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain) {
      setSubmitError("Please fill all required fields: domain.");
      return;
    }
    setIsLoading(true); 
    const softConstraints = constraints
      .filter((c) => c.constraintType === "soft")
      .map((c) => ({
        name: c.name,
        type: c.type,
        ...(c.type === "categorical" && { value: c.value }),
        ...(c.type === "numerical" && { min: c.min ?? null, max: c.max ?? null }),
      }));

    const hardConstraints = constraints
      .filter((c) => c.constraintType === "hard")
      .map((c) => ({
        name: c.name,
        type: c.type,
        ...(c.type === "categorical" && { value: c.value }),
        ...(c.type === "numerical" && { min: c.min ?? null, max: c.max ?? null }),
      }));
  
    if (softConstraints.length === 0 && hardConstraints.length === 0) {
      setSubmitError("Please add at least one constraint before submitting.");
      return;
    }

    const body = {
      domain: domain,
      intent: intent || null,
      algorithm: algorithm || null,
      method: method || null,
      hard_constraints: hardConstraints,
      soft_constraints: softConstraints,
    };
    try {
      const response = await authenticatedFetch("/experiment/call_mdp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (data.status === "error" && data.status_code === 404) {
        setSubmitError(data.error || "No experiments found with the given constraints.");
        setIsLoading(false);  
        return;
      }

      if (!response.ok) throw new Error("MDP call failed");
      const experiments = data.data || data;
      sessionStorage.setItem("experiments", JSON.stringify(experiments));
      sessionStorage.setItem(
        "searchParams",
        JSON.stringify({ domain, hardConstraints, softConstraints })
      );

      navigate("/results", {
        state: {
          experiments,
          searchParams: { domain, hardConstraints, softConstraints },
        },
      });

    } catch (error) {
      alert("Search failed: " + (error instanceof Error ? error.message : "Unknown error"));
    }
    finally {
      setIsLoading(false);  
    }
  };

  const softConstraints = constraints.filter((c) => c.constraintType === "soft");
  const hardConstraints = constraints.filter((c) => c.constraintType === "hard");

  return (
    <Layout isLoggedIn>
      <div className="min-h-[calc(100vh-11.45rem)] px-4 py-8 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-blue-950">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Options Explorer</h1>
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
              <h2 className="text-xl font-bold mb-4">Required Parameters</h2>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Domain <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    required
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors appearance-none"
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
            </div>
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
              <h2 className="text-xl font-bold mb-4">Optional Parameters</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Intent</label>
                  <input
                    type="text"
                    value={intent}
                    onChange={(e) => setIntent(e.target.value)}
                    placeholder="e.g. anomaly detection"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Algorithm</label>
                  <input
                    type="text"
                    value={algorithm}
                    onChange={(e) => setAlgorithm(e.target.value)}
                    placeholder="e.g. RNN"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Method</label>
                  <input
                    type="text"
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                    placeholder="e.g. Q-learning"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors"
                  />
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-foreground">Add Constraints</h2>
                {isAdding && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
              {!isAdding ? (
                <button
                  type="button"
                  onClick={() => setIsAdding(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Add Constraint
                </button>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Database Field
                    </label>
                    <div className="relative">
                      <select
                        required
                        value={selectedField?.name || ""}
                        onChange={(e) => {
                          const field = availableFields.find((f) => f.name === e.target.value);
                          setSelectedField(field || null);
                          setCategoricalValue("");
                          setNumericalMin("");
                          setNumericalMax("");
                        }}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors appearance-none"
                      >
                        <option value="">Select a field...</option>
                        {availableFields.map((field) => (
                          <option key={field.name} value={field.name}>
                            {field.name} ({field.type})
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-3 top-2.5 pointer-events-none text-muted-foreground">
                        ▼
                      </div>
                    </div>
                  </div>
                  {selectedField && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-3">
                          Constraint Type
                        </label>
                        <div className="flex gap-3">
                          {(["soft", "hard"] as const).map((type) => (
                            <label key={type} className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                value={type}
                                checked={constraintType === type}
                                onChange={(e) => setConstraintType(e.target.value as "soft" | "hard")}
                                className="w-4 h-4"
                              />
                              <span className="text-sm font-medium text-foreground capitalize">
                                {type}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                      {selectedField.type === "categorical" && (
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Value
                          </label>
                          <input
                            type="text"
                            required
                            value={categoricalValue}
                            onChange={(e) => setCategoricalValue(e.target.value)}
                            placeholder="Enter value"
                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors"
                          />
                        </div>
                      )}
                      {selectedField.type === "numerical" && (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                              Minimum Value
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={numericalMin}
                              onChange={(e) =>
                                setNumericalMin(e.target.value === "" ? "" : parseFloat(e.target.value))
                              }
                              placeholder="Min"
                              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                              Maximum Value
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={numericalMax}
                              onChange={(e) =>
                                setNumericalMax(e.target.value === "" ? "" : parseFloat(e.target.value))
                              }
                              placeholder="Max"
                              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors"
                            />
                          </div>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={handleAddConstraint}
                        className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <Check className="w-4 h-4" />
                        {editingId ? "Update Constraint" : "Add Constraint"}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
            {softConstraints.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6">
                <h2 className="text-lg font-bold text-foreground mb-4">
                  Soft Constraints ({softConstraints.length})
                </h2>
                <div className="space-y-3">
                  {softConstraints.map((constraint) => (
                    <div
                      key={constraint.id}
                      draggable
                      onDragStart={() => handleDragStart(constraint.id)}
                      onDragOver={handleDragOver}
                      onDrop={() => handleDrop(constraint.id)}
                      className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg hover:shadow-md transition-all"
                    >
                      <GripVertical className="w-5 h-5 text-muted-foreground flex-shrink-0 cursor-grab" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground">
                          {constraint.name}
                          {constraint.type === "categorical" && (
                            <span className="ml-2 text-sm font-normal text-muted-foreground">
                              = {constraint.value}
                            </span>
                          )}
                          {constraint.type === "numerical" && (
                            <span className="ml-2 text-sm font-normal text-muted-foreground">
                              {constraint.min !== undefined && constraint.max !== undefined
                                ? `[${constraint.min}, ${constraint.max}]`
                                : constraint.min !== undefined
                                  ? `≥ ${constraint.min}`
                                  : `≤ ${constraint.max}`}
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">Soft Constraint</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleEditConstraint(constraint)}
                        className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-800 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveConstraint(constraint.id)}
                        className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-800 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {hardConstraints.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6">
                <h2 className="text-lg font-bold text-foreground mb-4">
                  Hard Constraints ({hardConstraints.length})
                </h2>
                <div className="space-y-3">
                  {hardConstraints.map((constraint) => (
                    <div
                      key={constraint.id}
                      draggable
                      onDragStart={() => handleDragStart(constraint.id)}
                      onDragOver={handleDragOver}
                      onDrop={() => handleDrop(constraint.id)}
                      className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg hover:shadow-md transition-all"
                    >
                      <GripVertical className="w-5 h-5 text-muted-foreground flex-shrink-0 cursor-grab" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground">
                          {constraint.name}
                          {constraint.type === "categorical" && (
                            <span className="ml-2 text-sm font-normal text-muted-foreground">
                              = {constraint.value}
                            </span>
                          )}
                          {constraint.type === "numerical" && (
                            <span className="ml-2 text-sm font-normal text-muted-foreground">
                              {constraint.min !== undefined && constraint.max !== undefined
                                ? `[${constraint.min}, ${constraint.max}]`
                                : constraint.min !== undefined
                                  ? `≥ ${constraint.min}`
                                  : `≤ ${constraint.max}`}
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">Hard Constraint</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleEditConstraint(constraint)}
                        className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-800 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveConstraint(constraint.id)}
                        className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-800 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {isLoading && (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent"></div>
              </div>
            )}
            <div className="flex flex-col gap-2">
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`flex-1 px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-3 
                    ${isLoading 
                      ? "bg-gray-400 cursor-not-allowed" 
                      : "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                    }
                  `}
                  >
                  {isLoading ? (
                    "Running MDP process..."
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      Run MDP Process
                    </>
                  )}
                </button>
              </div>
              {submitError && (
                <p className="text-red-600 text-lg font-bold mt-4">{submitError}</p>
              )}
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}

