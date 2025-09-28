// src/pages/Login.jsx
import { useState } from "react";
import { loginUser, resetPassword } from "../utils/auth";
import BackButton from "../components/BackButton.jsx";
import "../styles/App.css";
import logo from "../assets/logo.png";

export default function Login({ onLogin, onSwitch, onBack }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [showForgotPopup, setShowForgotPopup] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetPasswordValue, setResetPasswordValue] = useState("");
  const [resetMessage, setResetMessage] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    try {
      const user = loginUser(email, password);
      onLogin(user);
    } catch {
      setMessage("❌ Identifiants incorrects");
    }
  }

  function handleResetPassword(e) {
    e.preventDefault();
    if (resetPasswordValue.length < 6) {
      setResetMessage(
        "⚠️ Le mot de passe doit contenir au moins 6 caractères."
      );
      return;
    }
    try {
      resetPassword(resetEmail, resetPasswordValue);
      setResetMessage("✅ Mot de passe réinitialisé !");
      setTimeout(() => {
        setShowForgotPopup(false);
        setResetEmail("");
        setResetPasswordValue("");
        setResetMessage("");
      }, 1500);
    } catch (err) {
      setResetMessage("❌ " + err.message);
    }
  }

  return (
    <div className="wrap page-content">
      <BackButton onBack={onBack} />

      {/* Gros logo centré */}
      <img src={logo} alt="Logo EPS" className="logo-home" />

      <h2>Connexion</h2>

      <form onSubmit={handleSubmit}>
        <input
          type="email"
          className="input"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          className="input"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit" className="btn btn-green">
          Se connecter
        </button>
      </form>

      {message && <p style={{ marginTop: "10px" }}>{message}</p>}

      <div className="links">
        <p>
          <a href="#" onClick={onSwitch}>
            Pas encore de compte ? S’inscrire
          </a>
        </p>
        <p>
          <a href="#" onClick={() => setShowForgotPopup(true)}>
            Mot de passe oublié ?
          </a>
        </p>
      </div>

      {/* Popup reset mot de passe */}
      {showForgotPopup && (
        <div className="overlay">
          <div className="popup">
            <button
              className="close-btn"
              onClick={() => setShowForgotPopup(false)}
            >
              ✖
            </button>
            <h3>Réinitialiser le mot de passe</h3>
            <form onSubmit={handleResetPassword}>
              <input
                type="email"
                className="input"
                placeholder="Votre email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
              />
              <input
                type="password"
                className="input"
                placeholder="Nouveau mot de passe"
                value={resetPasswordValue}
                onChange={(e) => setResetPasswordValue(e.target.value)}
              />
              {resetMessage && <p>{resetMessage}</p>}
              <button type="submit" className="btn btn-green">
                Réinitialiser
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
