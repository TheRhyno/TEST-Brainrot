// ============================================================
//  main.js - Point d'entrée, variables globales, initialisation
// ============================================================

// --- Variables globales ---


// --- Données et probabilités ---


const RARITY_PROBS = { 'Commun': 50, 'Rare': 25, 'Epic': 13, 'Legendary': 6, 'Mythic': 3, 'Brainrot God': 1, 'Secret': 0.07, 'OG': 0.03, 'Mythic Lucky Block': 0.5, 'Brainrot God Lucky Block': 0.1, 'Secret Lucky Block': 0.005, 'Admin Lucky Block': 0.0001 };


const BOOSTER_IMAGES = [
  "https://cdn.phototourl.com/uploads/2026-03-17-f809674f-b5b6-4b59-9785-8c5bdb113b28.png",
  "https://cdn.phototourl.com/uploads/2026-03-17-f809674f-b5b6-4b59-9785-8c5bdb113b28.png",
  "https://cdn.phototourl.com/uploads/2026-03-17-f809674f-b5b6-4b59-9785-8c5bdb113b28.png"
];



const SHOP_CARDS = [
  { name: "Booster OR", isPack: true, packType: "gold", price: 10000, rarity: "1 Brainrot God minimum", image: "https://cdn.phototourl.com/uploads/2026-03-18-932a1812-124d-4b83-bb18-b8f14429f207.png" },
  { name: "Booster PLATINE", isPack: true, packType: "platinum", price: 25000, rarity: "1 Secret minimum", image: "https://cdn.phototourl.com/uploads/2026-03-18-a1925a7f-b526-4171-8ab5-c88a216d2867.png" },
  { name: "Booster DIAMANT", isPack: true, packType: "diamond", price: 50000, rarity: "1 OG minimum", image: "https://cdn.phototourl.com/uploads/2026-03-18-3bbfcd6b-5128-4913-bcdd-10ae790b137b.png" }
];









// --- 1. SÉCURITÉ ANTI-CRASH APK ---

// --- load ---
function load(key, def) {
    try {
        const item = localStorage.getItem(key);
        if (!item) return def;
        return JSON.parse(item);
    } catch (e) {
        console.error("Erreur Load APK:", e);
        return def;
    }
}

// --- save ---
function save(key, val) {
    try {
        localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {
        console.error("Erreur Save APK:", e);
    }
}

// --- disableSite ---
function disableSite(active) {
    const overlay = document.getElementById('disableOverlay');
    const news = document.getElementById('newsOverlay');

    if(active) {
        document.body.classList.add('maintenance-active'); // Active le CSS forcé
        
        if(overlay) {
            overlay.style.setProperty('display', 'flex', 'important');
        }
        
        // Cache explicitement la MAJ si elle est déjà là
        if(news) news.style.setProperty('display', 'none', 'important');

        // Bloque le scroll PC
        document.body.style.overflow = 'hidden';

        // Bloque les clics (Capture phase)
        window.addEventListener('click', blockInput, true);
        window.addEventListener('keydown', blockInput, true);
    }
}

// --- blockInput ---
function blockInput(e) {
    e.stopImmediatePropagation();
    e.preventDefault();
}

// --- updateEventTimer ---
function updateEventTimer() {
    const banner = document.getElementById("eventAnnouncementArea");
    if (!banner) return;

    // 1. Gestion de l'affichage (ON/OFF)
    if (typeof showEvent !== 'undefined' && !showEvent) {
        banner.style.display = "none";
        return;
    }

    const now = new Date().getTime();
    const distance = eventDate - now;

    // 2. Si le temps est écoulé
    if (distance <= 0) {
        banner.style.display = "flex";
        const display = document.getElementById("eventCountdown");
        display.innerHTML = "🚀 C'EST PARTI !";
        display.style.background = "#10b981";
        display.style.color = "white";
        return;
    }

    // 3. Calcul du temps (Jours + Heures restantes)
    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    // 4. Formatage
    const d = days.toString().padStart(2, '0');
    const h = hours.toString().padStart(2, '0');
    const m = minutes.toString().padStart(2, '0');
    const s = seconds.toString().padStart(2, '0');

    // 5. Mise à jour de l'interface
    banner.style.display = "flex";
    
    // On affiche les jours seulement s'il en reste, ou on les laisse pour le style
    document.getElementById("eventCountdown").innerHTML = `${d}J : ${h}H : ${m}M : ${s}S`;
}

// --- confirmDeleteAccount ---
async function confirmDeleteAccount() {
    const user = auth.currentUser;

    if (!user) {
        alert("Tu dois être connecté pour faire ça.");
        return;
    }

    // --- PREMIÈRE VÉRIFICATION (Confirmation classique) ---
    const firstCheck = confirm("⚠️ Es-tu sûr de vouloir supprimer ton compte ?");
    if (!firstCheck) return;

    // --- DEUXIÈME VÉRIFICATION (Saisie manuelle) ---
    // On remplace le confirm par un prompt pour forcer l'écriture de "SUPPRIMER"
    const confirmationWord = "SUPPRIMER";
    const secondCheck = prompt(`Dernier avertissement : Toutes tes cartes et tes fragments seront PERDUS à jamais.\n\nTape "${confirmationWord}" en majuscules pour confirmer la suppression définitive :`);

    // On vérifie si la saisie est correcte (on gère aussi l'annulation du prompt)
    if (secondCheck !== confirmationWord) {
        alert("Action annulée. Le mot de confirmation était incorrect.");
        return;
    }

    try {
        // --- ÉTAPE 0 : DÉSACTIVER LES LISTENERS ---
        // Si tu as une variable pour ton listener (ex: unsubscribe), appelle-la !
        if (typeof unsubscribeProfil === "function") unsubscribeProfil();
        if (typeof unsubscribeMarket === "function") unsubscribeMarket();

        // --- ÉTAPE 1 : Supprimer les données Firestore d'abord ---
        // On le fait TANT QUE l'utilisateur est encore connecté.
        const userId = user.uid;
        await db.collection("users").doc(userId).delete();
        console.log("✅ Données Firestore supprimées.");

        // --- ÉTAPE 2 : Supprimer le compte Auth ensuite ---
        // Une fois que les données sont parties, on supprime l'accès.
        await user.delete();
        console.log("✅ Compte Auth supprimé.");

        alert("Compte supprimé avec succès. Adieu, champion.");
        location.reload(); 

    } catch (error) {
        console.error("Erreur suppression :", error);

        if (error.code === 'auth/requires-recent-login') {
            alert("Sécurité : Pour supprimer ton compte, tu dois t'être connecté très récemment. Déconnecte-toi et reconnecte-toi avant de réessayer.");
        } else {
            alert("Erreur lors de la suppression : " + error.message);
        }
    }
}

// --- verifierVraieConnexion ---
async function verifierVraieConnexion() {
    try {
        const response = await fetch("https://www.google.com/favicon.ico", { mode: 'no-cors', cache: 'no-store' });
        return true;
    } catch (e) {
        return false;
    }
}

// --- declencherEventSecret ---
function declencherEventSecret() {
    let secretDiv = document.getElementById('secretAnimation');
    if (!secretDiv) {
        secretDiv = document.createElement('div');
        secretDiv.id = 'secretAnimation';
        Object.assign(secretDiv.style, {
            position: "fixed",
            top: "0", left: "0",
            width: "100vw", height: "100vh",
            background: "transparent", 
            zIndex: "40000", // Très haut pour bloquer tout clic
            display: "none",
            pointerEvents: "all"
        });
        document.body.appendChild(secretDiv);
    }
    
    secretDiv.style.display = 'block';

    // Confettis de fête
    if (typeof confetti === 'function') {
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#ff00ff', '#ffffff', '#00ffff'],
            zIndex: 40001
        });
    }

    // On retire l'overlay invisible après 2.5s pour libérer le clic
    setTimeout(() => {
        secretDiv.style.display = 'none';
    }, 1500);
}

// --- updateLuckyTimer ---
function updateLuckyTimer(unlockTime, type) {
    luckyBlockUnlockTime = unlockTime;

    const ui = document.getElementById("luckyBlockUI");
    const timerText = document.getElementById("luckyTimerDisplay");
    const btn = document.getElementById("btnRecupereLucky");
    const typeText = document.getElementById("luckyBlockType");
    const btnSpeedy = document.getElementById("btnSpeedy");

    if (!unlockTime) {
        if (ui) ui.style.display = "none";
        luckyBlockReady = false; 
        if (luckyInterval) clearInterval(luckyInterval);
        return;
    }

    // --- MISE À JOUR DU TYPE ---
    if (typeText) {
        typeText.innerHTML = type ? type : "Lucky Block";
    }

    if (luckyInterval) clearInterval(luckyInterval);

    luckyInterval = setInterval(() => {
        const maintenant = Date.now();
        const reste = unlockTime - maintenant;

        // --- CONDITION : AFFICHAGE UNIQUEMENT SUR L'ACCUEIL ---
        const menuOuvert = document.getElementById('shopSection')?.style.display === 'flex' || 
                           document.getElementById('inventorySection')?.style.display === 'flex' ||
                           document.getElementById('accountSection')?.style.display === 'flex' ||
                           document.getElementById('settingsSection')?.style.display === 'flex';

        if (ui) {
            if (menuOuvert) {
                ui.style.display = "none";
                if (document.getElementById('speedyMenu')) {
                    document.getElementById('speedyMenu').style.display = "none";
                }
            } else {
                ui.style.display = "flex"; 
            }
        }

        if (reste <= 0) {
            luckyBlockReady = true; 
            clearInterval(luckyInterval);
            
            // --- LOGIQUE DE REMPLACEMENT ---
            if (timerText) timerText.style.display = "none"; 
            if (typeText) typeText.style.display = "block";  
            
            btn.style.display = "block"; 
            ui.style.borderColor = "#10b981"; 
            
            if (btnSpeedy) btnSpeedy.style.display = "none";
        } else {
            luckyBlockReady = false;
            
            // --- AFFICHAGE PENDANT LE TIMER ---
            if (timerText) {
                timerText.style.display = "block"; 
                const h = Math.floor(reste / 3600000);
                const m = Math.floor((reste % 3600000) / 60000);
                const s = Math.floor((reste % 60000) / 1000);
                timerText.innerHTML = `${h}h ${m}m ${s}s`;
                timerText.style.color = "#fbbf24";
            }
            
            btn.style.display = "none";
            ui.style.borderColor = "#fbbf24";

            if (btnSpeedy) {
                btnSpeedy.style.display = "inline-block";
                btnSpeedy.innerHTML = `⚡`; 
                btnSpeedy.onclick = () => {
                    const menu = document.getElementById('speedyMenu');
                    if (menu) menu.style.display = 'block';
                };
            }
        }
    }, 1000);
}

// --- ouvrirCadeauLuckyBlock ---
async function ouvrirCadeauLuckyBlock() {
    const user = firebase.auth().currentUser;
    if (!user) return;

    const doc = await db.collection("users").doc(user.uid).get();
    const data = doc.data();

    if (data && data.luckyBlockUnlockTime) {
        if (Date.now() < data.luckyBlockUnlockTime) return;

        let gainDust = 5000;
        let gainXP = 500;
        const typeOrigine = data.luckyBlockType; 

        if (typeOrigine === "Brainrot God Lucky Block") {
            gainDust = 15000; gainXP = 1500;
        } else if (typeOrigine === "Secret Lucky Block") {
            gainDust = 50000; gainXP = 5000;
        } else if (typeOrigine === "Admin Lucky Block") {
            gainDust = 250000; gainXP = 25000;
        }

        luckyBlockUnlockTime = null;
        luckyBlockType = null;
        luckyBlockReady = false;
        dust += gainDust;

        if (typeof ajouterXP === "function") await ajouterXP(gainXP);

        const uiContainer = document.getElementById("luckyBlockUI");
        if (uiContainer) uiContainer.style.display = "none";

        await db.collection("users").doc(user.uid).update({
            luckyBlockUnlockTime: null,
            luckyBlockType: null,
            luckyBlockReady: false,
            dust: dust,
            xp: typeof xp !== 'undefined' ? xp : 0 
        });

        alert(`🎉 BOOM !\nTon ${typeOrigine} contenait :\n💰 +${gainDust} Fragments\n✨ +${gainXP} XP !`);
    }
}

// --- appliquerBoost ---
async function appliquerBoost(cout, minutesAReduire) {
    const user = firebase.auth().currentUser;
    if (!user || !luckyBlockUnlockTime) return;

    if (typeof speedies === 'undefined' || speedies < cout) {
        alert("Tu n'as pas assez de Speedies ! ⚡");
        return;
    }

    const reductionMs = minutesAReduire * 60 * 1000;
    let nouveauTemps = luckyBlockUnlockTime - reductionMs;

    if (nouveauTemps < Date.now()) nouveauTemps = Date.now();

    try {
        speedies -= cout;
        luckyBlockUnlockTime = nouveauTemps;

        await db.collection("users").doc(user.uid).update({
            speedies: speedies,
            luckyBlockUnlockTime: nouveauTemps
        });

        document.getElementById('speedyMenu').style.display = 'none';
        
        const speedyProfileDisplay = document.getElementById("profileSpeedies");
        if (speedyProfileDisplay) {
            speedyProfileDisplay.innerText = speedies;
        }
        
        const typeActuel = document.getElementById("luckyBlockType").innerText;
        updateLuckyTimer(nouveauTemps, typeActuel);
        
        if (typeof refreshStats === "function") refreshStats();
        
        console.log(`Boost de -${minutesAReduire}min appliqué avec succès !`);
    } catch (e) {
        console.error("Erreur lors de l'application du boost:", e);
        alert("Erreur de connexion au serveur.");
    }
}

// --- calculerNiveau ---
function calculerNiveau(points) {
    if (points < 150) return 1;
    return Math.floor(Math.sqrt(points / 150)) + 1;
}

// --- toggleXPBar ---
function toggleXPBar() {
    const container = document.getElementById("xpProgressionContainer");
    if (container) {
        container.style.display = (container.style.display === "none") ? "block" : "none";
    }
}

// --- ajouterXP ---
async function ajouterXP(montant) {
    // On garde ton calcul de base
    let niveauAvant = calculerNiveau(xp);
    xp += montant;
    
    // 1. Sauvegarde Locale (Inchangé)
    localStorage.setItem("xp", xp); 
    
    // On prépare le niveau après ajout pour la suite
    let niveauApres = calculerNiveau(xp);
    let passageDeNiveau = niveauApres > niveauAvant;

    // 2. SAUVEGARDE SUR FIREBASE
    const user = auth.currentUser;
    
    if (user) {
        try {
            // DONNÉES À SAUVEGARDER
            let dataToSave = {
                xp: xp,
                dust: dust 
            };

            // Si on monte de niveau, on ajoute les 100 Dust au même pack de sauvegarde
            // pour éviter de faire deux "set" séparés qui font bugger les alertes
            if (passageDeNiveau) {
                dust += 100;
                dataToSave.dust = dust;
            }

            await db.collection("users").doc(user.uid).set(dataToSave, { merge: true });

        } catch (error) {
            console.error("❌ ERREUR Firebase : La sauvegarde a échoué.", error);
        }
    } else {
        console.warn("⚠️ ATTENTION : Aucun utilisateur connecté. L'XP est uniquement locale.");
    }
    
    // 3. Logique de passage de niveau (Alerte unique)
    if (passageDeNiveau) {
        
        // L'alerte est ici, elle ne s'affichera qu'une fois car on a regroupé les saves
        alert("🎉 NIVEAU SUPÉRIEUR ! Tu es maintenant Niveau " + niveauApres + "\n🎁 +100 Fragments offerts !");
        
        // Sauvegarde locale du nouveau montant de dust
        save("dust", dust);
    }

    // 4. Actualisation visuelle (Inchangé)
    actualiserProfil(); 
}

// --- actualiserProfil ---
function actualiserProfil() {
    // 1. Valeurs globales
    const vXP = (typeof xp !== 'undefined') ? xp : 0;
    const vDust = (typeof dust !== 'undefined') ? dust : 0;

    // 2. NIVEAU ET RANG
    const niveau = (typeof calculerNiveau === "function") ? calculerNiveau(vXP) : 1;
    
    // Mise à jour du niveau sur les deux éléments (Battle Pass et Profil)
    if (document.getElementById("profileLevelStat")) {
        document.getElementById("profileLevelStat").innerText = niveau;
    }
    if (document.getElementById("profileLevelStat2")) {
        document.getElementById("profileLevelStat2").innerText = niveau;
    }

    // 3. BARRE D'XP (Mise à jour avec diviseur 30)
    try {

        const xpPalierActuel = Math.pow(niveau - 1, 2) * 150;
        const xpPalierSuivant = Math.pow(niveau, 2) * 150;
        
        const xpDansLeNiveau = vXP - xpPalierActuel;
        const xpRequisPourNiveau = xpPalierSuivant - xpPalierActuel;
        
        // Calcul du pourcentage réel
        const pourcentage = Math.min(Math.max(Math.floor((xpDansLeNiveau / xpRequisPourNiveau) * 100), 0), 100);

        // Mise à jour des barres (on gère les deux IDs possibles : profil et battle pass)
        const barres = ["profileXpBar", "bpProgressBar"];
        barres.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.width = pourcentage + "%";
        });

        if (document.getElementById("xpPercent")) document.getElementById("xpPercent").innerText = pourcentage + "%";
        
        // Mise à jour du texte d'XP (on gère les deux IDs possibles)
        const textXP = Math.floor(xpDansLeNiveau) + " / " + Math.floor(xpRequisPourNiveau) + " XP";
        if (document.getElementById("profileXpText")) document.getElementById("profileXpText").innerText = textXP;
        if (document.getElementById("bpXpText")) document.getElementById("bpXpText").innerText = textXP;
        if (document.getElementById("xpTextDisplay")) document.getElementById("xpTextDisplay").innerText = textXP;

    } catch(e) {
        console.error("Erreur calcul XP Profil:", e);
    }

    // 4. DUST
    if (document.getElementById("profileDust")) document.getElementById("profileDust").innerText = vDust;

    // 5. BOOSTERS (Synchro avec l'accueil)
    const boostersEl = document.getElementById("profileBoosters");
    if (boostersEl) {
        const accueilEl = document.getElementById("boosterCounter") || document.getElementById("statsBoosters");
        if (accueilEl) {
            const extraction = accueilEl.innerText.match(/\d+/);
            if (extraction) boostersEl.innerText = extraction[0];
        }
    }

    // 6. --- FORCE L'AFFICHAGE NBE CARTES PROFIL (AVEC SÉCURITÉ) ---
    const cardsEl = document.getElementById("profileCards");
    if (cardsEl) {
        const possession = (typeof collection !== 'undefined') ? collection.length : 0;
        
        // On l'affiche une première fois
        cardsEl.innerText = possession + " / 391";

        // Sécurité : On force une deuxième fois 50ms après pour écraser tout bug
        setTimeout(() => {
            cardsEl.innerText = possession + " / 391";
        }, 50);
    }
}

// --- filtrerCartesVente ---
function filtrerCartesVente(filtre) {
    const grid = document.getElementById('selectCardGrid');
    const toutesLesCartes = grid.querySelectorAll('.card'); 
    const messageAucunResultat = document.getElementById('noCardMessage');
    
    let cartesTrouvees = 0; // Compteur

    toutesLesCartes.forEach(card => {
        const nameTag = card.querySelector('strong');
        if (nameTag) {
            const cardName = nameTag.innerText.toLowerCase();
            
            if (cardName.includes(filtre)) {
                card.style.display = ""; // On remet le style d'origine
                cartesTrouvees++; // On a trouvé une carte !
            } else {
                card.style.display = "none";
            }
        }
    });

    // On affiche le message seulement si aucune carte n'est visible
    if (cartesTrouvees === 0 && filtre !== "") {
        messageAucunResultat.style.display = "block";
    } else {
        messageAucunResultat.style.display = "none";
    }
}

// --- afficherOngletMarket ---
function afficherOngletMarket(tab) {
    currentMarketTab = tab;

    // 1. ON FORCE LE NETTOYAGE DES COULEURS
    const btnBuy = document.getElementById('btnMarketBuy');
    const btnMine = document.getElementById('btnMarketMine');
    if (btnBuy) btnBuy.style.background = '#4b5563';
    if (btnMine) btnMine.style.background = '#4b5563';

    // 2. ON ALLUME LE BON ONGLET
    const activeBtn = (tab === 'buy') ? btnBuy : btnMine;
    if (activeBtn) activeBtn.style.background = '#7c3aed';

    // 3. LE BOUTON "VENDRE" (C'est ici qu'on force l'apparition)
    // On cible l'ID exact de ton HTML : marketactionBtn
    const conteneurVente = document.getElementById('marketactionBtn');
    
    if (conteneurVente) {
        if (tab === 'mySales') {
            // ON FORCE L'AFFICHAGE (Le "display: block" écrase le "display: none")
            conteneurVente.style.display = 'block';
        } else {
            // ON FORCE LA DISPARITION
            conteneurVente.style.display = 'none';
        }
    }

    // 4. ON CHARGE LES CARTES
    chargerMarche();
}

// --- ouvrirSelecteurVente ---
function ouvrirSelecteurVente() {
    // --- PARTIE 1 : INITIALISATION ET NETTOYAGE ---
    document.getElementById('searchSellCard').value = ""; 
    document.getElementById('noCardMessage').style.display = "none"; 
    
    // On cible l'overlay (c'est lui qui scrolle dans ton HTML)
    const overlay = document.getElementById('selectCardOverlay');
    overlay.style.display = 'block';

    const grid = document.getElementById('selectCardGrid');
    if (!grid) return;
    grid.innerHTML = ""; // On vide la grille pour la recharger

    // --- PARTIE 2 : LOGIQUE DE TRI ET FILTRAGE ---
    const ordreRarete = {
        "OG": 8, "Secret": 7, "Brainrot God": 6, "Mythic": 5,
        "Legendary": 4, "Epic": 3, "Rare": 2, "Commun": 1
    };

    const listLucky = [
        "Mythic Lucky Block", "Brainrot God Lucky Block", 
        "Secret Lucky Block", "Admin Lucky Block"
    ];

    // Tri par rareté
    collection.sort((a, b) => {
        const scoreA = ordreRarete[a.rarity] || 0;
        const scoreB = ordreRarete[b.rarity] || 0;
        return scoreB - scoreA;
    });

    // --- PARTIE 3 : CONFIGURATION DU BOUTON DE SCROLL ---
    const btnScroll = document.getElementById("scrollToBottomVente");
    if (btnScroll) {
        btnScroll.innerText = "↓";
        btnScroll.style.display = "flex"; 
    }

    // IMPORTANT : On écoute le scroll sur l'OVERLAY car c'est lui qui a l'overflow
    overlay.onscroll = function() {
        if (!btnScroll) return;
        // Détection du bas sur l'élément overlay
        const isAtBottom = (overlay.scrollHeight - overlay.scrollTop) <= (overlay.clientHeight + 60);
        btnScroll.innerText = isAtBottom ? "↑" : "↓";
    };

    // --- PARTIE 4 : GÉNÉRATION DES CARTES (AVEC FILTRE) ---
    collection.filter(c => !listLucky.includes(c.rarity)).forEach((card) => {
        const originalIndex = collection.indexOf(card);
        const cardEl = document.createElement('div');
        
        // --- AJOUT : DÉTECTION EXCLUSIVITÉ ---
        const estExclu = (card.rarity === "Exclu Season 1");

        cardEl.className = `card r-${card.rarity.toLowerCase().replace(/\s+/g, '-')} market-card-animate`;
        cardEl.style.cssText = `
            display: flex; flex-direction: column; padding: 12px; border-radius: 15px;
            background: #1a1a1a; border: 1px solid rgba(255,255,255,0.1);
            position: relative; cursor: pointer; min-height: 220px;
        `;

        if (card.enVente || estExclu) {
            cardEl.style.opacity = "0.6"; 
            cardEl.style.filter = "grayscale(1)";
            cardEl.style.cursor = "not-allowed";
            cardEl.onclick = null; // Bloque la vente
        } else {
            cardEl.onclick = () => choisirPrixVente(originalIndex);
        }
        
        cardEl.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <div style="color: ${getRarityColor(card.rarity)}; text-transform: uppercase; font-weight: 900; font-size: 0.6rem;">
                    ${card.rarity}
                </div>
                
                ${!estExclu ? `
                    <div style="background: #fbbf24; color: #000; padding: 2px 6px; border-radius: 4px; font-size: 0.65rem; font-weight: bold;">
                        Lvl ${card.level || 1}
                    </div>
                ` : '<div></div>'}
            </div>
            <div style="width: 100%; height: 120px; display: flex; justify-content: center; align-items: center; margin-bottom: 10px; position: relative;">
                <img src="${card.image}" style="width: 100%; height: 100%; object-fit: contain; ${(card.enVente || estExclu) ? 'filter: brightness(0.4);' : ''}">
                
                ${card.enVente ? `
                    <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-10deg); background: #ef4444; color: white; padding: 4px 10px; border-radius: 4px; font-size: 0.7rem; font-weight: bold; z-index: 2; border: 1px solid white; white-space:nowrap;">
                        DÉJÀ EN VENTE
                    </div>
                ` : estExclu ? `
                    <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-10deg); background: #3b82f6; color: white; padding: 4px 10px; border-radius: 4px; font-size: 0.7rem; font-weight: bold; z-index: 2; border: 1px solid white; white-space:nowrap;">
                        CARTE EXCLUSIVE
                    </div>
                ` : ''}

            </div>
            <div style="text-align: center;">
                <strong style="display:block; font-size: 0.85rem; color: #fff; line-height: 1.2;">${card.name}</strong>
            </div>
        `;
        grid.appendChild(cardEl);
    });
}

// --- descendreVente ---
function descendreVente() {
    const overlay = document.getElementById("selectCardOverlay");
    if (!overlay) return;

    const isAtBottom = (overlay.scrollHeight - overlay.scrollTop) <= (overlay.clientHeight + 60);

    if (isAtBottom) {
        overlay.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
        overlay.scrollTo({ top: overlay.scrollHeight, behavior: 'smooth' });
    }
}

// --- fermerSelecteur ---
function fermerSelecteur() {
    document.getElementById('selectCardOverlay').style.display = "none";
}

// --- choisirPrixVente ---
function choisirPrixVente(index) {
    cardToSellIndex = index;
    const card = collection[index];
    fermerSelecteur(); // On ferme le sélecteur de cartes
    
    document.getElementById('sellCardName').innerText = "Vendre " + card.name;
    document.getElementById('sellOverlay').style.display = 'flex'; // On ouvre ton menu de prix
}

// --- fermerVente ---
function fermerVente() {
    document.getElementById('sellOverlay').style.display = 'none';
    cardToSellIndex = null;
}

// --- quitterMarche ---
function quitterMarche() {
    // --- AJOUT : Arrêter l'écoute en temps réel du marché ---
    if (typeof marketUnsubscribe === "function") {
        marketUnsubscribe();
        marketUnsubscribe = null;
    }

    // 1. Cacher le marché
    document.getElementById('marketSection').style.display = 'none';

    // 2. Réafficher la navigation du bas
    const nav = document.querySelector('nav');
    if (nav) nav.style.display = 'flex';

    // 3. Réafficher le bouton profil
    const accBtn = document.getElementById('accountBtn');
    if (accBtn) accBtn.style.display = 'block';

    // 4. Réafficher le bouton flottant
    document.getElementById('tabMarket').style.display = 'flex';

    // 5. Revenir à l'accueil proprement
    showHome();
}

// --- preparerVente ---
function preparerVente(index) {
    cardToSellIndex = index;
    const card = collection[index];
    document.getElementById('sellCardName').innerText = "Vendre " + card.name;
    document.getElementById('sellOverlay').style.display = 'flex';
}

// --- getRarityColor ---
function getRarityColor(rarity) {
    const colors = {
        'Common': '#94a3b8',   // Gris-bleu
        'Rare': '#3b82f6',     // Bleu
        'Epic': '#a855f7',     // Violet
        'Legendary': '#fbbf24', // Jaune/Or
        'Mythic': '#ef4444'     // Rouge
    };
    // Retourne la couleur, ou blanc si la rareté n'est pas trouvée
    return colors[rarity] || '#ffffff';
}

// --- chargerMarche ---
async function chargerMarche() {
    const marketDiv = document.getElementById('marketCards');
    marketDiv.innerHTML = "Chargement du marché...";
    
    // --- NOUVEAU : Arrêter l'ancien écouteur s'il existe déjà ---
    if (marketUnsubscribe) {
        marketUnsubscribe();
    }

    // --- TRANSFORMATION EN TEMPS RÉEL (onSnapshot) ---
    marketUnsubscribe = db.collection("market").orderBy("date", "desc").onSnapshot(snapshot => {
        marketDiv.innerHTML = "";

        let count = 0;
        let index = 0; 

        snapshot.forEach(doc => {
            const item = doc.data();
            const isMine = item.sellerId === auth.currentUser.uid;

            // --- LOGIQUE DE FILTRAGE MISE À JOUR ---
            if (currentMarketTab === 'buy') {
                if (isMine || item.vendu) return;
            }
            if (currentMarketTab === 'mySales') {
                if (!isMine) return;
            }

            count++;

            const cardEl = document.createElement('div');
            cardEl.className = `card r-${item.card.rarity.toLowerCase().replace(/\s+/g, '-')} market-card-animate`;
            
            // Style de la carte container
            cardEl.style.display = "flex";
            cardEl.style.flexDirection = "column";
            cardEl.style.height = "auto";
            cardEl.style.padding = "12px";
            cardEl.style.borderRadius = "15px";
            cardEl.style.background = "#1a1a1a";
            cardEl.style.border = "1px solid rgba(255,255,255,0.1)";
            cardEl.style.animationDelay = `${index * 0.05}s`;
            
            if (item.vendu) {
                cardEl.style.opacity = "0.85";
            }

            index++;

            cardEl.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <div style="color: ${getRarityColor(item.card.rarity)}; text-transform: uppercase; font-weight: 900; font-size: 0.6rem; letter-spacing: 0.5px;">
                        ${item.card.rarity}
                    </div>
                    <div style="background: #fbbf24; color: #000; padding: 2px 6px; border-radius: 4px; font-size: 0.65rem; font-weight: bold;">
                        Lvl ${item.card.level || 1}
                    </div>
                </div>

<div style="width: 100%; height: 140px; display: flex; justify-content: center; align-items: center; margin-bottom: 10px; position: relative;">
<img src="${item.card.image}" style="width: 100%; height: 100%; object-fit: contain; ${item.vendu ? 'filter: brightness(0.4) grayscale(1);' : ''}">
                    
                    ${item.vendu ? `
                        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-10deg); background: #ef4444; color: white; padding: 4px 10px; border-radius: 4px; font-size: 0.8rem; font-weight: bold; z-index: 2; border: 1px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.5);">
                            VENDU
                        </div>
                    ` : ''}
                </div>
                
                <div style="text-align: center; margin-bottom: 4px;">
                    <strong style="display:block; font-size: 0.9rem; color: #fff; line-height: 1.2;">${item.card.name}</strong>
                </div>

                <div style="text-align: center; font-weight: 900; color: #fbbf24; font-size: 1.1rem; margin-bottom: 8px;">
                    ${item.price} <span style="font-size: 0.8rem;">💎</span>
                </div>

<div style="text-align: center; margin-bottom: 10px;">
    ${item.vendu && isMine ? `
        <div style="font-size: 0.65rem; color: #10b981; font-weight: bold;">
            🤝 Acheté par : ${item.acheteurPseudo || "Un joueur"}
        </div>
    ` : `
        <div style="font-size: 0.65rem; color: #94a3b8;">
            ${isMine ? "" : `👤 ${item.sellerName || "Joueur"}`}
        </div>
    `}
</div>

                </div>
                
                <div style="margin-top: auto;">
                    ${item.vendu 
                        ? (isMine 
                            ? `<button onclick="recupererArgent('${doc.id}', ${item.price})" style="background: #fbbf24; color: #000; width: 100%; border: none; border-radius: 8px; padding: 10px; cursor: pointer; font-weight: 900; font-size: 0.75rem; text-transform: uppercase;">💰 RÉCUPÉRER</button>`
                            : `<button disabled style="background:#374151; width:100%; border:none; border-radius:8px; padding:10px; color:#9ca3af; font-weight:bold; font-size:0.75rem;">VENDU</button>`)
                        : (isMine 
                            ? `<button onclick="annulerVente('${doc.id}')" style="background: transparent; border: 1px solid #ef4444; width:100%; border-radius:8px; padding:9px; cursor:pointer; color:#ef4444; font-weight:bold; font-size:0.75rem;">Annuler la vente</button>`
                            : `<button onclick="acheterCarte('${doc.id}', ${item.price}, '${item.sellerId}')" style="background: #10b981; width:100%; border:none; border-radius:8px; padding:10px; cursor:pointer; color:white; font-weight:900; font-size:0.8rem; box-shadow: 0 4px 10px rgba(16, 185, 129, 0.2);">ACHETER</button>`)
                    }
                </div>
            `;
            marketDiv.appendChild(cardEl);
        });

        if (count === 0) {
            const message = currentMarketTab === 'mySales' 
                ? "Vous n'avez aucune vente en cours." 
                : "Aucune carte n'est disponible sur le marché.";
                
            marketDiv.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #94a3b8; border: 2px dashed #4b5563; border-radius: 15px;">
                    <div style="font-size: 40px; margin-bottom: 10px;">📭</div>
                    <p>${message}</p>
                </div>
            `;
        }
    }, error => {
        console.error("Erreur lors de l'écoute du marché:", error);
        marketDiv.innerHTML = "Erreur de connexion au marché.";
    });
}

// --- recupererArgent ---
async function recupererArgent(docId, price) {
    const userRef = db.collection("users").doc(auth.currentUser.uid);
    const marketRef = db.collection("market").doc(docId);

playMoneySound();

    try {
        // 1. On ajoute les fragments au vendeur (Lui-même, donc autorisé par les règles)
        await userRef.update({
            dust: firebase.firestore.FieldValue.increment(price)
        });

        // 2. Mise à jour locale du montant pour un affichage immédiat
        dust += price;

const pDust = document.getElementById("profileDust");
    if(pDust) pDust.innerText = dust;

        localStorage.setItem("dust", dust);
        
        // 3. Si tu as une fonction pour rafraîchir ton interface globale (XP, Dust, etc.)
        if (typeof updateUI === "function") updateUI();

        // 4. On supprime l'annonce du marché maintenant que l'argent est récupéré
        await marketRef.delete();

        alert(`Gain récupéré ! +${price} fragments ajoutés à votre compte. 💎`);
        
    } catch (error) {
        console.error("Erreur lors de la récupération des gains :", error);
        alert("Une erreur est survenue lors de la récupération de vos fragments.");
    }
}

// --- acheterCarte ---
async function acheterCarte(id, price, sellerId) {
    if (dust < price) return alert("Pas assez de fragments !");
    
    const marketRef = db.collection("market").doc(id);
    const buyerRef = db.collection("users").doc(auth.currentUser.uid);

    try {
        const snap = await marketRef.get();
        if(!snap.exists) return alert("Cette carte n'est plus disponible !");

        const item = snap.data();
        
        // SÉCURITÉ : Vérifier si la carte n'est pas déjà vendue (anti-double clic)
        if (item.vendu) return alert("Cette carte a déjà été vendue !");

        const purchasedCard = item.card;

        // --- ✨ CONFIRMATION D'ACHAT ---
        const confirmation = confirm(`Êtes-vous sûr de vouloir acheter "${purchasedCard.name}" pour ${price} fragments ?`);
        if (!confirmation) return;

if (typeof playPurchaseSound === "function") {
            playPurchaseSound();
        }


        // --- 🆕 AJOUT : RÉCUPÉRATION DU PSEUDO DE L'ACHETEUR ---
        // On récupère le nom affiché dans ton profil actuel
        const buyerName = document.getElementById('profileName')?.innerText || "Un joueur";

        // --- ACTION 1 : MARQUER COMME VENDU SUR LE MARCHÉ ---
        // L'argent reste virtuellement "bloqué" sur l'annonce jusqu'à ce que le vendeur le récupère.
        await marketRef.update({
            vendu: true,
            acheteurId: auth.currentUser.uid,
            acheteurPseudo: buyerName, // On enregistre le pseudo pour le vendeur
            dateVente: firebase.firestore.FieldValue.serverTimestamp()
        });

        // --- LOGIQUE LOCALE (PRÉPARATION CARTE ACHETEUR) ---
        purchasedCard.enVente = false;
        if (purchasedCard.prixVente) delete purchasedCard.prixVente;

        // --- 🆙 GESTION DES DOUBLONS AVEC ADDITION DES NIVEAUX ---
        let messageSucces = "";
        let existingCard = collection.find(c => c.name === purchasedCard.name);
        const levelFromMarket = parseInt(purchasedCard.level) || 1;

        if (existingCard) {
            const ancienNiveau = parseInt(existingCard.level) || 1;
            existingCard.level = ancienNiveau + levelFromMarket;
            messageSucces = `Achat réussi ! Fusion effectuée : Votre "${purchasedCard.name}" passe du Lvl ${ancienNiveau} au Lvl ${existingCard.level} ! 🔥`;
        } else {
            purchasedCard.level = levelFromMarket;
            collection.push(purchasedCard);
            messageSucces = `Achat réussi ! "${purchasedCard.name}" (Lvl ${levelFromMarket}) a été ajoutée à votre collection.`;
        }

        // --- ACTION 2 : MISE À JOUR COMPTE ACHETEUR ---
        // L'acheteur perd ses fragments ici.
        dust -= price;

        const pDust = document.getElementById("profileDust");
        if(pDust) pDust.innerText = dust;

        await buyerRef.update({
            dust: dust,
            collection: collection
        });

        // --- MISE À JOUR LOCALE ---
        localStorage.setItem("collection", JSON.stringify(collection));
        localStorage.setItem("dust", dust);

        if (typeof displayCollection === "function") displayCollection();
        
        alert(messageSucces);

    } catch (error) {
        console.error("Erreur transaction détaillée:", error);
        alert("Erreur lors de l'achat : " + error.message);
    }
}

// --- surveillerMesVentes ---
function surveillerMesVentes() {
    const userId = auth.currentUser.uid;

    // On écoute le marché en filtrant uniquement MES ventes
    db.collection("market").where("sellerId", "==", userId)
      .onSnapshot((snapshot) => {
          // On récupère les noms des cartes qui sont ENCORE disponibles (non vendues)
          const cartesEncoreEnVente = [];
          snapshot.forEach(doc => {
              const data = doc.data();
              // Une carte est encore en vente seulement si 'vendu' n'est pas vrai
              if (!data.vendu) {
                  cartesEncoreEnVente.push(data.card.name);
              }
          });

          let aChange = false;

          // On parcourt la collection à l'envers pour éviter les problèmes d'index lors du splice
          for (let i = collection.length - 1; i >= 0; i--) {
              const card = collection[i];

              // SI la carte est marquée locale "enVente" 
              // MAIS qu'elle n'est plus dans la liste des objets disponibles du marché
              if (card.enVente && !cartesEncoreEnVente.includes(card.name)) {
                  console.log(`La carte ${card.name} a été confirmée comme vendue ou retirée !`);
                  
                  // On la retire de la collection locale du vendeur
                  collection.splice(i, 1); 
                  aChange = true;
              }
          }

          if (aChange) {
              // On met à jour les données locales et serveur
              localStorage.setItem("collection", JSON.stringify(collection));
              
              db.collection("users").doc(userId).update({
                  collection: collection
              }).then(() => {
                  if (typeof displayCollection === "function") displayCollection();
                  console.log("Collection synchronisée après détection de vente.");
              }).catch(err => {
                  console.error("Erreur synchro collection:", err);
              });
          }
      });
}

// --- annulerVente ---
async function annulerVente(id) {
    const ref = db.collection("market").doc(id);
    const snap = await ref.get();

    if(snap.exists) {
        // 1. On récupère les données de l'annonce pour savoir quelle carte libérer
        const cardFromMarket = snap.data().card;

        // --- NOUVELLE LOGIQUE : LIBÉRATION DE LA CARTE ---
        // On cherche la carte dans notre collection locale qui porte le flag 'enVente'
        const indexExistante = collection.findIndex(c => 
            c.name === cardFromMarket.name && c.enVente === true
        );

        if (indexExistante !== -1) {
            // On retire les flags de vente pour rendre la carte interactive à nouveau
            collection[indexExistante].enVente = false;
            if (collection[indexExistante].prixVente) {
                delete collection[indexExistante].prixVente;
            }
        } else {
            // Cas de secours : si la carte n'est pas trouvée (bug), on utilise celle du marché
            // en s'assurant qu'elle est bien marquée comme n'étant plus en vente
            cardFromMarket.enVente = false;
            collection.push(cardFromMarket);
        }
        
        try {
            // 2. Sauvegarde de la collection mise à jour (avec la carte libérée)
            if (auth.currentUser) {
                await db.collection("users").doc(auth.currentUser.uid).update({
                    collection: collection
                });
                // Mise à jour du stockage local
                localStorage.setItem("collection", JSON.stringify(collection));
            }

            // 3. On supprime l'annonce du marché
            await ref.delete();

            // Rafraîchissement des interfaces
if (typeof chargerMarche === "function") chargerMarche();
            if (typeof displayCollection === "function") displayCollection();
            
            // MODIF : Remplace showCollection par la fonction de tes ventes
            if (typeof showMySales === "function") {
                showMySales(); 
            } else {
                // Si tu n'as pas de fonction séparée, on recharge le marché
                if (typeof showMarket === "function") showMarket();
            }

            alert("Vente annulée ! La carte a été retirée du marché.");
        } catch (error) {
            console.error("Erreur critique lors de l'annulation :", error);
            
            // En cas d'échec serveur, on remet le flag en local pour rester synchro avec le marché
            if (indexExistante !== -1) {
                collection[indexExistante].enVente = true;
            }
            alert("Erreur de connexion. La carte est restée sur le marché.");
        }
    } else {
        alert("Cette annonce n'existe plus.");
    }
}

// --- annulerModification ---
function annulerModification() {
    // 1. On cache la box d'édition
    document.getElementById('editPseudoBox').style.display = 'none';
    
    // 2. On réaffiche le bouton "Modifier mon pseudo"
    document.getElementById('btnEditPseudo').style.display = 'block';
    
    // 3. Optionnel : On vide l'input pour la prochaine fois
    document.getElementById('newUsernameInput').value = "";
}

// --- validerNouveauPseudo ---
async function validerNouveauPseudo() {
    const user = auth.currentUser;
    const nouveauNom = document.getElementById("newUsernameInput").value.trim();
    const ancienNom = window.userPseudo; // On garde l'ancien pour le supprimer

    if (!user || nouveauNom.length < 3) return alert("Pseudo trop court !");
    if (nouveauNom === ancienNom) return alert("C'est déjà ton pseudo !");

    try {
        // 1. On tente de "réserver" le nouveau pseudo dans la liste globale
        const nameRef = db.collection("usernames").doc(nouveauNom);
        const nameDoc = await nameRef.get();

        if (nameDoc.exists) {
            return alert("❌ Ce pseudo est déjà pris !");
        }

        // 2. Si libre, on l'enregistre (on crée le verrou)
        await nameRef.set({ uid: user.uid });

        // 3. On met à jour le profil du joueur
        // Note : Si cette étape réussit, le pseudo est changé sur le serveur
        await db.collection("users").doc(user.uid).update({
            username: nouveauNom
        });

        // 4. ON SUPPRIME L'ANCIEN PSEUDO de la liste (pour qu'il redevienne libre)
        // Ajout d'un sous-try/catch : si la suppression échoue (permission), 
        // on passe quand même à la suite pour ne pas bloquer l'interface.
        if (ancienNom && ancienNom !== "Anonyme") {
            try {
                await db.collection("usernames").doc(ancienNom).delete();
            } catch (delError) {
                console.warn("Ancien pseudo non supprimé (Problème de permission), mais le nouveau est actif.");
            }
        }

        // 5. Mise à jour locale et interface
        window.userPseudo = nouveauNom;
        
        // Mise à jour visuelle immédiate
        const profileName = document.getElementById("profileName");
        if (profileName) {
            profileName.innerText = nouveauNom;
        }

        // Fermeture de la box
        document.getElementById("editPseudoBox").style.display = "none";
        document.getElementById("btnEditPseudo").style.display = "block";
        
        alert("Pseudo mis à jour ! ✨");

    } catch (e) {
        console.error(e);
        // Si l'erreur est une erreur de permission Firebase, on conseille quand même le refresh
        if (e.code === 'permission-denied') {
            alert("Erreur de permission Firebase. Si le pseudo ne change pas, rafraîchis la page.");
        } else {
            alert("Erreur : " + e.message);
        }
    }
}

// --- ouvrirLobby ---
function ouvrirLobby() {
    const lobby = document.getElementById("lobby-overlay");
    const content = document.getElementById("lobby-content-container"); // Le conteneur ajouté pour l'animation
    if(!lobby) return;
    
    // --- MODIFICATION : MASQUER LE BOUTON MUSIQUE ---
    const musicBtn = document.getElementById("musicBtn");
    if (musicBtn) musicBtn.style.display = "none";
    
    // --- AJOUT : MASQUER LE MENU ET LE PROFIL ---
    const nav = document.querySelector('nav');
    const accountBtn = document.getElementById('accountBtn');
    if (nav) nav.style.display = "none";
    if (accountBtn) accountBtn.style.display = "none";
    
    // --- TRANSITION FLUIDE ET MODERNE ---
    lobby.style.display = "block";
    // Ajout des classes d'animation définies dans le HTML/CSS
    lobby.classList.add("lobby-animate");
    if (content) content.classList.add("lobby-content-animate");
    
    // On retire temporairement .orderBy pour éviter les erreurs d'index Firebase
    db.collection("battles")
        .where("status", "==", "waiting")
        .onSnapshot((snapshot) => {
            const listeDiv = document.getElementById("liste-duels");
            if (!listeDiv) return;
            
            listeDiv.innerHTML = ""; 

            if (snapshot.empty) {
                listeDiv.innerHTML = "<p style='text-align:center; color:#8da0b8; padding:20px;'>Aucun duel en attente...<br>Crée le premier salon !</p>";
                return;
            }

            snapshot.forEach((doc) => {
                const data = doc.data();
                const user = auth.currentUser; // Récupération de l'utilisateur actuel
                
                // --- FIX : Définir dateData avant de l'utiliser ---
                const dateData = data.createdAt ? data.createdAt.toDate() : new Date();
                const heure = dateData.toLocaleTimeString('fr-FR', {
                    hour: '2-digit', 
                    minute: '2-digit'
                });

                const item = document.createElement("div");
                item.style = "display:flex; justify-content:space-between; align-items:center; background:#1e293b; padding:15px; margin-bottom:12px; border-radius:12px; border-left:5px solid #7c3aed; box-shadow: 0 4px 6px rgba(0,0,0,0.2);";
                
                // --- LOGIQUE DU BOUTON DYNAMIQUE ---
                let boutonAction = "";
                
                // On vérifie si l'utilisateur connecté est le créateur du salon
                if (user && data.player1 === user.uid) {
                    // C'est SON salon -> Afficher la croix de suppression
                    boutonAction = `
                        <button onclick="supprimerMonSalon('${doc.id}')" 
                                style="background:#ef4444; color:white; width:36px; height:36px; border-radius:8px; font-weight:bold; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:1.2rem;">
                            ✕
                        </button>`;
                } else {
                    // C'est le salon d'un autre -> Afficher Rejoindre
                    boutonAction = `
                        <button onclick="rejoindreCeDuel('${doc.id}')" 
                                style="background:#4ade80; color:#0e1525; padding:10px 18px; border-radius:8px; font-weight:900; border:none; cursor:pointer; text-transform:uppercase;">
                            Rejoindre
                        </button>`;
                }
                
                item.innerHTML = `
                    <div style="text-align:left;">
                        <strong style="color:#fff; font-size:1.1rem;">${data.player1Name || 'Anonyme'}</strong>
                        <div style="font-size:0.75rem; color:#8da0b8;">Ouvert à ${heure}</div>
                    </div>
                    ${boutonAction}
                `;
                listeDiv.appendChild(item);
            });
        }, (error) => {
            console.error("Erreur Lobby:", error);
        });
}

// --- supprimerMonSalon ---
async function supprimerMonSalon(id) {
    if (!confirm("Voulez-vous vraiment supprimer votre salon ?")) return;
    try {
        await db.collection("battles").doc(id).delete();

        const statusDiv = document.getElementById("status-recherche");
        if (statusDiv) {
            statusDiv.innerHTML = ""; 
        }

        const battleInfo = document.getElementById("battle-info");
        if (battleInfo) {
            battleInfo.innerText = "";
        }

        currentRoomId = null;

        // --- AJOUT : Réafficher le menu, le profil et la musique ---
        const nav = document.querySelector('nav');
        const accountBtn = document.getElementById('accountBtn');
        const musicBtn = document.getElementById('musicBtn');

        if (nav) nav.style.display = "flex";
        if (accountBtn) accountBtn.style.display = "block";
        if (musicBtn) musicBtn.style.display = "flex";

        if (typeof resetArena === 'function') {
            resetArena();
        }

        // --- FERMETURE APRÈS 2 SECONDES ---
        setTimeout(() => {
            if (typeof fermerLobby === 'function') {
                fermerLobby();
            }
        }, 100);

    } catch (e) {
        console.error("Erreur suppression:", e);
        alert("Erreur lors de la suppression.");
    }
}

// --- fermerLobby ---
function fermerLobby() {
    // 1. On récupère les éléments
    const lobby = document.getElementById("lobby-overlay");
    const content = document.getElementById("lobby-content-container");
    const musicBtn = document.getElementById("musicBtn");

    // --- AJOUT : Récupération du menu et du profil ---
    const nav = document.querySelector('nav');
    const accountBtn = document.getElementById('accountBtn');

    if (lobby && content) {
        // --- 🟢 DÉCLENCHEMENT DE L'ANIMATION DE SORTIE ---
        // On retire les classes d'entrée pour éviter les conflits
        lobby.classList.remove("lobby-animate");
        content.classList.remove("lobby-content-animate");
        
        // On ajoute les classes d'animation de SORTIE
        lobby.classList.add("lobby-exit-animate");
        content.classList.add("lobby-content-exit-animate");

        // 2. On attend la fin de l'animation (300ms) avant de masquer réellement
        setTimeout(() => {
            // Cache le menu des duels (fin de l'animation)
            lobby.style.display = "none";
            
            // --- 🟣 RESET pour la prochaine ouverture ---
            lobby.classList.remove("lobby-exit-animate");
            content.classList.remove("lobby-content-exit-animate");
            content.style.opacity = "0"; // On le remet invisible pour le prochain slideIn

            // --- CONDITION DE SÉCURITÉ : Réaffichage uniquement si AUCUN combat n'est en cours ---
            if (!currentRoomId) {
                // 3. On réaffiche le bouton de musique (après la fermeture)
                if (musicBtn) musicBtn.style.display = "flex";

                // --- AJOUT : Réafficher le menu et le profil ---
                if (nav) nav.style.display = "flex";
                if (accountBtn) accountBtn.style.display = "block";
            }

        }, 300); // 300ms correspond à la durée de l'animation CSS
    } else {
        // Sécurité si le lobby n'existe pas, on cache quand même
        if (lobby) lobby.style.display = "none";
        
        // Réaffichage de sécurité si aucun combat n'est lancé
        if (!currentRoomId) {
            if (musicBtn) musicBtn.style.display = "flex";
            if (nav) nav.style.display = "flex";
            if (accountBtn) accountBtn.style.display = "block";
        }
    }
}

// --- creerNouvellePartie ---
async function creerNouvellePartie() {
    const user = auth.currentUser;
    if (!user) return alert("Tu dois être connecté pour créer un duel !");

    try {
        // --- SÉCURITÉ : VÉRIFIER SI UN SALON EXISTE DÉJÀ ---
        const snapshot = await db.collection("battles")
            .where("player1", "==", user.uid)
            .where("status", "==", "waiting")
            .get();

        if (!snapshot.empty) {
            alert("⚠️ Tu as déjà un salon en attente ! Attends qu'un adversaire le rejoigne.");
            fermerLobby();
            return; 
        }

        // --- NOUVEAUTÉ : TIRAGE DES 3 CARTES DÈS LA CRÉATION ---
        genererTirageCombat();

        // UTILISATION DU PSEUDO
        const monPseudo = window.userPseudo || user.email.split('@')[0];

        const docRef = await db.collection("battles").add({
            player1: user.uid,
            player1Name: monPseudo,
            player2: null,
            player2Name: null,
            card1: null,
            card2: null,
            status: "waiting",
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            // On initialise timerEnd à null, il sera fixé par le Player 2
            timerEnd: null 
        });

        currentRoomId = docRef.id;
        role = "player1";
        
        // --- 🛡️ MASQUAGE DES RUBRIQUES DU BAS ---
        const nav = document.querySelector('nav');
        const accountBtn = document.getElementById('accountBtn');
        const musicBtn = document.getElementById("musicBtn");

        if (nav) nav.style.display = "none";
        if (accountBtn) accountBtn.style.display = "none";
        if (musicBtn) musicBtn.style.display = "none";

        fermerLobby();
        
        // --- 🔓 DÉVERROUILLAGE DU TAPIS ET DU DECK (NOUVEAU) ---
        const playerSlot = document.getElementById("player-slot");
        const deckZone = document.getElementById("choix-cartes") || document.getElementById("cards-container");

        if (playerSlot) {
            playerSlot.style.pointerEvents = "auto";
            playerSlot.style.opacity = "1";
            playerSlot.innerHTML = `
                <span style="color: #4ade80; font-size: 0.8rem; text-align:center; font-weight:bold;">
                    Clique ici pour<br>choisir ta carte
                </span>
            `;
        }
        if (deckZone) {
            deckZone.style.pointerEvents = "auto";
            deckZone.style.filter = "none";
            deckZone.style.opacity = "1";
        }
        
        const statusDiv = document.getElementById("status-recherche");
        if (statusDiv) {
            statusDiv.innerHTML = "<span style='color:#4ade80;'>✅ Salon créé. En attente d'un adversaire...</span>";
        }
        
        ecouterLaPartie(); 
    } catch (e) {
        console.error("Erreur création salon:", e);
        alert("Erreur lors de la création : " + e.message);
    }
}

// --- rejoindreCeDuel ---
async function rejoindreCeDuel(id) {
    const user = auth.currentUser;
    if (!user) return alert("Connecte-toi pour combattre !");

    try {
        // 1. On récupère les données actuelles du salon
        const roomDoc = await db.collection("battles").doc(id).get();
        if (!roomDoc.exists) {
            alert("Ce salon n'existe plus.");
            return;
        }

        const roomData = roomDoc.data();

        // 2. SÉCURITÉ : Vérifier si l'utilisateur est le créateur (Player 1)
        if (roomData.player1 === user.uid) {
            alert("🚫 Tu ne peux pas rejoindre ton propre salon ! Attends qu'un adversaire arrive.");
            return; 
        }

        // --- NOUVEAUTÉ : TIRAGE DES 3 CARTES POUR LE JOUEUR 2 ---
        genererTirageCombat();

        // 3. Si c'est bon, on rejoint la partie
        currentRoomId = id;
        role = "player2";

        // --- 🛡️ MASQUAGE DES RUBRIQUES DU BAS ---
        const nav = document.querySelector('nav');
        const accountBtn = document.getElementById('accountBtn');
        const musicBtn = document.getElementById("musicBtn");

        if (nav) nav.style.display = "none";
        if (accountBtn) accountBtn.style.display = "none";
        if (musicBtn) musicBtn.style.display = "none";

        // Utilisation du pseudo global si disponible, sinon l'email
        const monPseudo = window.userPseudo || user.email.split('@')[0];

        // --- ⏳ CALCUL DU TIMER SERVEUR ---
        // On définit la fin du combat à : Heure Actuelle + 32 secondes 
        // (30s de jeu + 2s de marge pour la synchronisation)
        const tempsFinCombat = Date.now() + 32000;

        await db.collection("battles").doc(id).update({
            player2: user.uid,
            player2Name: monPseudo,
            status: "ready",
            // On enregistre l'heure de fin officielle sur le serveur
            timerEnd: tempsFinCombat 
        });

        fermerLobby();

playJoinSound();

        // --- 🔓 DÉVERROUILLAGE DU TAPIS ET DU DECK (NOUVEAU) ---
        const playerSlot = document.getElementById("player-slot");
        const deckZone = document.getElementById("choix-cartes") || document.getElementById("cards-container");

        if (playerSlot) {
            playerSlot.style.pointerEvents = "auto";
            playerSlot.style.opacity = "1";
            playerSlot.innerHTML = `
                <span style="color: #4ade80; font-size: 0.8rem; text-align:center; font-weight:bold;">
                    Clique ici pour<br>choisir ta carte
                </span>
            `;
        }
        if (deckZone) {
            deckZone.style.pointerEvents = "auto";
            deckZone.style.filter = "none";
            deckZone.style.opacity = "1";
        }

        ecouterLaPartie();
        
    } catch (e) {
        console.error("Erreur rejoindreCeDuel:", e);
        alert("Impossible de rejoindre : " + e.message);
    }
}

// --- chercherPartie ---
async function chercherPartie() {
    const user = auth.currentUser;
    if (!user) return alert("Connecte-toi pour jouer !");

    const statusDiv = document.getElementById("status-recherche");
    if(statusDiv) statusDiv.innerText = "Recherche d'un adversaire...";

    // 1. Chercher une salle en attente
    const snapshot = await db.collection("battles")
        .where("status", "==", "waiting")
        .orderBy("createdAt", "asc")
        .limit(1)
        .get();

    if (snapshot.empty) {
        // 2. Créer une nouvelle salle
        const docRef = await db.collection("battles").add({
            player1: user.uid,
            player1Name: user.email.split('@')[0],
            player2: null,
            player2Name: null,
            card1: null,
            card2: null,
            status: "waiting",
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        currentRoomId = docRef.id;
        role = "player1";
        if(statusDiv) statusDiv.innerText = "Salle créée. En attente d'un ami...";
    } else {
        // 3. Rejoindre la salle trouvée
        const doc = snapshot.docs[0];
        currentRoomId = doc.id;
        role = "player2";
        await db.collection("battles").doc(currentRoomId).update({
            player2: user.uid,
            player2Name: user.email.split('@')[0],
            status: "ready"
        });
        if(statusDiv) statusDiv.innerText = "Match trouvé ! Choisissez votre carte.";
    }

    // Activer l'écouteur temps réel
    ecouterLaPartie();
}

// --- ecouterLaPartie ---
function ecouterLaPartie() {
    if (!currentRoomId) return;
    
    forfaitAffiche = false;

adversaireDejaAnnonce = false;


    db.collection("battles").doc(currentRoomId).onSnapshot(async (doc) => {
        if (!currentRoomId) return;

        const data = doc.data();
        if (!data) return;


if (data.player1 && data.player2 && !adversaireDejaAnnonce) {
            playJoinSound(); // Cette fonction vérifie déjà isSoundEnabled
            adversaireDejaAnnonce = true; // On verrouille

        }



        // --- 1. GESTION DU FORFAIT (DÉCONNEXION OU TEMPS ÉCOULÉ) ---
        if (data.status === "forfait") {
            stopperTimer(); 
            combatEnCours = false;
            
            const monId = auth.currentUser.uid;
            const cEstMoiLeFautif = (data.quitterId === monId);

            if (!forfaitAffiche) {
                forfaitAffiche = true; 

                if (!cEstMoiLeFautif) {
                    // SCÉNARIO : JE SUIS LE GAGNANT
                    const fautif = data.quitterName || "L'adversaire";
                    alert(`🏆 VICTOIRE PAR FORFAIT : ${fautif} n'a pas joué à temps.`);
                    
                    resetArena();
                    currentRoomId = null;
                } else {
                    // SCÉNARIO : JE SUIS LE FAUTIF ET JE SUIS EN LIGNE
                    // On lance la sanction directe (débit immédiat + maj visuelle)
                    await appliquerSanctionForfait("Temps écoulé !");
                    return; 
                }
            }
            
            const nav = document.querySelector('nav');
            if (nav) nav.style.display = "flex";
            return; 
        }

        // --- 2. SURVEILLANCE DU TIMER SERVEUR (ARBITRAGE AVEC DÉLAI) ---
        if (data.status === "ready" && data.timerEnd && !forfaitAffiche) {
            const maintenant = Date.now();
            
            // On attend 3 secondes de plus que le timer officiel.
            // Cela laisse le temps au fautif de se sanctionner lui-même s'il est connecté.
            const delaiDeGrace = 3000; 

            if (maintenant > (data.timerEnd + delaiDeGrace)) {
                const jAiJoue = (role === "player1" ? data.card1 : data.card2);
                const lAdversaireAJoue = (role === "player1" ? data.card2 : data.card1);

                if (jAiJoue && !lAdversaireAJoue) {
                    console.log("Arbitrage : L'adversaire semble déconnecté. Envoi de l'amende en attente.");
                    
                    const adversaireId = (role === "player1" ? data.player2 : data.player1);
                    const adversaireNom = (role === "player1" ? data.player2Name : data.player1Name);

                    // 1. On déclare le forfait pour tout le monde
                    await db.collection("battles").doc(currentRoomId).update({
                        status: "forfait",
                        quitterName: adversaireNom,
                        quitterId: adversaireId,
                        raison: "Déconnexion"
                    });

                    // 2. On punit le déconnecté (amende en attente)
                    await db.collection("users").doc(adversaireId).update({
                        amendeEnAttente: firebase.firestore.FieldValue.increment(1000)
                    });
                    return;
                }
            }
        }

        if (combatEnCours) return;

        // --- 3. DÉMARRAGE DU TIMER ---
        if (data.player1 && data.player2 && data.status === "ready" && !combatTimer && !forfaitAffiche) {
            lancerTimerCombat();
        }

        // --- 4. AFFICHAGE DES ÉLÉMENTS DE COMBAT ---
        const btnStart = document.getElementById("btn-start-fight");
        const opponentSlot = document.getElementById("opponent-slot");
        const battleInfo = document.getElementById("battle-info");
        const statusDiv = document.getElementById("status-recherche");

        if (data.player1 && data.player2) {
            if (statusDiv) {
                statusDiv.innerHTML = "<span style='color:#ff4444; font-weight:bold; text-transform:uppercase;'>⚡ COMBAT EN COURS ⚡</span>";
            }
            const nomAdversaire = (role === "player1") ? data.player2Name : data.player1Name;
            if (battleInfo && !combatTimer) { 
                battleInfo.innerHTML = `⚔️ Adversaire : <span style="color:#ff4444; font-weight:bold;">${nomAdversaire || "Joueur..."}</span>`;
            }
        }

        // --- 5. PROCESSING (CALCUL VAINQUEUR) ---
        if (data.status === "processing") {
            stopperTimer(); 
            combatEnCours = true; 
            if (typeof avancerQuete === "function") avancerQuete("combat", 1);
            if (btnStart) {
                btnStart.disabled = true;
                btnStart.style.display = "none";
            }
            if (statusDiv) statusDiv.innerHTML = "<span style='color:#facc15; font-weight:bold;'>🔥 CALCUL DU VAINQUEUR... 🔥</span>";
            executerCalculCombat(); 
            return; 
        }

        // --- 6. CARTES PRÊTES ---
        if (data.card1 && data.card2 && data.status === "ready") {
            stopperTimer(); 
            if (battleInfo) battleInfo.innerHTML = `<span style="color:#4ade80; font-weight:bold;">🔥 PRÊTS ! 🔥</span>`;
            if (btnStart) btnStart.style.display = "block";
        }

        const opponentCard = (role === "player1") ? data.card2 : data.card1;
        if (opponentCard && opponentSlot && data.status === "ready") {
            opponentSlot.innerHTML = `
                <div class="card" style="background:#1e293b; border:2px solid #ff4444; height:100%; display:flex; align-items:center; justify-content:center; flex-direction:column;">
                    <span style="font-size:3rem;">❓</span>
                    <span style="font-size:0.7rem; color:#ff4444;">Carte choisie</span>
                </div>`;
        }
    });
}

// --- ouvrirSelectionCombat ---
function ouvrirSelectionCombat() {
    const selectionList = document.getElementById("selection-list");
    const overlay = document.getElementById("selection-combat-overlay");
    selectionList.innerHTML = ""; 

    if (mes3CartesCombat.length === 0) {
        // Si le tirage n'a pas été fait, on le fait maintenant (sécurité)
        genererTirageCombat();
    }

    // On affiche les cartes stockées dans mes3CartesCombat
    mes3CartesCombat.forEach(c => {
        const wrapper = document.createElement("div");
        wrapper.className = "card-wrapper";
        wrapper.style.position = "relative";
        wrapper.style.cursor = "pointer";

        // --- BADGE DE NIVEAU (Identique collection) ---
        const levelBadge = document.createElement("div");
        levelBadge.style.cssText = `position:absolute; top:-5px; right:-5px; background:linear-gradient(135deg,#ffd700,#ffa500); color:#000; padding:2px 8px; border-radius:10px; font-size:0.75rem; font-weight:bold; z-index:5; box-shadow:0 2px 4px rgba(0,0,0,0.3); border:1px solid #fff; display:flex; flex-direction:column; align-items:center;`;
        levelBadge.innerHTML = `<span>Niv. ${c.level || 1}</span>`;
        if (c.rarity === "OG") {
            levelBadge.innerHTML += `<span style="font-size:0.6rem; opacity:0.8; margin-top:-2px;">${c.exp || 0}/2</span>`;
        }
        wrapper.appendChild(levelBadge);

        const cardDiv = document.createElement("div");
        if (c.rarity === "OG") {
            cardDiv.className = "card";
            cardDiv.style.cssText = "position:relative; border:none; padding:0; background:none; overflow:hidden;";
            cardDiv.innerHTML = `<img src="${c.image}" style="width:100%;height:100%;object-fit:contain;display:block;">`;
        } else {
            cardDiv.className = "card r-" + c.rarity.replace(/ /g, "-");
            cardDiv.innerHTML = `
                <div style="font-size:0.8rem;color:#ccc;margin-bottom:4px;">${c.rarity}</div>
                <img src="${c.image}" alt="${c.name}" style="width:100%;border-radius:8px;margin-bottom:8px">
                <strong>${c.name}</strong>
            `;
        }

        wrapper.appendChild(cardDiv);
        wrapper.onclick = () => {
            choisirCetteCarte(c, c.originalIndex);
            overlay.style.display = 'none';
        };
        selectionList.appendChild(wrapper);
    });

    overlay.style.display = "block";
}

// --- genererTirageCombat ---
function genererTirageCombat() {
    // --- FILTRE : On exclut les cartes en période de récupération ---
    const cartesDisponibles = collection.filter(c => {
        const maintenant = Date.now();
        return !c.indisponibleJusquA || maintenant > c.indisponibleJusquA;
    });

    if (cartesDisponibles.length === 0) {
        alert("Tu n'as aucune carte disponible pour combattre !");
        return;
    }

    mes3CartesCombat = [];

    let tirage = cartesDisponibles.map((card, index) => ({...card, originalIndex: index}));
    
    // Mélange classique
    for (let i = tirage.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [tirage[i], tirage[j]] = [tirage[j], tirage[i]];
    }



    // Prend les 3 premières (l'Exclu sera forcément dedans si elle n'est pas bannie)
    mes3CartesCombat = tirage.slice(0, 3);
}

// --- choisirCetteCarte ---
async function choisirCetteCarte(card, index) {
    // --- 1. SÉCURITÉ ET ADAPTATION DU TIMER ---
    // MODIF : On ne stoppe plus le timer ici pour permettre l'arbitrage.
    // Le texte du chrono changera automatiquement grâce à "selectedPlayerCard" dans lancerTimerCombat.

    // --- 2. MISE À JOUR DES VARIABLES LOCALES ---
    // On définit ces variables tout de suite pour bloquer les relances inutiles
    selectedPlayerCard = card;
    selectedPlayerCardIndex = index;

    // --- 3. PARTIE LOGIQUE MULTIJOUEUR ---
    if (currentRoomId) {
        const updateData = {};
        // On vérifie si on est le joueur 1 ou 2 pour remplir le bon champ sur Firebase
        if (role === "player1") {
            updateData.card1 = card;
        } else {
            updateData.card2 = card;
        }
        
        // On envoie la carte choisie sur le serveur
        // L'utilisation de "await" ici attend que la DB soit à jour
        await db.collection("battles").doc(currentRoomId).update(updateData);
    }

    // --- 4. MISE À JOUR VISUELLE DU SLOT ---
    const playerSlot = document.getElementById("player-slot");
    if (playerSlot) {
        // On applique la rareté pour la bordure (ex: r-Legendary)
        const rarityClass = `r-${card.rarity.replace(/\s+/g, '-')}`;
        
        // On injecte le design SANS l'ATK (Révélée au calcul final)
        playerSlot.innerHTML = `
            <div class="card ${rarityClass}" style="width:100%; height:100%; margin:0; border:none; box-shadow: 0 0 15px rgba(124,58,237,0.4);">
                <div class="card-inner" style="height:100%; padding: 5px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                    <img src="${card.image}" class="card-img" style="max-height: 85%; width: auto; object-fit: contain; border-radius: 5px;">
                    <div class="card-name" style="font-size: 0.75rem; margin-top: 5px; font-weight: bold; color: #fff;">${card.name}</div>
                </div>
            </div>
        `;
    }

    // --- 5. NETTOYAGE DE L'INTERFACE ---
    // On ferme l'overlay de sélection
    const overlay = document.getElementById("selection-combat-overlay");
    if (overlay) {
        overlay.style.display = "none";
    }
    
    // --- 6. LOGIQUE SOLO (IA) ---
    // On ne lance l'IA que si on n'est pas en mode multijoueur
    if (!currentRoomId) {
        // En mode solo, on arrête le timer car il n'y a pas d'arbitrage réseau nécessaire
        stopperTimer();
        if (typeof preparerAdversaire === 'function') {
            preparerAdversaire();
        }
    }
}

// --- preparerAdversaire ---
function preparerAdversaire() {
    // 1. L'IA choisit une carte au hasard dans TOUTES les cartes existantes // ICI
    const randomIndex = Math.floor(Math.random() * ALL_CARDS.length);
    
    // On crée une copie pour ne pas modifier l'original dans ALL_CARDS
    currentOpponentCard = { ...ALL_CARDS[randomIndex] };

    // --- NOUVEAU : On donne un niveau aléatoire à l'IA (ex: entre 1 et 5) ---
    // Cela permet à getPower d'utiliser le niveau pour calculer l'ATK de l'IA
    currentOpponentCard.level = Math.floor(Math.random() * 5) + 1;

    // 2. On récupère le slot de l'IA (à droite) // ICI
    const opponentSlot = document.getElementById("opponent-slot");
    
    // 3. On affiche la carte de l'IA
    opponentSlot.innerHTML = `
        <div class="card" style="width:100%; height:100%; margin:0; position:relative; border:2px solid #ff4444;">
            <img src="${currentOpponentCard.image}" style="width:100%; border-radius:8px;">
            <div style="font-size:0.7rem; font-weight:bold;">${currentOpponentCard.name} (Niv. ${currentOpponentCard.level})</div>
            <div style="color:#ff4444; font-weight:bold;">ATK: ${getPower(currentOpponentCard)}</div>
        </div>
    `;

    // 4. Une fois que l'IA a choisi, on montre enfin le bouton pour lancer le combat // ICI
    document.getElementById("btn-start-fight").style.display = "block";
    
    // On peut ajouter un petit texte d'info
    document.getElementById("battle-info").innerText = "L'IA est prête ! À l'attaque !";
}

// --- lancerLeCombat ---
async function lancerLeCombat() {

    /* if (typeof avancerQuete === "function") {
        avancerQuete("combat", 1);
    } 
    */

    if (!currentRoomId || combatEnCours) return;

    const roomRef = db.collection("battles").doc(currentRoomId);
    const btn = document.getElementById("btn-start-fight");
    const infoZone = document.getElementById("battle-info"); // On récupère la zone d'info

    btn.disabled = true;
    btn.innerText = "Envoi du signal...";

    // --- MODIFICATION POUR FORCER L'AFFICHAGE ---
    try {
        // On récupère les données fraîches de la base de données
        const doc = await roomRef.get();
        const data = doc.data();

        if (data && data.playerCard && data.opponentCard) {
            // On affiche les stats qui sont stockées dans Firebase
            infoZone.innerHTML = `
                <span style="color: #7c3aed; font-size: 1.2rem;">Ton ATK: ${data.playerCard.attaque}</span> 
                <span style="color: #ff4444; margin-left: 15px; font-size: 1.2rem;">ATK Adv: ${data.opponentCard.attaque}</span>
            `;
        } else if (window.carteSelectionnee && window.carteAdversaire) {
            // Backup : si Firebase n'est pas encore prêt, on utilise les variables locales
            infoZone.innerHTML = `
                <span style="color: #7c3aed;">Ton ATK: ${window.carteSelectionnee.attaque}</span> 
                <span style="color: #ff4444; margin-left: 15px;">ATK Adv: ${window.carteAdversaire.attaque}</span>
            `;
        }
    } catch (error) {
        console.error("Erreur lors de l'affichage des ATK:", error);
    }

    // 2. IMPORTANT : Le changement de statut va déclencher la quête chez TOUT LE MONDE
    await roomRef.update({ status: "processing" });
}

// --- executerCalculCombat ---
async function executerCalculCombat() {

playFightSound();

    combatEnCours = true; 
    const btn = document.getElementById("btn-start-fight");
    let p1Power, p2Power, maCarte, carteAdversaire;

    // 1. RÉCUPÉRATION
    const doc = await db.collection("battles").doc(currentRoomId).get();
    const data = doc.data();
    if (!data) return;

    maCarte = (role === "player1") ? data.card1 : data.card2;
    carteAdversaire = (role === "player1") ? data.card2 : data.card1;
    p1Power = getPower(maCarte);
    p2Power = getPower(carteAdversaire);

    // --- AJOUT : RÉVÉLATION VISUELLE DE TA CARTE (Taille fixée) ---
    document.getElementById("player-slot").innerHTML = `
        <div class="card ${maCarte.rarity?.toLowerCase()}" style="width: 100%; height: 100%; margin: 0; padding: 0; box-sizing: border-box; overflow: hidden;">
            <div class="card-inner" style="width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: space-around;">
                <img src="${maCarte.image}" class="card-img" style="width: 100%; height: 100px; object-fit: contain;">
                <div class="card-name" style="font-size: 0.75rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 90%; text-align: center;">${maCarte.name}</div>
                <div class="card-power" style="font-size: 0.85rem; font-weight: bold; color: #ff4444;">${p1Power} ATK</div>
            </div>
        </div>`;

    // Révélation visuelle de l'ADVERSAIRE (Taille fixée)
    document.getElementById("opponent-slot").innerHTML = `
        <div class="card ${carteAdversaire.rarity?.toLowerCase()}" style="width: 100%; height: 100%; margin: 0; padding: 0; box-sizing: border-box; overflow: hidden;">
            <div class="card-inner" style="width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: space-around;">
                <img src="${carteAdversaire.image}" class="card-img" style="width: 100%; height: 100px; object-fit: contain;">
                <div class="card-name" style="font-size: 0.75rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 90%; text-align: center;">${carteAdversaire.name}</div>
                <div class="card-power" style="font-size: 0.85rem; font-weight: bold; color: #ff4444;">${p2Power} ATK</div>
            </div>
        </div>`;

// 2. MISE EN SCÈNE DU COMBAT (ANIMATIONS)
    btn.style.display = "block";
    btn.disabled = true;
    btn.innerText = "CHOC EN COURS...";

    const cardP1 = document.getElementById("player-slot").firstElementChild;
    const cardP2 = document.getElementById("opponent-slot").firstElementChild;

    // Étape A : Inclinaison (Préparation)
    cardP1.classList.add("prepare-p1");
    cardP2.classList.add("prepare-p2");

    await new Promise(r => setTimeout(r, 600));

    // Étape B : Collision (Elles se foncent dedans)
    cardP1.classList.remove("prepare-p1");
    cardP2.classList.remove("prepare-p2");
    cardP1.classList.add("collision-p1");
    cardP2.classList.add("collision-p2");

    // Son de choc au milieu de l'anim
    setTimeout(() => { playFightSound(); }, 150); 

    await new Promise(r => setTimeout(r, 400));

    // Étape C : Zoom sur le vainqueur
    if (p1Power > p2Power) {
        cardP1.classList.add("winner-anim");
        cardP2.classList.add("loser-anim");
    } else if (p1Power < p2Power) {
        cardP2.classList.add("winner-anim");
        cardP1.classList.add("loser-anim");
    }

    await new Promise(r => setTimeout(r, 800)); // Laisse le joueur voir qui a gagné

    let xpGagne = 20;


    // --- 3. VERDICT (LOGIQUE FRAGMENTS ET QUÊTES) ---
if (p1Power > p2Power) {
        // VICTOIRE
        playWinSound();
        xpGagne = 100;

        if (typeof avancerQuete === "function") {
            avancerQuete("win_combat", 1);
        }

        // Gain de base pour la victoire
        dust += 500;
        
        // --- LOGIQUE SPÉCIALE EXCLU (PRIME AU LIEU DE CAPTURE) ---
        if (carteAdversaire.rarity === "Exclu Season 1"   || carteAdversaire.rarity === "Exclu Pâques 2026") {
            dust += 3000;
            setTimeout(() => {
                alert(`🏆 VICTOIRE !\n+${xpGagne} XP | +500 Fragments.\n💰 PRIME DE COMBAT : Tu as battu une EXCLU ! Tu gagnes +3000 Fragments au lieu de la capturer !`);
            }, 100);
        } else {
            // Logique normale pour les autres cartes
            const possèdeDéjà = collection.some(c => c.name === carteAdversaire.name);

            if (possèdeDéjà) {
                // --- AJOUT : GAIN DOUBLON SELON RARETÉ ---
                const gainsParRarete = {
                    "Commun": 400,
                    "Rare": 400,
                    "Epic": 500,
                    "Legendary": 600,
                    "Mythic": 1000,
                    "Brainrot God": 1500,
                    "Secret": 2500,
                    "OG": 5000
                };

                let bonusDoublon = gainsParRarete[carteAdversaire.rarity] || 1000;
                dust += bonusDoublon;

                setTimeout(() => {
                    alert(`🏆 VICTOIRE !\n+${xpGagne} XP | +500 Fragments.\n✨ Tu possèdes déjà cette carte : BONUS +${bonusDoublon} Fragments pour rareté ${carteAdversaire.rarity} ! (Total : ${500 + bonusDoublon} 💎)`);
                }, 100);
            } else {
                // NOUVELLE CARTE : On l'ajoute normalement
                collection.push({ ...carteAdversaire });
                setTimeout(() => {
                    alert(`🏆 VICTOIRE !\n+${xpGagne} XP | +500 Fragments.\nNouveau Brainrot capturé : ${carteAdversaire.name} !`);
                }, 100);
            }
        }
        
    } else if (p1Power < p2Power) {
        // DÉFAITE
        playLoseSound();
        dust = Math.max(0, dust - 200);
        
        if (selectedPlayerCardIndex !== -1) {
            const carteCombat = collection[selectedPlayerCardIndex];

            // --- SYSTÈME ANTI-PERTE EXCLU ---
            if (carteCombat.rarity === "Exclu Season 1"     || carteCombat.rarity === "Exclu Pâques 2026") {
                // On ne splice pas ! On ajoute un timer de 7 jours (en ms)
                const uneSemaine = 7 * 24 * 60 * 60 * 1000;
                collection[selectedPlayerCardIndex].indisponibleJusquA = Date.now() + uneSemaine;

if (typeof refreshCollection === "function") refreshCollection();
                
                setTimeout(() => {
                    alert(`💀 DÉFAITE !\n+${xpGagne} XP | -200 Fragments.\n⚠️ Ta carte ${maCarte.name} est épuisée ! Elle est sauvée mais sera indisponible pendant 7 jours.`);
                }, 100);
            } else {
                // Logique normale : suppression de la carte
                collection.splice(selectedPlayerCardIndex, 1);
                setTimeout(() => {
                    alert(`💀 DÉFAITE !\n+${xpGagne} XP | -200 Fragments. Ta carte ${maCarte.name} est détruite.`);
                }, 100);
            }

}


    } else {
        alert(`🤝 MATCH NUL !\n+${xpGagne} XP gagnés.`);
    }

    if (typeof ajouterXP === "function") {
        await ajouterXP(xpGagne);
    }



    // 4. SAUVEGARDE
    if (auth.currentUser) {
        await saveUserData(auth.currentUser.uid);
    }

    // 5. RESET FINAL
    combatEnCours = false; 
    btn.style.display = "none";

    // --- NETTOYAGE DU MESSAGE DE STATUT ---
    const statusDiv = document.getElementById("status-recherche");
    if (statusDiv) {
        statusDiv.innerHTML = ""; 
    }

    resetArena();
    
    if (typeof showCombat === "function") {
        showCombat(); 
    } else if (typeof showSection === "function") {
        showSection('combat');
    }

    currentRoomId = null; 
}

// --- resetArena ---
function resetArena() {
    // 1. On vide les variables (les cartes n'existent plus dans le combat) // ICI
    selectedPlayerCard = null;
    selectedPlayerCardIndex = null;
    currentOpponentCard = null;

    // 2. On remet le texte de guidage à gauche // ICI
    const playerSlot = document.getElementById("player-slot");
    if (playerSlot) {
        playerSlot.innerHTML = `
            <span style="color: #8da0b8; font-size: 0.75rem; text-align:center; padding: 5px; line-height: 1.2;">
                Rejoins ou crée un salon<br>pour combattre
            </span>
        `;
        // --- BLOCAGE DU SLOT ---
        playerSlot.style.pointerEvents = "none"; 
        playerSlot.style.opacity = "0.5";
    }

    // 3. On remet le "?" à droite // ICI
    const opponentSlot = document.getElementById("opponent-slot");
    if (opponentSlot) {
        opponentSlot.innerHTML = `<span>?</span>`;
    }

    // 4. On cache le bouton de combat (il ne doit pas rester là) // ICI
    const btnFight = document.getElementById("btn-start-fight");
    if (btnFight) {
        btnFight.style.display = "none";
        btnFight.disabled = false;
        btnFight.innerText = "🔥 LANCER LE COMBAT ! 🔥";
    }

    // 5. On efface les messages de victoire/défaite sur l'écran
    const battleInfo = document.getElementById("battle-info");
    if (battleInfo) battleInfo.innerText = "";

    // --- AJOUT : CACHER LE PSEUDO DE L'ADVERSAIRE ---
    const infoAdversaireBas = document.getElementById("battle-info-adversaire");
    if (infoAdversaireBas) {
        infoAdversaireBas.innerHTML = ""; 
    }

    // --- AJOUT : RESET DU MESSAGE DE STATUT (Pour enlever "COMBAT EN COURS") ---
    const statusDiv = document.getElementById("status-recherche");
    if (statusDiv) {
        statusDiv.innerHTML = "PRÊT À COMBATTRE ?";
    }

    // --- 🛡️ BLOCAGE DU CHOIX DE CARTES (DECK) ---
    const deckZone = document.getElementById("choix-cartes") || document.getElementById("cards-container");
    if (deckZone) {
        deckZone.style.pointerEvents = "none";
        deckZone.style.filter = "grayscale(1)"; 
        deckZone.style.opacity = "0.6";
    }

    // --- 🏠 RÉAFFICHAGE DU MENU, DU PROFIL ET DE LA MUSIQUE ---
    const nav = document.querySelector('nav');
    const accountBtn = document.getElementById('accountBtn');
    const musicBtn = document.getElementById('musicBtn');

    if (nav) nav.style.display = "flex";
    if (accountBtn) accountBtn.style.display = "block";
    if (musicBtn) musicBtn.style.display = "flex";
}

// --- getPower ---
function getPower(card) {
    // 1. Priorité à l'ATK fixe si elle existe (ex: calculée lors d'un événement spécial)
    if (card.atk !== undefined && card.atk !== null) {
        return card.atk;
    }

    // 2. Nouvelles Bases d'ATK (Équilibrées par rapport aux probabilités d'obtention)
    const basePowers = {
        "Commun": 100,
        "Rare": 300,
        "Epic": 800,
        "Legendary": 2000,
        "Mythic": 4500,
        "Brainrot God": 9000,
        "Secret": 15000,
        "OG": 25000,
        "Exclu Season 1": 150000,
        "Exclu Pâques 2026" : 120000
    };

    // Récupération de la base (par défaut 50 si rareté inconnue)
    const base = basePowers[card.rarity] || 50;
    
    // Récupération du niveau (par défaut 1)
    const niveau = card.level || 1;

    // 3. Nouvelle Formule : +10% de la BASE par niveau supplémentaire
    // Niveau 1 = Base pure
    // Niveau 2 = Base + 10%
    // Niveau 11 = Base + 100% (Puissance doublée)
    const bonusNiveau = base * 0.1 * (niveau - 1);
    
    return Math.floor(base + bonusNiveau);
}

// --- lancerTimerCombat ---
function lancerTimerCombat() {
    // 1. NETTOYAGE PRÉALABLE
    if (combatTimer) { 
        clearInterval(combatTimer); 
        combatTimer = null; 
    }

    // 2. INITIALISATION DES PARAMÈTRES
    tempsRestant = 30;
    const battleInfo = document.getElementById("battle-info");
    const infoAdversaireBas = document.getElementById("battle-info-adversaire");
    const timerDisplay = document.getElementById("combat-timer-display");

    if (timerDisplay) timerDisplay.style.display = "block";

    // 3. LANCEMENT DE LA BOUCLE
    combatTimer = setInterval(async () => {
        try {
            // SÉCURITÉ : Si la room a disparu, on arrête tout
            if (!currentRoomId) {
                clearInterval(combatTimer);
                combatTimer = null;
                return;
            }

            tempsRestant--;

            // A. MISE À JOUR VISUELLE DU CHRONO (HAUT)
            if (battleInfo) {
                const color = tempsRestant <= 10 ? "#ff4444" : "#facc15";
                battleInfo.innerHTML = selectedPlayerCard 
                    ? `L'adversaire a <span style="color:${color};">${tempsRestant}s</span> pour jouer`
                    : `Il te reste <span style="color:${color};">${tempsRestant}s</span> pour jouer`;
            }

            // B. MISE À JOUR DU PSEUDO (BAS)
            // On ne le fait qu'une fois ou si le champ est vide pour économiser Firebase
            if (infoAdversaireBas && infoAdversaireBas.innerHTML === "") {
                const doc = await db.collection("battles").doc(currentRoomId).get();
                if (doc.exists) {
                    const data = doc.data();
                    const nomAdversaire = (role === "player1" ? data.player2Name : data.player1Name);
                    infoAdversaireBas.innerHTML = `Adversaire : <span style="color:#fff; font-weight:bold;">${nomAdversaire || "En attente..."}</span>`;
                }
            }

            // C. LOGIQUE DE FIN DE TEMPS
            if (tempsRestant <= 0) { 
                clearInterval(combatTimer);
                combatTimer = null;

                // --- CAS 1 : MOI je n'ai pas choisi ---
                if (!selectedPlayerCard) {
                    console.warn("Joueur AFK : Sanction et Reset.");
                    if (timerDisplay) timerDisplay.style.display = "none";
                    
                    await appliquerSanctionForfait("Temps écoulé !");
                    resetArena(); // Reset complet de l'arène
                    return; 
                } 
                
                // --- CAS 2 : L'ADVERSAIRE ne répond pas ---
                console.log("Arbitrage : Attente du délai de grâce (3s)...");
                
                // On stocke l'ID de la room pour le timeout au cas où currentRoomId changerait
                const roomToCheck = currentRoomId;

                setTimeout(async () => {
                    // SÉCURITÉ : Vérification du path vide avant l'appel Firebase
                    if (!roomToCheck) return;

                    const docRef = db.collection("battles").doc(roomToCheck);
                    const doc = await docRef.get();
                    
                    if (doc.exists) {
                        const data = doc.data();
                        
                        if (data.status !== "forfait") {
                            const lAdversaireAJoue = (role === "player1" ? data.card2 : data.card1);
                            const adversaireId = (role === "player1" ? data.player2 : data.player1);

                            if (!lAdversaireAJoue) {
                                console.log("Arbitrage : L'adversaire est absent.");
                                await docRef.update({
                                    status: "forfait",
                                    quitterName: (role === "player1" ? data.player2Name : data.player1Name),
                                    quitterId: adversaireId,
                                    raison: "déconnexion_timeout"
                                });

                                await db.collection("users").doc(adversaireId).update({
                                    amendeEnAttente: firebase.firestore.FieldValue.increment(1000)
                                });
                            }
                        }
                    }
                }, 3000); 
            }
        } catch (error) {
            console.error("Erreur dans la boucle du timer :", error);
            if (combatTimer) {
                clearInterval(combatTimer);
                combatTimer = null;
            }
        }
    }, 1000);
}

// --- appliquerDefaiteForfait ---
async function appliquerDefaiteForfait() {
    // Sanction financière
    dust = Math.max(0, dust - 1000);
    if (auth.currentUser) await saveUserData(auth.currentUser.uid);
    
    // Notification à l'adversaire via Firebase
    if (currentRoomId) {
        await db.collection("battles").doc(currentRoomId).update({
            status: "forfait",
            quitterName: window.userPseudo || auth.currentUser.email.split('@')[0]
        });
    }
    resetArena();
    currentRoomId = null;
}

// --- stopperTimer ---
function stopperTimer() {
    // 1. ARRÊT LOGIQUE (Backend local)
    if (combatTimer) {
        clearInterval(combatTimer);
        combatTimer = null; // Crucial pour éviter les doubles déclenchements

    }

    // 2. NETTOYAGE VISUEL (UI)
    const timerDisplay = document.getElementById("combat-timer-display");
    const timerBar = document.getElementById("timer-bar");

    // Cache le conteneur du timer
    if (timerDisplay) {
        timerDisplay.style.display = "none";
    }

    // Reset complet de la barre de progression pour le prochain combat
    if (timerBar) {
        timerBar.style.width = "100%";
        // On remet la couleur d'origine (violet ou vert) si elle était passée en rouge (danger)
        timerBar.style.background = "#7c3aed"; 
    }

    // Optionnel : On peut aussi vider le texte du décompte dans battle-info
    const battleInfo = document.getElementById("battle-info");
    if (battleInfo && !combatEnCours) {
        battleInfo.innerText = "";
    }
}

// --- appliquerSanctionForfait ---
async function appliquerSanctionForfait(raison) {
    const user = auth.currentUser;
    // Sécurité : si pas d'utilisateur ou si la sanction est déjà en cours d'affichage
    if (!user || forfaitAffiche) return; 

    // 1. VERROUILLAGE & NETTOYAGE IMMÉDIAT
    forfaitAffiche = true; 
    stopperTimer(); // On arrête tout de suite le visuel du chrono


    // 2. MISE À JOUR VISUELLE IMMÉDIATE (Évite le besoin de refresh)
    dust = Math.max(0, dust - 1000);




    // --- MODIFICATION ICI : 
    const profileDustElem = document.getElementById("profileDust");
    const hudDustElem = document.getElementById("hudDust");
    
    if (profileDustElem) profileDustElem.innerText = dust;
    if (hudDustElem) hudDustElem.innerText = dust;


    if (typeof actualiserAffichageDust === 'function') {
        actualiserAffichageDust();
    }



    try {
        // 3. MISE À JOUR BASE DE DONNÉES
        const userRef = db.collection("users").doc(user.uid);
        
        // On lance les deux updates en parallèle pour gagner du temps
        const updates = [];

        // Update 1 : Retrait des fragments (On utilise la variable calculée pour être précis)
        updates.push(userRef.update({
            dust: dust,
            amendeEnAttente: 0 // On remet à zéro car il paie maintenant
        }));

        // Update 2 : Signalement du forfait dans le salon
        if (currentRoomId) {
            const monPseudo = window.userPseudo || user.email.split('@')[0];
            updates.push(db.collection("battles").doc(currentRoomId).update({
                status: "forfait",
                quitterName: monPseudo,
                quitterId: user.uid,
                raison: raison
            }));
        }

        await Promise.all(updates);

        // 4. ALERTE À L'UTILISATEUR
        alert(`❌ DÉFAITE PAR FORFAIT\n${raison}\n\nRetrait de 1000 Fragments.`);

    } catch (error) {
        console.error("Erreur lors de la synchronisation de la sanction :", error);
    } finally {
        // 5. RÉINITIALISATION DE L'INTERFACE (RESET ARENA)
        combatEnCours = false;
        
        if (typeof resetArena === 'function') {
            resetArena();
        }
        
        currentRoomId = null;

        // 6. RÉAFFICHAGE DES ÉLÉMENTS DE NAVIGATION (HUD)
        const nav = document.querySelector('nav');
        const accountBtn = document.getElementById('accountBtn');
        const musicBtn = document.getElementById('musicBtn');
        const luckyRow = document.getElementById('hudBottomRow');

        if (nav) nav.style.display = "flex";
        if (accountBtn) accountBtn.style.display = "block";
        if (musicBtn) musicBtn.style.display = "flex";
        if (luckyRow) luckyRow.style.display = "flex";

    }
}

// --- verifierAmendes ---
async function verifierAmendes(userId) {
    try {
        const userRef = db.collection("users").doc(userId);
        const doc = await userRef.get();
        if (!doc.exists) return;

        const data = doc.data();
        
        // On vérifie s'il y a une amende en attente sur le serveur
        if (data.amendeEnAttente && data.amendeEnAttente > 0) {
            const montant = data.amendeEnAttente;
            
            // SÉCURITÉ : Si la variable globale 'dust' est undefined, 
            // on prend la valeur 'dust' qui vient du serveur
            let dustActuel = (typeof dust !== 'undefined') ? dust : (data.dust || 0);
            
            // Calcul du nouveau total
            const nouveauDust = Math.max(0, dustActuel - montant);
            
            // Mise à jour de la variable globale pour que le reste du script soit au courant
            dust = nouveauDust;

            // 1. On nettoie l'amende ET on met à jour les fragments sur Firebase
            await userRef.update({
                dust: nouveauDust,
                amendeEnAttente: 0 
            });

            // 2. Alerte le joueur
            alert(`❌ DÉFAITE PAR FORFAIT : Tu as abandonné ton dernier combat avant la fin.\nTu as perdu ${montant} Fragments.`);
            
            // 3. Mise à jour visuelle (HUD)
            if (typeof actualiserAffichageDust === 'function') {
                actualiserAffichageDust();
            }
        }
    } catch (error) {
        console.error("Erreur vérification amendes :", error);
    }
}

// --- checkUpdateNews ---
function checkUpdateNews() {
    const lastSeenVersion = localStorage.getItem("lastSeenVersion");

    // Si la version stockée est différente de la version actuelle
    if (lastSeenVersion !== CURRENT_VERSION) {
        document.getElementById("newsOverlay").style.display = "flex";
    }
}

// --- closeNews ---
function closeNews() {
    // On enregistre que l'utilisateur a vu cette version
    localStorage.setItem("lastSeenVersion", CURRENT_VERSION);
    document.getElementById("newsOverlay").style.display = "none";
}

// --- disableSiteForQuota ---
function disableSiteForQuota() {
    const maintenance = document.getElementById("maintenanceOverlay");
    if(maintenance) {
        maintenance.style.display = "flex";
        // On bloque aussi toute interaction avec le clavier
        window.addEventListener("keydown", (e) => e.stopPropagation(), true);
    }
}

// --- toggleMusic ---
function toggleMusic() {
    if (!bgMusic) return;

    if (isPlaying) {
        bgMusic.pause();
        if (musicBtn) musicBtn.innerText = "🔈";
        if (hudMusicIcon) hudMusicIcon.innerText = "🔈";
        isPlaying = false;
    } else {
        bgMusic.play().catch(e => console.log("Lecture bloquée"));
        if (musicBtn) musicBtn.innerText = "🔊";
        if (hudMusicIcon) hudMusicIcon.innerText = "🔊";
        isPlaying = true;
    }
}

// --- playJoinSound ---
function playJoinSound() {
    if (isSoundEnabled && soundJoin) {
        soundJoin.currentTime = 0;
        soundJoin.play().catch(e => console.log("Lecture bloquée"));
    }
}

// --- playFightSound ---
function playFightSound() {
    if (isSoundEnabled && soundFight) {
        soundFight.currentTime = 0;
        soundFight.play().catch(e => console.log("Audio bloqué"));
    }
}

// --- playWinSound ---
function playWinSound() {
    if (isSoundEnabled && soundWin) {
        soundWin.currentTime = 0;
        soundWin.play().catch(e => {});
    }
}

// --- playLoseSound ---
function playLoseSound() {
    if (isSoundEnabled && soundLose) {
        soundLose.currentTime = 0;
        soundLose.play().catch(e => {});
    }
}

// --- playMoneySound ---
function playMoneySound() {
    if (isSoundEnabled && soundMoney) {
        soundMoney.currentTime = 0;
        soundMoney.play().catch(e => console.log("Audio bloqué"));
    }
}

// --- playQuestSound ---
function playQuestSound() {
    if (isSoundEnabled && soundQuest) {
        soundQuest.currentTime = 0;
        soundQuest.play().catch(e => console.log("Audio en attente d'interaction"));
    }
}

// --- playPurchaseSound ---
function playPurchaseSound() {
    if (typeof isSoundEnabled !== 'undefined' && isSoundEnabled && soundPurchase) {
        soundPurchase.currentTime = 0;
        soundPurchase.play().catch(e => console.log("Audio bloqué"));
    }
}

// --- toggleSFXFromMenu ---
function toggleSFXFromMenu() {
    // 1. On récupère la checkbox par son ID
    const checkbox = document.getElementById('sfxCheckbox');
    
    if (checkbox) {
        // 2. On met à jour la variable isSoundEnabled selon si c'est coché ou non
        isSoundEnabled = checkbox.checked;

        // 3. (Sécurité) Si on vient de décocher, on coupe tous les sons en cours immédiatement
        if (!isSoundEnabled) {
            const allSounds = [
                soundBooster, soundJoin, soundFight, soundWin, 
                soundLose, soundMoney, soundQuest, soundPurchase
            ];
            
            allSounds.forEach(s => {
                if (s) {
                    s.pause();
                    s.currentTime = 0;
                }
            });
        }
        
    }
}

// --- saveToFirebase ---
function saveToFirebase(uid) {
  // --- DÉBUT DU SYSTÈME D'ALERTE ---
  let timeoutAlerteRecue = false;
  const chronoSecurite = setTimeout(() => {
      timeoutAlerteRecue = true;
      console.warn("%c📡 ALERTE RÉSEAU : La sauvegarde Firebase ne répond plus !", "background: #8B0000; color: white; padding: 5px; font-weight: bold;");
      console.log("%c(Le jeu va réessayer de sauvegarder automatiquement dès que la connexion revient)", "color: gray; font-style: italic;");
  }, 4000); // Déclenche l'alerte après 4 secondes de silence
  // --- FIN DU SYSTÈME D'ALERTE ---

  // On prépare l'objet proprement (Ton code original)
  const dataToSave = {
    collection: collection,
    dust: dust,
    streakCount: streakCount,
    lastOpenDate: lastOpenDate,
    xp: typeof xp !== 'undefined' ? xp : 0,
    
    // On ajoute ça pour être sûr que Firebase est TOUJOURS d'accord avec le JS local
    luckyBlockUnlockTime: typeof luckyBlockUnlockTime !== 'undefined' ? luckyBlockUnlockTime : null,
    luckyBlockReady: typeof luckyBlockReady !== 'undefined' ? luckyBlockReady : false,

    lastUpdate: firebase.firestore.FieldValue.serverTimestamp()
  };

  // Sécurité pour le type (évite l'erreur HTMLDivElement)
  if (typeof luckyBlockType !== 'undefined') {
      dataToSave.luckyBlockType = (luckyBlockType instanceof HTMLElement) ? luckyBlockType.innerText : luckyBlockType;
  } else {
      dataToSave.luckyBlockType = null;
  }

  // Lancement de la sauvegarde
  db.collection("users").doc(uid).set(dataToSave, { merge: true })
  .then(() => {
      // On annule l'alerte car la sauvegarde a finalement réussi
      clearTimeout(chronoSecurite); 
      
      if (timeoutAlerteRecue) {
          console.log("%c✅ CONNEXION RÉTABLIE : Sauvegarde enfin synchronisée !", "background: green; color: white; padding: 2px;");
      } else {

      }
  })
  .catch(err => {
      // On annule aussi le chrono en cas d'erreur immédiate
      clearTimeout(chronoSecurite);
      console.error("❌ Erreur Firebase :", err);
  });
}

// --- saveUserData ---
function saveUserData(uid) {
  db.collection("users").doc(uid).set({
    collection: collection,
    dust: dust,
    daily: daily
  }, { merge: true }) // merge = ne remplace pas tout le document, juste ces champs
  .then(() => {

  })
  .catch(err => console.error("❌ Erreur sauvegarde Firebase :", err));
}

// --- loadUserData ---
function loadUserData(uid) {
  db.collection("users").doc(uid).get().then(doc => {
    if (doc.exists) {
      const data = doc.data();

      // --- Pseudo ---
      window.userPseudo = data.username || "Anonyme";

      // --- STREAK & DATE (Adaptation au Timestamp) ---
      streakCount = data.streakCount || 0;
      
      // On convertit le Timestamp Google en format YYYY-MM-DD pour le code local
      if (data.lastOpenDate && typeof data.lastOpenDate.toDate === 'function') {
          lastOpenDate = data.lastOpenDate.toDate().toISOString().split('T')[0];
      } else {
          lastOpenDate = data.lastOpenDate || ""; // Cas des anciennes données string
      }


      localStorage.setItem("streakCount", streakCount);
      localStorage.setItem("lastOpenDate", lastOpenDate);
      
      if (typeof renderStreak === "function") renderStreak(streakCount);

      // --- LE RESTE DE TA FONCTION (Inchangé) ---
      let rawCollection = data.collection || [];
      collection = rawCollection.map(card => ({
          ...card,
          level: (card.level ?? 1),
          exp: (card.exp ?? 0)
      }));

      dust = data.dust || 0;
      daily = data.daily || { date: null, opened: 0 };

      save("collection", collection);
      save("dust", dust);
      save("daily", daily);

      refreshCollection();
      refreshLimit();

      if (document.getElementById("profileDust")) document.getElementById("profileDust").innerText = dust;
      if (document.getElementById("profileName")) document.getElementById("profileName").innerText = window.userPseudo;

    } else {
      saveUserData(uid);
    }
  }).catch(err => console.error("❌ Erreur chargement :", err));
}

// --- queueSave ---
function queueSave() {
    if (!auth.currentUser) return; // Sécurité si l'utilisateur se déconnecte pendant le délai
    
    pendingSave = true;
    if(saveTimeout) clearTimeout(saveTimeout);

    saveTimeout = setTimeout(() => {
        console.log("⏳ Sauvegarde en cours...");

        db.collection("users").doc(auth.currentUser.uid).set({
            collection: collection || [],
            dust: dust || 0,
            boostersOpened: boostersOpened || 0
        }, { merge: true })
        .then(() => {

            pendingSave = false;
        })
        .catch(err => {
            console.error("❌ Erreur Firestore:", err.code, err.message);

            // 1. Détection spécifique du Quota Firebase (Spark Plan 50k reads/20k writes)
            const isQuotaError = 
                err.code === 'resource-exhausted' || 
                err.code === 'functions/resource-exhausted' ||
                err.message.toLowerCase().includes('quota');

            // 2. Détection d'accès refusé (souvent lié au quota ou règles de sécu)
            const isPermissionError = err.code === 'permission-denied';

            if (isQuotaError || isPermissionError) {
                disableSiteForQuota();
            } else {
                // Si c'est juste une micro-coupure internet, on ne bloque pas le site
                console.warn("⚠️ Erreur de sauvegarde simple (Internet ?), tentative suivante au prochain clic.");
                pendingSave = false; 
            }
        });

    }, SAVE_DELAY);
}

// --- flushSave ---
function flushSave() {
    if(!pendingSave) return;

    console.log("⏳ flushSave: tentative de sauvegarde avant fermeture...");

    db.collection("users").doc(auth.currentUser.uid).set({
        collection: collection || [],
        dust: dust || 0,
        boostersOpened: boostersOpened || 0
    }, { merge: true })
    .then(() => {
        console.log("✅ flushSave réussie !");
        pendingSave = false;
    })
    .catch(err => {
        console.error("❌ flushSave erreur Firestore:", err);
        pendingSave = false;
    });
}

// --- installerLeJeu ---
async function installerLeJeu() {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`Choix utilisateur : ${outcome}`);
        
        if (outcome === 'accepted') {
            if (installBox) installBox.style.display = 'none';
        }
        deferredPrompt = null;
    } else {
        // Fallback intelligent : si l'événement n'est pas là, on guide l'utilisateur
        alert("Installation : Clique sur les 3 points (menu) de ton navigateur ou sur l'icône de partage (iOS) et choisis 'Installer' ou 'Sur l'écran d'accueil'.");
    }
}

// --- Listeners & initialisation au chargement ---
// --- Listeners ---
tabHome.addEventListener("click", showHome);
tabCollection.addEventListener("click", showCollection);
tabAllCards.addEventListener("click", showAllCards);
openPackBtn.addEventListener("click", openPackSequence);

resetCollectionBtn.addEventListener("click", () => {
    // Premier avertissement (Confirmation classique)
    if (confirm("Êtes-vous sûr de vouloir réinitialiser la collection ?")) {
        
        // Deuxième avertissement (Saisie manuelle pour double sécurité)
        const confirmationWord = "RÉINITIALISER";
        const secondCheck = prompt(`⚠️ ATTENTION : Cette action est irréversible.\nToutes vos cartes seront supprimées.\n\nTapez "${confirmationWord}" en majuscules pour confirmer :`);

        // On vérifie si la saisie est strictement identique
        if (secondCheck === confirmationWord) {
            collection = [];
            save("collection", collection);
            refreshCollection();
            alert("Collection réinitialisée avec succès.");
        } else {
            alert("Action annulée. Le mot de confirmation était incorrect.");
        }
    }
});



// --- Init ---
refreshCollection();
refreshLimit();
showHome();


const authOverlay = document.getElementById("authOverlay");
const emailInput = document.getElementById("emailInput");
const passwordInput = document.getElementById("passwordInput");
const loginBtn = document.getElementById("loginBtn");
const signupBtn = document.getElementById("signupBtn");
const authError = document.getElementById("authError");
const logoutBtn = document.getElementById("logoutBtn");





// --- Gestion de l'état de connexion ---

// --- auth.onAuthStateChanged ---
auth.onAuthStateChanged(async (user) => {
    // --- RÉCUPÉRATION DE L'ÉCRAN DE CHARGEMENT ---
    const loadingOverlay = document.getElementById("loading-overlay");
    
    const accountBtn = document.getElementById("accountBtn");
    const userEmailText = document.getElementById("userEmail");
    const userIdText = document.getElementById("userIdDisplay");
    
    // Éléments des nouvelles stats dans le profil
    const profileBoosters = document.getElementById("profileBoosters");
    const profileDust = document.getElementById("profileDust");

    if(user){
        // --- Utilisateur connecté ---
        authOverlay.style.display = "none";      // Masque le formulaire de login
        accountBtn.style.display = "flex";       // Affiche le bouton "Mon Compte" (en flex pour l'icône)
        
        // Remplissage des infos dans la section profil
        if(userEmailText) userEmailText.textContent = user.email;
        if(userIdText) userIdText.textContent = user.uid;

        // Mise à jour visuelle des stats dans le profil au chargement
        if(profileBoosters) profileBoosters.textContent = typeof boostersOpened !== 'undefined' ? boostersOpened : 0;
        if(profileDust) profileDust.textContent = typeof dust !== 'undefined' ? dust : 0;

        // Chargement des données de jeu
        await loadUserData(user.uid); 

        await verifierRecompenseBossRecue();

        // --- SURVEILLANCE DES PV DU BOSS EN TEMPS RÉEL ---
        // On initialise bossData globalement pour qu'il soit accessible par hitBoss()
        window.bossData = {}; 

        db.collection("global_event").doc("boss_battle")
          .onSnapshot(async (doc) => {
              if (doc.exists) {
                  // Mise à jour de la variable globale sans 'const'
                  bossData = doc.data(); 

                  // Mise à jour de la barre de vie sur l'interface (INSIDE le snapshot)
                  const hpElement = document.getElementById("bossHP"); 
                  const barElement = document.getElementById("bossBarInner");

                  if (hpElement && bossData.hp_current !== undefined) {
                      hpElement.innerText = `${bossData.hp_current.toLocaleString()} / ${bossData.hp_max.toLocaleString()} HP`;
                  }
                  
                  if (barElement && bossData.hp_current !== undefined) {
                      const pourcentage = (bossData.hp_current / bossData.hp_max) * 100;
                      barElement.style.width = pourcentage + "%";
                  }

                  // Si le boss vient de mourir pendant que le joueur est connecté
                  if (bossData.hp_current <= 0) {
                      await verifierRecompenseBossRecue();
                  }
              }
          });

        // Autres vérifications initiales
        await verifierAmendes(user.uid);
        loadBoosterCounter(user.uid);              
        checkDailyShop();                          

        // --- SYNC AUTO VENTE (Action côté Vendeur) ---
        db.collection("market").where("sellerId", "==", user.uid)
          .onSnapshot((snapshot) => {
              const cartesEncoreEnVente = [];
              snapshot.forEach(doc => {
                  cartesEncoreEnVente.push(doc.data().card.name);
              });

              let aEteVendue = false;

              // On parcourt la collection locale (supposée globale)
              collection.forEach((card, index) => {
                  if (card.enVente && !cartesEncoreEnVente.includes(card.name)) {
                      collection.splice(index, 1); 
                      aEteVendue = true;
                  }
              });

              if (aEteVendue) {
                  db.collection("users").doc(user.uid).update({
                      collection: collection
                  }).then(() => {
                      const collectionSection = document.getElementById("collectionSection"); 
                      const estSurLaCollection = collectionSection && collectionSection.style.display !== "none";

                      if (estSurLaCollection) {
                          if (typeof displayCollection === "function") displayCollection();
                          if (typeof showCollection === "function") showCollection();
                      } else {
                          if (typeof chargerMarche === "function") chargerMarche();
                      }
                  });
              }
          });
        
    } else {
        // --- Utilisateur déconnecté ---
        authOverlay.style.display = "flex";      
        accountBtn.style.display = "none";       
        
        const accountSection = document.getElementById("accountSection");
        if(accountSection) accountSection.style.display = "none";
    }

    // --- FERMETURE DE L'ÉCRAN DE CHARGEMENT ---
    if (loadingOverlay) {
        loadingOverlay.classList.add("fade-out"); 
        setTimeout(() => {
            loadingOverlay.style.display = "none";
        }, 500); 
    }
});

// --- Service Worker & PWA ---








// --- Traducteur d'erreurs Firebase ---
function getAuthErrorMessage(errorCode) {
    switch (errorCode) {
        case 'auth/invalid-email':
            return "Adresse email invalide.";

        case 'auth/user-disabled':
            return "Ce compte est indisponible. Contacte le support.";

        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-login-credentials': // ← nouveau code
            return "Email ou mot de passe incorrect.";

        case 'auth/email-already-in-use':
            return "Un compte existe déjà avec cet email.";

        case 'auth/weak-password':
            return "Mot de passe trop faible (6 caractères minimum).";

        case 'auth/network-request-failed':
            return "Connexion impossible. Vérifie internet.";

        case 'auth/too-many-requests':
            return "Trop de tentatives. Réessaie plus tard.";

        default:
            // Fallback pour codes inconnus liés au login
            if (errorCode && (errorCode.toLowerCase().includes("password") || errorCode.toLowerCase().includes("login"))) {
                return "Email ou mot de passe incorrect.";
            }
            return "Une erreur est survenue. Réessaie.";
    }
}


// --- Connexion ---
// --- GESTION UNIQUE DE L'AUTHENTIFICATION ---
const mainAuthBtn = document.getElementById('mainAuthBtn');

if (mainAuthBtn) {
    mainAuthBtn.onclick = (e) => {
        // Empêche le rechargement par défaut du formulaire HTML
        if (e) e.preventDefault(); 
        
        console.log("Clic détecté sur le bouton d'authentification");

        // Utilisation de document.getElementById pour être sûr de récupérer les valeurs
        // même si les variables globales sont perdues dans les 11 000 lignes
        const emailInputEl = document.getElementById('emailInput');
        const passwordInputEl = document.getElementById('passwordInput');
        const authError = document.getElementById("authError");

        if (!emailInputEl || !passwordInputEl) {
            console.error("ERREUR : Les champs emailInput ou passwordInput sont introuvables dans le HTML.");
            return;
        }

        const email = emailInputEl.value.trim();
        const password = passwordInputEl.value.trim();

        // --- MODE CONNEXION (isLoginMode = true) ---
        if (isLoginMode) {
            console.log("Tentative de connexion pour :", email);

            // --- Vérification si les champs sont remplis ---
            if (!email && !password) {
                authError.textContent = "Email et mot de passe requis.";
                return;
            } else if (!email) {
                authError.textContent = "Email requis.";
                return;
            } else if (!password) {
                authError.textContent = "Mot de passe requis.";
                return;
            }

            // --- Connexion Firebase ---
            auth.signInWithEmailAndPassword(email, password)
                .then(userCredential => {
                    console.log("Connexion réussie ! Redémarrage du jeu...");
                    
                    // ON GARDE TES LIGNES MAIS LE RELOAD VA TOUT RÉINITIALISER PROPREMENT
                    const uid = userCredential.user.uid;
                    loadUserData(uid);
                    loadBoosterCounter(uid);
                    authOverlay.style.display = "none";
                    if (typeof logoutBtn !== 'undefined') logoutBtn.style.display = "block";
                    authError.textContent = "";

                    // LE REDÉMARRAGE FORCÉ
                    window.location.reload();
                })
                .catch(err => {
                    console.error("Erreur Firebase :", err.code, err.message);
                    if ((!err.code || err.code === "") && err.message && err.message.toLowerCase().includes("password")) {
                        authError.textContent = "Email ou mot de passe incorrect.";
                    } else {
                        authError.textContent = typeof getAuthErrorMessage === 'function' ? getAuthErrorMessage(err.code) : err.message;
                    }
                });
        } 
        // Note : Si tu as un bloc 'else' pour l'inscription, il vient ici

        
        
        // --- MODE INSCRIPTION (isLoginMode = false) ---
        else {
            const username = document.getElementById("reg-username").value.trim();

            if (!username || username.length < 3) {
                authError.textContent = "Choisis un pseudo d'au moins 3 caractères !";
                return;
            }

            if (!email || !password) {
                authError.textContent = "Email et mot de passe requis.";
                return;
            }

            auth.createUserWithEmailAndPassword(email, password)
                .then(userCredential => {
                    const uid = userCredential.user.uid;

                    // Création du document utilisateur dans Firestore
                    db.collection("users").doc(uid).set({
                        username: username,
                        boostersOpened: 0,
                        collection: [],
                        dust: 0,
                        xp: 0,

                        streakCount: 0,
                        isPremium: false,
                        claimedRewards: [],
                        lastUpdate: firebase.firestore.FieldValue.serverTimestamp()
                    }).then(() => {
                        console.log("Document utilisateur créé avec succès !");
                        loadUserData(uid);
                        loadBoosterCounter(uid);
                        authOverlay.style.display = "none";
                        logoutBtn.style.display = "block";
                        authError.textContent = "";
                    }).catch(err => {
                        console.error("Erreur création doc :", err);
                        authError.textContent = getAuthErrorMessage(err.code);
                    });
                })
                .catch(err => {
                    authError.textContent = getAuthErrorMessage(err.code);
                });
        }
    };
}






// --- Déconnexion ---
logoutBtn.onclick = () => {
    auth.signOut()
        .then(() => {
            alert("Déconnecté !");
            collection = [];  // vide collection locale
            dust = 0;         // vide fragments locaux
            if(typeof boostersOpened !== 'undefined') boostersOpened = 0; 
            
            save("collection", collection);
            save("dust", dust);
            
            refreshCollection();
            refreshLimit();
            
            // On s'assure de masquer la section profil après déco
            document.getElementById("accountSection").style.display = "none";
            document.getElementById("mainMenu").style.display = "flex";
        })
        .catch(err => console.error("Erreur lors de la déconnexion :", err));
};








// Sauvegarder les données sur Firebase



// Charger les données depuis Firebase






// Sauvegarder automatiquement après chaque action
let saveTimeout = null;
let pendingSave = false;
const SAVE_DELAY = 3000; // 3 secondes entre actions pour regrouper



window.addEventListener("beforeunload", flushSave);












// --- GESTION DU COMPTE ---

const accountBtn = document.getElementById("accountBtn");
const accountSection = document.getElementById("accountSection");
const backFromAccount = document.getElementById("backFromAccount");
const userEmailText = document.getElementById("userEmail");
const userIdText = document.getElementById("userIdDisplay");

// Ouvrir la page compte
if (accountBtn) {
    accountBtn.onclick = () => {

actualiserProfil();

document.getElementById("profileCards").innerText = collection.length + " / " + ALL_CARDS.length;
document.getElementById("profileStreak").innerText = (typeof streakCount !== 'undefined') ? streakCount : 0;

        // On cache les sections du jeu
        homeSection.style.display = "none";
        collectionSection.style.display = "none";
        allCardsSection.style.display = "none";
        shopSection.style.display = "none";
        accountBtn.style.display = "none"; // Cache le petit bouton
        
        // On affiche la page profil
        if (accountSection) {
            accountSection.style.display = "flex";
            accountSection.style.flexDirection = "column";
            accountSection.style.alignItems = "center";
        }
    };
}

// Retourner au jeu
if (backFromAccount) {
    backFromAccount.onclick = () => {
        if (accountSection) accountSection.style.display = "none";
        if (accountBtn) accountBtn.style.display = "block";
        showHome(); // Relance l'affichage de l'accueil
    };
}

// Logique de déconnexion (Correction de l'erreur de déclaration)
const logoutBtnEl = document.getElementById("logoutBtn");
if (logoutBtnEl) {
    logoutBtnEl.onclick = () => {
        if(confirm("Voulez-vous vraiment vous déconnecter ?")) {
            auth.signOut().then(() => {
                // Reset local des données
                collection = [];
                dust = 0;
                save("collection", []);
                save("dust", 0);
                localStorage.clear(); 
                window.location.reload(); // Recharge pour tout nettoyer
            });
        }
    };
}









// 1. Enregistrement du Service Worker avec détection de mise à jour
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').then((reg) => {
    console.log("Service Worker enregistré !");

    // --- AJOUT : DETECTION MAJ INSTANTANÉE ---
    reg.onupdatefound = () => {
      const installingWorker = reg.installing;
      installingWorker.onstatechange = () => {
        if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // Une nouvelle version a été téléchargée et est prête
          console.log("Nouvelle version détectée, rechargement immédiat...");
          window.location.reload(); 
        }
      };
    };
    
    // Force une vérification de mise à jour à chaque chargement
    reg.update();
  }).catch(err => console.log("Erreur SW:", err));

  // Force le refresh si le Service Worker prend le contrôle (indispensable pour skipWaiting)
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    window.location.reload();
  });
}

let deferredPrompt;
const installBox = document.getElementById('install-btn-container');

// --- MODIFICATION : On affiche le bloc par défaut dès le chargement du script ---
if (installBox && !window.matchMedia('(display-mode: standalone)').matches) {
    installBox.style.display = 'block';
}

// 2. Écoute de l'événement d'installation
window.addEventListener('beforeinstallprompt', (e) => {
    // On empêche la barre native de Chrome de s'afficher (on garde le contrôle)
    e.preventDefault();
    deferredPrompt = e;
    
    // Au cas où le bloc était caché, on s'assure qu'il apparaît ici aussi
    if (installBox && !window.matchMedia('(display-mode: standalone)').matches) {
        installBox.style.display = 'block';
    }
});

// 3. Fonction pour déclencher l'installation


// 4. Vérification au chargement et Notifications
window.addEventListener('load', () => {
  // Check mode standalone (si l'app est déjà lancée en mode installé)
  if (window.matchMedia('(display-mode: standalone)').matches) {
    if (installBox) installBox.style.display = 'none';
  }

  // Demande permission notifications
  if ("Notification" in window) {
    Notification.requestPermission();
  }
});

// 5. Détecter quand l'installation est réussie
window.addEventListener('appinstalled', (evt) => {
  console.log('Brainrot TCG a été installé avec succès !');
  if (installBox) installBox.style.display = 'none';
});



</script>
</body>
</html>