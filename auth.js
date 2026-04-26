// ============================================================
//  auth.js - Authentification Firebase
// ============================================================

let isLoginMode = false;

// --- Messages d'erreur Firebase en français ---
function getAuthErrorMessage(code) {
    switch (code) {
        case 'auth/invalid-email':          return "Email invalide.";
        case 'auth/user-disabled':          return "Ce compte a été désactivé.";
        case 'auth/user-not-found':         return "Aucun compte trouvé avec cet email.";
        case 'auth/wrong-password':         return "Mot de passe incorrect.";
        case 'auth/email-already-in-use':   return "Cet email est déjà utilisé.";
        case 'auth/weak-password':          return "Mot de passe trop faible (6 caractères min).";
        case 'auth/network-request-failed': return "Erreur réseau. Vérifie ta connexion.";
        case 'auth/too-many-requests':      return "Trop de tentatives. Réessaie plus tard.";
        case 'auth/invalid-credential':     return "Email ou mot de passe incorrect.";
        default:                            return "Une erreur est survenue. Réessaie.";
    }
}

// --- Réinitialisation du mot de passe ---
function resetPassword() {
    const email = document.getElementById('emailInput').value.trim();
    const authError = document.getElementById("authError");

    if (!email) {
        authError.style.color = "#ffe4e6";
        authError.textContent = "Veuillez entrer votre email pour réinitialiser.";
        return;
    }

    auth.sendPasswordResetEmail(email)
        .then(() => {
            authError.style.color = "#4ade80";
            authError.innerHTML = "Email de réinitialisation envoyé !<br>Vérifie tes spams.";
            setTimeout(() => {
                toggleAuthMode('login');
            }, 2000);
        })
        .catch(err => {
            authError.style.color = "#ffe4e6";
            authError.textContent = getAuthErrorMessage(err.code);
        });
}

// --- Bascule entre connexion / inscription / mot de passe oublié ---
function toggleAuthMode(mode) {
    const usernameContainer = document.getElementById('usernameContainer');
    const passwordInputParent = typeof passwordInput !== 'undefined' ? passwordInput.parentElement : null;
    const mainBtn = document.getElementById('mainAuthBtn');
    const toggleText = document.getElementById('toggleText');
    const authTitle = document.getElementById('authTitle');
    const authError = document.getElementById("authError");
    const forgotLink = document.getElementById('forgotPasswordLink');

    if (!mainBtn || !usernameContainer || !authTitle) return;

    authError.textContent = "";
    authError.style.color = "#ffe4e6";

    if (mode === 'login' || mode === true) {
        // --- MODE CONNEXION ---
        usernameContainer.style.display = 'none';
        if (passwordInputParent) passwordInputParent.style.display = 'block';
        if (forgotLink) forgotLink.style.display = 'block';

        authTitle.innerText = "CONNEXION";
        mainBtn.innerText = "Se connecter";
        toggleText.innerHTML = `Pas encore de compte ? <span onclick="toggleAuthMode('signup')" style="color:#ef4444;font-weight:700;cursor:pointer;margin-left:5px;">S'inscrire</span>`;

        mainBtn.onclick = () => {
            const email = emailInput.value.trim();
            const password = passwordInput.value.trim();
            if (!email || !password) { authError.textContent = "Email et mot de passe requis."; return; }

            auth.signInWithEmailAndPassword(email, password)
                .then(userCredential => {
                    const uid = userCredential.user.uid;
                    loadUserData(uid);
                    loadBoosterCounter(uid);
                    authOverlay.style.display = "none";
                    if (typeof logoutBtn !== 'undefined') logoutBtn.style.display = "block";
                    authError.textContent = "";
                    window.location.reload();
                })
                .catch(err => {
                    if ((!err.code || err.code === "") && err.message && err.message.toLowerCase().includes("password")) {
                        authError.textContent = "Email ou mot de passe incorrect.";
                    } else {
                        authError.textContent = getAuthErrorMessage(err.code);
                    }
                });
        };

    } else if (mode === 'signup' || mode === false) {
        // --- MODE INSCRIPTION ---
        usernameContainer.style.display = 'block';
        if (passwordInputParent) passwordInputParent.style.display = 'block';
        if (forgotLink) forgotLink.style.display = 'none';

        authTitle.innerText = "BIENVENUE !";
        mainBtn.innerText = "S'inscrire";
        toggleText.innerHTML = `Tu as déjà un compte ? <span onclick="toggleAuthMode('login')" style="color:#9333ea;font-weight:700;cursor:pointer;margin-left:5px;">Connexion</span>`;

        mainBtn.onclick = () => {
            const email = emailInput.value.trim();
            const password = passwordInput.value.trim();
            const username = document.getElementById("reg-username").value.trim();

            if (!username || username.length < 3) { authError.textContent = "Pseudo trop court !"; return; }
            if (!email || !password) { authError.textContent = "Champs requis."; return; }

            auth.createUserWithEmailAndPassword(email, password)
                .then(userCredential => {
                    const uid = userCredential.user.uid;
                    return db.collection("users").doc(uid).set({
                        username: username,
                        boostersOpened: 0,
                        collection: [],
                        dust: 0,
                        xp: 0,
                        level: 1,
                        streakCount: 0,
                        isPremium: false,
                        claimedRewards: [],
                        lastUpdate: firebase.firestore.FieldValue.serverTimestamp()
                    });
                })
                .then(() => {
                    window.location.reload();
                })
                .catch(err => {
                    authError.textContent = getAuthErrorMessage(err.code);
                });
        };

    } else if (mode === 'forgot') {
        // --- MODE MOT DE PASSE OUBLIÉ ---
        usernameContainer.style.display = 'none';
        if (passwordInputParent) passwordInputParent.style.display = 'none';
        if (forgotLink) forgotLink.style.display = 'none';

        authTitle.innerText = "RÉCUPÉRATION";
        mainBtn.innerText = "Envoyer le lien";
        toggleText.innerHTML = `Retour à la <span onclick="toggleAuthMode('login')" style="color:#9333ea;font-weight:700;cursor:pointer;margin-left:5px;">Connexion</span>`;

        mainBtn.onclick = () => {
            resetPassword();
        };
    }
}

// --- Initialisation au chargement ---
window.addEventListener('DOMContentLoaded', () => {
    auth.onAuthStateChanged(user => {
        if (!user) {
            toggleAuthMode('signup');
        }
    });
});