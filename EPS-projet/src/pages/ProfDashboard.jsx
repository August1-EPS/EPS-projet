// src/pages/ProfDashboard.jsx
import { useState, useEffect, useRef } from "react";
import { createClass, getClasses, updateClass } from "../utils/storage";
import "../styles/App.css";
import logo from "../assets/logo.png";
import power from "../assets/power.png"; // ✅ Icône logout

function getSportColor(sport) {
  const colors = {
    athletisme: "#ff9800",
    badminton: "#4caf50",
    basket: "#8e24aa",
    boxe: "#c62828",
    escalade: "#ef6c00",
    foot: "#f44336",
    gym: "#9c27b0",
    hand: "#fdd835",
    judo: "#283593",
    lutte: "#6d4c41",
    natation: "#00bcd4",
    rugby: "#bf360c",
    tennis: "#1b5e20",
    pingpong: "#43a047",
    volley: "#2196f3",
    danse: "#e91e63",
    cirque: "#ab47bc",
    orientation: "#795548",
    ultimate: "#009688",
    vtt: "#2e7d32",
    aviron: "#0277bd",
    "escalade-nature": "#8d6e63",
  };
  return colors[sport] || "#666";
}

export default function ProfDashboard({
  user,
  onLogout,
  onSelectClass,
  onSelectSport,
}) {
  const [classes, setClasses] = useState(getClasses());
  const [showPopup, setShowPopup] = useState(false);
  const [nomClasse, setNomClasse] = useState("");
  const [couleurClasse, setCouleurClasse] = useState("#004aad");
  const [classChoices, setClassChoices] = useState(null);
  const [editingClass, setEditingClass] = useState(null);

  // ✅ Gestion clic simple vs double clic
  const clickTimeout = useRef(null);

  function handleClassClick(c) {
    if (clickTimeout.current) {
      clearTimeout(clickTimeout.current);
      clickTimeout.current = null;

      // 👉 Double clic → édition
      setEditingClass(c);
      setNomClasse(c.nom);
      setCouleurClasse(c.color || "#004aad");
      setShowPopup(true);
    } else {
      // 👉 Simple clic → ouvrir la classe
      clickTimeout.current = setTimeout(() => {
        onSelectClass(c.id);
        clickTimeout.current = null;
      }, 250);
    }
  }

  // ✅ Création / Edition
  function handleSaveClass(e) {
    e.preventDefault();
    if (!nomClasse) return;

    if (editingClass) {
      const updated = { ...editingClass, nom: nomClasse, color: couleurClasse };
      updateClass(updated);
    } else {
      createClass(nomClasse, couleurClasse);
    }

    setClasses(getClasses());
    setNomClasse("");
    setCouleurClasse("#004aad");
    setEditingClass(null);
    setShowPopup(false);
  }

  // ✅ Drag & Drop
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  function handleDragStart(index) {
    setDraggedIndex(index);
  }

  function handleDragOver(index) {
    if (index !== dragOverIndex) {
      setDragOverIndex(index);
    }
  }

  function handleDrop(index) {
    if (draggedIndex === null) return;
    const reordered = [...classes];
    const [moved] = reordered.splice(draggedIndex, 1);
    reordered.splice(index, 0, moved);

    // ✅ sauvegarde avec toutes les clés
    const data = JSON.parse(localStorage.getItem("data")) || { classes: [] };
    data.classes = reordered;
    localStorage.setItem("data", JSON.stringify(data));

    setClasses(reordered);
    setDraggedIndex(null);
    setDragOverIndex(null);
  }

  useEffect(() => {
    const interval = setInterval(() => {
      setClasses(getClasses());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="wrap page-content">
      {/* ✅ Header */}
      <div className="prof-header">
        <img src={logo} alt="Logo EPS" className="logo-prof" />
        <h2 className="titre-prof">Mon espace professeur</h2>
        <img
          src={power}
          alt="Déconnexion"
          className="logout-icon"
          onClick={onLogout}
        />
      </div>

      {/* ✅ Bouton création classe */}
      <button
        className="btn btn-green"
        onClick={() => {
          setEditingClass(null);
          setNomClasse("");
          setCouleurClasse("#004aad");
          setShowPopup(true);
        }}
      >
        Créer une classe
      </button>

      {/* ✅ Liste des classes draggable */}
      <div className="classes-list">
        {classes.length === 0 ? (
          <p>Aucune classe pour l’instant.</p>
        ) : (
          <div className="classes-grid">
            {classes.map((c, index) => (
              <button
                key={c.id}
                className={`btn class-btn ${
                  dragOverIndex === index ? "class-drag-over" : ""
                }`}
                style={{
                  backgroundColor: c.color || "#004aad",
                  color: "#fff",
                  opacity: draggedIndex === index ? 0.5 : 1, // semi-transparent quand on drag
                }}
                onClick={() => handleClassClick(c)}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => {
                  e.preventDefault();
                  handleDragOver(index);
                }}
                onDrop={() => handleDrop(index)}
              >
                {c.nom}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ✅ Calendrier */}
      <div className="calendar">
        <table>
          <thead>
            <tr>
              <th className="horaire-col">Horaire</th>
              <th>Lundi</th>
              <th>Mardi</th>
              <th>Mercredi</th>
              <th>Jeudi</th>
              <th>Vendredi</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 10 }, (_, i) => {
              const heure = `${8 + i}h00`;
              return (
                <tr key={i}>
                  <td className="horaire-col">{heure}</td>
                  {["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"].map(
                    (day) => {
                      const key = `${day}-${i}`;
                      const cours = classes
                        .map((c) => ({
                          id: c.id,
                          nomClasse: c.nom,
                          sport: c.calendrier[key],
                        }))
                        .filter((c) => c.sport);

                      const uniqueCours = cours.slice(0, 2);
                      let cellStyle = {};
                      if (uniqueCours.length === 1) {
                        cellStyle = {
                          background: getSportColor(uniqueCours[0].sport),
                          color: "#fff",
                          cursor: "pointer",
                        };
                      } else if (uniqueCours.length === 2) {
                        cellStyle = {
                          background: `linear-gradient(135deg, ${getSportColor(
                            uniqueCours[0].sport
                          )} 50%, ${getSportColor(uniqueCours[1].sport)} 50%)`,
                          color: "#fff",
                          cursor: "pointer",
                        };
                      }

                      return (
                        <td
                          key={key}
                          style={cellStyle}
                          onClick={() => {
                            if (uniqueCours.length === 1) {
                              onSelectSport(
                                uniqueCours[0].sport,
                                uniqueCours[0].id
                              );
                            } else if (uniqueCours.length === 2) {
                              setClassChoices(uniqueCours);
                            }
                          }}
                        >
                          {uniqueCours.map((c) => c.nomClasse).join(" / ")}
                        </td>
                      );
                    }
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ✅ Popup création/édition classe */}
      {showPopup && (
        <div className="overlay">
          <div className="popup">
            <button className="close-btn" onClick={() => setShowPopup(false)}>
              ✖
            </button>
            <h3>
              {editingClass
                ? "Modifier la classe"
                : "Créer une nouvelle classe"}
            </h3>
            <form onSubmit={handleSaveClass}>
              <input
                type="text"
                className="input"
                placeholder="Nom de la classe"
                value={nomClasse}
                onChange={(e) => setNomClasse(e.target.value)}
              />
              <div className="color-row">
                <label>Couleur du bouton :</label>
                <input
                  type="color"
                  value={couleurClasse}
                  onChange={(e) => setCouleurClasse(e.target.value)}
                />
              </div>
              <button type="submit" className="btn btn-green">
                {editingClass ? "Enregistrer" : "Créer"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ✅ Popup choix quand 2 classes en même temps */}
      {classChoices && (
        <div className="overlay">
          <div className="popup">
            <button className="close-btn" onClick={() => setClassChoices(null)}>
              ✖
            </button>
            <h3>Choisissez une classe</h3>
            {classChoices.map((c) => (
              <button
                key={c.id}
                className="btn btn-blue"
                style={{ marginTop: "8px" }}
                onClick={() => {
                  onSelectSport(c.sport, c.id);
                  setClassChoices(null);
                }}
              >
                {c.nomClasse} — {c.sport}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
