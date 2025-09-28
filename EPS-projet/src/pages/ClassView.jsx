// src/pages/ClassView.jsx
import "../styles/App.css";
import { useState, useEffect, useRef } from "react";
import { updateClass, deleteClass } from "../utils/storage";
import { getCurrentUser, getUserByEmail } from "../utils/auth";
import BackButton from "../components/BackButton.jsx";
import { QRCodeSVG } from "qrcode.react";
import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";
import logo from "../assets/logo.png";

export default function ClassView({ classe, onBack, onSelectSport }) {
  const [selectedSport, setSelectedSport] = useState("");
  const [isSelecting, setIsSelecting] = useState(false);
  const [startCell, setStartCell] = useState(null);
  const [previewCells, setPreviewCells] = useState([]);
  const [currentUser, setCurrentUser] = useState(getCurrentUser());

  // ✅ Recherche
  const [searchMode, setSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchRef = useRef(null);
  const inputRef = useRef(null);

  // ✅ Export
  const [showExportPopup, setShowExportPopup] = useState(false);
  const [selectedCols, setSelectedCols] = useState([]);
  const [exportFormat, setExportFormat] = useState("pdf");

  // ✅ Tri
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  // ✅ Drag & Drop Colonnes
  const [dragOverCol, setDragOverCol] = useState(null);
  const [dragHint, setDragHint] = useState(null);
  const [dragSourceIdx, setDragSourceIdx] = useState(null);

  // popups
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showAddColPopup, setShowAddColPopup] = useState(false);
  const [showRemoveColPopup, setShowRemoveColPopup] = useState(null);
  const [showRenameColPopup, setShowRenameColPopup] = useState(null);
  const [showRenameClassPopup, setShowRenameClassPopup] = useState(false);
  const [showRemoveElevePopup, setShowRemoveElevePopup] = useState(null);
  const [showPasswordPopup, setShowPasswordPopup] = useState(null);
  const [showAbsPopup, setShowAbsPopup] = useState(null);

  // inputs popup
  const [newColName, setNewColName] = useState("");
  const [renameColName, setRenameColName] = useState("");
  const [renameClassName, setRenameClassName] = useState(classe?.nom || "");

  if (!classe) return <p>Classe introuvable.</p>;

  // 🔄 rafraîchir statut online
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentUser(getCurrentUser());
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // ✅ clic en dehors du champ recherche
  useEffect(() => {
    function handleClickOutside(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchMode(false);
        setSearchQuery("");
      }
    }
    if (searchMode) {
      document.addEventListener("mousedown", handleClickOutside);
      if (inputRef.current) inputRef.current.focus();
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [searchMode]);

  // --- suppression classe ---
  function confirmDelete() {
    deleteClass(classe.id);
    setShowDeletePopup(false);
    onBack();
  }

  // --- colonnes ---
  function addColumn() {
    if (!classe.colonnes) classe.colonnes = ["Élève"];
    if (newColName.trim() !== "") {
      classe.colonnes.push(newColName);
      classe.eleves.forEach((e) => (e[newColName] = ""));
      updateClass(classe);
      setNewColName("");
      setShowAddColPopup(false);
    }
  }

  function removeColumn(index) {
    if (index === 0) return;
    const colName = classe.colonnes[index];
    classe.colonnes.splice(index, 1);
    classe.eleves.forEach((e) => delete e[colName]);
    updateClass(classe);
    setShowRemoveColPopup(null);
  }

  function renameColumn(index) {
    if (index === 0 || renameColName.trim() === "") return;
    const oldName = classe.colonnes[index];
    classe.colonnes[index] = renameColName;
    classe.eleves.forEach((e) => {
      e[renameColName] = e[oldName];
      delete e[oldName];
    });
    updateClass(classe);
    setShowRenameColPopup(null);
    setRenameColName("");
  }

  function removeEleve(ele) {
    classe.eleves = classe.eleves.filter((e) => e.email !== ele.email);
    updateClass(classe);
    setShowRemoveElevePopup(null);
  }

  function renameClass() {
    if (renameClassName.trim() !== "") {
      classe.nom = renameClassName;
      updateClass(classe);
      setShowRenameClassPopup(false);
    }
  }

  // --- calendrier ---
  function handleMouseDown(day, row) {
    setIsSelecting(true);
    setStartCell({ day, row });
    setPreviewCells([`${day}-${row}`]);
  }

  function handleMouseEnter(day, row) {
    if (!isSelecting || !startCell) return;
    const days = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"];
    const startRow = Math.min(startCell.row, row);
    const endRow = Math.max(startCell.row, row);
    const startCol = Math.min(days.indexOf(startCell.day), days.indexOf(day));
    const endCol = Math.max(days.indexOf(startCell.day), days.indexOf(day));
    const newPreview = [];
    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        newPreview.push(`${days[c]}-${r}`);
      }
    }
    setPreviewCells(newPreview);
  }

  function handleMouseUp() {
    if (isSelecting && selectedSport) {
      previewCells.forEach((key) => {
        if (selectedSport === "supprimer") {
          delete classe.calendrier[key];
        } else {
          classe.calendrier[key] = selectedSport;
        }
      });
      updateClass(classe);
    }
    setIsSelecting(false);
    setStartCell(null);
    setPreviewCells([]);
  }

  // --- colonnes forcées ---
  const effectiveCols =
    !classe.colonnes || classe.colonnes.length === 0
      ? ["Élève"]
      : classe.colonnes;

  // --- tri ---
  function handleSort(col) {
    let direction = "asc";
    if (sortConfig.key === col && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key: col, direction });
  }

  const sortedEleves = [...classe.eleves].sort((a, b) => {
    if (!sortConfig.key) return 0;

    let aVal =
      sortConfig.key === "Élève"
        ? `${a.prenom} ${a.nom}`
        : sortConfig.key === "absStatus"
        ? a.absStatus || ""
        : a[sortConfig.key] || "";

    let bVal =
      sortConfig.key === "Élève"
        ? `${b.prenom} ${b.nom}`
        : sortConfig.key === "absStatus"
        ? b.absStatus || ""
        : b[sortConfig.key] || "";

    if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  // --- filtrage ---
  const filteredEleves = sortedEleves.filter(
    (e) =>
      !searchQuery ||
      `${e.prenom} ${e.nom}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // --- export ---
  function exportData(eleves, colonnes, format) {
    const rows = eleves.map((e) =>
      colonnes.map((col) =>
        col === "Élève" ? `${e.prenom} ${e.nom}` : e[col] || ""
      )
    );

    if (format === "pdf") {
      const doc = new jsPDF();
      doc.text("Export tableau des élèves", 10, 10);
      let startY = 20;
      rows.forEach((row) => {
        doc.text(row.join(" | "), 10, startY);
        startY += 10;
      });
      doc.save("eleves.pdf");
    } else if (format === "excel") {
      const ws = XLSX.utils.aoa_to_sheet([colonnes, ...rows]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Élèves");
      XLSX.writeFile(wb, "eleves.xlsx");
    }
  }

  // --- drag & drop ---
  function handleDragStart(e, index) {
    e.dataTransfer.setData("colIndex", index.toString());
    e.dataTransfer.effectAllowed = "move";
    setDragSourceIdx(index);
  }
  function handleDragEnd() {
    setDragOverCol(null);
    setDragHint(null);
    setDragSourceIdx(null);
  }
  function handleDragOver(e, index) {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const position = x < rect.width / 2 ? "left" : "right";
    setDragOverCol(index);
    setDragHint({ index, position });
  }
  function handleDragLeave() {
    setDragOverCol(null);
    setDragHint(null);
  }
  function handleDrop(e, index) {
    e.preventDefault();
    const fromIndex = parseInt(e.dataTransfer.getData("colIndex"), 10);
    if (Number.isNaN(fromIndex)) return;

    if (fromIndex === 0) return; // Élève non déplaçable

    // Calcul de la position d'insertion
    let insertAt;
    if (dragHint && dragHint.index === index) {
      insertAt = index + (dragHint.position === "right" ? 1 : 0);
    } else {
      insertAt = index + 1;
    }

    if (insertAt < 1) insertAt = 1;

    // Ajustement si on enlève avant d’insérer
    if (fromIndex < insertAt) insertAt -= 1;

    // ✅ Supprimé : la condition qui bloquait les swaps adjacents
    // if (insertAt === fromIndex || insertAt === fromIndex + 1) {
    //   handleDragEnd();
    //   return;
    // }

    // Déplacement effectif
    const movedCol = classe.colonnes[fromIndex];
    classe.colonnes.splice(fromIndex, 1);
    classe.colonnes.splice(insertAt, 0, movedCol);
    updateClass(classe);

    handleDragEnd();
  }

  const getHeaderDragStyle = (idx) => {
    if (!dragHint || dragHint.index !== idx) return {};
    const isLeft = dragHint.position === "left";
    const style = {
      position: "relative",
      background:
        "linear-gradient(to " +
        (isLeft ? "right" : "left") +
        ", rgba(40,167,69,0.12), transparent)",
    };
    if (isLeft) {
      style.boxShadow = "inset 3px 0 0 0 #28a745";
    } else {
      style.boxShadow = "inset -3px 0 0 0 #28a745";
    }
    return style;
  };

  return (
    <div className="wrap" onMouseUp={handleMouseUp}>
      {/* Header */}
      <div className="page-header">
        <div className="header-left">
          <img src={logo} alt="Logo EPS" className="logo-small" />
          <h2
            className="titre-classe"
            onDoubleClick={() => setShowRenameClassPopup(true)}
          >
            Classe {classe.nom}
          </h2>
        </div>
        <button
          className="btn-close"
          onClick={() => setShowDeletePopup(true)}
          title="Supprimer la classe"
        >
          -
        </button>
      </div>

      <BackButton onBack={onBack} />

      {/* Code du jour */}
      <div className="qr-section">
        <h3>Code</h3>
        {classe.code ? (
          <p className="code-du-jour" onClick={() => setShowQR(true)}>
            {classe.code}
          </p>
        ) : (
          <p className="code-invalide">⚠ Aucun code généré</p>
        )}
      </div>

      {/* Export */}
      <button
        className="btn export-btn"
        onClick={() => {
          if (selectedCols.length === 0) setSelectedCols(effectiveCols);
          setShowExportPopup(true);
        }}
      >
        Exporter ↥
      </button>

      {/* Tableau élèves */}
      <div className="students">
        <h3></h3>
        <table className="students-table">
          <thead>
            <tr>
              {/* Statut fixe */}
              <th className="abs-col">
                <span
                  className="sort-arrows"
                  onClick={() => handleSort("absStatus")}
                  style={{ cursor: "pointer", marginRight: "6px" }}
                >
                  {sortConfig.key === "absStatus"
                    ? sortConfig.direction === "asc"
                      ? "⤒"
                      : "⤓"
                    : "↕"}
                </span>
                Statut
              </th>

              {effectiveCols.map((col, idx) => {
                const isEleve = idx === 0;
                return (
                  <th
                    key={idx}
                    onDragOver={(e) => !isEleve && handleDragOver(e, idx)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => !isEleve && handleDrop(e, idx)}
                    style={getHeaderDragStyle(idx)}
                  >
                    {!isEleve && (
                      <div
                        className="col-drag-handle"
                        draggable
                        onDragStart={(e) => handleDragStart(e, idx)}
                        onDragEnd={handleDragEnd}
                        title="Glisser pour déplacer la colonne"
                      />
                    )}

                    <span
                      className="sort-arrows"
                      onClick={() => handleSort(col)}
                      style={{ cursor: "pointer", marginRight: "6px" }}
                    >
                      {sortConfig.key === col
                        ? sortConfig.direction === "asc"
                          ? "⤒"
                          : "⤓"
                        : "↕"}
                    </span>

                    {isEleve ? (
                      <>
                        {!searchMode ? (
                          <>
                            {col}
                            <button
                              className="search-btn"
                              onClick={() => setSearchMode(true)}
                              style={{ marginLeft: "8px" }}
                              title="Rechercher un élève"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                fill="currentColor"
                                viewBox="0 0 16 16"
                              >
                                <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85zm-5.242.656a5 5 0 1 1 0-10 5 5 0 0 1 0 10z" />
                              </svg>
                            </button>
                          </>
                        ) : (
                          <div
                            ref={searchRef}
                            style={{ display: "flex", alignItems: "center" }}
                          >
                            <input
                              ref={inputRef}
                              type="text"
                              className="input"
                              placeholder="Rechercher..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              style={{ flex: 1 }}
                            />
                            <button
                              className="close-btn search-close"
                              onClick={() => {
                                setSearchMode(false);
                                setSearchQuery("");
                              }}
                              title="Fermer la recherche"
                            >
                              ✖
                            </button>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        {col}
                        <button
                          className="btn-close"
                          onClick={() => setShowRemoveColPopup(idx)}
                          title="Supprimer la colonne"
                        >
                          -
                        </button>
                      </>
                    )}
                  </th>
                );
              })}
              <th>
                <button
                  className="btn btn-green"
                  onClick={() => setShowAddColPopup(true)}
                >
                  + Ajouter
                </button>
              </th>
            </tr>
          </thead>

          <tbody>
            {filteredEleves.map((e, i) => {
              const online =
                currentUser &&
                currentUser.email &&
                e.email === currentUser.email;

              return (
                <tr
                  key={i}
                  className={
                    e.absStatus === "absent"
                      ? "row-absent"
                      : e.absStatus === "blesse"
                      ? "row-blesse"
                      : ""
                  }
                >
                  <td className="abs-cell" onClick={() => setShowAbsPopup(e)}>
                    {e.absStatus === "absent" ? (
                      <span className="abs-text">ABS</span>
                    ) : e.absStatus === "blesse" ? (
                      <span className="ble-text">+</span>
                    ) : (
                      ""
                    )}
                  </td>

                  {effectiveCols.map((col, idx) => (
                    <td key={idx}>
                      {idx === 0 ? (
                        <>
                          <span
                            className={`status-dot ${
                              online ? "status-online" : "status-offline"
                            }`}
                          />
                          <span
                            style={{
                              cursor: "pointer",
                              textDecoration: "underline",
                            }}
                            onClick={() => setShowPasswordPopup(e)}
                          >
                            {e.prenom} {e.nom}
                          </span>
                          <button
                            className="btn-close"
                            onClick={() => setShowRemoveElevePopup(e)}
                            title="Retirer l'élève"
                          >
                            -
                          </button>
                        </>
                      ) : (
                        <input
                          type="text"
                          value={e[col] || ""}
                          onChange={(ev) => {
                            e[col] = ev.target.value;
                            updateClass(classe);
                          }}
                        />
                      )}
                    </td>
                  ))}
                  <td />
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* calendrier */}
      <div className="calendar">
        <h3></h3>
        <select
          className="input sport-select"
          value={selectedSport}
          onChange={(e) => setSelectedSport(e.target.value)}
        >
          <option value="">Sélectionner un sport</option>
          <option value="supprimer">🗑 Supprimer un cours</option>
          <option value="athletisme">Athlétisme</option>
          <option value="badminton">Badminton</option>
          <option value="basket">Basket-ball</option>
          <option value="boxe">Boxe française</option>
          <option value="escalade">Escalade</option>
          <option value="foot">Football</option>
          <option value="gym">Gymnastique</option>
          <option value="hand">Handball</option>
          <option value="judo">Judo</option>
          <option value="lutte">Lutte</option>
          <option value="natation">Natation</option>
          <option value="rugby">Rugby</option>
          <option value="tennis">Tennis</option>
          <option value="pingpong">Tennis de table</option>
          <option value="volley">Volley-ball</option>
          <option value="danse">Danse</option>
          <option value="cirque">Arts du cirque</option>
          <option value="orientation">Course d’orientation</option>
          <option value="ultimate">Ultimate</option>
          <option value="vtt">VTT</option>
          <option value="aviron">Aviron</option>
          <option value="escalade-nature">Escalade en milieu naturel</option>
        </select>

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
                      const isPreview = previewCells.includes(key);

                      return (
                        <td
                          key={key}
                          className={
                            (sport ? `sport-${sport} cell-clickable` : "") +
                            (isPreview && selectedSport
                              ? ` preview highlight-${selectedSport}`
                              : "")
                          }
                          onMouseDown={() => handleMouseDown(day, i)}
                          onMouseEnter={() => handleMouseEnter(day, i)}
                          onClick={() => {
                            if (selectedSport) {
                              if (selectedSport === "supprimer") {
                                delete classe.calendrier[key];
                              } else {
                                classe.calendrier[key] = selectedSport;
                              }
                              updateClass(classe);
                            }
                          }}
                          onDoubleClick={() => {
                            if (sport && onSelectSport) {
                              onSelectSport(sport, classe.id);
                            }
                          }}
                        >
                          {sport ? sport : ""}
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

      {/* Popups */}
      {showDeletePopup && (
        <Popup
          title="Supprimer cette classe ?"
          onClose={() => setShowDeletePopup(false)}
          onConfirm={confirmDelete}
        >
          <p>
            Supprimer <b>{classe.nom}</b> ?
          </p>
        </Popup>
      )}

      {showAddColPopup && (
        <Popup
          title="Ajouter une colonne"
          onClose={() => setShowAddColPopup(false)}
          onConfirm={addColumn}
        >
          <input
            type="text"
            className="input"
            placeholder="Nom de la colonne"
            value={newColName}
            onChange={(e) => setNewColName(e.target.value)}
          />
        </Popup>
      )}

      {showRemoveColPopup !== null && (
        <Popup
          title="Supprimer cette colonne ?"
          onClose={() => setShowRemoveColPopup(null)}
          onConfirm={() => removeColumn(showRemoveColPopup)}
        >
          <p>
            Supprimer la colonne <b>{classe.colonnes[showRemoveColPopup]}</b> ?
          </p>
        </Popup>
      )}

      {showRenameColPopup !== null && (
        <Popup
          title="Renommer la colonne"
          onClose={() => setShowRenameColPopup(null)}
          onConfirm={() => renameColumn(showRenameColPopup)}
        >
          <input
            type="text"
            className="input"
            value={renameColName}
            onChange={(e) => setRenameColName(e.target.value)}
          />
        </Popup>
      )}

      {showRemoveElevePopup && (
        <Popup
          title="Retirer l'élève ?"
          onClose={() => setShowRemoveElevePopup(null)}
          onConfirm={() => removeEleve(showRemoveElevePopup)}
        >
          <p>
            Supprimer{" "}
            <b>
              {showRemoveElevePopup.prenom} {showRemoveElevePopup.nom}
            </b>{" "}
            ?
          </p>
        </Popup>
      )}

      {showRenameClassPopup && (
        <Popup
          title="Renommer la classe"
          onClose={() => setShowRenameClassPopup(false)}
          onConfirm={renameClass}
        >
          <input
            type="text"
            className="input"
            value={renameClassName}
            onChange={(e) => setRenameClassName(e.target.value)}
          />
        </Popup>
      )}

      {showQR && (
        <Popup
          title="Code de la classe"
          onClose={() => setShowQR(false)}
          readOnly
        >
          <p>
            <b>{classe.nom}</b>
          </p>
          <p>
            Code du jour : <b>{classe.code}</b>
          </p>
          <div style={{ margin: "20px 0" }}>
            <QRCodeSVG value={classe.code} size={180} />
          </div>
        </Popup>
      )}

      {showPasswordPopup && (
        <Popup
          title="Mot de passe de l'élève"
          onClose={() => setShowPasswordPopup(null)}
          readOnly
        >
          <p>
            <b>
              {showPasswordPopup.prenom} {showPasswordPopup.nom}
            </b>
          </p>
          <p>Email : {showPasswordPopup.email}</p>
          <p>
            Mot de passe :{" "}
            {showPasswordPopup?.email
              ? getUserByEmail(showPasswordPopup.email)?.password ||
                "Non trouvé"
              : "Non trouvé"}
          </p>
        </Popup>
      )}

      {showAbsPopup && (
        <Popup
          title="Statut de l'élève"
          onClose={() => setShowAbsPopup(null)}
          readOnly
        >
          <p>
            Choisir le statut de{" "}
            <b>
              {showAbsPopup.prenom} {showAbsPopup.nom}
            </b>
          </p>
          <div
            style={{
              marginTop: "15px",
              display: "flex",
              gap: "10px",
              justifyContent: "center",
            }}
          >
            <button
              className="btn btn-red"
              onClick={() => {
                showAbsPopup.absStatus = "absent";
                updateClass(classe);
                setShowAbsPopup(null);
              }}
            >
              Absent
            </button>
            <button
              className="btn btn-blue"
              onClick={() => {
                showAbsPopup.absStatus = "blesse";
                updateClass(classe);
                setShowAbsPopup(null);
              }}
            >
              Blessé
            </button>
            <button
              className="btn btn-white"
              onClick={() => {
                showAbsPopup.absStatus = null;
                updateClass(classe);
                setShowAbsPopup(null);
              }}
            >
              Effacer
            </button>
          </div>
        </Popup>
      )}

      {showExportPopup && (
        <Popup
          title="Exporter le tableau"
          onClose={() => setShowExportPopup(false)}
          onConfirm={() => {
            const cols = selectedCols.length ? selectedCols : effectiveCols;
            exportData(filteredEleves, cols, exportFormat);
            setShowExportPopup(false);
          }}
        >
          <p>Choisir les colonnes à exporter :</p>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              marginBottom: "10px",
              textAlign: "left",
              gap: "6px",
            }}
          >
            {effectiveCols.map((col) => (
              <label key={col} style={{ cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={selectedCols.includes(col)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedCols([...selectedCols, col]);
                    } else {
                      setSelectedCols(selectedCols.filter((c) => c !== col));
                    }
                  }}
                  style={{ marginRight: "6px" }}
                />
                {col}
              </label>
            ))}
          </div>

          <p style={{ marginTop: 10 }}>Format :</p>
          <div
            style={{ display: "flex", gap: "12px", justifyContent: "center" }}
          >
            <label style={{ cursor: "pointer" }}>
              <input
                type="radio"
                value="pdf"
                checked={exportFormat === "pdf"}
                onChange={(e) => setExportFormat(e.target.value)}
                style={{ marginRight: "6px" }}
              />
              PDF
            </label>
            <label style={{ cursor: "pointer" }}>
              <input
                type="radio"
                value="excel"
                checked={exportFormat === "excel"}
                onChange={(e) => setExportFormat(e.target.value)}
                style={{ marginRight: "6px" }}
              />
              Excel
            </label>
          </div>
        </Popup>
      )}
    </div>
  );
}

/* --- Composant popup --- */
function Popup({ title, children, onClose, onConfirm, readOnly = false }) {
  return (
    <div className="overlay">
      <div className="popup">
        <button className="close-btn" onClick={onClose}>
          ✖
        </button>
        <h3>{title}</h3>
        <div style={{ margin: "10px 0" }}>{children}</div>
        {!readOnly && (
          <div className="popup-actions">
            <button className="btn btn-green" onClick={onConfirm}>
              Confirmer
            </button>
            <button className="btn btn-white" onClick={onClose}>
              Annuler
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
