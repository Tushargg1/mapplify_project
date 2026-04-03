import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import MapView from "./pages/MapView";
import LoginPage from "./pages/LoginPage";
import LandingPage from "./pages/LandingPage";
import AboutPage from "./pages/AboutPage";

const AUTH_STORAGE_KEY = "mapplify_auth_user";

function ProtectedMap() {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return <Navigate to="/login" replace />;

  try {
    JSON.parse(raw);
    return <MapView />;
  } catch (e) {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return <Navigate to="/login" replace />;
  }
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/map" element={<ProtectedMap />} />
      </Routes>
    </BrowserRouter>
  );
}
