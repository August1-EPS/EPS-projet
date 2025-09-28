// src/utils/storage.js

// --- UTILITAIRES --- //
function loadData() {
  return JSON.parse(localStorage.getItem("data")) || { classes: [] };
}

function saveData(data) {
  localStorage.setItem("data", JSON.stringify(data));
}

function getDailyCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function todayKey() {
  const d = new Date();
  return d.toISOString().split("T")[0];
}

// --- CLASSES --- //
export function createClass(nom, color = "#004aad") {
  const data = loadData();

  const newClass = {
    id: `cls-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    nom,
    color,
    eleves: [],
    calendrier: {},
    colonnes: ["Élève"],
    qfq: [],
    activeParcoursByEleve: {},
    code: getDailyCode(),
    lastGenerated: todayKey(),
  };

  data.classes.push(newClass);
  saveData(data);
  return newClass;
}

export function getClasses() {
  const data = loadData();
  let changed = false;
  data.classes.forEach((c) => {
    if (c.lastGenerated !== todayKey()) {
      c.code = getDailyCode();
      c.lastGenerated = todayKey();
      changed = true;
    }
  });

  if (changed) saveData(data);
  return data.classes;
}

export function getClassById(id) {
  const data = loadData();
  const classe = data.classes.find((c) => c.id === id);
  if (!classe) return null;

  if (classe.lastGenerated !== todayKey()) {
    classe.code = getDailyCode();
    classe.lastGenerated = todayKey();
    saveData(data);
  }
  return classe;
}

export function updateClass(updatedClass) {
  const data = loadData();
  const index = data.classes.findIndex((c) => c.id === updatedClass.id);
  if (index !== -1) {
    data.classes[index] = updatedClass;
    saveData(data);
  }
}

export function deleteClass(id) {
  const data = loadData();
  data.classes = data.classes.filter((c) => c.id !== id);
  saveData(data);
}

// --- ÉLÈVES --- //
export function addStudent(classId, nom, prenom, email) {
  const data = loadData();
  const classe = data.classes.find((c) => c.id === classId);
  if (!classe) return null;

  if (!classe.eleves.find((e) => e.email === email)) {
    classe.eleves.push({ nom, prenom, email });
    saveData(data);
  }
  return classe;
}

export function removeStudent(classId, nom, prenom, email) {
  const data = loadData();
  const classe = data.classes.find((c) => c.id === classId);
  if (!classe) return null;

  classe.eleves = classe.eleves.filter(
    (e) =>
      !(e.nom === nom && e.prenom === prenom && (!email || e.email === email))
  );

  if (classe.qfq) {
    classe.qfq.forEach((parcours) => {
      if (parcours.eleves && parcours.eleves[email]) {
        delete parcours.eleves[email];
      }
    });
  }

  saveData(data);

  let currentUser = JSON.parse(localStorage.getItem("currentUser"));
  if (
    currentUser &&
    currentUser.nom === nom &&
    currentUser.prenom === prenom &&
    (!email || currentUser.email === email)
  ) {
    delete currentUser.classId;
    localStorage.setItem("currentUser", JSON.stringify(currentUser));
  }

  return classe;
}

export const kickStudent = removeStudent;

// --- CALENDRIER --- //
export function setCourse(classId, dayKey, sport) {
  const data = loadData();
  const classe = data.classes.find((c) => c.id === classId);
  if (!classe) return null;

  if (sport) classe.calendrier[dayKey] = sport;
  else delete classe.calendrier[dayKey];

  saveData(data);
  return classe;
}

// --- COLONNES PERSO --- //
export function addColumn(classId, title = "") {
  const data = loadData();
  const classe = data.classes.find((c) => c.id === classId);
  if (!classe) return null;

  if (!classe.colonnes) classe.colonnes = ["Élève"];
  classe.colonnes.push(title || `Colonne ${classe.colonnes.length}`);
  saveData(data);
  return classe;
}

export function updateColumnTitle(classId, colIndex, newTitle) {
  const data = loadData();
  const classe = data.classes.find((c) => c.id === classId);
  if (!classe || !classe.colonnes) return null;

  classe.colonnes[colIndex] = newTitle;
  saveData(data);
  return classe;
}

export function updateColumnValue(classId, colName, eleveIndex, value) {
  const data = loadData();
  const classe = data.classes.find((c) => c.id === classId);
  if (!classe) return null;
  if (!classe.eleves[eleveIndex]) return null;

  classe.eleves[eleveIndex][colName] = value;
  saveData(data);
  return classe;
}

// --- REJOINDRE UNE CLASSE --- //
export function joinClassByCode(code, nom, prenom, email) {
  const data = loadData();
  const classe = data.classes.find((c) => c.code === code);
  if (!classe) throw new Error("Code invalide ou expiré.");

  if (!classe.eleves.find((e) => e.email === email)) {
    classe.eleves.push({ nom, prenom, email });
    saveData(data);
  }
  return classe;
}

// ===============================
//   QUI FAIT QUOI (QFQ)
// ===============================
export function createParcours(classId, nom, nbBalises) {
  const data = loadData();
  const classe = data.classes.find((c) => c.id === classId);
  if (!classe) return null;
  if (!classe.qfq) classe.qfq = [];

  const newParcours = {
    id: `parc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    nom,
    nbBalises,
    reponses: Array(nbBalises).fill(""),
    eleves: {},
    compete: false,
  };

  classe.qfq.push(newParcours);
  saveData(data);
  return newParcours;
}

export function deleteParcours(classId, parcoursId) {
  const data = loadData();
  const classe = data.classes.find((c) => c.id === classId);
  if (!classe) return null;
  classe.qfq = classe.qfq.filter((p) => p.id !== parcoursId);
  saveData(data);
  return classe.qfq;
}

export function setReponsesParcours(classId, parcoursId, reponses) {
  const data = loadData();
  const classe = data.classes.find((c) => c.id === classId);
  if (!classe) return null;
  const parcours = classe.qfq.find((p) => p.id === parcoursId);
  if (!parcours) return null;

  parcours.reponses = reponses;
  recalcParcoursScores(parcours);
  saveData(data);
  return parcours;
}

export function setEleveReponse(
  classId,
  parcoursId,
  email,
  baliseIndex,
  value
) {
  const data = loadData();
  const classe = data.classes.find((c) => c.id === classId);
  if (!classe) return null;
  const parcours = classe.qfq.find((p) => p.id === parcoursId);
  if (!parcours) return null;

  if (!parcours.eleves[email]) {
    parcours.eleves[email] = {
      reponses: Array(parcours.nbBalises).fill(""),
      isCorrect: Array(parcours.nbBalises).fill(false),
      depart: "00:00:00",
      arrivee: "00:00:00",
      points: 0,
      tempsMs: null,
      hidden: false,
    };
  }

  parcours.eleves[email].reponses[baliseIndex] = value;
  parcours.eleves[email].isCorrect[baliseIndex] =
    value.trim().toLowerCase() ===
    (parcours.reponses[baliseIndex] || "").trim().toLowerCase();

  recalcParcoursScores(parcours);
  saveData(data);
  return parcours.eleves[email];
}

export function setDepartArrivee(classId, parcoursId, email, type, value) {
  const data = loadData();
  const classe = data.classes.find((c) => c.id === classId);
  if (!classe) return null;
  const parcours = classe.qfq.find((p) => p.id === parcoursId);
  if (!parcours) return null;

  if (!parcours.eleves[email]) {
    parcours.eleves[email] = {
      reponses: Array(parcours.nbBalises).fill(""),
      isCorrect: Array(parcours.nbBalises).fill(false),
      depart: "00:00:00",
      arrivee: "00:00:00",
      points: 0,
      tempsMs: null,
      hidden: false,
    };
  }

  parcours.eleves[email][type] = value;
  recalcParcoursScores(parcours);
  saveData(data);
  return parcours.eleves[email];
}

export function assignParcoursToEleve(classId, email, parcoursId) {
  const data = loadData();
  const classe = data.classes.find((c) => c.id === classId);
  if (!classe) return null;
  if (!classe.activeParcoursByEleve) classe.activeParcoursByEleve = {};

  classe.activeParcoursByEleve[email] = parcoursId;
  saveData(data);
  return classe.activeParcoursByEleve;
}

export function clearCell(classId, parcoursId, email, baliseIndex) {
  const data = loadData();
  const classe = data.classes.find((c) => c.id === classId);
  if (!classe) return null;
  const parcours = classe.qfq.find((p) => p.id === parcoursId);
  if (!parcours || !parcours.eleves[email]) return null;

  parcours.eleves[email].reponses[baliseIndex] = "";
  parcours.eleves[email].isCorrect[baliseIndex] = false;
  recalcParcoursScores(parcours);
  saveData(data);
  return parcours.eleves[email];
}

export function clearRow(classId, parcoursId, email) {
  const data = loadData();
  const classe = data.classes.find((c) => c.id === classId);
  if (!classe) return null;
  const parcours = classe.qfq.find((p) => p.id === parcoursId);
  if (!parcours || !parcours.eleves[email]) return null;

  parcours.eleves[email] = {
    reponses: Array(parcours.nbBalises).fill(""),
    isCorrect: Array(parcours.nbBalises).fill(false),
    depart: "00:00:00",
    arrivee: "00:00:00",
    points: 0,
    tempsMs: null,
    hidden: false,
  };
  saveData(data);
  return parcours.eleves[email];
}

export function clearParcoursFor(classId, parcoursId) {
  const data = loadData();
  const classe = data.classes.find((c) => c.id === classId);
  if (!classe) return null;
  const parcours = classe.qfq.find((p) => p.id === parcoursId);
  if (!parcours) return null;

  parcours.eleves = {};
  saveData(data);
  return parcours;
}

export function toggleCompete(classId, parcoursId, state) {
  const data = loadData();
  const classe = data.classes.find((c) => c.id === classId);
  if (!classe) return null;
  const parcours = classe.qfq.find((p) => p.id === parcoursId);
  if (!parcours) return null;

  parcours.compete = state;
  saveData(data);
  return parcours;
}

// --- Nouvelle fonction --- //
export function toggleEleveVisibility(classId, parcoursId, email) {
  const data = loadData();
  const classe = data.classes.find((c) => c.id === classId);
  if (!classe) return null;
  const parcours = classe.qfq.find((p) => p.id === parcoursId);
  if (!parcours) return null;

  if (!parcours.eleves[email]) {
    parcours.eleves[email] = {
      reponses: Array(parcours.nbBalises).fill(""),
      isCorrect: Array(parcours.nbBalises).fill(false),
      depart: "00:00:00",
      arrivee: "00:00:00",
      points: 0,
      tempsMs: null,
      hidden: false,
    };
  }

  parcours.eleves[email].hidden = !parcours.eleves[email].hidden;

  saveData(data);
  return parcours.eleves[email];
}

// --- Helpers --- //
function recalcParcoursScores(parcours) {
  function toSeconds(hms) {
    if (!hms || !/^\d{2}:\d{2}:\d{2}$/.test(hms)) return null;
    const [h, m, s] = hms.split(":").map(Number);
    return h * 3600 + m * 60 + s;
  }

  Object.values(parcours.eleves).forEach((el) => {
    el.points = el.isCorrect.filter((x) => x).length;

    const dep = toSeconds(el.depart);
    const arr = toSeconds(el.arrivee);
    el.tempsMs =
      dep != null && arr != null && arr > dep ? (arr - dep) * 1000 : null;
  });
}
