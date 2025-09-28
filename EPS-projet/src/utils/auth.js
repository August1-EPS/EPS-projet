function loadUsers() {
  return JSON.parse(localStorage.getItem("users")) || [];
}

function saveUsers(users) {
  localStorage.setItem("users", JSON.stringify(users));
}

// --- INSCRIPTION ---
export function registerUser({ nom, prenom, email, password, role }) {
  const users = loadUsers();
  const normalizedEmail = email.toLowerCase().trim();

  // Vérifier si email déjà utilisé
  if (users.find((u) => u.email === normalizedEmail)) {
    throw new Error("⚠️ Cet email est déjà utilisé.");
  }

  // Vérifier longueur mot de passe
  if (password.length < 6) {
    throw new Error("⚠️ Le mot de passe doit contenir au moins 6 caractères.");
  }

  // Nouvel utilisateur
  users.push({
    nom,
    prenom,
    email: normalizedEmail,
    password,
    role,
    classId: null,
    online: false,
  });

  saveUsers(users);
}

// --- CONNEXION ---
export function loginUser(email, password) {
  const users = loadUsers();
  const normalizedEmail = email.toLowerCase().trim();

  const user = users.find(
    (u) => u.email === normalizedEmail && u.password === password
  );

  if (!user) {
    throw new Error("❌ Identifiants incorrects (email ou mot de passe).");
  }

  // Passe en ligne si élève
  if (user.role === "eleve") {
    user.online = true;
    const index = users.findIndex((u) => u.email === user.email);
    if (index !== -1) {
      users[index] = user;
      saveUsers(users);
    }
  }

  localStorage.setItem("currentUser", JSON.stringify(user));
  return user;
}

// --- UTILISATEUR COURANT ---
export function getCurrentUser() {
  return JSON.parse(localStorage.getItem("currentUser"));
}

// --- DÉCONNEXION ---
export function logoutUser() {
  const user = getCurrentUser();
  if (user && user.role === "eleve") {
    const users = loadUsers();
    const index = users.findIndex((u) => u.email === user.email);
    if (index !== -1) {
      users[index].online = false;
      saveUsers(users);
    }
  }
  localStorage.removeItem("currentUser");
}

// --- MISE À JOUR UTILISATEUR ---
export function updateUser(updatedUser) {
  const users = loadUsers();
  const index = users.findIndex((u) => u.email === updatedUser.email);

  if (index !== -1) {
    users[index] = updatedUser;
    saveUsers(users);
  }

  // Met aussi à jour le currentUser
  localStorage.setItem("currentUser", JSON.stringify(updatedUser));
}

// --- RÉINITIALISATION MOT DE PASSE ---
export function resetPassword(email, newPassword) {
  const users = loadUsers();
  const normalizedEmail = email.toLowerCase().trim();
  const index = users.findIndex((u) => u.email === normalizedEmail);

  if (index === -1) {
    throw new Error("❌ Aucun compte trouvé avec cet email.");
  }

  if (newPassword.length < 6) {
    throw new Error("⚠️ Le mot de passe doit contenir au moins 6 caractères.");
  }

  users[index].password = newPassword;
  saveUsers(users);

  // Si c’était l’utilisateur courant
  const current = getCurrentUser();
  if (current && current.email === normalizedEmail) {
    localStorage.setItem("currentUser", JSON.stringify(users[index]));
  }

  return users[index];
}
// --- Récupérer un utilisateur par email ---
export function getUserByEmail(email) {
  if (!email) return null; // sécurité si email = undefined
  const users = JSON.parse(localStorage.getItem("users")) || [];
  return users.find((u) => u.email === email.toLowerCase().trim()) || null;
}
