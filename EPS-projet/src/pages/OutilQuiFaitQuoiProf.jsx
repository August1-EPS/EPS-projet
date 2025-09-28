// src/pages/OutilQuiFaitQuoiProf.jsx
import { useState, useEffect, useRef } from "react";
import {
  getClassById,
  createParcours,
  deleteParcours,
  setReponsesParcours,
  setEleveReponse,
  setDepartArrivee,
  removeStudent,
  toggleCompete,
  clearRow,
  clearParcoursFor,
  toggleEleveVisibility,
} from "../utils/storage";
import "../styles/App.css";

export default function OutilQuiFaitQuoiProf({ classe, onBack }) {
  const [currentClass, setCurrentClass] = useState(classe);
  const [showPopup, setShowPopup] = useState(false);
  const [nomParcours, setNomParcours] = useState("");
  const [nbBalises, setNbBalises] = useState(5);

  const [localTimes, setLocalTimes] = useState({});
  const [localReps, setLocalReps] = useState({});
  const focusedCell = useRef(null);

  function handleArrowNav(e, cellId) {
    const inputs = Array.from(document.querySelectorAll("input[data-cell-id]"));
    const index = inputs.findIndex((inp) => inp.dataset.cellId === cellId);
    if (index === -1) return;

    if (e.key === "ArrowRight" && index < inputs.length - 1) {
      e.preventDefault();
      inputs[index + 1].focus();
    }
    if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      inputs[index - 1].focus();
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const currentRect = inputs[index].getBoundingClientRect();
      const next = inputs.find(
        (inp, i) =>
          i > index &&
          Math.abs(inp.getBoundingClientRect().left - currentRect.left) < 10
      );
      if (next) next.focus();
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      const currentRect = inputs[index].getBoundingClientRect();
      const prev = [...inputs]
        .slice(0, index)
        .reverse()
        .find(
          (inp) =>
            Math.abs(inp.getBoundingClientRect().left - currentRect.left) < 10
        );
      if (prev) prev.focus();
    }
  }

  function refreshClass(force = false) {
    if (focusedCell.current && !force) return;
    const updated = getClassById(classe.id);
    setCurrentClass(updated);

    setTimeout(() => {
      if (focusedCell.current) {
        const el = document.querySelector(
          `[data-cell-id="${focusedCell.current}"]`
        );
        if (el) el.focus();
      }
    }, 0);
  }

  useEffect(() => {
    refreshClass(true);
    function handleStorageChange() {
      refreshClass();
    }
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  function handleCreateParcours(e) {
    e.preventDefault();
    if (!nomParcours || nbBalises < 1) return;
    createParcours(currentClass.id, nomParcours, nbBalises);
    setShowPopup(false);
    setNomParcours("");
    setNbBalises(5);
    refreshClass(true);
  }

  function timeToSeconds(time) {
    if (!time) return null;
    const [h, m, s] = time.split(":").map(Number);
    return h * 3600 + m * 60 + (s || 0);
  }

  function formatTime(seconds) {
    if (seconds == null || isNaN(seconds) || seconds < 0) return "—";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
  }

  function handleTimeSave(classId, parcoursId, email, field, value) {
    if (!value) return;
    setDepartArrivee(classId, parcoursId, email, field, value);
    refreshClass(true);
  }

  if (!currentClass) {
    return (
      <div className="wrap page-content">
        <p>Classe introuvable.</p>
        <button className="btn btn-blue" onClick={onBack}>
          ⬅ Retour
        </button>
      </div>
    );
  }

  return (
    <div className="wrap page-content">
      {/* 🔹 Header avec titre + bouton créer parcours */}
      <div className="page-header">
        <h2 className="header-title">Outil — Qui fait quoi (Prof)</h2>
        <button className="btn btn-green" onClick={() => setShowPopup(true)}>
          ➕ Créer un parcours
        </button>
      </div>

      {/* 🔹 Popup création parcours */}
      {showPopup && (
        <div className="popup">
          <div className="popup-content">
            <h3>Créer un parcours</h3>
            <form onSubmit={handleCreateParcours}>
              <label>
                Nom :
                <input
                  type="text"
                  value={nomParcours}
                  onChange={(e) => setNomParcours(e.target.value)}
                />
              </label>
              <label>
                Nombre de balises :
                <input
                  type="number"
                  min="1"
                  value={nbBalises}
                  onChange={(e) => setNbBalises(parseInt(e.target.value))}
                />
              </label>
              <div className="popup-actions">
                <button type="submit" className="btn btn-green">
                  Créer
                </button>
                <button
                  type="button"
                  className="btn btn-blue"
                  onClick={() => setShowPopup(false)}
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🔹 Nom de la classe */}
      <p className="header-class">Classe : {currentClass?.nom || "—"}</p>

      {currentClass.qfq?.map((p) => {
        let elevesToShow = currentClass?.eleves?.map((eleve) => {
          const data = p.eleves?.[eleve.email] || {
            reponses: Array(p.nbBalises).fill(""),
            depart: "00:00:00",
            arrivee: "00:00:00",
            hidden: false,
          };

          const departSec = timeToSeconds(data.depart);
          const arriveeSec = timeToSeconds(data.arrivee);
          const temps =
            departSec != null && arriveeSec != null
              ? arriveeSec - departSec
              : null;
          const points = data.reponses?.reduce(
            (acc, rep, i) => acc + (rep && rep === p.reponses?.[i] ? 1 : 0),
            0
          );

          return { ...eleve, data, temps, points };
        });

        if (p.compete && !focusedCell.current) {
          elevesToShow = elevesToShow.sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            if (a.temps == null) return 1;
            if (b.temps == null) return -1;
            return a.temps - b.temps;
          });
        }

        return (
          <div key={p.id} style={{ marginTop: "25px", width: "100%" }}>
            {/* 🔹 Mode compétition */}
            <label className="header-compet">
              <input
                type="checkbox"
                checked={p.compete || false}
                onChange={(e) => {
                  toggleCompete(currentClass.id, p.id, e.target.checked);
                  refreshClass(true);
                }}
              />{" "}
              Mode Compétition
            </label>

            <h3 style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              {p.nom} {p.compete ? "(Classement activé)" : ""}
              {/* Réinit parcours */}
              <button
                onClick={() => {
                  clearParcoursFor(currentClass.id, p.id);
                  refreshClass(true);
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "white",
                  fontSize: "14px",
                }}
                title="Réinitialiser parcours"
              >
                ♻
              </button>
              {/* Supprimer parcours */}
              <button
                className="btn-close"
                onClick={() => {
                  deleteParcours(currentClass.id, p.id);
                  refreshClass(true);
                }}
                title="Supprimer ce parcours"
              >
                -
              </button>
            </h3>

            <div style={{ overflowX: "auto" }}>
              <table className="students-table" style={{ minWidth: "950px" }}>
                <thead>
                  <tr>
                    {p.compete && <th>Rang</th>}
                    <th>Élève</th>
                    <th>Départ</th>
                    <th>Arrivée</th>
                    {[...Array(p.nbBalises)].map((_, i) => (
                      <th key={i}>Balise {i + 1}</th>
                    ))}
                    <th>Temps</th>
                    <th>Points</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ background: "#444", color: "#fff" }}>
                    {p.compete && <td>—</td>}
                    <td>Réponses officielles</td>
                    <td colSpan={2}></td>
                    {[...Array(p.nbBalises)].map((_, i) => (
                      <td key={i}>
                        <input
                          type="text"
                          className="input"
                          value={p.reponses?.[i] || ""}
                          onChange={(e) => {
                            const newReps = [...(p.reponses || [])];
                            newReps[i] = e.target.value;
                            setReponsesParcours(currentClass.id, p.id, newReps);
                            refreshClass(true);
                          }}
                          data-cell-id={`rep-officiel-${p.id}-${i}`}
                          onKeyDown={(e) =>
                            handleArrowNav(e, `rep-officiel-${p.id}-${i}`)
                          }
                        />
                      </td>
                    ))}
                    <td></td>
                    <td></td>
                  </tr>

                  {elevesToShow.map((el, idx) => {
                    const { data, temps, points } = el;
                    const departKey = `depart-${el.email}`;
                    const arriveeKey = `arrivee-${el.email}`;

                    let rowStyle = {};
                    if (data.hidden) {
                      rowStyle.backgroundColor = "rgba(0,0,0,0.3)";
                    } else if (el.absStatus === "blesse") {
                      rowStyle.backgroundColor = "rgba(0,123,255,0.3)";
                    } else if (el.absStatus === "absent") {
                      rowStyle.backgroundColor = "rgba(220,53,69,0.3)";
                    }

                    return (
                      <tr key={idx} style={rowStyle}>
                        {p.compete && <td>{idx + 1}</td>}
                        <td style={{ position: "relative" }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                            }}
                          >
                            {/* Réinit élève */}
                            <button
                              onClick={() => {
                                clearRow(currentClass.id, p.id, el.email);
                                refreshClass(true);
                              }}
                              style={{
                                background: "transparent",
                                border: "none",
                                cursor: "pointer",
                                color: "white",
                                fontSize: "14px",
                              }}
                              title="Réinitialiser élève"
                            >
                              ♻
                            </button>
                            {el.prenom} {el.nom}
                            {/* Supprimer élève test */}
                            {el.email === "test-apercu@local" && (
                              <button
                                onClick={() => {
                                  removeStudent(
                                    currentClass.id,
                                    "Test",
                                    "(Aperçu)",
                                    "test-apercu@local"
                                  );
                                  refreshClass(true);
                                }}
                                style={{
                                  position: "absolute",
                                  top: "0px",
                                  left: "-2px",
                                  background: "none",
                                  border: "none",
                                  color: "red",
                                  borderRadius: "50%",
                                  width: "18px",
                                  height: "18px",
                                  fontSize: "12px",
                                  lineHeight: "14px",
                                  cursor: "pointer",
                                }}
                                title="Supprimer élève test"
                              >
                                ✖
                              </button>
                            )}
                            {/* Bouton œil */}
                            <button
                              onClick={() => {
                                toggleEleveVisibility(
                                  currentClass.id,
                                  p.id,
                                  el.email
                                );
                                refreshClass(true);
                              }}
                              style={{
                                background: "transparent",
                                border: "none",
                                cursor: "pointer",
                                fontSize: "16px",
                                marginLeft: "4px",
                              }}
                              title={
                                data.hidden
                                  ? "Rendre visible"
                                  : "Masquer pour l’élève"
                              }
                            >
                              {data.hidden ? (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="18"
                                  height="18"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="white"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a21.77 21.77 0 0 1 5.08-6.26M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a21.77 21.77 0 0 1-2.26 3.02M1 1l22 22" />
                                </svg>
                              ) : (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="18"
                                  height="18"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="white"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                  <circle cx="12" cy="12" r="3" />
                                </svg>
                              )}
                            </button>
                          </div>
                        </td>

                        {/* Départ */}
                        <td>
                          <input
                            type="time"
                            step="1"
                            className="input time-input"
                            value={
                              localTimes[departKey] ?? data.depart ?? "00:00:00"
                            }
                            data-cell-id={departKey}
                            onFocus={() => (focusedCell.current = departKey)}
                            onChange={(e) => {
                              setLocalTimes((prev) => ({
                                ...prev,
                                [departKey]: e.target.value,
                              }));
                            }}
                            onBlur={(e) => {
                              handleTimeSave(
                                currentClass.id,
                                p.id,
                                el.email,
                                "depart",
                                e.target.value
                              );
                              setLocalTimes((prev) => {
                                const copy = { ...prev };
                                delete copy[departKey];
                                return copy;
                              });
                              focusedCell.current = null;
                            }}
                            onKeyDown={(e) => handleArrowNav(e, departKey)}
                          />
                        </td>

                        {/* Arrivée */}
                        <td>
                          <input
                            type="time"
                            step="1"
                            className="input time-input"
                            value={
                              localTimes[arriveeKey] ??
                              data.arrivee ??
                              "00:00:00"
                            }
                            data-cell-id={arriveeKey}
                            onFocus={() => (focusedCell.current = arriveeKey)}
                            onChange={(e) => {
                              setLocalTimes((prev) => ({
                                ...prev,
                                [arriveeKey]: e.target.value,
                              }));
                            }}
                            onBlur={(e) => {
                              handleTimeSave(
                                currentClass.id,
                                p.id,
                                el.email,
                                "arrivee",
                                e.target.value
                              );
                              setLocalTimes((prev) => {
                                const copy = { ...prev };
                                delete copy[arriveeKey];
                                return copy;
                              });
                              focusedCell.current = null;
                            }}
                            onKeyDown={(e) => handleArrowNav(e, arriveeKey)}
                          />
                        </td>

                        {/* Balises */}
                        {[...Array(p.nbBalises)].map((_, i) => {
                          const official = p.reponses?.[i] || "";
                          const rep = data.reponses?.[i] || "";
                          const repKey = `rep-${el.email}-${i}`;
                          const isCorrect = rep && rep === official;
                          return (
                            <td
                              key={i}
                              style={{
                                background: isCorrect
                                  ? "#02a054"
                                  : rep
                                  ? "#d11a2a"
                                  : "transparent",
                                color: "#fff",
                              }}
                            >
                              <input
                                type="text"
                                className="input"
                                value={localReps[repKey] ?? rep ?? ""}
                                data-cell-id={repKey}
                                onFocus={() => (focusedCell.current = repKey)}
                                onChange={(e) => {
                                  setLocalReps((prev) => ({
                                    ...prev,
                                    [repKey]: e.target.value,
                                  }));
                                }}
                                onBlur={(e) => {
                                  setEleveReponse(
                                    currentClass.id,
                                    p.id,
                                    el.email,
                                    i,
                                    e.target.value
                                  );
                                  refreshClass(true);
                                  setLocalReps((prev) => {
                                    const copy = { ...prev };
                                    delete copy[repKey];
                                    return copy;
                                  });
                                  focusedCell.current = null;
                                }}
                                onKeyDown={(e) => handleArrowNav(e, repKey)}
                                style={{
                                  background: "transparent",
                                  color: "#fff",
                                  textAlign: "center",
                                }}
                              />
                            </td>
                          );
                        })}

                        <td>{temps != null ? formatTime(temps) : "—"}</td>
                        <td>{points}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {/* Bouton retour en bas */}
      <button
        className="btn btn-blue"
        style={{ marginTop: "20px" }}
        onClick={onBack}
      >
        ⬅ Retour
      </button>
    </div>
  );
}
