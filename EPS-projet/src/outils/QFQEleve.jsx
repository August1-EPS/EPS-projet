import "../styles/App.css";

export default function QFQEleve({ classe, user }) {
  const parcours = []; // provisoire
  const nbBalises = 5; // exemple fixe pour squelette

  return (
    <div className="wrap page-content">
      <h2>Qui fait quoi — Élève</h2>
      <h3>
        {user.prenom} {user.nom} — Classe {classe.nom}
      </h3>

      <table className="students-table">
        <thead>
          <tr>
            <th>Départ</th>
            <th>Arrivée</th>
            <th>Temps</th>
            <th>Points</th>
            {Array.from({ length: nbBalises }).map((_, i) => (
              <th key={i}>B{i + 1}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>--:--</td>
            <td>
              <input type="time" />
            </td>
            <td>--:--</td>
            <td>0</td>
            {Array.from({ length: nbBalises }).map((_, i) => (
              <td key={i}>
                <input type="text" maxLength={1} style={{ width: "30px" }} />
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
