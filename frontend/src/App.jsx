import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import MapView from "./components/MapView";
import LoginPage from "./components/LoginPage";
import LandingPage from "./components/LandingPage";
import AboutPage from "./components/AboutPage";

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
