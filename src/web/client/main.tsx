import "./global.css";

import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Explorer from "./pages/Explorer";
import Results from "./pages/Results";
import ExperimentDetail from "./pages/ExperimentDetail";
import NotFound from "./pages/NotFound";
import CreateExperiment from "./pages/CreateExperiment";
import Profile from "./pages/Profile";
import Contact from "./pages/Contact";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/login" />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/explorer" element={<Explorer />} />
            <Route path="/results" element={<Results />} />
            <Route path="/experiment/:id" element={<ExperimentDetail />} />
            <Route path="/create-experiment" element={<CreateExperiment />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
