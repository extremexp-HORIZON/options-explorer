import { useState } from "react";
import Layout from "@/components/Layout";
import { ChevronLeft, ChevronRight, Star, AlertCircle } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { authenticatedFetch } from "@/lib/api";
import { clearAuthData } from "@/lib/auth";

interface Experiment {
  [key: string]: any;
}

export default function Results() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isLoading } = useRequireAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectingExperiment, setSelectingExperiment] = useState<string | null>(null);
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const experiments: Experiment[] = location.state?.experiments || JSON.parse(sessionStorage.getItem("experiments") || "[]");
  const searchParams = location.state?.searchParams || JSON.parse(sessionStorage.getItem("searchParams") || "null");
  const ignoredKeys = ["experiment_id", "title", "feedback", "descriptions"];
  const formatLabel = (key: string) =>
    key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  function getVisiblePages(current: number, total: number) {
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const pages = [];

    if (current <= 4) {
      pages.push(1, 2, 3, 4, 5, "...", total);
    } else if (current >= total - 3) {
      pages.push(1, "...", total - 4, total - 3, total - 2, total - 1, total);
    } else {
      pages.push(
        1,
        "...",
        current - 1,
        current,
        current + 1,
        "...",
        total
      );
    }

    return pages;
  }

  if (location.state?.experiments) {
    sessionStorage.setItem("experiments", JSON.stringify(location.state.experiments));
  }
  if (location.state?.searchParams) {
    sessionStorage.setItem("searchParams", JSON.stringify(location.state.searchParams));
  }

  if (!isLoading && experiments.length === 0) {
    return (
      <Layout isLoggedIn>
        <div className="min-h-[calc(100vh-11.45rem)] flex items-center justify-center px-4 py-12 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-blue-950">
          <div className="text-center max-w-md">
            <h2 className="text-2xl font-bold text-foreground mb-4">No Data Available</h2>
            <p className="text-muted-foreground mb-6">
              Please run a search from the Function Explorer to view results.
            </p>
            <Link
              to="/explorer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Explorer
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  const totalPages = Math.ceil(experiments.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const endIdx = startIdx + itemsPerPage;
  const currentExperiments = experiments.slice(startIdx, endIdx);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSelectExperiment = async (experimentId: string, experiment: Experiment) => {
    setSelectingExperiment(experimentId);
    setSelectionError(null);

    try {
      const response = await authenticatedFetch(`/experiment/select_experiment?experiment_id=${experimentId}`, {
        method: "GET",
      });

      if (response.status === 401) {
        clearAuthData();
        navigate("/login", { replace: true });
        return;
      }

      if (!response.ok) {
        if (response.status === 404) {
          setSelectionError("Experiment not found");
        } else {
          setSelectionError("Failed to select experiment");
        }
        setSelectingExperiment(null);
        return;
      }

      navigate(`/experiment/${experimentId}`, {
        state: { experiment, searchParams },
      });
    } catch (error) {
      console.error("Error selecting experiment:", error);
      setSelectionError("Failed to select experiment");
      setSelectingExperiment(null);
    }
  };

  if (isLoading) {
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
        <div className="max-w-6xl mx-auto">
          <div className="mb-8 flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Search Results</h1>
              <p className="text-muted-foreground mt-2">
                Found {experiments.length} experiments matching your criteria
              </p>
            </div>
            <Link
              to="/explorer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-200 dark:bg-slate-800 text-foreground rounded-lg font-medium hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              New Search
            </Link>
          </div>
          {searchParams && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6 mb-8">
              <h2 className="text-lg font-bold text-foreground mb-4">Search Parameters</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase">Domain</p>
                  <p className="text-sm font-medium text-foreground">{searchParams.domain}</p>
                </div>
                {searchParams.intent && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase">Intent</p>
                    <p className="text-sm font-medium text-foreground">{searchParams.intent}</p>
                  </div>
                )}
                {searchParams.algorithm && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase">Algorithm</p>
                    <p className="text-sm font-medium text-foreground">{searchParams.algorithm}</p>
                  </div>
                )}
                {searchParams.method && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase">Method</p>
                    <p className="text-sm font-medium text-foreground">{searchParams.method}</p>
                  </div>
                )}
              </div>
              {(searchParams.hardConstraints?.length > 0 || searchParams.softConstraints?.length > 0) && (
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <p className="text-xs font-medium text-muted-foreground uppercase mb-2">Constraints</p>
                  <div className="flex flex-wrap gap-2">
                    {searchParams.hardConstraints?.map((constraint: any, idx: number) => (
                      <span
                        key={`hard-${idx}`}
                        className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs font-medium rounded-full"
                      >
                        {constraint.name}: {constraint.value || `[${constraint.min || "-"}, ${constraint.max || "-"}]`}
                      </span>
                    ))}
                    {searchParams.softConstraints?.map((constraint: any, idx: number) => (
                      <span
                        key={`soft-${idx}`}
                        className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-full"
                      >
                        {constraint.name}: {constraint.value || `[${constraint.min || "-"}, ${constraint.max || "-"}]`}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          {selectionError && (
            <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3 mb-8">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-200">{selectionError}</p>
            </div>
          )}
          <div className="grid gap-4 mb-8">
            {currentExperiments.map((experiment) => (
              <button
                key={experiment.experiment_id}
                onClick={() => handleSelectExperiment(experiment.experiment_id, experiment)}
                disabled={selectingExperiment !== null}
                className="block text-left bg-white dark:bg-slate-900 rounded-xl shadow-md hover:shadow-lg border border-slate-200 dark:border-slate-700 transition-all hover:-translate-y-0.5 p-6 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="text-lg font-bold text-foreground truncate">
                        {experiment.title}
                      </h3>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                      {Object.entries(experiment)
                        .filter(([key, value]) =>
                          value !== null &&
                          value !== undefined &&
                          value !== "" &&
                          !ignoredKeys.includes(key)
                        )
                        .map(([key, value]) => (
                          <div key={key}>
                            <p className="text-xs text-muted-foreground uppercase">
                              {formatLabel(key)}
                            </p>
                            <p className="text-sm font-medium truncate">
                              {String(value)}
                            </p>
                          </div>
                        ))}
                    </div>
                  </div>
                  <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </div>
              </button>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white dark:bg-slate-900 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 p-4">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border text-foreground hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              <div className="flex items-center gap-2 flex-wrap max-w-full justify-center">
                {getVisiblePages(currentPage, totalPages).map((page, idx) => (
                  <button
                    key={idx}
                    onClick={() => typeof page === "number" && goToPage(page)}
                    disabled={page === "..."}
                    className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                      page === currentPage
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                      : page === "..."
                      ? "border text-muted-foreground cursor-default"
                      : "border text-foreground hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border text-foreground hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

