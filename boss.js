// ============================================================
//  boss.js - Boss communautaire, barre de vie, classement
// ============================================================

// --- verifierRecompenseBossRecue ---
async function verifierRecompenseBossRecue() {
    const user = auth.currentUser;
    if (!user) return;

    // --- SÉCURITÉ ANTI-DOUBLON (VERROU LOCAL) ---
    if (bossRewardProcessing) return;
    bossRewardProcessing = true;

    const userRef = db.collection("users").doc(user.uid);
    const bossRef = db.collection("global_event").doc("boss_battle");

    try {
        // ON FORCE LA LECTURE SUR LE SERVEUR POUR ÉVITER LE CACHE (Source du bug de refresh)
        const [userDoc, bossDoc] = await Promise.all([
            userRef.get({ source: 'server' }), 
            bossRef.get({ source: 'server' })
        ]);
        
        if (userDoc.exists && bossDoc.exists) {
            const userData = userDoc.data();
            const bossData = bossDoc.data();
            
            const bossId = bossData.event_id || "event_paques_2026"; 
            const recompensesObtenues = userData.bossRewardsClaimed || [];

            // --- VÉRIFICATION : BOSS MORT ET PAS ENCORE RÉCLAMÉ ---
            if (bossData.hp_current <= 0 && !recompensesObtenues.includes(bossId)) {
                
                const degatsJoueur = userData.bossDamageDealt || 0;

                // --- 1. CALCUL DU CLASSEMENT (TOP 3) ---
                const snapshot = await db.collection("users")
                    .orderBy("bossDamageDealt", "desc")
                    .limit(3)
                    .get();

                let position = 0;
                let compteur = 1;
                snapshot.forEach(doc => {
                    if (doc.id === user.uid) position = compteur;
                    compteur++;
                });

                // Calcul des fragments (Dust) pour le Top 3
                let gainsDust = 0;
                if (position === 1) gainsDust = 15000;
                else if (position === 2) gainsDust = 10000;
                else if (position === 3) gainsDust = 5000;

                // --- 2. CARTE EXCLUSIVE (PALIER 500 DÉGÂTS) ---
                let inventory = userData.inventory || {};
                let aGagneCarte = false;

                if (degatsJoueur >= 500) { 
                    aGagneCarte = true;
                    const nomCarte = "Bunny Bunny Bunny Sahur";
                    const maRecompense = {
                        name: nomCarte,
                        rarity: "Exclu Pâques 2026",
                        image: "https://www.eldorado.gg/blog/wp-content/uploads/2026/03/Bunny-Bunny-Bunny-Sahur-150x300.webp"
                    };

                    if (inventory[nomCarte]) {
                        inventory[nomCarte].count += 1;
                    } else {
                        inventory[nomCarte] = { ...maRecompense, count: 1 };
                    }
                }

                // --- 3. SAUVEGARDE ET AFFICHAGE ---
                if (aGagneCarte || gainsDust > 0) {
                    
                    // On prépare l'objet de mise à jour pour Firebase
                    let updateData = {
                        bossRewardsClaimed: firebase.firestore.FieldValue.arrayUnion(bossId),
                        dust: firebase.firestore.FieldValue.increment(gainsDust),
                        bossDamageDealt: 0 // ON RESET LES DÉGÂTS POUR ÉVITER LE DOUBLE GAIN AU REFRESH
                    };

                    if (aGagneCarte) {
                        const nomCarte = "Bunny Bunny Bunny Sahur";
                        const maRecompense = {
                            name: nomCarte,
                            rarity: "Exclu Pâques 2026",
                            image: "https://www.eldorado.gg/blog/wp-content/uploads/2026/03/Bunny-Bunny-Bunny-Sahur-150x300.webp",
                            level: 1,
                            exp: 0,
                            isNew: true
                        };

                        const existingCard = collection.find(card => card.name === nomCarte);
                        
                        if (!existingCard) {
                            collection.push({ ...maRecompense });
                            if (typeof ajouterXP === "function") ajouterXP(20);
                        } else {
                            existingCard.exp = (existingCard.exp || 0) + 1;
                        }

                        let inventoryUpdate = userData.inventory || {};
                        if (inventoryUpdate[nomCarte]) {
                            inventoryUpdate[nomCarte].count += 1;
                        } else {
                            inventoryUpdate[nomCarte] = { ...maRecompense, count: 1 };
                        }

                        updateData.collection = collection;
                        updateData.inventory = inventoryUpdate;
                    }

                    // Envoi unique à Firebase
                    await userRef.update(updateData);

                    // --- CONFIGURATION DE LA POP-UP ---
                    if (aGagneCarte) {
                        document.getElementById("rewardCardImg").src = "https://www.eldorado.gg/blog/wp-content/uploads/2026/03/Bunny-Bunny-Bunny-Sahur-150x300.webp";
                        document.getElementById("rewardCardName").innerText = "Bunny Bunny Bunny Sahur";
                        
                        let detailGains = "Événement de Pâques 2026";
                        if (gainsDust > 0) {
                            detailGains = `Top ${position} ! +${gainsDust.toLocaleString()} Fragments`;
                        }
                        
                        document.getElementById("rewardCardRarity").innerText = detailGains;
                        document.getElementById("rewardCardRarity").style.color = "#ffeb3b";
                        document.getElementById("rewardPopup").style.display = "flex";

                        const closeBtn = document.querySelector("#rewardPopup button");
                        if (closeBtn) {
                            closeBtn.onclick = () => {
                                document.getElementById("rewardPopup").style.display = "none";
                                const profileDust = document.getElementById("profileDust");
                                if (profileDust && typeof gainsDust !== 'undefined') {
                                    let actuel = parseInt(profileDust.innerText.replace(/\s/g, '')) || 0;
                                    profileDust.innerText = (actuel + gainsDust).toLocaleString();
                                }
                                if (typeof syncSubwayHUD === "function") syncSubwayHUD(); 
                                if (typeof refreshCollection === "function") refreshCollection();
                            };
                        }
                        
                    } else if (gainsDust > 0) {
                        alert(`Bravo ! Tu es classé ${position}e et tu gagnes ${gainsDust.toLocaleString()} fragments !`);
                        const profileDust = document.getElementById("profileDust");
                        if (profileDust && typeof gainsDust !== 'undefined') {
                            let actuel = parseInt(profileDust.innerText.replace(/\s/g, '')) || 0;
                            profileDust.innerText = (actuel + gainsDust).toLocaleString();
                        }
                        if (typeof syncSubwayHUD === "function") syncSubwayHUD(); 
                        if (typeof refreshCollection === "function") refreshCollection();
                    }
                }
            }
        }
    } catch (e) {
        console.error("Erreur lors de la distribution :", e);
    } finally {
        // ON LIBÈRE LE VERROU À LA TOUTE FIN
        bossRewardProcessing = false;
    }
}

// --- gestionBarreBoss ---
function gestionBarreBoss() {
    db.collection("global_event").doc("boss_battle").onSnapshot((doc) => {
        const area = document.getElementById("bossArea");
        const homeSection = document.getElementById("homeSection");
        
        if (doc.exists && area) {
            const data = doc.data();
            
            // --- DÉCLENCHEMENT DU TIRAGE QUAND LE BOSS MEURT ---
            if (data.hp_current <= 0) {
                area.style.display = "none";f
                // On appelle la fonction de récompense immédiatement à la mort du boss
                verifierRecompenseBossRecue();
                return;
            }

            // Condition d'affichage : Actif + Sur l'accueil
            const isHomeVisible = homeSection && homeSection.style.display !== "none";
            
            if (data.active === true && isHomeVisible) {
                area.style.display = "block"; 
                
                if(document.getElementById("bossNameDisplay")) {
                    document.getElementById("bossNameDisplay").innerText = data.name || "BOSS";
                }
                
                // Calcul du pourcentage
                const pourcentage = Math.max(0, (data.hp_current / data.hp_max) * 100);
                const bar = document.getElementById("bossBarProgress");
                if (bar) bar.style.width = pourcentage + "%";
                
                // Texte des PV
                const hpText = document.getElementById("bossHpTextDisplay");
                if (hpText) {
                    hpText.innerText = Math.ceil(data.hp_current).toLocaleString() + " / " + data.hp_max.toLocaleString() + " PV";
                }
            } else {
                area.style.display = "none";
            }
        }
    });
}

// --- hitBoss ---
function hitBoss() {
    const user = firebase.auth().currentUser;
    if (!user) return;

    const bossRef = db.collection("global_event").doc("boss_battle");
    const userRef = db.collection("users").doc(user.uid);
    
    // 1. Dégâts collectifs (réduit les PV globaux)
    bossRef.update({
        hp_current: firebase.firestore.FieldValue.increment(-100)
    });

    // 2. Dégâts personnels (stocké sur le profil utilisateur pour le classement final)
    userRef.update({
        bossDamageDealt: firebase.firestore.FieldValue.increment(100)
    });

    hitBossEffect();
}

// --- hitBossEffect ---
function hitBossEffect() {
    const bossArea = document.getElementById("bossArea");
    if (bossArea) {
        bossArea.style.animation = "shake 0.2s ease-in-out";
        setTimeout(() => bossArea.style.animation = "", 200);
    }
}

// --- afficherClassementDirect ---
function afficherClassementDirect() {
    // Écoute en temps réel des 3 meilleurs joueurs
    db.collection("users")
        .orderBy("bossDamageDealt", "desc")
        .limit(3)
        .onSnapshot(snapshot => {
            let entries = [];
            
            snapshot.forEach((doc, index) => {
                const data = doc.data();
                const pseudo = data.username || "Anonyme";
                const degats = data.bossDamageDealt || 0;
                // On prépare le texte pour chaque joueur
                entries.push(`<span style="color:#ffd700">#${index + 1}</span> ${pseudo}: ${degats.toLocaleString()}`);
            });

            // On injecte le tout dans l'élément HTML
            const leaderBoardDiv = document.getElementById("liveLeaderboard");
            if (leaderBoardDiv) {
                leaderBoardDiv.innerHTML = entries.join(" | ");
            }
        });
}