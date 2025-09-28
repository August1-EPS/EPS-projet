import { useState } from "react";
import { getCurrentUser, logoutUser } from "./auth";
import Login from "./Login";
import Register from "./Register";
import ProfDashboard from "./ProfDashboard";
import EleveDashboard from "./EleveDashboard";
import "./App.css";

export default function App() {
  const [user, setUser] = useState(getCurrentUser());
  const [page, setPage] = useState(user ? user.role : "login");

  function handleLogin(u) {
    setUser(u);
    setPage(u.role); // redirige automatiquement vers prof ou élève
  }

  function handleLogout() {
    logoutUser();
    setUser(null);
    setPage("login");
  }

  // ✅ Prof connecté
  if (user && page === "prof") {
    return (
      <ProfDashboard onLogout={handleLogout} onBack={() => setPage("login")} />
    );
  }

  // ✅ Élève connecté
  if (user && page === "eleve") {
    return (
      <EleveDashboard onLogout={handleLogout} onBack={() => setPage("login")} />
    );
  }

  // ✅ Page inscription
  if (page === "register") {
    return (
      <Register
        onRegistered={() => setPage("login")}
        onBack={() => setPage("login")}
      />
    );
  }

  // ✅ Page connexion
  return (
    <Login
      onLogin={handleLogin}
      onSwitch={() => setPage("register")}
      onBack={() => setPage("login")}
    />
  );
}
