// src/pages/OutilsSport.jsx
import "../styles/App.css";
import logo from "../assets/logo.png";
import BackButton from "../components/BackButton.jsx";

export default function OutilsSport({ sport, classe, onBack, onSelectTool }) {
  // Exemple : outil test visible uniquement pour foot ou badminton
  const showTool = sport === "foot" || sport === "badminton";

  return (
    <div className="wrap">
      {/* Logo petit en haut à gauche */}
      <img src={logo} alt="Logo EPS" className="logo logo-small" />

      {/* Bouton retour en haut à droite */}
      <BackButton onBack={onBack} />

      <h2>Outils — {sport}</h2>
      <p style={{ opacity: 0.8, marginTop: -8 }}>Classe : {classe?.nom}</p>

      <div className="tools-list" style={{ width: "100%", maxWidth: 480 }}>
        {showTool ? (
          <button
            className="btn btn-blue"
            onClick={() =>
              onSelectTool({
                toolId: "empty-test",
                sport,
                classId: classe?.id,
              })
            }
          >
            <div style={{ fontWeight: 800 }}>🧪 Outil test</div>
            <div style={{ fontSize: ".9rem", opacity: 0.9, marginTop: 4 }}>
              Page vide (test de navigation)
            </div>
          </button>
        ) : sport === "orientation" ? (
          <>
            {/* ✅ Bouton élève */}
            <button
              className="btn btn-blue"
              onClick={() =>
                onSelectTool({
                  toolId: "outil-qfq-eleve", // ⚡ doit matcher ton routeur
                  sport,
                  classId: classe?.id,
                })
              }
            >
              <div style={{ fontWeight: 800 }}>🎯 Qui fait quoi — Élève</div>
              <div style={{ fontSize: ".9rem", opacity: 0.9, marginTop: 4 }}>
                Version élève (réponses et validation)
              </div>
            </button>

            {/* ✅ Bouton prof */}
            <button
              className="btn btn-green"
              onClick={() =>
                onSelectTool({
                  toolId: "outil-qfq-prof", // ⚡ doit matcher ton routeur
                  sport,
                  classId: classe?.id,
                })
              }
            >
              <div style={{ fontWeight: 800 }}>🧑‍🏫 Qui fait quoi — Prof</div>
              <div style={{ fontSize: ".9rem", opacity: 0.9, marginTop: 4 }}>
                Version professeur (gestion et suivi)
              </div>
            </button>
          </>
        ) : (
          <p>Aucun outil défini pour ce sport.</p>
        )}
      </div>
    </div>
  );
}
