import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import Layout from "@/components/Layout";
import { ArrowLeft, Star, Send } from "lucide-react";
import { authenticatedFetch } from "@/lib/api";
import { clearAuthData } from "@/lib/auth";
import { useRequireAuth } from "@/lib/useRequireAuth";

interface ExperimentData {
  [key: string]: any;
}

export default function ExperimentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoading } = useRequireAuth();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [selectedExperimentsData, setSelectedExperimentsData] = useState<any>(null);
  const [loadingSelectedData, setLoadingSelectedData] = useState(false);
  const experiment: ExperimentData | null = location.state?.experiment || null;
  const searchParams = location.state?.searchParams || null;
  const ignoredKeys = ["experiment_id", "title", "feedback", "descriptions"];
  const formatLabel = (key: string) =>
    key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  useEffect(() => {
    if (!id) return;

    const fetchSelectedExperimentsData = async () => {
      setLoadingSelectedData(true);
      try {
        const response = await authenticatedFetch("/experiment/get_selected_experiments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            experiment_ids: [{ id: Number(id) }], 
          }),
        });

        if (response.status === 401) {
          clearAuthData();
          navigate("/login", { replace: true });
          return;
        }

        if (response.ok) {
          const data = await response.json();
          setSelectedExperimentsData(data);
        }
      } catch (error) {
        console.error("Failed to fetch selected experiments data:", error);
      } finally {
        setLoadingSelectedData(false);
      }
    };

    fetchSelectedExperimentsData();
  }, [id, navigate]);

  if (!isLoading && !experiment) {
    return (
      <Layout isLoggedIn>
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <h2 className="text-2xl font-bold text-foreground mb-4">No Data Available</h2>
            <p className="text-muted-foreground mb-6">
              Please select an experiment from the search results.
            </p>
            <button
              onClick={() => navigate("/results", { replace: true })}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Results
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  const handleSubmitRating = async () => {
    if (!experiment || rating === 0) {
      alert("Please select a rating");
      return;
    }

    setSubmitting(true);
    setFeedback("");

    try {
      const response = await authenticatedFetch("/experiment/add_user_feedback", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          experiment_id: experiment.experiment_id.toString(),
          rating: rating.toString(),
        }).toString(),
      });

      if (response.status === 401) {
        clearAuthData();
        navigate("/login", { replace: true });
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to submit rating");
      }

      setFeedback("Thank you for your feedback!");
      setTimeout(() => {
        navigate("/results");
      }, 2000);
    } catch (error) {
      setFeedback(
        "Error submitting feedback: " + (error instanceof Error ? error.message : "Unknown error")
      );
    } finally {
      setSubmitting(false);
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
        <div className="max-w-5xl mx-auto">
          <button
            onClick={() => navigate("/results")}
            className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Results
          </button>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-8 mb-6">
            <h1 className="text-3xl font-bold text-foreground mb-4">{experiment?.title}</h1>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
              {Object.entries(experiment)
                .filter(([key, value]) =>
                  value !== null &&
                  value !== undefined &&
                  value !== "" &&
                  !ignoredKeys.includes(key)
                )
                .map(([key, value]) => (
                  <div key={key}>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      {formatLabel(key)}
                    </p>
                    <p className="text-lg font-semibold text-foreground mt-1">
                      {String(value)}
                    </p>
                  </div>
                ))}
            </div>
            {!loadingSelectedData && selectedExperimentsData && (
              <div className="border-t border-slate-200 dark:border-slate-700 pt-6 mt-6">
                <p className="text-xs font-medium text-muted-foreground uppercase mb-3">Search History</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {selectedExperimentsData.data?.length > 0 && (
                    <>
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <p className="text-xs text-muted-foreground uppercase font-medium">Times Selected</p>
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                          {selectedExperimentsData.data[0]?.experiment_count || 0}
                        </p>
                      </div>
                      {selectedExperimentsData.data[0]?.last_selected && (
                        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                          <p className="text-xs text-muted-foreground uppercase font-medium">Last Selected</p>
                          <p className="text-sm font-medium text-purple-700 dark:text-purple-300 mt-1">
                            {new Date(selectedExperimentsData.data[0].last_selected).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
          {searchParams && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-8 mb-6">
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
          {experiment?.descriptions && experiment.descriptions.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-8 mb-6">
              <h2 className="text-2xl font-bold text-foreground mb-6">Experiment Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {experiment.descriptions.map((desc, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"
                  >
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 mt-1.5 flex-shrink-0"></div>
                      <p className="text-foreground font-medium">{desc.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-8">
            <h2 className="text-2xl font-bold text-foreground mb-6">Rate This Experiment</h2>

            <div className="max-w-md">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-8 h-8 ${star <= (hoveredRating || rating)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-slate-300 dark:text-slate-600"
                          } transition-colors`}
                      />
                    </button>
                  ))}
                </div>
                {rating > 0 && (
                  <span className="text-lg font-semibold text-foreground">{rating}.0 / 5.0</span>
                )}
              </div>
              {feedback && (
                <div
                  className={`p-4 rounded-lg mb-6 text-sm font-medium ${feedback.includes("Thank you")
                      ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800"
                      : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800"
                    }`}
                >
                  {feedback}
                </div>
              )}
              <button
                onClick={handleSubmitRating}
                disabled={rating === 0 || submitting}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-slate-400 disabled:to-slate-400 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Submit Rating
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function Info({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-lg font-semibold text-foreground mt-1">{value || "-"}</p>
    </div>
  );
}
