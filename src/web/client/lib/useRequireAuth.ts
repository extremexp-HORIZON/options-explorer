import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export function useRequireAuth() {
  const navigate = useNavigate();
  const { isLoggedIn, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      navigate("/login", { replace: true });
    }
  }, [isLoggedIn, isLoading, navigate]);

  return { isLoggedIn, isLoading };
}
