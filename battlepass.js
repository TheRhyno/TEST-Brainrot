// ============================================================
//  battlepass.js - Battle Pass, récompenses, progression
// ============================================================

// --- Configuration Speedies & Récompenses BP ---
    // --- LOGIQUE DES SPEEDIES (Inchangée) ---
    const speedyReward = battlePassRewards.find(r => r.level === i);
    if (speedyReward) {
        if (speedyReward.isPremium) { prem = speedyReward.qty + " ⚡"; pIcon = "⚡"; }
        else { free = speedyReward.qty + " ⚡"; fIcon = "⚡"; }
    }

    // --- CONFIGURATION DES RÉCOMPENSES ---

    // PALIER 100 (EXCLU)
    if (i === 100) {
        free = "15000 💎"; 
        prem = "Carte " + cartesPaliers[i];
        fIcon = "💰"; pIcon = "🃏";
    } 



else if (i === 18) {
    free = "Avatar Spécial"; 
    prem = premAmount + " 💎";
    fIcon = "👤"; pIcon = "💎";
}


else if (i === 53) {
    free = freeAmount + " 💎";
    prem = "Avatar Premium"; 
    fIcon = "💎"; pIcon = "👤";
}



else if (i === 47) {
        free = "Fond Rainbow"; 
        prem = premAmount + " 💎";
        fIcon = "🌈"; pIcon = "💰";
    }

    else if (i === 72) {
        free = freeAmount + " 💎";
        prem = "Fond Moonlight"; 
        fIcon = "💎"; pIcon = "🌙"; 
    }


    // PALIER 50 : CARTE MYSTÈRE PREMIUM #1
    else if (i === 50) {
        free = "Pack Platine";
        prem = "Carte Mystère"; 
        fIcon = "🥈"; pIcon = "🎁";
    }
    // PALIER 51 : LE PREMIER GROS CASH (40 000 💎)
    else if (i === 51) {
        free = freeAmount + " 💎";
        prem = "40000 💎"; 
        fIcon = "💎"; pIcon = "💰";
    }
    // PALIER 97 : LE DEUXIÈME GROS CASH (50 000 💎)
    else if (i === 97) {
        free = freeAmount + " 💎";
        prem = "50000 💎"; 
        fIcon = "💎"; pIcon = "💰";
    }
    // PALIER 98 : CARTE MYSTÈRE PREMIUM #2
    else if (i === 98) {
        free = freeAmount + " 💎";
        prem = "Carte Mystère"; 
        fIcon = "💎"; pIcon = "🎁";
    }
    // PALIER 99 : PACK DIAMOND
    else if (i === 99) {
        free = freeAmount + " 💎";
        prem = "Pack Diamond";
        fIcon = "💎"; pIcon = "💎";
    }
    // LES 5 CARTES MYSTÈRE GRATUITES
    else if (paliersAleatoires.includes(i)) {
        free = "Carte Mystère";
        if (!prem.includes("⚡")) prem = premAmount + " 💎"; 
        fIcon = "🎁"; pIcon = "💰";
    }
    // PACK PLATINE (25, 75)
    else if (i % 25 === 0) {
        free = "Pack Platine"; prem = "Pack Platine";
        fIcon = "🥈"; pIcon = "🥈";
    } 
    // CARTES FIXES GRATUITES (21, 42, 63, 84)
    else if (cartesPaliers[i]) {
        free = "Carte " + cartesPaliers[i];
        prem = "Pack Gold";
        fIcon = "🃏"; pIcon = "🥇";
    }
    // PACK GOLD (15, 30, 45, 60, 90)
    else if (i % 15 === 0) {
        free = "Pack Gold"; prem = "Pack Gold";
        fIcon = "🥇"; pIcon = "🥇";
    }

    bpRewards.push({ lvl: i, free, prem, fIcon, pIcon });
}







// --- FONCTION POUR TIRER UNE RARETÉ (À utiliser dans claimBPReward) ---

// --- tirerRareteAleatoire ---
function tirerRareteAleatoire() {
    let rand = Math.random() * 100;
    let cumul = 0;
    for (let rarete in probasRarete) {
        cumul += probasRarete[rarete];
        if (rand <= cumul) return rarete;
    }
    return "Commun";
}

// --- updateBPHudRealTime ---
function updateBPHudRealTime() {
    const hudBar = document.getElementById('bpHudProgressBar');
    if (!hudBar) return;

    // Calcul du niveau (basé sur ton système de 21 XP par palier)
    let niveauActuel = typeof calculerNiveau === "function" ? calculerNiveau(xp) : Math.floor(xp / 21);
    
    // Calcul de la progression globale (sur 100 niveaux comme dans ton menu)
    const progressPercent = Math.min((niveauActuel / 100) * 100, 100);

    // Mise à jour de la largeur de la barre
    hudBar.style.width = progressPercent + "%";
}

// --- updateBattlePassUI ---
function updateBattlePassUI() {
    const container = document.getElementById("bpLevelsContainer");
    const progressBar = document.getElementById("bpProgressBar");
    const verticalLine = document.getElementById("bpVerticalLine"); // La ligne jaune du milieu
    
    // --- NOUVEAUX ÉLÉMENTS POUR LES BOUTONS ---
    const btnPremRecup = document.getElementById("btnPremiumBP");
    const btnAcheter = document.getElementById("btnBuyPremium");

    if (!container) return;

    let niveauActuel = calculerNiveau(xp); 
    container.innerHTML = "";

    // --- GESTION DE L'AFFICHAGE DES BOUTONS DE PIED DE PAGE ---
    if (isPremium) {
        // Si Premium : on montre le bouton de récupération Premium et on cache l'achat
        if (btnPremRecup) btnPremRecup.style.display = "block";
        if (btnAcheter) btnAcheter.style.display = "none";
    } else {
        // Si pas Premium : on cache la récupération Premium et on montre l'achat (100k)
        if (btnPremRecup) btnPremRecup.style.display = "none";
        if (btnAcheter) btnAcheter.style.display = "block";
    }

    bpRewards.forEach(item => {
        const isReached = niveauActuel >= item.lvl;
        const idFree = item.lvl + "_free";
        const idPrem = item.lvl + "_prem";

        const isFreeClaimed = claimedRewards.includes(idFree);
        const isPremClaimed = claimedRewards.includes(idPrem);

        const getRewardDisplay = (label, icon, claimed) => {
            if (label.includes("Carte")) {
                const nomCarte = label.replace("Carte ", "").trim();
                const card = ALL_CARDS.find(c => c.name === nomCarte);
                if (card) {
                    const rarityColors = {
                        "Commun": "#94a3b8", "Rare": "#3b82f6", "Epic": "#a855f7",
                        "Legendary": "#f59e0b", "Mythic": "#ef4444", "OG": "#10b981"
                    };
                    const rColor = rarityColors[card.rarity] || "#fff";
                    return `
                        <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; width:100%; position:relative;">
                            <span style="font-size: 7px; font-weight:bold; color:${rColor}; text-transform:uppercase; margin-bottom:2px;">${card.rarity}</span>
                            <img src="${card.image}" style="width:45px; height:60px; object-fit:cover; border-radius:5px; border:1px solid ${rColor}; filter: ${claimed ? 'grayscale(100%)' : 'none'}">
                            <span style="font-size: 8px; margin-top:3px; text-transform:uppercase; font-weight:bold;">${card.name}</span>
                        </div>`;
                }
            }
            return `
                <span style="font-size: 30px; filter: ${claimed ? 'grayscale(100%)' : 'none'}">${icon}</span>
                <span style="font-size: 10px; color: inherit; font-weight: bold;">${label}</span>`;
        };

        const row = document.createElement("div");
        row.style = "display: flex; align-items: center; justify-content: center; height: 110px; gap: 10px; margin-bottom: 10px; position: relative; z-index: 5;";

        row.innerHTML = `
            <div onclick="claimBPReward(${item.lvl}, 'free')" style="flex: 1; height: 100%; background: ${isReached ? (isFreeClaimed ? '#1a1a1a' : '#2d3436') : '#1e272e'}; border-radius: 15px; border: 2px solid ${isFreeClaimed ? '#10b981' : (isReached ? '#4ade80' : '#374151')}; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; color: white;">
                ${getRewardDisplay(item.free, item.fIcon, isFreeClaimed)}
                <span style="font-size: 9px; margin-top: 4px; color: ${isFreeClaimed ? '#10b981' : (isReached ? '#4ade80' : '#aaa')}">
                    ${isFreeClaimed ? '✅ REÇU' : (isReached ? '🎁 RÉCUPÉRER' : '🔒 BLOQUÉ')}
                </span>
            </div>

            <div style="width: 45px; height: 45px; background: ${isReached ? '#fbbf24' : '#1f2937'}; color: ${isReached ? '#000' : '#6b7280'}; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-weight: bold; border: 4px solid ${isReached ? '#111827' : '#374151'}; z-index: 10; transition: background 0.3s, color 0.3s;">
                ${item.lvl}
            </div>

            <div onclick="claimBPReward(${item.lvl}, 'prem')" style="flex: 1; height: 100%; background: ${isPremium && isReached ? (isPremClaimed ? '#1a1a1a' : 'linear-gradient(135deg, #fbbf24, #d97706)') : '#1e272e'}; border-radius: 15px; border: 2px solid ${isPremClaimed ? '#fbbf24' : (isPremium ? '#fbbf24' : '#374151')}; display: flex; flex-direction: column; align-items: center; justify-content: center; opacity: ${isPremium ? 1 : 0.6}; cursor: pointer; color: ${isPremium && isReached && !isPremClaimed ? 'black' : 'white'};">
                ${getRewardDisplay(item.prem, item.pIcon, isPremClaimed)}
                <span style="font-size: 9px; margin-top: 4px; color: ${isPremium && isReached ? (isPremClaimed ? '#fbbf24' : 'black') : '#aaa'}">
                    ${isPremClaimed ? '✅ REÇU' : (isPremium && isReached ? '🌟 RÉCUPÉRER' : '🔒 BLOQUÉ')}
                </span>
            </div>
        `;
        container.appendChild(row);
    });

    // --- CALCUL ET MISE À JOUR DES BARRES ---
    const progressPercent = Math.min((niveauActuel / 100) * 100, 100);
    
    // 1. Barre Horizontale (Haut)
    if(progressBar) {
        progressBar.style.width = progressPercent + "%";
    }

    // 2. Barre Verticale (Milieu) - Détection dynamique de la position
    if(verticalLine && container.children.length > 0) {
        const targetIndex = Math.max(0, Math.min(niveauActuel - 1, container.children.length - 1));
        const targetRow = container.children[targetIndex];
        
        if (targetRow) {
            const targetPos = targetRow.offsetTop + (targetRow.offsetHeight / 2) + 20;
            verticalLine.style.height = targetPos + "px";
        }
    }
}

// --- toggleBattlePass ---
function toggleBattlePass() {
    const overlay = document.getElementById('bpOverlay');
    const icon = document.getElementById('bpIcon');
    
    // --- AJOUT : Récupération du menu et du profil ---
    const nav = document.querySelector('nav');
    const accountBtn = document.getElementById('accountBtn');
    
    // OUVERTURE
    if (overlay.style.display === 'none' || overlay.style.display === '') {
        overlay.style.display = 'flex';
        overlay.classList.remove('bp-closing'); // Sécurité au cas où on ouvre vite
        
        if(icon) icon.style.display = 'none'; 
        
        // --- AJOUT : Masquer le menu et le profil ---
        if (nav) nav.style.display = 'none';
        if (accountBtn) accountBtn.style.display = 'none';

        updateBattlePassUI();
    } 
    // FERMETURE (C'est ici qu'on ajoute l'animation)
    else {
        overlay.classList.add('bp-closing'); // On lance l'animation de descente
        
        // On attend la fin de l'animation (0.4s) pour cacher l'élément
        setTimeout(() => {
            overlay.style.display = 'none';
            overlay.classList.remove('bp-closing'); // On nettoie la classe
            
            if(icon) icon.style.display = 'flex';
            
            // --- AJOUT : Réafficher le menu et le profil ---
            if (nav) nav.style.display = 'flex';
            if (accountBtn) accountBtn.style.display = 'block';
            
        }, 400); 
    }
}

// --- claimBPReward ---
async function claimBPReward(lvl, type) {
    const rewardID = lvl + "_" + type;
    if (claimedRewards.includes(rewardID)) return alert("🚫 Déjà récupéré !");
    
    let niveauActuel = calculerNiveau(xp); 
    if (niveauActuel < lvl) return alert("🔒 Palier verrouillé !");
    if (type === 'prem' && !isPremium) return alert("💰 Débloque le Premium !");

    const rewardData = bpRewards.find(r => r.lvl === lvl);
    if (!rewardData) return;
    const itemLabel = (type === 'free') ? rewardData.free : rewardData.prem;
    
    // --- 1. CAS DES DIAMANTS ---
    if (itemLabel.includes("💎")) {
        dust += parseInt(itemLabel) || 0;
        const profileDust = document.getElementById("profileDust");
        if (profileDust) profileDust.innerText = dust;
        if (typeof syncSubwayHUD === "function") syncSubwayHUD();
        alert(`💎 +${parseInt(itemLabel)} Fragments !`);
    } 
    
    // --- 2. CAS DES SPEEDIES ⚡ ---
    else if (itemLabel.includes("⚡")) {
        const gainSpeedy = parseInt(itemLabel) || 0;
        speedies = (speedies || 0) + gainSpeedy;
        const profileDisplay = document.getElementById("profileSpeedies");
        if (profileDisplay) profileDisplay.innerText = speedies;
        alert(`⚡ +${gainSpeedy} Speedies ajoutés !`);
    }

    // --- 3. CAS DES CARTES (MYSTÈRE OU FIXE) ---
    else if (itemLabel.includes("Carte")) {
        let info;
        if (itemLabel === "Carte Mystère") {
            let rand = Math.random() * 100;
            let cumul = 0;
            let rareteChoisie = "Commun";
            for (let r in probasRarete) {
                cumul += probasRarete[r];
                if (rand <= cumul) { rareteChoisie = r; break; }
            }
            const possibles = ALL_CARDS.filter(c => c.rarity === rareteChoisie);
            info = possibles.length > 0 ? possibles[Math.floor(Math.random() * possibles.length)] : ALL_CARDS[0];
        } 
        else {
            const nomCarte = itemLabel.replace("Carte ", "").trim();
            info = ALL_CARDS.find(c => c.name === nomCarte);
        }

        if (info) {
            const cardInCollection = collection.find(c => c.name === info.name);
            if (lvl === 100 && type === 'prem') {
                if (!cardInCollection) collection.push({ ...info, level: 1, exp: 0, isNew: true });
                else cardInCollection.level = (cardInCollection.level || 1) + 1;
                displayExcluPalier100(info);
            } 
            else {
                if (!cardInCollection) {
                    collection.push({ ...info, level: 1, exp: 0, isNew: true });
                    displayGainedCard(info, true, 1);
                } else {
                    cardInCollection.level = (cardInCollection.level || 1) + 1;
                    displayGainedCard(info, false, cardInCollection.level);
                }
            }
        }
    }

    // --- 4. CAS DES PACKS ---
    else if (itemLabel.includes("Pack")) {
        if (itemLabel.includes("Diamond")) openSpecialPack("diamond");
        else if (itemLabel.includes("Platine") || itemLabel.includes("Platinum")) openSpecialPack("platinum");
        else openSpecialPack("gold");
    }

    // --- SAUVEGARDE FIREBASE ---
    claimedRewards.push(rewardID); 
    const user = firebase.auth().currentUser;
    if (user) {
        try {
            let updateData = {
                claimedRewards: claimedRewards,
                dust: dust,
                speedies: speedies,
                collection: collection 
            };

            // --- NOUVEAU : AVATAR SPÉCIAL (PALIER 18 FREE) ---
            if (lvl === 18 && type === 'free') {
                const specialAvatarUrl = "https://cdn.phototourl.com/free/2026-04-10-cf9b788c-b14e-4a20-be90-118e4f82aa73.jpg";
                updateData.avatar18Unlocked = true;
                if (typeof updateProfileAvatar === "function") {
                    updateProfileAvatar(specialAvatarUrl);
                }
                alert("👤 NOUVEL AVATAR DÉBLOQUÉ ! Tu peux le changer à tout moment dans ton profil.");
            }

            // --- NOUVEAU : AVATAR RARE (PALIER 53 PREM) ---
            if (lvl === 53 && type === 'prem') {
                const rareAvatarUrl = "https://cdn.phototourl.com/free/2026-04-10-f0ba66d1-f04b-4b9f-98e5-e883909aa1f6.jpg"; 
                updateData.avatar53Unlocked = true;
                if (typeof updateProfileAvatar === "function") {
                    updateProfileAvatar(rareAvatarUrl);
                }
                alert("👤 NOUVEL AVATAR DÉBLOQUÉ ! Tu peux le changer à tout moment dans ton profil.");
            }

            // --- FOND RAINBOW (PALIER 47 FREE) ---
            if (lvl === 47 && type === 'free') {
                updateData.rainbowUnlocked = true; 
                changerFond('rainbow', true);
                alert("🌈 NOUVEAU FOND DÉBLOQUÉ : Rainbow ! Tu peux le changer à tout moment dans les paramètres.");
            }

            // --- FOND MOONLIGHT (PALIER 72 PREM) ---
            if (lvl === 72 && type === 'prem') {
                updateData.moonlightUnlocked = true; 
                if (typeof changerFond === "function") {
                    changerFond('moonlight', true);
                }
                alert("🌙 NOUVEAU FOND DÉBLOQUÉ : Moonlight ! Tu peux le changer à tout moment dans les paramètres.");
            }

            await db.collection("users").doc(user.uid).update(updateData);
        } catch (e) {
            console.error("Erreur Firebase :", e);
        }
    }

    // --- INTERFACE ---
    const overlayBP = document.getElementById('bpOverlay');
    if (overlayBP) overlayBP.style.display = 'flex';
    const iconBP = document.getElementById('bpIcon');
    if (iconBP) iconBP.style.display = 'none';

    updateBattlePassUI();
    
    // MAJ VISIBILITÉ DES BOUTONS/AVATARS DANS LES SETTINGS
    if (typeof checkUnlockedAssets === "function") {
        checkUnlockedAssets();
    } else if (typeof checkRainbowButtonVisibility === "function") {
        checkRainbowButtonVisibility();
    }
}

// --- displayGainedCard ---
function displayGainedCard(cardData, isNew, newLevel) {

    // 1. On ferme le menu du Battle Pass UNIQUEMENT si on ne fait pas un "Tout récupérer"
    // On vérifie si isBulkClaiming existe et est faux
    if (typeof isBulkClaiming !== 'undefined' && !isBulkClaiming) {
        const bpMenu = document.getElementById('bpOverlay');
        if (bpMenu) bpMenu.style.display = 'none';
    }

    // 2. On prépare les données (Ta logique qui marche)
    currentPack = [{ ...cardData, isNew: isNew, level: newLevel }];
    currentCardIndex = 0;

    // --- 🚩 AJOUT : Désactivation temporaire des feux d'artifice ---
    window.isBPReward = true; 

    // 3. On lance DIRECTEMENT ta fonction pour générer la carte en dessous
    showBigCard();

    // 4. On récupère l'overlay
    const targetOverlay = (typeof overlay !== 'undefined') ? overlay : document.getElementById('overlay');

    if (targetOverlay) {
        // 5. On crée le "Rideau" (Masque noir)
        const cover = document.createElement("div");
        cover.id = "mystery-cover";
        cover.style.cssText = `
            position: absolute; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.85); display: flex; justify-content: center;
            align-items: center; z-index: 100000; cursor: pointer;
            border-radius: 15px;
            backdrop-filter: blur(5px);
        `;

        // 6. La carte Mystère (Agrandie)
        const mysteryCard = document.createElement("div");
        mysteryCard.style.cssText = `
            width: 280px; 
            height: 400px; 
            background: linear-gradient(145deg, #1a1a1a, #2c3e50); 
            border: 6px solid #ffd700; 
            border-radius: 20px; 
            display: flex; 
            justify-content: center; 
            align-items: center; 
            box-shadow: 0 0 50px rgba(255, 215, 0, 0.5);
            transition: transform 0.2s;
        `;
        
        mysteryCard.onmouseover = () => mysteryCard.style.transform = "scale(1.05)";
        mysteryCard.onmouseout = () => mysteryCard.style.transform = "scale(1)";
        
        mysteryCard.innerHTML = `<span style="font-size: 120px; color: #ffd700; font-weight: bold; text-shadow: 0 0 20px rgba(255,215,0,0.6);">?</span>`;

        cover.appendChild(mysteryCard);
        targetOverlay.appendChild(cover);

        // 7. Clic pour révéler
        cover.onclick = (e) => {
            e.stopPropagation();
            
            // Tremblement
            mysteryCard.style.animation = "cardShake 0.5s infinite";
            
            setTimeout(() => {
                // Animation de disparition fluide
                cover.style.opacity = "0";
                cover.style.transition = "opacity 0.3s";
                
                setTimeout(() => {
                    cover.remove(); 
                    // --- 🚩 AJOUT : Réactivation des feux d'artifice pour la suite ---
                    window.isBPReward = false; 
                }, 300);
            }, 600);
        };
    }
}

// --- acheterPremium ---
async function acheterPremium() {
    const prix = 100000;
    if (isPremium) return alert("Déjà possédé !");
    if (dust < prix) return alert("Pas assez de fragments !");

    if (confirm(`Acheter le Pass Premium pour ${prix} 💎 ?`)) {
        dust -= prix;
        isPremium = true;


const profileDust = document.getElementById("profileDust");
        if (profileDust) {
            profileDust.innerText = dust.toLocaleString(); // Affiche le nouveau solde direct
        }
        
        if (typeof syncSubwayHUD === "function") {
            syncSubwayHUD(); // Met à jour la barre en haut de l'écran
        }


        const user = auth.currentUser;
        if (user) {
            await db.collection("users").doc(user.uid).update({ isPremium: true, dust: dust });
            alert("🎉 Pass Premium débloqué !");
            updatePremiumButtonUI();
            updateBattlePassUI();
        }
    }
}

// --- updatePremiumButtonUI ---
function updatePremiumButtonUI() {
    const btn = document.getElementById("btnBuyPremium");
    if (btn && isPremium) {
        btn.innerText = "✨ PASS PREMIUM DÉBLOQUÉ ✨";
        btn.style.background = "linear-gradient(90deg, #4ade80, #22c55e)";
        btn.style.cursor = "default";
    }
}

// --- recupererGratuit ---
async function recupererGratuit() {
    const user = auth.currentUser;
    if (!user) return alert("Connecte-toi !");

    isBulkClaiming = true;

    // Calcul du niveau
    let niveauActuel = typeof calculerNiveau === "function" ? calculerNiveau(xp) : Math.floor(xp / 21);
    
    let nouveauxGains = { dust: 0, speedies: 0 };
    let objetsSpeciaux = []; 
    let nouveauxPaliersIDs = [];

    // Objets pour compter le détail
    let nbMystere = 0;
    let detailCartes = {};
    let detailPacks = {}; 

    // SCAN UNIQUEMENT GRATUIT
    bpRewards.forEach(item => {
        if (item.lvl <= niveauActuel) {
            const idFree = item.lvl + "_free";

            if (!claimedRewards.includes(idFree)) {
                if (item.free.includes("💎")) {
                    nouveauxGains.dust += parseInt(item.free.replace(/[^0-9]/g, "")) || 0;
                } else if (item.free.includes("⚡")) {
                    nouveauxGains.speedies += parseInt(item.free.replace(/[^0-9]/g, "")) || 0;
                } else {
                    objetsSpeciaux.push({ lvl: item.lvl, type: 'free' });
                    if (item.free === "Carte Mystère") nbMystere++;
                    else if (item.free.includes("Carte")) detailCartes[item.free] = (detailCartes[item.free] || 0) + 1;
                    else if (item.free.includes("Pack")) detailPacks[item.free] = (detailPacks[item.free] || 0) + 1;
                }
                nouveauxPaliersIDs.push(idFree);
            }
        }
    });

    if (nouveauxPaliersIDs.length === 0) {
        isBulkClaiming = false;
        return alert("☕ Aucun nouveau palier GRATUIT à récupérer !");
    }

    // On envoie à la fonction de sauvegarde
    await finaliserLaRecuperation(nouveauxPaliersIDs, nouveauxGains, objetsSpeciaux, nbMystere, detailCartes, detailPacks);

    // --- FORCE L'AFFICHAGE DU BATTLE PASS APRÈS LA RÉCUPÉRATION ---
    const overlayBP = document.getElementById('bpOverlay');
    if (overlayBP) {
        overlayBP.style.display = 'flex';
    }
}

// --- recupererPremium ---
async function recupererPremium() {
    const user = auth.currentUser;
    if (!user || !isPremium) return alert("Pass Premium requis !");

    isBulkClaiming = true;

    let niveauActuel = typeof calculerNiveau === "function" ? calculerNiveau(xp) : Math.floor(xp / 21);
    
    let nouveauxGains = { dust: 0, speedies: 0 };
    let objetsSpeciaux = []; 
    let nouveauxPaliersIDs = [];

    let nbMystere = 0;
    let detailCartes = {};
    let detailPacks = {}; 

    // SCAN UNIQUEMENT PREMIUM
    bpRewards.forEach(item => {
        if (item.lvl <= niveauActuel) {
            const idPrem = item.lvl + "_prem";

            if (!claimedRewards.includes(idPrem)) {
                if (item.prem.includes("💎")) {
                    nouveauxGains.dust += parseInt(item.prem.replace(/[^0-9]/g, "")) || 0;
                } else if (item.prem.includes("⚡")) {
                    nouveauxGains.speedies += parseInt(item.prem.replace(/[^0-9]/g, "")) || 0;
                } else {
                    objetsSpeciaux.push({ lvl: item.lvl, type: 'prem' });
                    if (item.prem === "Carte Mystère") nbMystere++;
                    else if (item.prem.includes("Carte")) detailCartes[item.prem] = (detailCartes[item.prem] || 0) + 1;
                    else if (item.prem.includes("Pack")) detailPacks[item.prem] = (detailPacks[item.prem] || 0) + 1;
                }
                nouveauxPaliersIDs.push(idPrem);
            }
        }
    });

    if (nouveauxPaliersIDs.length === 0) {
        isBulkClaiming = false;
        return alert("☕ Aucun nouveau palier PREMIUM à récupérer !");
    }

    await finaliserLaRecuperation(nouveauxPaliersIDs, nouveauxGains, objetsSpeciaux, nbMystere, detailCartes, detailPacks);

    // --- FORCE L'AFFICHAGE DU BATTLE PASS APRÈS LA RÉCUPÉRATION ---
    const overlayBP = document.getElementById('bpOverlay');
    if (overlayBP) {
        overlayBP.style.display = 'flex';
    }
}

// --- finaliserLaRecuperation ---
async function finaliserLaRecuperation(ids, gains, objets, mysteres, dCartes, dPacks) {
    const user = auth.currentUser;
    try {
        const nextClaimed = Array.from(new Set([...claimedRewards, ...ids]));
        const nextDust = Math.floor(Number(dust) + gains.dust);
        const nextSpeedies = Math.floor(Number(speedies) + gains.speedies);

        // --- NOUVEAU : GESTION DES DÉBLOCAGES SPÉCIAUX ---
        let updateData = {
            claimedRewards: nextClaimed,
            dust: nextDust,
            speedies: nextSpeedies
        };

        let messageSpeciaux = "";

        // Palier 18 : Avatar (Équipement Auto)
        if (ids.includes("18_free")) {
            updateData.avatar18Unlocked = true;
            messageSpeciaux += `👤 Avatar Spécial débloqué !\n`;
            if (typeof updateProfileAvatar === "function") {
                updateProfileAvatar("https://cdn.phototourl.com/free/2026-04-10-cf9b788c-b14e-4a20-be90-118e4f82aa73.jpg");
            }
        }

if (ids.includes("53_prem")) {
    updateData.avatar53Unlocked = true;
    messageSpeciaux += `👤 Avatar Premium débloqué !\n`;
    if (typeof updateProfileAvatar === "function") {
        updateProfileAvatar("https://cdn.phototourl.com/free/2026-04-10-f0ba66d1-f04b-4b9f-98e5-e883909aa1f6.jpg");
    }
}



        // Palier 47 : Fond Rainbow (Équipement Auto)
        if (ids.includes("47_free")) {
            updateData.rainbowUnlocked = true;
            messageSpeciaux += `🌈 Fond Rainbow débloqué !\n`;
            if (typeof changerFond === "function") {
                changerFond('rainbow', true); // On active le fond Rainbow immédiatement
            }
        }

        // Palier 72 : Fond Moonlight (Équipement Auto)
        if (ids.includes("72_prem")) {
            updateData.moonlightUnlocked = true;
            messageSpeciaux += `🌙 Fond Moonlight débloqué !\n`;
            if (typeof changerFond === "function") {
                changerFond('moonlight', true); // On active le fond Moonlight immédiatement
            }
        }

        // Sauvegarde Firebase
        await db.collection("users").doc(user.uid).update(updateData);

        // Mise à jour des variables locales
        claimedRewards = nextClaimed;
        dust = nextDust;
        speedies = nextSpeedies;

        const pSpeed = document.getElementById("profileSpeedies");
        if (pSpeed) pSpeed.innerText = speedies;

const pDust = document.getElementById("profileDust");
if (pDust) pDust.innerText = dust;

        updateBattlePassUI();

        // Bilan
        let messageGains = `✅ Tu récupères :\n`;
        if (gains.dust > 0) messageGains += `💎 ${gains.dust} Fragments\n`;
        if (gains.speedies > 0) messageGains += `⚡ ${gains.speedies} Speedies\n`;
        if (mysteres > 0) messageGains += `❓ ${mysteres} Carte Mystère\n`;

        for (let nom in dCartes) messageGains += `🃏 ${dCartes[nom]} ${nom}\n`;
        for (let nom in dPacks) messageGains += `🎁 ${dPacks[nom]} ${nom}\n`;

        // Ajout des objets spéciaux au bilan visuel
        if (messageSpeciaux !== "") {
            messageGains += `\n✨ SPÉCIAL :\n${messageSpeciaux}`;
        }

        if (objets.length > 0) {
            messageGains += `\nClique sur OK pour tout débloquer !`;
            alert(messageGains);

            const bpOverlay = document.getElementById('bpOverlay');
            if (bpOverlay) bpOverlay.style.display = 'none';

            // --- FIX : On force l'affichage du bouton Battle Pass pour qu'il ne disparaisse pas ---
            const bpIcon = document.getElementById('bpIcon');
            if (bpIcon) {
                bpIcon.style.display = 'flex';
                bpIcon.style.opacity = '1';
                bpIcon.style.visibility = 'visible';
            }
            
            await executerOuverturesEnSerie(objets);
        } else {
            alert(messageGains);
        }

        // Mise à jour de la visibilité des boutons dans les paramètres
        if (typeof checkRainbowButtonVisibility === "function") {
            checkRainbowButtonVisibility();
        }

    } catch (e) {
        console.error("Erreur Save :", e);
        alert("Erreur de synchronisation.");
    } finally {
        isBulkClaiming = false;
    }
}

// --- executerOuverturesEnSerie ---
async function executerOuverturesEnSerie(liste) {
    for (const item of liste) {
        const rewardData = bpRewards.find(r => r.lvl === item.lvl);
        if (!rewardData) continue;
        
        const label = (item.type === 'free') ? rewardData.free : rewardData.prem;

        if (label === "Carte Mystère") {
            let rarete = tirerRareteAleatoire();
            const possibles = ALL_CARDS.filter(c => c.rarity === rarete);
            const piochee = possibles.length > 0 ? possibles[Math.floor(Math.random() * possibles.length)] : ALL_CARDS[0];
            gererAjoutCollectionSansSave(piochee);
        } 
        else if (label.includes("Carte")) {
            const nom = label.replace("Carte ", "").trim();
            const info = ALL_CARDS.find(c => c.name === nom);
            if (info) gererAjoutCollectionSansSave(info);
        } 
        else if (label.includes("Pack")) {
            if (label.includes("Diamond")) openSpecialPack("diamond");
            else if (label.includes("Platine")) openSpecialPack("platinum");
            else openSpecialPack("gold");
        }

        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    const user = auth.currentUser;
    if(user) await db.collection("users").doc(user.uid).update({ collection: collection });
}

// --- gererAjoutCollectionSansSave ---
function gererAjoutCollectionSansSave(card) {
    if (!card) return;
    const cardInCollection = collection.find(c => c.name === card.name);
    let isNew = false;
    let nLevel = 1;

    if (!cardInCollection) {
        isNew = true;
        collection.push({ ...card, level: 1, exp: 0, isNew: true });
    } else {
        cardInCollection.level = (cardInCollection.level || 1) + 1;
        nLevel = cardInCollection.level;
    }
    
    if (typeof displayGainedCard === "function") {
        displayGainedCard(card, isNew, nLevel);
    }
}

// --- checkRainbowButtonVisibility ---
function checkRainbowButtonVisibility() {
    const btn = document.getElementById("btn-fond-rainbow");
    if (!btn) return;

    // Si le palier 47 est dans la liste des récompenses, on montre le bouton
    if (claimedRewards.includes("47_free")) {
        btn.style.display = "block";
    }

// Bouton Moonlight
    const btnMoonlight = document.getElementById("btn-fond-moonlight");
    if (btnMoonlight && claimedRewards.includes("72_prem")) {
        btnMoonlight.style.display = "block";
    }

// --- AJOUT : Avatar Palier 18 ---
    const imgAvatar18 = document.getElementById("avatar-18-free");
    if (imgAvatar18 && claimedRewards.includes("18_free")) {
        imgAvatar18.style.display = "block";
    }

// Avatar Palier 53 Premium
const imgAvatar53 = document.getElementById("avatar-53-prem");
if (imgAvatar53 && claimedRewards.includes("53_prem")) {
    imgAvatar53.style.display = "block";
}

}