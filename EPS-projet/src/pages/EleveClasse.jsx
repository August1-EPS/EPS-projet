// src/pages/EleveClasse.jsx
import "../styles/App.css";
import logo from "../assets/logo.png";
import power from "../assets/power.png"; // ✅ Icône logout

export default function EleveClasse({ classe, user, onSelectSport, onLogout }) {
  if (!classe) return <p>Aucune classe sélectionnée.</p>;

  return (
    <div className="wrap page-content">
      {/* ✅ Header spécifique à EleveClasse */}
      <div className="eleve-classe-header">
        <img src={logo} alt="Logo EPS" className="logo-small" />
        <h2 className="titre-prof">Classe {classe.nom}</h2>
        <img
          src={power}
          alt="Déconnexion"
          className="logout-icon"
          onClick={onLogout}
        />
      </div>

      <h3>
        Bienvenue {user.prenom} {user.nom}
      </h3>

      {/* ✅ Calendrier (clic sur un sport pour accéder aux outils) */}
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
                      const sport = classe.calendrier[key];
                      return (
                        <td
                          key={key}
                          className={
                            sport ? `sport-${sport} cell-clickable` : ""
                          }
                          onClick={() => {
                            if (sport && onSelectSport) {
                              onSelectSport(sport, classe.id);
                            }
                          }}
                        >
                          {sport || ""}
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
    </div>
  );
}
