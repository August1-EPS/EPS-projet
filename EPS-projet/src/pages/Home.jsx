// src/pages/Home.jsx
import "../styles/App.css";
import logo from "../assets/logo.png";

export default function Home({ onGoLogin, onGoRegister }) {
  return (
    <div className="wrap page-content">
      {/* Gros logo centré */}
      <img src={logo} alt="Logo EPS" className="logo-home" />

      <button className="btn btn-green" onClick={onGoRegister}>
        S’inscrire
      </button>
      <button className="btn btn-blue" onClick={onGoLogin}>
        Se connecter
      </button>
    </div>
  );
}
