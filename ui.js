// ============================================================
//  ui.js - Interface utilisateur, navigation, affichage
// ============================================================

// --- preventZoom ---
function preventZoom(e) {
    if (e.touches.length > 1) {
        e.preventDefault();
    }
}

// --- openPrivacy ---
function openPrivacy() {
    const privacy = document.getElementById('privacyModal');
    
    if (privacy) {
        // On affiche la politique en plein écran
        privacy.style.setProperty('display', 'flex', 'important');
        
        // On force l'opacité à 1 au cas où
        privacy.style.opacity = "1";
        
        // On s'assure qu'elle est au premier plan absolu
        privacy.style.zIndex = "9999999";

        // --- AJOUT : SÉCURITÉ ANTI-ZOOM ET SCROLL ---
        // On empêche le scroll du site derrière
        document.body.style.overflow = "hidden";
        document.body.style.touchAction = "none";
        // On bloque le geste de "pincement" pour zoomer
        document.addEventListener('touchmove', preventZoom, { passive: false });
        
    } else {
        console.error("L'élément privacyModal est introuvable !");
    }
}

// --- closePrivacy ---
function closePrivacy() {
    const privacy = document.getElementById('privacyModal');
    if (privacy) {
        privacy.style.display = 'none';

        // --- AJOUT : RÉTABLISSEMENT ---
        // On redonne le contrôle du scroll au body
        document.body.style.overflow = "";
        document.body.style.touchAction = "";
        // On retire la protection anti-zoom
        document.removeEventListener('touchmove', preventZoom);
    }
}

// --- openAvatarPicker ---
function openAvatarPicker() {
    document.getElementById('avatarPickerModal').style.display = 'flex';

    // --- AJOUT : MISE EN SURBRILLANCE DE L'AVATAR ACTUEL ---
    const hud = document.getElementById('hudAvatar');
    const currentAvatarSrc = hud ? hud.getAttribute('src') : "";
    const allOptions = document.querySelectorAll('.avatar-option');

    allOptions.forEach(img => {
        // Applique le contour jaune uniquement à l'avatar actif
        if (currentAvatarSrc && img.getAttribute('src') === currentAvatarSrc) {
            img.style.border = "3px solid #fbbf24"; // Jaune pile autour
            img.style.borderRadius = "50%"; // Force le rond
            img.style.padding = "2px"; // Petit espace optionnel pour le style
        } else {
            // Remet à l'état normal pour les autres
            img.style.border = "2px solid transparent";
            img.style.borderRadius = "50%";
            img.style.padding = "0px";
        }
    });
}

// --- closeAvatarPicker ---
function closeAvatarPicker() {
    document.getElementById('avatarPickerModal').style.display = 'none';
}

// --- updateProfileAvatar ---
async function updateProfileAvatar(newSrc) {
    // 1. Image du HUD
    const hudImg = document.getElementById('hudAvatar');
    if (hudImg) {
        // On ne met le crossOrigin QUE pour Dicebear ou les images custom
        if (newSrc.includes('dicebear') || newSrc.startsWith('data:')) {
            hudImg.crossOrigin = "anonymous";
        } else {
            hudImg.removeAttribute('crossOrigin'); // On l'enlève pour les liens normaux
        }
        hudImg.src = newSrc;
    }

    // 2. Image du Profil
    const profImg = document.getElementById('profileBigAvatar');
    if (profImg) {
        if (newSrc.includes('dicebear') || newSrc.startsWith('data:')) {
            profImg.crossOrigin = "anonymous";
        } else {
            profImg.removeAttribute('crossOrigin');
        }
        profImg.src = newSrc;
    }

    // 3. Sauvegarde Locale
    localStorage.setItem('userAvatar', newSrc);

    // --- AJOUT : MISE À JOUR VISUELLE IMMÉDIATE (Bordure jaune dynamique) ---
    const allOptions = document.querySelectorAll('.avatar-option');
    allOptions.forEach(img => {
        if (img.getAttribute('src') === newSrc) {
            img.style.border = "3px solid #fbbf24";
            img.style.borderRadius = "50%";
            img.style.padding = "2px";
        } else {
            // Nettoyage : tout revient à la normale pour les autres
            img.style.border = "2px solid transparent";
            img.style.borderRadius = "50%";
            img.style.padding = "0px";
        }
    });

    // --- SAUVEGARDE FIREBASE (Syntaxe Compat v9) ---
    const user = firebase.auth().currentUser;
    if (user) {
        try {
            const db = firebase.firestore();
            await db.collection("users").doc(user.uid).update({
                avatar: newSrc
            });
        } catch (error) {
            console.error("Erreur de sauvegarde Firebase :", error);
        }
    }
}

// --- handleCustomAvatar ---
function handleCustomAvatar(input) {
    const file = input.files[0];
    if (file) {
        if (file.size > 1024 * 1024) { // Limite 1Mo pour éviter l'erreur de taille Firestore
            alert("L'image est trop lourde ! (Max 1Mo)");
            return;
        }
        const reader = new FileReader();
        reader.onload = function(e) {
            // Appelle la fonction ci-dessus qui fait maintenant le save Firebase
            updateProfileAvatar(e.target.result);
        };
        reader.readAsDataURL(file);
    }
}

// --- restaurerAvatarAuChargement ---
function restaurerAvatarAuChargement() {
    // 1. D'abord on vérifie le localStorage (très rapide)
    const savedAvatar = localStorage.getItem('userAvatar');
    if (savedAvatar) {
        if (document.getElementById('hudAvatar')) document.getElementById('hudAvatar').src = savedAvatar;
        if (document.getElementById('profileBigAvatar')) document.getElementById('profileBigAvatar').src = savedAvatar;
    }

    // 2. Puis on synchronise avec Firebase au cas où l'utilisateur a changé d'appareil
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            firebase.firestore().collection("users").doc(user.uid).get().then((doc) => {
                if (doc.exists && doc.data().avatar) {
                    const fbAvatar = doc.data().avatar;
                    
                    // On met à jour les images si elles existent dans le DOM
                    const hud = document.getElementById('hudAvatar');
                    const prof = document.getElementById('profileBigAvatar');
                    
                    if (hud) hud.src = fbAvatar;
                    if (prof) prof.src = fbAvatar;
                    
                    // On met à jour le localStorage avec la version la plus récente de Firebase
                    localStorage.setItem('userAvatar', fbAvatar);
                }
            }).catch(err => console.error("Erreur récup avatar:", err));
        }
    });
}

// --- openSettings ---
function openSettings(event) {
    // --- SÉCURITÉ ANTI-RETOUR ACCUEIL ---
    // Empêche le clic de se propager aux éléments parents (le HUD) 
    // qui forcent souvent un retour à l'accueil.
    if (event) {
        event.preventDefault();
        event.stopPropagation();
        if (event.stopImmediatePropagation) event.stopImmediatePropagation();
    }

    const menu = document.getElementById('settingsMenu');
    if (menu) {
        // On utilise setProperty avec !important pour gagner contre tout CSS existant
        menu.style.setProperty('display', 'flex', 'important');
        
        // On s'assure qu'il est devant TOUT le reste (HUD, cartes, rubriques)
        menu.style.zIndex = "100000"; 

        // Bloquer le scroll du jeu en arrière-plan
        document.body.style.overflow = 'hidden';

        // CACHER LA FLÈCHE DE SCROLL (ton bouton scrollToBottom)
        const fleche = document.getElementById('scrollToBottom');
        if (fleche) {
            fleche.style.setProperty('display', 'none', 'important');
        }

    } else {
        console.error("Le menu settingsMenu est introuvable dans le HTML");
    }
}

// --- closeSettingsMenu ---
function closeSettingsMenu() {
    const menu = document.getElementById('settingsMenu');
    if (menu) {
        // 1. On ajoute la classe d'animation de sortie
        menu.classList.add('menu-closing');

        // 2. On attend la fin de l'animation (300ms) avant de cacher
        setTimeout(() => {
            menu.style.display = 'none';
            
            // On retire la classe pour que la prochaine ouverture soit normale
            menu.classList.remove('menu-closing');

            // 3. Tes actions habituelles (Réactiver le scroll et la flèche)
            document.body.style.overflow = 'auto';
            const fleche = document.getElementById('scrollToBottom');
            if (fleche) {
                fleche.style.setProperty('display', 'flex', 'important');
            }
        }, 300); // 300ms correspond à la durée de l'animation CSS
    }
}

// --- toggleMusicFromMenu ---
function toggleMusicFromMenu() {
    const audio = document.getElementById('bgMusic');
    const checkbox = document.getElementById('musicCheckbox');
    
    if (!audio || !checkbox) return;

    if (checkbox.checked) {
        audio.play().catch(err => {
            console.log("Lecture bloquée par le navigateur");
            checkbox.checked = false; // On remet le levier sur OFF si ça bloque
        });
    } else {
        audio.pause();
    }
}

// --- syncSubwayHUD ---
function syncSubwayHUD() {
    // 1. On synchronise la Streak (Correction : on utilise la variable streakCount en priorité)
    const targetStreak = document.getElementById("hudStreak");
    const sourceStreak = document.getElementById("streakValue");
    const profileStreak = document.getElementById("profileStreak");

    if(targetStreak) {
        // On prend la valeur de la variable JS 'streakCount' (la source la plus fiable)
        // Sinon on essaie de lire l'élément source s'il existe
        targetStreak.innerText = (typeof streakCount !== 'undefined') ? streakCount : (sourceStreak ? sourceStreak.innerText : "0");
    }
    
    // On s'assure que l'affichage dans le profil suit aussi la variable
    if(profileStreak && typeof streakCount !== 'undefined') {
        profileStreak.innerText = streakCount;
    }

    // 2. On synchronise les Fragments 💎
    const sourceDust = document.getElementById("profileDust");
    const targetDust = document.getElementById("hudDust");
    if(sourceDust && targetDust) {
        targetDust.innerText = sourceDust.innerText;
    }

    // 3. On synchronise les Speedies ⚡
    const sourceSpeed = document.getElementById("profileSpeedies");
    const targetSpeed = document.getElementById("hudSpeedies");
    if(sourceSpeed && targetSpeed) {
        targetSpeed.innerText = sourceSpeed.innerText;
    }

    // 4. On synchronise le Niveau et le Pseudo
    const sourceLvl = document.getElementById("profileLevelStat");

    const targetLvl = document.getElementById("hudLevel");
    if(sourceLvl && targetLvl) {
        targetLvl.innerText = sourceLvl.innerText;
    }

    const sourceName = document.getElementById("profileName");
    const targetName = document.getElementById("hudUsername");
    if(sourceName && targetName) {
        targetName.innerText = sourceName.innerText;
    }

    // 5. On synchronise la barre d'XP
    const sourceBar = document.getElementById("profileXpBar");
    const targetBar = document.getElementById("hudXPBar");
    if(sourceBar && targetBar) {
        targetBar.style.width = sourceBar.style.width;
    }

    // 6. On synchronise l'icône Musique (CORRECTION : On ne copie que si la source n'est pas vide)
    const musicBtnOriginal = document.getElementById("musicBtn");
    const hudMusicIcon = document.getElementById("hudMusicIcon");
    
    if(musicBtnOriginal && hudMusicIcon) {
        // On vérifie que le bouton original contient bien un émoji avant d'écraser le HUD
        if (musicBtnOriginal.innerText.trim() !== "") {
            hudMusicIcon.innerText = musicBtnOriginal.innerText;
        }
    }
}

// --- displayExcluPalier100 ---
function displayExcluPalier100(cardData) {

    // 1. Fermeture du menu
    const bpOverlay = document.getElementById('bpOverlay');
    if (bpOverlay) {
        bpOverlay.style.display = 'none';
    }

    // 2. Préparation données
    currentPack = [{ ...cardData, isNew: true, level: 1 }];
    currentCardIndex = 0;
    window.isBPReward = true; 

    // 3. Création du rideau (Attaché au BODY)
    const cover = document.createElement("div");
    cover.id = "exclu-100-cover";
    cover.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
        background: radial-gradient(circle, rgba(0,0,0,0.98) 0%, #000 100%);
        display: flex; flex-direction: column; justify-content: center;
        align-items: center; z-index: 999999; cursor: pointer;
        backdrop-filter: blur(20px);
    `;

cover.innerHTML = `
        <div style="color: gold; font-size: 1.2rem; margin-bottom: 20px; text-shadow: 0 0 10px gold; font-family: sans-serif; font-weight: bold; text-align: center; letter-spacing: 1px; opacity: 0.8;">🏆 RÉCOMPENSE ULTIME 🏆</div>
        <div id="mystery-rect" style="width: 280px; height: 400px; background: linear-gradient(145deg, #111, #222); border: 10px solid #ffd700; border-radius: 20px; display: flex; justify-content: center; align-items: center; box-shadow: 0 0 70px rgba(255, 215, 0, 0.5); transition: transform 0.05s;">
            <span style="font-size: 170px; color: #ffd700; font-weight: bold; user-select: none; text-shadow: 0 0 20px gold;">?</span>
        </div>
        <div style="color: white; margin-top: 30px; font-family: sans-serif; font-weight: bold; letter-spacing: 2px; font-size: 1.1rem; animation: pulse 1.5s infinite; text-transform: uppercase;">CLIQUEZ 5 FOIS POUR RÉVÉLER !</div>
    `;

    let clicks = 0;
    const rect = cover.querySelector('#mystery-rect');

    cover.onclick = (e) => {
        e.stopPropagation(); 
        clicks++;
        
        // Tremblement très intense (plus agressif)
        const shakeIntensity = clicks * 4; // Augmente l'intensité à chaque clic
        const shakeX = Math.random() * shakeIntensity - (shakeIntensity/2);
        const shakeY = Math.random() * shakeIntensity - (shakeIntensity/2);
        rect.style.transform = `translate(${shakeX}px, ${shakeY}px) scale(1.05) rotate(${shakeX/1.5}deg)`;
        
        setTimeout(() => {
            rect.style.transform = "scale(1) rotate(0deg)";
        }, 50);

        if (clicks >= 5) {
            cover.style.pointerEvents = "none";
            
            // Effet flash blanc intense
            cover.style.background = "white";
            cover.style.transition = "background 0.1s ease-in";
            rect.style.transition = "transform 0.15s ease-in, opacity 0.15s ease-in";
            rect.style.transform = "scale(3)";
            rect.style.opacity = "0";
            
            setTimeout(() => {
                cover.remove();
                if (typeof showBigCard === "function") {
                    showBigCard();
                    
                    // --- LANCEMENT DE L'EXPLOSION DE CONFETTIS (4 COINS) ---
                    lancerExplosionConfettis4Coins();

                }
                window.isBPReward = false;
            }, 200);
        }
    };

    document.body.appendChild(cover);

}

// --- lancerExplosionConfettis4Coins ---
function lancerExplosionConfettis4Coins() {

    const container = document.body;
    const particleCountPerCorner = 40; // Nombre de confettis par coin
    const colors = ['#ffd700', '#ffa500', '#ff4500', '#ff0000', '#ffffff', '#4facfe', '#00f2fe']; 

    const corners = [
        { x: 0, y: 0, dxMin: 200, dxMax: 600, dyMin: 100, dyMax: 400 },        // Haut Gauche
        { x: window.innerWidth, y: 0, dxMin: -600, dxMax: -200, dyMin: 100, dyMax: 400 }, // Haut Droite
        { x: 0, y: window.innerHeight, dxMin: 200, dxMax: 600, dyMin: -400, dyMax: -100 }, // Bas Gauche
        { x: window.innerWidth, y: window.innerHeight, dxMin: -600, dxMax: -200, dyMin: -400, dyMax: -100 } // Bas Droite
    ];

    corners.forEach(corner => {
        for (let i = 0; i < particleCountPerCorner; i++) {
            const confetti = document.createElement("div");
            confetti.className = "confetti";
            
            // Position de départ (le coin)
            confetti.style.left = corner.x + "px";
            confetti.style.top = corner.y + "px";
            
            // Couleur aléatoire
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            
            // Trajectoire aléatoire vers le centre
            const dx = Math.random() * (corner.dxMax - corner.dxMin) + corner.dxMin;
            const dy = Math.random() * (corner.dyMax - corner.dyMin) + corner.dyMin;
            
            // Rotation aléatoire
            const rx = Math.random() * 720 - 360;
            const ry = Math.random() * 720 - 360;
            
            // Définition des variables CSS pour l'animation
            confetti.style.setProperty('--dx', dx + "px");
            confetti.style.setProperty('--rx', rx + "deg");
            confetti.style.setProperty('--ry', ry + "deg");
            
            // Légère variation de la durée pour un effet naturel
            confetti.style.animationDuration = (Math.random() * 2 + 3) + "s";
            // Délai aléatoire pour que tout n'explose pas exactement en même temps
            confetti.style.animationDelay = (Math.random() * 0.2) + "s";
            
            // Forme rectangulaire variable
            confetti.style.width = (Math.random() * 8 + 6) + "px";
            confetti.style.height = (Math.random() * 12 + 8) + "px";

            container.appendChild(confetti);
            
            // Suppression de la particule après l'animation
            setTimeout(() => confetti.remove(), 5000);
        }
    });
}

// --- trierParRarete ---
function trierParRarete() {
    const btn = document.getElementById("triRareteBtn");
    const ordreRareteValeurs = {
        "Commun": 1, "Rare": 2, "Epic": 3, "Legendary": 4,
        "Mythic": 5, "Brainrot God": 6, "Secret": 7, "OG": 8
    };

    // --- SÉCURITÉ : On synchronise TOUJOURS avec la collection réelle ---
    // On utilise l'ordre naturel (chronologique) de ton inventaire
    collectionSourceFixe = [...collection]; 

    if (triEtat === "defaut") {
        // --- PASSAGE AU TRI PAR RARETÉ ---
        triEtat = "rarete";

        // On trie une copie de la source (ordre chronologique) par rareté
        let tableauTrie = [...collectionSourceFixe].sort((a, b) => {
            const scoreA = ordreRareteValeurs[a.rarity] || 0;
            const scoreB = ordreRareteValeurs[b.rarity] || 0;
            return scoreA - scoreB;
        });

        // Mise à jour visuelle
        if (btn) {
            btn.innerHTML = "🆕 Trier par Nouveauté";
            btn.style.background = "#7c3aed"; 
            btn.style.color = "#fff";
        }

        refreshCollection(tableauTrie);

    } else {
        // --- RETOUR AU TRI PAR NOUVEAUTÉ ---
        triEtat = "defaut";

        // On reprend la source (ordre chronologique) et on l'inverse proprement.
        // Puisqu'on repart de 'collectionSourceFixe' qui n'a jamais été inversé,
        // le résultat sera TOUJOURS : le plus récent en haut.
        const ordreNouveaute = [...collectionSourceFixe].reverse();

        if (btn) {
            btn.innerHTML = "💎 Trier par Rareté";
            btn.style.background = "#facc15"; 
            btn.style.color = "#000";
        }

        refreshCollection(ordreNouveaute);
    }
}

// --- changerFond ---
function changerFond(nomDesign, viaBattlePass = false) {
    // --- SÉCURITÉ : VÉRIFICATION DES DÉBLOCAGES ---
    
    // On n'affiche l'alerte QUE si on n'est PAS via le Battle Pass
    if (!viaBattlePass) {
        // Sécurité Rainbow (Palier 47 Gratuit)
        if (nomDesign === 'rainbow' && !claimedRewards.includes("47_free")) {
            alert("🔒 Ce fond est verrouillé ! Débloque le palier 47 du Battle Pass.");
            return;
        }

        // Sécurité Moonlight (Palier 72 Premium)
        if (nomDesign === 'moonlight' && !claimedRewards.includes("72_prem")) {
            alert("🔒 Ce fond requiert le Battle Pass Premium (Palier 72) !");
            return;
        }
    }

    const lien = FONDS_DISPONIBLES[nomDesign];
    if (lien) {
        // 1. On applique le nouveau fond au body
        document.body.style.backgroundImage = `url('${lien}')`;
        document.body.style.backgroundSize = "cover";
        document.body.style.backgroundAttachment = "fixed";
        document.body.style.backgroundPosition = "center";
        
        // 2. On sauvegarde le choix pour le prochain rafraîchissement
        localStorage.setItem("pref_fond_ecran", nomDesign);

        // --- 3. RETOUR À L'ACCUEIL (Gestion intelligente) ---
        // On ne ferme les menus QUE si on n'est pas dans le Battle Pass
        if (!viaBattlePass) {
            // On appelle directement ta fonction de fermeture des paramètres
            if (typeof closeSettingsMenu === "function") {
                closeSettingsMenu(); 
            }
            
            // Sécurité pour forcer le retour accueil si besoin
            const btnRetour = document.getElementById("backFromAccount");
            if (btnRetour) {
                btnRetour.click(); 
            }
        }
    } else {
        console.error("Lien introuvable pour le fond : " + nomDesign);
    }
}

// --- descendreToutEnBas ---
function descendreToutEnBas() {
    // On cible la zone de cartes qui possède le défilement interne
    const zoneScroll = document.getElementById("collection");
    const btnScroll = document.getElementById("scrollToBottom");

    if (zoneScroll && btnScroll) {
        // On calcule si on est déjà en bas de la zone de scroll
        const isAtBottom = (zoneScroll.scrollHeight - zoneScroll.scrollTop) <= (zoneScroll.clientHeight + 50);

        if (isAtBottom) {
            // --- ACTION : REMONTER ---
            // On fait remonter la zone interne
            zoneScroll.scrollTo({ top: 0, behavior: 'smooth' });
            
            // On change l'icône pour indiquer qu'on peut redescendre
            btnScroll.innerText = "↓";
        } else {
            // --- ACTION : DESCENDRE ---
            // On fait descendre la zone interne jusqu'au bout
            zoneScroll.scrollTo({
                top: zoneScroll.scrollHeight,
                behavior: 'smooth'
            });

            // On change l'icône pour indiquer qu'on peut remonter
            btnScroll.innerText = "↑";
        }
    }
}

// --- descendreChances ---
function descendreChances() {
    const sectionComplete = document.getElementById("allCardsList");
    const btnScroll = document.getElementById("scrollToBottomChances");

    if (sectionComplete && btnScroll) {
        const isAtBottom = (sectionComplete.scrollHeight - sectionComplete.scrollTop) <= (sectionComplete.clientHeight + 50);

        if (isAtBottom) {
            // REMONTER la liste
            sectionComplete.scrollTo({ top: 0, behavior: 'smooth' });
            btnScroll.innerText = "↓";
        } else {
            // DESCENDRE la liste
            sectionComplete.scrollTo({
                top: sectionComplete.scrollHeight,
                behavior: 'smooth'
            });
            btnScroll.innerText = "↑";
        }
    }
}

// --- hideAllSections ---
function hideAllSections() {
    const ids = ['homeSection', 'collectionSection', 'allCardsSection', 'shopSection', 'accountSection', 'marketSection', 'combatSection'];
    ids.forEach(id => { 
        const el = document.getElementById(id);
        if(el) el.style.display = 'none';
    });
    // Réaffiche le bouton flottant si on quitte le marché
    document.getElementById('tabMarket').style.display = 'flex';
}

// --- showHome ---
function showHome() {
    homeSection.style.display = "block";
    collectionSection.style.display = "none";
    allCardsSection.style.display = "none";
    shopSection.style.display = "none";
    combatSection.style.display = "none";

    // --- RÉAFFICHER LE LUCKY BLOCK & BATTLE PASS (ACCUEIL) ---
    const hudBottomRow = document.getElementById("hudBottomRow");
    if (hudBottomRow) hudBottomRow.style.display = "flex";

    // --- AJOUT TRANSITION FLUIDE (FONDU UNIQUEMENT) ---
    homeSection.classList.remove("section-fade");
    void homeSection.offsetWidth; // Reset l'animation
    homeSection.classList.add("section-fade");

    // RÉAFFICHER LES BOUTONS CACHÉS EN COMBAT
    const accountBtn = document.getElementById("accountBtn");
    const musicBtn = document.getElementById("musicBtn");
    if (accountBtn) accountBtn.style.display = "flex";
    if (musicBtn) musicBtn.style.display = "flex";

    updateButtons();
}

// --- showCollection ---
function showCollection() {
    homeSection.style.display = "none";
    collectionSection.style.display = "block";
    allCardsSection.style.display = "none";
    shopSection.style.display = "none";
    combatSection.style.display = "none";

    // --- MASQUER LE LUCKY BLOCK & BATTLE PASS (COMME DANS L'ACCUEIL) ---
    const hudBottomRow = document.getElementById("hudBottomRow");
    const speedyMenu = document.getElementById("speedyMenu");
    
    if (hudBottomRow) hudBottomRow.style.display = "none";
    if (speedyMenu) speedyMenu.style.display = "none";

    // --- AJOUT TRANSITION FLUIDE (FONDU) ---
    collectionSection.classList.remove("section-fade");
    void collectionSection.offsetWidth; // Force le redémarrage de l'animation
    collectionSection.classList.add("section-fade");

    // RÉAFFICHER LES BOUTONS CACHÉS EN COMBAT
    const accountBtn = document.getElementById("accountBtn");
    const musicBtn = document.getElementById("musicBtn");
    if (accountBtn) accountBtn.style.display = "flex";
    if (musicBtn) musicBtn.style.display = "flex";

    updateButtons();
}

// --- showAllCards ---
function showAllCards() {
    // Affiche uniquement la section "Chances d'obtention"
    homeSection.style.display = "none";
    collectionSection.style.display = "none";
    allCardsSection.style.display = "block";
    shopSection.style.display = "none";
    combatSection.style.display = "none";

    // --- MASQUER LE LUCKY BLOCK & BATTLE PASS ---
    const hudBottomRow = document.getElementById("hudBottomRow");
    const speedyMenu = document.getElementById("speedyMenu");
    if (hudBottomRow) hudBottomRow.style.display = "none";
    if (speedyMenu) speedyMenu.style.display = "none";

    // --- AJOUT TRANSITION FLUIDE (FONDU) ---
    allCardsSection.classList.remove("section-fade");
    void allCardsSection.offsetWidth; // Force le redémarrage de l'animation
    allCardsSection.classList.add("section-fade");

    // RÉAFFICHER LES BOUTONS CACHÉS EN COMBAT
    const accountBtn = document.getElementById("accountBtn");
    const musicBtn = document.getElementById("musicBtn");
    if (accountBtn) accountBtn.style.display = "flex";
    if (musicBtn) musicBtn.style.display = "flex";

    updateButtons();

    const search = document.getElementById("searchCard");

    // Affiche toutes les cartes au départ
    displayCards(ALL_CARDS);

    // Moteur de recherche
    if (search) {
        search.oninput = function() {
            const value = this.value.toLowerCase();
            const filtered = ALL_CARDS.filter(card =>
                card.name.toLowerCase().includes(value)
            );
            displayCards(filtered);
        };
    }
}

// --- isVisible ---
function isVisible(el){ return el.style.display !== "none"; }

// --- updateButtons ---
function updateButtons() {
  if (isVisible(homeSection)) {
    openPackBtn.style.display = "inline-block";
    // resetCollectionBtn supprimé ici pour qu'il reste visible dans les paramètres
  } 
  else if (isVisible(collectionSection)) {
    openPackBtn.style.display = "none";
    // resetCollectionBtn supprimé ici
  } 
  else if (isVisible(allCardsSection)) {
    openPackBtn.style.display = "none";
    // resetCollectionBtn supprimé ici
  } 
  else if (isVisible(shopSection)) {
    openPackBtn.style.display = "none";
    // resetCollectionBtn supprimé ici
  }
}

// --- refreshCollection ---
function refreshCollection(cardsToShow) {
    // --- GESTION DU BOUTON DE TRI ---
    const triBtn = document.getElementById("triRareteBtn");
    
    if (triBtn) {
        if (typeof showingMissing !== "undefined" && showingMissing) {
            triBtn.style.display = "none";
        } else {
            triBtn.style.display = "inline-block";
        }
    }

    const collectionDiv = document.getElementById("collection");
    collectionDiv.innerHTML = "";

    // --- LOGIQUE D'INVERSION ---
    let baseCards = cardsToShow || collection;

    if (typeof triEtat !== "undefined" && triEtat === "defaut" && !cardsToShow) {
        baseCards = [...collection].reverse();
    }

    // --- FILTRE : On ignore les Lucky Blocks ---
    const listLucky = [
        "Mythic Lucky Block", 
        "Brainrot God Lucky Block", 
        "Secret Lucky Block", 
        "Admin Lucky Block"
    ];

    const listExclu = ["Exclu Season 1", "Exclu Pâques 2026"];

    const filteredCollection = collection.filter(c => !listLucky.includes(c.rarity));

    const filteredAllCards = ALL_CARDS.filter(c => 
        !listLucky.includes(c.rarity) && !listExclu.includes(c.rarity)
    );
    
    const cards = baseCards.filter(c => !listLucky.includes(c.rarity));

    // --- TABLEAU DE RÉFÉRENCE ---
    const expTable = {
        "Commun": 15, 
        "Rare": 12, 
        "Epic": 10, 
        "Legendary": 7,
        "Mythic": 4, 
        "Brainrot God": 3, 
        "Secret": 1, 
        "OG": 1
    };

    // --- COMPTEUR ---
    const collectionSection = document.getElementById("collectionSection");
    let compteurDiv = collectionSection.querySelector(".compteur-cards");

    if (!compteurDiv) {
        compteurDiv = document.createElement("div");
        compteurDiv.className = "compteur-cards";
        compteurDiv.style.marginTop = "20px"; 
        compteurDiv.style.marginBottom = "20px";
        compteurDiv.style.fontSize = "1rem";
        compteurDiv.style.color = "#a1a1aa";
        compteurDiv.style.textAlign = "center";
        compteurDiv.style.fontWeight = "bold";

        const existingTitle = collectionSection.querySelector("h2");
        if (existingTitle) {
            existingTitle.insertAdjacentElement("afterend", compteurDiv);
        }
    }

    compteurDiv.innerText = `Cartes obtenues : ${filteredCollection.length} / ${filteredAllCards.length}`;

    // --- Affichage des cartes ---
    cards.forEach(c => {
        const wrapper = document.createElement("div");
        wrapper.className = "card-wrapper";
        wrapper.style.position = "relative"; 

        const level = c.level || 1;
        const exp = c.exp || 0;
        const expNeeded = expTable[c.rarity] || 10;
        const progressPercent = Math.min((exp / expNeeded) * 100, 100);

        // --- GESTION DU TIMER (BAN) ---
        const maintenant = Date.now();
        const estBannie = c.indisponibleJusquA && maintenant < c.indisponibleJusquA;

        // --- INDICATEUR DE NIVEAU (Badge) ---
        if (c.rarity !== "Exclu Season 1"   &&    c.rarity !== "Exclu Pâques 2026") {
            const levelBadge = document.createElement("div");
            levelBadge.style.cssText = `
                position: absolute;
                top: -5px;
                right: -5px;
                background: linear-gradient(135deg, #ffd700, #ffa500);
                color: #000;
                padding: 2px 8px;
                border-radius: 10px;
                font-size: 0.75rem;
                font-weight: bold;
                z-index: 5;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                border: 1px solid #fff;
                display: flex;
                flex-direction: column;
                align-items: center;
            `;
            
            const levelText = document.createElement("span");
            levelText.innerText = `Niv. ${level}`;
            levelBadge.appendChild(levelText);

            if (c.rarity === "OG") {
                const ogCounter = document.createElement("span");
                ogCounter.style.cssText = "font-size: 0.6rem; opacity: 0.8; margin-top: -2px;";
                ogCounter.innerText = `${exp}/${expNeeded}`;
                levelBadge.appendChild(ogCounter);
            }
            
            wrapper.appendChild(levelBadge);
        }

        const cardDiv = document.createElement("div");

        // --- EFFET VISUEL SI BANNIE ---
        if (estBannie) {
            cardDiv.style.filter = "grayscale(1) brightness(0.5)";
            cardDiv.style.cursor = "not-allowed";
        }

        if (c.rarity === "OG") {
            cardDiv.className = "card";
            cardDiv.style.cssText = "position:relative; border:none; padding:0; background:none; overflow:hidden;";
            cardDiv.innerHTML = `<img src="${c.image}" style="width:100%;height:100%;object-fit:contain;display:block;border-radius:0;">`;
        } else {
            cardDiv.className = "card r-" + c.rarity.replace(/ /g, "-");
            
let expBarHTML = "";
            if (c.rarity !== "Exclu Season 1" && c.rarity !== "Exclu Pâques 2026") {
                expBarHTML = `
                    <div class="exp-container" style="width:100%; height:6px; background:rgba(0,0,0,0.3); border-radius:3px; margin-top:8px; overflow:hidden; border:1px solid rgba(255,255,255,0.1); position:relative;">
                        <div class="exp-fill" style="width:${progressPercent}%; height:100%; background:linear-gradient(90deg, #4facfe 0%, #00f2fe 100%); transition: width 0.3s;"></div>
                    </div>
                    <div style="font-size: 0.6rem; color: #aaa; text-align: right; margin-top: 2px;">${exp}/${expNeeded}</div>
                `;
            }

            // --- AFFICHAGE DU TIMER ---
            let timerHTML = "";
            if (estBannie) {
                const restantMs = c.indisponibleJusquA - maintenant;
                const jours = Math.floor(restantMs / (1000 * 60 * 60 * 24));
                const heures = Math.floor((restantMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                let texteTemps = jours > 0 ? `${jours}j ${heures}h` : `${heures}h`;
                
                timerHTML = `
                    <div style="background: rgba(255, 0, 0, 0.2); border-radius: 4px; padding: 4px; margin-top: 8px; border: 1px solid rgba(255, 0, 0, 0.3); text-align: center;">
                        <div style="color:#ff4444; font-weight:bold; font-size:0.7rem;">⏳ RÉCUPÉRATION</div>
                        <div style="color:#fff; font-size:0.65rem;">Retour dans : ${texteTemps}</div>
                    </div>
                `;
            }

            cardDiv.innerHTML = `
                <div style="font-size:0.8rem;color:#ccc;margin-bottom:4px;">${c.rarity}</div>
                <img src="${c.image}" alt="${c.name}" style="width:100%;border-radius:8px;margin-bottom:8px">
                <strong>${c.name}</strong>
                ${expBarHTML}
                ${timerHTML}
            `;
        }

        wrapper.appendChild(cardDiv);
        collectionDiv.appendChild(wrapper);
    });

    const searchWrapper = document.getElementById("searchCollection")?.parentElement;
    if (searchWrapper) {
        searchWrapper.style.display = "flex";
        searchWrapper.style.justifyContent = "center";
        searchWrapper.style.marginBottom = "10px";
    }
}

// --- refreshAllCards ---
function refreshAllCards() {
    const allDiv = document.getElementById("allCardsList");
    allDiv.innerHTML = "";

    ALL_CARDS.forEach(c => {
        const cardDiv = document.createElement("div");
        cardDiv.className = "card r-" + c.rarity.replace(/ /g, "-");
        cardDiv.innerHTML = `
            <img src="${c.image}" alt="${c.name}">
            <strong>${c.name}</strong>
            <div class="rarity-indicator r-${c.rarity.replace(/ /g, "-")}">${c.rarity}</div>
        `;
        allDiv.appendChild(cardDiv);
    });
}

// --- displayCards ---
function displayCards(cards) {
    const sortedCards = [...cards].sort(
        (a, b) => (RARITY_PROBS[b.rarity] || 0) - (RARITY_PROBS[a.rarity] || 0)
    );

    document.getElementById("allCardsList").innerHTML = sortedCards.map(c => {
        // --- LOGIQUE D'AFFICHAGE DE LA PROBABILITÉ ---
        let displayProba;
        if (c.rarity.includes("Exclu Season 1")) {
            displayProba = "BATTLE PASS 1";

        } else if (c.rarity.includes("Exclu Pâques 2026")) {
               displayProba = "Event Pâques 2026";



        } else {
            displayProba = (RARITY_PROBS[c.rarity] || 0) + "%"; // Pourcentage normal
        }

        if (c.rarity === "OG" || c.rarity === "Mythic Lucky Block" || c.rarity === "Brainrot God Lucky Block" || c.rarity === "Secret Lucky Block" || c.rarity === "Admin Lucky Block") {
            // On garde la classe r-rarity pour avoir la bordure colorée du CSS
            return `
            <div class="card r-${c.rarity.replace(/ /g, "-")}" style="position:relative; padding:0; overflow:hidden;">
                <img src="${c.image}" 
                     style="width:100%; height:100%; object-fit:cover; display:block; position:absolute; top:0; left:0; z-index:1;">
                
                <span class="rarity-indicator r-${c.rarity.replace(/ /g, "-")}" 
                      style="position:absolute; bottom:5px; right:5px; z-index:2;">
                    ${displayProba}
                </span>
            </div>`;
        } else {
            return `
            <div class="card r-${c.rarity.replace(/ /g, "-")}" style="position:relative;">
                <div style="font-size:0.8rem; color:#ccc; margin-bottom:6px; font-weight:bold;">
                    ${escapeHtml(c.rarity)}
                </div>
                <img src="${c.image}" alt="${c.name}" 
                     style="width:100%; height:50%; object-fit:contain; margin:0 auto 10px auto; border-radius:8px; display:block">
                <strong>${escapeHtml(c.name)}</strong>
                <span class="rarity-indicator r-${c.rarity.replace(/ /g, "-")}" 
                      style="position:absolute; bottom:5px; right:5px;">
                    ${displayProba}
                </span>
            </div>`;
        }
    }).join('');
}