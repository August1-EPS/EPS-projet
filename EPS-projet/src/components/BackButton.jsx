// src/components/BackButton.jsx
import "../styles/App.css";

export default function BackButton({ onBack }) {
  return (
    <button className="back-btn" onClick={onBack}>
      ← Retour
    </button>
  );
}
