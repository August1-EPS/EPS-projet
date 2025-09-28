// src/pages/EleveDashboard.jsx
import { useState } from "react";
import { joinClassByCode } from "../utils/storage";
import { QrReader } from "react-qr-reader";
import "../styles/App.css";
import logo from "../assets/logo.png";
import power from "../assets/power.png"; // ✅ icône déconnexion

export default function EleveDashboard({ user, onJoinClass, onLogout }) {
  const [code, setCode] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const [error, setError] = useState("");

  function handleJoin(inputCode) {
    try {
      const classe = joinClassByCode(
        inputCode,
        user.nom,
        user.prenom,
        user.email
      );

      // ✅ Met à jour le user courant avec sa classe
      const updatedUser = { ...user, classId: classe.id };
      localStorage.setItem("currentUser", JSON.stringify(updatedUser));

      setCode("");
      setShowScanner(false);
      setError("");

      // ✅ Redirection directe vers EleveClasse
      onJoinClass(classe);
    } catch (err) {
      setError("❌ Code invalide ou expiré");
    }
  }

  return (
    <div className="wrap page-content">
      {/* ✅ Header repositionnable */}
      <div className="eleve-header">
        <img src={logo} alt="Logo EPS" className="logo-prof" />
        <h2 className="titre-prof">
          Bienvenue {user.prenom} {user.nom}
        </h2>
        <img
          src={power}
          alt="Déconnexion"
          className="logout-icon"
          onClick={onLogout}
        />
      </div>

      {/* ✅ Titre déplaçable */}
      <h3 className="rejoindre-title">Rejoindre une classe</h3>

      {/* ✅ Bloc code + boutons */}
      <div className="join-block">
        {/* Champ code au-dessus */}
        <input
          type="text"
          className={`input join-code-input ${error ? "input-error" : ""}`}
          placeholder="Entrer un code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />

        {/* Deux boutons côte à côte en dessous */}
        <div className="buttons-row">
          <button
            className="btn btn-green join-btn"
            onClick={() => handleJoin(code)}
          >
            Rejoindre
          </button>
          <button
            className="btn btn-blue qr-btn"
            onClick={() => setShowScanner(!showScanner)}
          >
            {showScanner ? "❌ Fermer le scanner" : "Scanner un QR code"}
          </button>
        </div>
      </div>

      {error && <p style={{ color: "red", marginTop: "8px" }}>{error}</p>}

      {/* ✅ Scanner QR code */}
      {showScanner && (
        <div className="qr-scanner">
          <QrReader
            onResult={(result) => {
              if (!!result) {
                handleJoin(result?.text);
              }
            }}
            constraints={{ facingMode: "environment" }}
          />
        </div>
      )}
    </div>
  );
}
