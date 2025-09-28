// src/pages/OutilQuiFaitQuoiEleve.jsx
import { useState, useEffect, useRef } from "react";
import {
  getClassById,
  setEleveReponse,
  setDepartArrivee,
} from "../utils/storage";
import "../styles/App.css";

export default function OutilQuiFaitQuoiEleve({ classe, user, onBack }) {
  const [currentClass, setCurrentClass] = useState(classe);
  const [localTimes, setLocalTimes] = useState({});
  const [localReps, setLocalReps] = useState({});
  const focusedCell = useRef(null);

  // ✅ navigation clavier avec flèches
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

  // ✅ refresh protégé
  function refreshClass(force = false) {
    if (focusedCell.current && !force) return;

    const updated = getClassById(classe.id);
    setCurrentClass(updated);

    // Restaurer focus après refresh
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
    refreshClass(true); // premier refresh forcé
    function handleStorageChange() {
      refreshClass(); // protégé
    }
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

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

  function handleTimeSave(classId, parcoursId, email, value) {
    if (!value) return;
    setDepartArrivee(classId, parcoursId, email, "arrivee", value);
    refreshClass(true); // ✅ refresh forcé seulement après validation
  }

  if (!currentClass || !currentClass.qfq || currentClass.qfq.length === 0) {
    return (
      <div className="wrap page-content">
        <h2>Outil — Qui fait quoi (Élève)</h2>
        <p>Aucun parcours disponible pour le moment.</p>
        <button className="btn btn-blue" onClick={onBack}>
          ⬅ Retour
        </button>
      </div>
    );
  }

  return (
    <div className="wrap page-content">
      <h2>Outil — Qui fait quoi (Élève)</h2>
      <p style={{ opacity: 0.8, marginTop: -8 }}>
        Classe : {currentClass?.nom}
      </p>

      {currentClass.qfq.map((p) => {
        // 🚫 Si le prof a caché ce parcours pour l’élève → on ne l’affiche pas
        if (p.eleves?.[user.email]?.hidden) {
          return null;
        }

        if (!p.eleves?.[user.email]) {
          p.eleves[user.email] = {
            reponses: Array(p.nbBalises).fill(""),
            depart: "00:00:00",
            arrivee: "00:00:00",
            hidden: false,
          };
        }

        // ✅ calculs uniquement sur les données officielles
        const allEleves = Object.entries(p.eleves || {}).map(
          ([email, data]) => {
            const departSec = timeToSeconds(data.depart);
            const arriveeSec = timeToSeconds(data.arrivee);
            const temps =
              departSec != null && arriveeSec != null
                ? arriveeSec - departSec
                : null;

            return {
              email,
              ...data,
              temps,
              points: data.reponses?.reduce(
                (acc, rep, i) => acc + (rep && rep === p.reponses?.[i] ? 1 : 0),
                0
              ),
            };
          }
        );

        let elevesToShow;
        if (p.compete) {
          elevesToShow = allEleves.map((el) => ({
            ...el,
            nom:
              currentClass.eleves.find((e) => e.email === el.email)?.nom || "—",
            prenom:
              currentClass.eleves.find((e) => e.email === el.email)?.prenom ||
              "—",
          }));

          // ✅ tri seulement si aucune cellule en édition
          if (!focusedCell.current) {
            elevesToShow = elevesToShow.sort((a, b) => {
              if (b.points !== a.points) return b.points - a.points;
              if (a.temps == null) return 1;
              if (b.temps == null) return -1;
              return a.temps - b.temps;
            });
          }
        } else {
          const eleveData = p.eleves?.[user.email];
          elevesToShow = [
            {
              ...eleveData,
              email: user.email,
              nom: user.nom,
              prenom: user.prenom,
              temps: (() => {
                const dep = timeToSeconds(eleveData.depart);
                const arr = timeToSeconds(eleveData.arrivee);
                return dep != null && arr != null ? arr - dep : null;
              })(),
              points: eleveData.reponses?.reduce(
                (acc, rep, i) => acc + (rep && rep === p.reponses?.[i] ? 1 : 0),
                0
              ),
            },
          ];
        }

        return (
          <div key={p.id} style={{ marginTop: "25px", width: "100%" }}>
            <h3>
              {p.nom} {p.compete ? "(Mode Compétition)" : ""}
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
                  {elevesToShow.map((el, idx) => {
                    const arriveeKey = `arrivee-${el.email}`;
                    return (
                      <tr
                        key={idx}
                        style={{
                          backgroundColor:
                            el.email === user.email && p.compete
                              ? "rgba(2,160,84,0.3)"
                              : "transparent",
                        }}
                      >
                        {p.compete && <td>{idx + 1}</td>}
                        <td>
                          {el.prenom} {el.nom}
                        </td>

                        {/* Départ */}
                        <td>
                          <input
                            type="time"
                            step="1"
                            className="input time-input"
                            value={el.depart ?? "00:00:00"}
                            disabled
                          />
                        </td>

                        {/* Arrivée */}
                        <td>
                          <input
                            type="time"
                            step="1"
                            className="input time-input"
                            value={
                              localTimes[arriveeKey] ?? el.arrivee ?? "00:00:00"
                            }
                            data-cell-id={arriveeKey}
                            onFocus={() => (focusedCell.current = arriveeKey)}
                            onChange={(e) => {
                              if (el.email !== user.email) return;
                              setLocalTimes((prev) => ({
                                ...prev,
                                [arriveeKey]: e.target.value,
                              }));
                            }}
                            onBlur={(e) => {
                              if (el.email !== user.email) return;
                              handleTimeSave(
                                currentClass.id,
                                p.id,
                                user.email,
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
                            disabled={el.email !== user.email}
                          />
                        </td>

                        {/* Balises */}
                        {[...Array(p.nbBalises)].map((_, i) => {
                          const official = p.reponses?.[i] || "";
                          const rep = el.reponses?.[i] || "";
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
                                value={
                                  localReps[repKey] ??
                                  (isCorrect ? "" : rep) ??
                                  ""
                                }
                                data-cell-id={repKey}
                                onFocus={() => (focusedCell.current = repKey)}
                                onChange={(e) => {
                                  if (el.email !== user.email || isCorrect)
                                    return;
                                  setLocalReps((prev) => ({
                                    ...prev,
                                    [repKey]: e.target.value,
                                  }));
                                }}
                                onBlur={(e) => {
                                  if (el.email !== user.email || isCorrect)
                                    return;
                                  setEleveReponse(
                                    currentClass.id,
                                    p.id,
                                    user.email,
                                    i,
                                    e.target.value
                                  );
                                  refreshClass(true); // ✅ après validation
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
                                disabled={isCorrect || el.email !== user.email}
                              />
                            </td>
                          );
                        })}

                        <td>{formatTime(el.temps)}</td>
                        <td>{el.points}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

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
