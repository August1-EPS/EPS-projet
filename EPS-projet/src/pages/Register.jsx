// src/pages/Register.jsx
import { useState } from "react";
import { registerUser, loginUser } from "../utils/auth";
import BackButton from "../components/BackButton.jsx";
import "../styles/App.css";
import logo from "../assets/logo.png";

export default function Register({ onRegistered, onSwitch, onBack }) {
  const [form, setForm] = useState({
    nom: "",
    prenom: "",
    email: "",
    password: "",
    role: "eleve",
  });
  const [message, setMessage] = useState("");

  function handleChange(field, value) {
    setForm({ ...form, [field]: value });
  }

  function handleSubmit(e) {
    e.preventDefault();

    if (form.password.length < 6) {
      setMessage("⚠️ Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    try {
      registerUser(form);
      const user = loginUser(form.email, form.password); // connexion auto
      onRegistered(user);
    } catch (err) {
      setMessage("❌ " + err.message);
    }
  }

  return (
    <div className="wrap page-content">
      <BackButton onBack={onBack} />

      {/* Gros logo centré */}
      <img src={logo} alt="Logo EPS" className="logo-home" />

      <h2>Inscription</h2>

      <form className="register-form" onSubmit={handleSubmit}>
        <input
          type="text"
          className="input"
          placeholder="Nom"
          value={form.nom}
          onChange={(e) => handleChange("nom", e.target.value)}
        />
        <input
          type="text"
          className="input"
          placeholder="Prénom"
          value={form.prenom}
          onChange={(e) => handleChange("prenom", e.target.value)}
        />
        <input
          type="email"
          className="input"
          placeholder="Email"
          value={form.email}
          onChange={(e) => handleChange("email", e.target.value)}
        />
        <input
          type="password"
          className="input"
          placeholder="Mot de passe"
          value={form.password}
          onChange={(e) => handleChange("password", e.target.value)}
        />

        <select
          className="input"
          value={form.role}
          onChange={(e) => handleChange("role", e.target.value)}
        >
          <option value="eleve">Élève</option>
          <option value="prof">Professeur</option>
        </select>

        <button type="submit" className="btn btn-blue">
          S’inscrire
        </button>
      </form>

      {message && <p className="register-message">{message}</p>}

      <div className="links">
        <p>
          <a href="#" onClick={onSwitch}>
            Déjà un compte ? Se connecter
          </a>
        </p>
      </div>
    </div>
  );
}
