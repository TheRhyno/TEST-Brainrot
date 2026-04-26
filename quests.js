// ============================================================
//  quests.js - Quêtes journalières, streak, bonus
// ============================================================

// --- Variable globale quêtes ---
let quetesActives = null;

// --- updateStreak ---
async function updateStreak() {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    // 1. Empêcher le double appel le même jour
    if (lastOpenDate === today) {
        return;
    }

    // --- CONNEXION SERVEUR ---
    const user = auth.currentUser;
    if (!user) return;
    const userRef = db.collection("users").doc(user.uid);

    const lastDate = new Date(lastOpenDate);
    const diffTime = now - lastDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    // 2. Logique de progression (ta logique originale)
    if (lastOpenDate === "") {
        streakCount = 1;
        streakBonusAvailable = false; 
    } else if (diffDays === 1) {
        streakCount++;
        // SI PALIER DE 5 : On active le cadeau
        if (streakCount % 5 === 0) {
            streakBonusAvailable = true;
        } else {
            streakBonusAvailable = false; 
        }
    } else if (diffDays > 1) {
        // Trop tard, on reset tout
        streakCount = 1;
        streakBonusAvailable = false;
    }

    lastOpenDate = today;
    
    // 3. SAUVEGARDE LOCALE
    localStorage.setItem("streakCount", streakCount);
    localStorage.setItem("lastOpenDate", lastOpenDate);
    localStorage.setItem("streakBonusAvailable", streakBonusAvailable);
    
    // 4. SAUVEGARDE SERVEUR (Pour éviter la triche et garder la synchro)
    try {
        await userRef.update({
            streakCount: streakCount,
            lastOpenDate: lastOpenDate,
            streakBonusAvailable: streakBonusAvailable
        });

    } catch (e) {
        console.error("Erreur synchro serveur:", e);
    }
    
    alert(`🔥 Streak: ${streakCount} jour(s) !`);
    renderStreak();
}

// --- renderStreak ---
function renderStreak() {
    const hudStreak = document.getElementById("hudStreak");
    if (hudStreak) {
        hudStreak.innerText = streakCount;
    }

    const profileStreak = document.getElementById("profileStreak");
    if (profileStreak) {
        profileStreak.innerText = streakCount;
    }

    const oldDisplay = document.getElementById("streakDisplay");
    if (oldDisplay) {
        oldDisplay.style.display = "none";
    }
}

// --- toggleQuests ---
function toggleQuests() {
    const overlay = document.getElementById("questOverlay");
    if (!overlay) {
        console.error("L'élément questOverlay n'existe pas dans le HTML");
        return;
    }
    
    // On récupère le bouton musique au cas où tu voudrais le cacher aussi (comme pour le lobby)
    const musicBtn = document.getElementById("musicBtn");
    
    // --- AJOUT : Récupération du menu et du profil ---
    const nav = document.querySelector('nav');
    const accountBtn = document.getElementById('accountBtn');

    // Alterne entre 'none' et 'flex'
    if (overlay.style.display === "none" || overlay.style.display === "") {
        // --- OUVERTURE ---
        overlay.style.display = "flex";
        
        // On ajoute la classe d'animation d'entrée
        overlay.classList.remove("quest-exit-animate"); // Sécurité
        overlay.classList.add("quest-overlay-animate");

        if (musicBtn) musicBtn.style.display = "none";
        
        // --- AJOUT : Masquer le menu et le profil ---
        if (nav) nav.style.display = "none";
        if (accountBtn) accountBtn.style.display = "none";

        // On recharge les quêtes depuis Firebase à chaque ouverture pour être à jour
        chargerQuetesFirebase();
    } else {
        // --- FERMETURE AVEC ANIMATION ---
        // On retire l'animation d'entrée et on met celle de sortie
        overlay.classList.remove("quest-overlay-animate");
        overlay.classList.add("quest-exit-animate");

        // On attend la fin de l'animation (ex: 0.3s) avant de mettre display none
        setTimeout(() => {
            overlay.style.display = "none";
            overlay.classList.remove("quest-exit-animate"); // Reset pour la prochaine fois
            
            if (musicBtn) musicBtn.style.display = "flex";
            
            // --- AJOUT : Réafficher le menu et le profil ---
            if (nav) nav.style.display = "flex";
            if (accountBtn) accountBtn.style.display = "block";
            
        }, 300);
    }
}

// --- chargerQuetesFirebase ---
async function chargerQuetesFirebase() {
    const user = firebase.auth().currentUser;
    if (!user) return;

    const today = new Date().toDateString();
    const userRef = db.collection("users").doc(user.uid);

    try {
        const doc = await userRef.get();
        let data = doc.data();

        // Cas 1 : Pas de quêtes OU Date différente (Nouveau jour) -> RESET
        if (!data.dailyQuests || data.dailyQuests.date !== today) {

            const shuffled = [...TOUTES_LES_QUETES].sort(() => 0.5 - Math.random());
            quetesActives = {
                date: today,
                bonusFinalDonne: false, // ✨ AJOUTÉ : Indispensable pour que le bonus fonctionne
                active: shuffled.slice(0, 3).map(q => ({ 
                    ...q, progres: 0, fini: false, recuperee: false 
                }))
            };
            // Sauvegarde immédiate du nouveau jour sur Firebase
            await userRef.set({ dailyQuests: quetesActives }, { merge: true });
        } else {
            // Cas 2 : On récupère les quêtes existantes du jour
            quetesActives = data.dailyQuests;
        }
        
        if (document.getElementById("questOverlay").style.display === "flex") {
            afficherQuetes(quetesActives.active);
        }
    } catch (error) {
        console.error("Erreur lors du chargement des quêtes:", error);
    }
}

// --- afficherQuetes ---
function afficherQuetes(quetes) {
    const list = document.getElementById("questList");
    if (!list) return;
    list.innerHTML = "";

    // --- CALCUL DES ÉTATS DU BONUS ---
    // On compte combien de quêtes sont finies (pour savoir si on peut récupérer le bonus)
    const nbFinies = quetes.filter(q => q.fini).length;
    // On garde nbRecuperees pour la barre de progression visuelle
    const nbRecuperees = quetes.filter(q => q.recuperee).length;
    const bonusFinalDonne = (typeof quetesActives !== 'undefined' && quetesActives.bonusFinalDonne);
    
    const xpParQuete = 100;
    const xpBonusFinal = 400;

    // Création du bandeau de bonus avec animation
    const bonusContainer = document.createElement("div");
    bonusContainer.className = "quest-item-animate";
    bonusContainer.style.animationDelay = "0.1s";
    bonusContainer.style.cssText = `
        background: #1e1b4b; 
        padding: 12px; 
        border-radius: 8px; 
        margin-bottom: 15px; 
        border: 1px solid ${nbFinies === 3 && !bonusFinalDonne ? '#fbbf24' : '#4338ca'}; 
        text-align: center;
    `;

    // --- LOGIQUE DU CONTENU DU BANDEAU (BOUTON MANUEL) ---
    let bonusUI = "";
    if (bonusFinalDonne) {
        // Cas 1 : Bonus déjà pris
        bonusUI = `
            <div style="font-weight: bold; color: #10b981; font-size: 0.9em;">🏆 OBJECTIF DU JOUR TERMINÉ</div>
            <div style="font-size: 0.75em; color: #a5b4fc; margin-top: 4px;">✨ Bonus de 1000 💎 et ${xpBonusFinal} XP récupérés !</div>
        `;
    } else if (nbFinies === 3) {
        // Cas 2 : Les 3 quêtes sont finies, on affiche le bouton de récupération manuel
        bonusUI = `
            <div style="font-weight: bold; color: #fbbf24; font-size: 0.9em; margin-bottom: 8px;">🎁 BONUS PRÊT !</div>
            <button onclick="recupererBonusFinal()" style="background: #fbbf24; color: #1e1b4b; border: none; padding: 6px 15px; border-radius: 6px; cursor: pointer; font-weight: 900; font-size: 10px; text-transform: uppercase; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                RÉCUPÉRER LE BONUS
            </button>
        `;
    } else {
        // Cas 3 : En cours de progression
        bonusUI = `
            <div style="font-weight: bold; color: #fbbf24; font-size: 0.9em;">🏆 OBJECTIF DU JOUR : ${nbFinies}/3</div>
            <div style="font-size: 0.75em; color: #a5b4fc; margin-top: 4px;">Complétez tout pour : 1000 💎 & ${xpBonusFinal} XP ✨</div>
        `;
    }

    bonusContainer.innerHTML = `
        ${bonusUI}
        <div style="width: 100%; background: #312e81; height: 6px; border-radius: 3px; margin-top: 8px; overflow: hidden;">
            <div style="width: ${(nbFinies / 3) * 100}%; background: #fbbf24; height: 100%; transition: width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);"></div>
        </div>
    `;
    list.appendChild(bonusContainer);

    // --- BOUCLE DES QUÊTES ---
    quetes.forEach((q, index) => {
        let statusHTML = "";
        let bgColor = "#1e293b";
        let clickAction = "";

        if (q.recuperee) {
            statusHTML = `<span style="color: #10b981;">TERMINÉ ✅</span>`;
            bgColor = "rgba(16, 185, 129, 0.05)";
        } else if (q.fini) {
            statusHTML = `<button style="background: #10b981; color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer;">RÉCUPÉRER</button>`;
            bgColor = "rgba(16, 185, 129, 0.2)";
              clickAction = () => { playQuestSound(); recupererCadeauFirebase(index); };
        } else {
            statusHTML = `<span style="color: #3b82f6;">${q.progres}/${q.cible}</span>`;
        }

        const item = document.createElement("div");
        item.className = "quest-item-animate";
        item.style.animationDelay = `${(index + 2) * 0.1}s`;
        
        item.style.cssText = `
            background: ${bgColor}; 
            padding: 12px; 
            border-radius: 8px; 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            border-left: 4px solid ${q.fini ? '#10b981' : '#3b82f6'}; 
            margin-bottom: 8px; 
            cursor: ${q.fini && !q.recuperee ? 'pointer' : 'default'};
        `;

        if (q.fini && !q.recuperee) {
            item.onclick = clickAction;
        }

        item.innerHTML = `
            <div style="text-align: left;">
                <div style="font-weight: bold; font-size: 0.9em; color: white; line-height: 1.2;">${q.desc}</div>
                <div style="font-size: 0.8em; display: flex; align-items: center; gap: 10px; margin-top: 5px; line-height: 1;">
                    <span style="color: #fbbf24; display: flex; align-items: center; gap: 3px;">
                        +${q.recompense} 💎
                    </span>
                    <span style="color: #4fc3f7; font-weight: bold; display: flex; align-items: center; gap: 3px;">
                        +${xpParQuete} XP
                    </span>
                </div>
            </div>
            <div>${statusHTML}</div>
        `;
        list.appendChild(item);
    });
}

// --- recupererBonusFinal ---
async function recupererBonusFinal() {
    const user = firebase.auth().currentUser;
    // On garde tes conditions de base et on s'assure que le bonus n'est pas déjà donné
    if (!user || !quetesActives || quetesActives.bonusFinalDonne) return;

    // --- AJOUT DE LA VÉRIFICATION DE SÉCURITÉ ---
    // On vérifie que les 3 quêtes ont bien le statut 'fini' à true
    const nbFinies = quetesActives.active.filter(q => q.fini).length;
    if (nbFinies < 3) {
        console.log("Le bonus n'est pas encore débloqué (Quêtes finies : " + nbFinies + "/3)");
        return; 
    }

    try {
        const MONTANT_BONUS = 1000;
        const XP_BONUS_FINAL = 400;

        // Mise à jour locale du montant de dust (Fragments/Diamants)
        dust += MONTANT_BONUS;
        
        // On marque le bonus comme étant donné pour empêcher toute double récupération
        quetesActives.bonusFinalDonne = true;

        // Appel de la fonction de gain d'XP si elle existe
        if (typeof ajouterXP === "function") await ajouterXP(XP_BONUS_FINAL);

        // Mise à jour de la base de données Firebase
        await db.collection("users").doc(user.uid).update({
            dust: dust,
            dailyQuests: quetesActives
        });

        // Mise à jour visuelle du compteur de dust si l'élément existe
        if (document.getElementById("profileDust")) {
            document.getElementById("profileDust").innerText = dust;
        }

        // Message de succès pour le joueur
        alert("🌟 Bonus récupéré ! +1000 💎 et +400 XP");
        
        // Rafraîchissement de l'affichage pour faire disparaître le bouton
        afficherQuetes(quetesActives.active);
        
    } catch (e) {
        // Log de l'erreur en cas de problème avec Firebase ou le script
        console.error("Erreur lors de la récupération du bonus final :", e);
        // On remet éventuellement à false en cas d'échec critique de la DB pour permettre de réessayer
        // quetesActives.bonusFinalDonne = false; 
    }
}

// --- recupererCadeauFirebase ---
async function recupererCadeauFirebase(index) {
    const user = firebase.auth().currentUser;
    // Vérification de sécurité : utilisateur connecté et objet quêtes chargé
    if (!user || !quetesActives) return;

    let q = quetesActives.active[index];

    // --- CONDITION DE RÉCUPÉRATION ---
    // On vérifie que la quête est terminée (fini) et qu'elle n'a pas déjà été encaissée
    if (q.fini && !q.recuperee) {
        
        // 1. Mise à jour locale immédiate
        q.recuperee = true;
        dust += q.recompense; // Ajout des fragments de la quête individuelle

        try {
            // --- GAIN D'XP INDIVIDUEL ---
            const XP_PAR_QUETE = 100;
            if (typeof ajouterXP === "function") {
                await ajouterXP(XP_PAR_QUETE);
            }

            // --- ⚠️ MODIFICATION ICI : DÉSACTIVATION DU BONUS AUTO ---
            // On commente la distribution auto pour laisser le bouton manuel apparaître
            /* const nbRecuperees = quetesActives.active.filter(quest => quest.recuperee === true).length;
            let messageBonus = "";

            if (nbRecuperees === 3 && quetesActives.bonusFinalDonne !== true) {
                const MONTANT_BONUS = 1000;
                const XP_BONUS_FINAL = 400;
                dust += MONTANT_BONUS;
                quetesActives.bonusFinalDonne = true; 
                if (typeof ajouterXP === "function") {
                    await ajouterXP(XP_BONUS_FINAL);
                }
                messageBonus = `\n\n🌟 BONUS QUOTIDIEN : +${MONTANT_BONUS} Fragments & +${XP_BONUS_FINAL} XP !`;
            }
            */

            // 2. SAUVEGARDE SYNCHRONISÉE SUR FIREBASE
            // On sauvegarde la quête comme "récupérée"
            await db.collection("users").doc(user.uid).update({
                dust: dust,
                dailyQuests: quetesActives
            });

            // 3. MISE À JOUR VISUELLE
            if (document.getElementById("profileDust")) {
                document.getElementById("profileDust").innerText = dust;
            }
            
            // Recharger l'affichage : C'est ici que le bouton jaune "RÉCUPÉRER LE BONUS" va apparaître
            afficherQuetes(quetesActives.active);
            
            // 4. FEEDBACK UTILISATEUR
            alert(`🎁 +${q.recompense} Fragments & +${XP_PAR_QUETE} XP récupérés !`);
            
        } catch (error) {
            console.error("Erreur lors de la récupération :", error);
            q.recuperee = false; 
            alert("Erreur de connexion à Firebase. Tes gains n'ont pas été enregistrés. Réessaie.");
        }
    }
}

// --- avancerQuete ---
async function avancerQuete(type, montant = 1) {
    if (!quetesActives) return;

    let aChange = false;
    // On passe sur chaque quête pour voir si elle correspond
    for (const q of quetesActives.active) {
        if (q.type === type && !q.fini) {
            q.progres += montant;
            
            // --- DÉTECTION QUÊTE TERMINÉE ---
            if (q.progres >= q.cible) {
                q.progres = q.cible;
                q.fini = true;

                // --- GAIN D'XP IMMÉDIAT ---
                const xpQuete = 100; 
                if (typeof ajouterXP === "function") {
                    await ajouterXP(xpQuete);
                }

                // --- MODIFICATION : DÉTECTION DU BONUS (SANS DISTRIBUTION AUTO) ---
                // On vérifie si les 3 quêtes sont maintenant à l'état 'fini'
                const nbFinies = quetesActives.active.filter(quest => quest.fini === true).length;
                
                if (nbFinies === 3 && quetesActives.bonusFinalDonne !== true) {
                    // Les lignes ci-dessous sont neutralisées pour permettre la récupération manuelle via le bouton
                    /* const MONTANT_BONUS = 1000;
                    const XP_BONUS_FINAL = 400;
                    dust += MONTANT_BONUS;
                    quetesActives.bonusFinalDonne = true; 
                    if (typeof ajouterXP === "function") { await ajouterXP(XP_BONUS_FINAL); }
                    alert(`🏆 EXCEPTIONNEL ! Tu as terminé les 3 quêtes !`); 
                    */
                    
                }
            }
            aChange = true;
        }
    }

    if (aChange) {
        const user = firebase.auth().currentUser;
        if(user) {
            // Sauvegarde de l'état (On sauvegarde la progression, mais dust n'augmente pas ici pour le bonus)
            await db.collection("users").doc(user.uid).update({ 
                dailyQuests: quetesActives,
                dust: dust 
            });
        }
        
        if (document.getElementById("questOverlay") && document.getElementById("questOverlay").style.display === "flex") {
            afficherQuetes(quetesActives.active);
        }
    }
}