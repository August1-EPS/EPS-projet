import { useState } from "react";
import "../styles/App.css";

export default function QFQProf({ classe }) {
  const [parcours, setParcours] = useState([]); // liste des parcours
  const [eleves, setEleves] = useState(classe?.eleves || []);

  function handleAddParcours(nbBalises) {
    const newParcours = {
      id: Date.now(),
      nbBalises,
      reponses: Array(nbBalises).fill(""), // ligne des bonnes réponses
    };
    setParcours([...parcours, newParcours]);
  }

  return (
    <div className="wrap page-content">
      <h2>Qui fait quoi — Professeur</h2>

      {/* Création de parcours */}
      <div style={{ marginBottom: "15px" }}>
        <button onClick={() => handleAddParcours(5)}>
          + Parcours 5 balises
        </button>
        <button onClick={() => handleAddParcours(7)}>
          + Parcours 7 balises
        </button>
      </div>

      {/* Tableau des élèves */}
      <table className="students-table">
        <thead>
          <tr>
            <th>Élève</th>
            <th>Parcours</th>
            <th>Départ</th>
            <th>Arrivée</th>
            <th>Temps</th>
            <th>Points</th>
            {/* Balises dynamiques */}
            {parcours.length > 0 &&
              parcours[0].reponses.map((_, i) => <th key={i}>B{i + 1}</th>)}
          </tr>
        </thead>
        <tbody>
          {eleves.map((e, idx) => (
            <tr key={idx}>
              <td>
                {e.prenom} {e.nom}
              </td>
              <td>
                <select>
                  {parcours.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nbBalises} balises
                    </option>
                  ))}
                </select>
              </td>
              <td>
                <input type="time" />
              </td>
              <td>
                <input type="time" />
              </td>
              <td>--:--</td>
              <td>0</td>
              {parcours.length > 0 &&
                parcours[0].reponses.map((_, i) => <td key={i}></td>)}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Ligne spéciale réponses prof */}
      {parcours.length > 0 && (
        <div style={{ marginTop: "20px" }}>
          <h3>Réponses officielles (prof seulement)</h3>
          <div>
            {parcours.map((p) => (
              <div key={p.id} style={{ marginBottom: "10px" }}>
                <span>Parcours {p.nbBalises} balises :</span>
                {p.reponses.map((r, i) => (
                  <input
                    key={i}
                    type="text"
                    maxLength={1}
                    style={{ width: "30px", margin: "0 5px" }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
