// ============================================================
//  booster.js - Ouverture boosters, animations, tirage cartes
// ============================================================

// --- handleCardClick ---
function handleCardClick(cardElement, cardData) {
    // SI ON A DÉJÀ CLIQUÉ SUR UNE CARTE, ON BLOQUE TOUT
    if (!canClickCard) return; 

    // ON ACTIVE LE VERROU IMMÉDIATEMENT
    canClickCard = false;

    // 1. On révèle la carte cliquée (ton code actuel pour l'animation)
    cardElement.classList.add("revealed"); 
    
    // 2. On ajoute la carte à la collection
    collection.push(cardData);
    save("collection", collection);

    // 3. OPTIONNEL : On grise ou on cache les deux autres cartes
    const allPackCards = document.querySelectorAll(".pack-card-item"); // Remplace par ta classe
    allPackCards.forEach(c => {
        if (c !== cardElement) {
            c.style.opacity = "0.5";
            c.style.pointerEvents = "none"; // Sécurité supplémentaire
        }
    });

    console.log("Une seule carte récupérée, les autres sont bloquées !");

    // Une fois que l'animation est finie et qu'on ferme l'overlay
    // Il faudra remettre canClickCard = true; pour le prochain booster.
}

// --- pickBoostedCard ---
function pickBoostedCard(tier) {
    let probs;
    if (tier === "gold") {
        probs = { 'Rare': 40, 'Epic': 30, 'Legendary': 20, 'Mythic': 8, 'Brainrot God': 2 };
    } else if (tier === "platinum") {
        probs = { 'Epic': 50, 'Legendary': 30, 'Mythic': 15, 'Brainrot God': 4, 'Secret': 1 };
    } else if (tier === "diamond") {
        probs = { 'Legendary': 40, 'Mythic': 35, 'Brainrot God': 15, 'Secret': 8, 'OG': 2 };
    } else {
        return pickRandomCard();
    }

    const total = Object.values(probs).reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    
    for (const [rarity, prob] of Object.entries(probs)) {
        r -= prob;
        if (r <= 0) {
            const filtered = ALL_CARDS.filter(c => c.rarity === rarity);
            return filtered[Math.floor(Math.random() * filtered.length)] || ALL_CARDS[0];
        }
    }
    return ALL_CARDS[0];
}

// --- openSpecialPack ---
function openSpecialPack(type) {
    let pack = [];

    // --- AJOUT : Progression Quête (Achat Booster Spécial) ---
    if (typeof progresserQuete === "function") {
        progresserQuete("shop_booster", 1);
    }

    if (type === "gold") {
        pack.push(pickBoostedCard("gold"));
        pack.push(pickBoostedCard("gold"));
        pack.push(pickSpecificRarity("Brainrot God"));
    } else if (type === "platinum") {
        pack.push(pickBoostedCard("platinum"));
        pack.push(pickBoostedCard("platinum"));
        pack.push(pickSpecificRarity("Secret"));
    } else if (type === "diamond") {
        pack.push(pickBoostedCard("diamond"));
        pack.push(pickBoostedCard("diamond"));
        pack.push(pickSpecificRarity("OG"));
    }

    // --- AJOUT : Tableau des paliers pour l'EXP ---
    const expTable = {
        "Commun": 15, "Rare": 12, "Epic": 10, "Legendary": 7,
        "Mythic": 4, "Brainrot God": 3, "Secret": 2, "OG": 1 
    };

    pack.forEach(c => {
        // --- AJOUT : Progression Quêtes de Rareté (Rare / Mythic) ---
        if (typeof progresserQuete === "function") {
            if (c.rarity === "Rare") progresserQuete("rare", 1);
            if (c.rarity === "Mythic") progresserQuete("mythic", 1);
        }

        // On cherche la carte précise dans la collection pour modifier son EXP
        const cardInCollection = collection.find(card => card.name === c.name);

        if (!cardInCollection) {
            // --- TON CODE ORIGINE (Nouvelle carte) ---
            c.isNew = true;
            c.exp = 0;      // Ajout de l'exp par défaut
            c.level = 1;    // Ajout du niveau par défaut
            collection.push({ ...c });
        } else {
            // --- AJOUT : Progression Quête (Doublons) ---
            if (typeof progresserQuete === "function") {
                progresserQuete("duplicate", 1);
            }

            // --- TON CODE ORIGINE (Doublon) ---
            c.isNew = false;
            const dustValues = { "Commun": 1, "Rare": 3, "Epic": 8, "Legendary": 20, "Mythic": 50, "Brainrot God": 200, "Secret": 500, "OG": 1000 };
            dust += (dustValues[c.rarity] || 1);

            // --- AJOUT : LOGIQUE EXP/NIVEAU ---
            cardInCollection.exp = (cardInCollection.exp || 0) + 1;
            const expNeeded = expTable[cardInCollection.rarity] || 10;

            if (cardInCollection.exp >= expNeeded) {
                cardInCollection.level = (cardInCollection.level || 1) + 1;
                cardInCollection.exp = 0; // Reset l'exp pour le prochain niveau

            }
        }
    });

    // --- TON CODE ORIGINE (Sauvegardes) ---
    save("collection", collection);
    save("dust", dust);

    const user = firebase.auth().currentUser;
    if (user) {
        db.collection("users").doc(user.uid).set({ collection, dust }, { merge: true });
        
        // --- AJOUT : Progression Quête (Total Dust) ---
        if (typeof progresserQuete === "function") {
            progresserQuete("dust_total", dust);
        }
    }

    currentPack = pack;
    currentCardIndex = 0;
    showBigCard();
}

// --- pickSpecificRarity ---
function pickSpecificRarity(rarityName) {
    const possible = ALL_CARDS.filter(c => c.rarity === rarityName);
    return possible[Math.floor(Math.random() * possible.length)] || ALL_CARDS[0];
}

// --- showOGAnimation ---
function showOGAnimation(card, callback) {
    const anim = document.createElement("div");
    anim.id = "ogAnimation";
    anim.style.cssText = `
        position:fixed;top:0;left:0;width:100vw;height:100vh;
        background:rgba(0,255,255,0.2);
        display:flex;align-items:center;justify-content:center;
        z-index:20000;pointer-events:all;user-select:none;
    `;

    const text = document.createElement("div");
    text.innerText = "OG !!!";
    text.style.cssText = `
        font-size:80px;font-weight:bold;color:#00ffff;
        text-shadow:0 0 20px #00ffff,0 0 40px #00ffff,0 0 80px #00ffff;
        animation: ogText 1.5s ease-out;
    `;

    anim.appendChild(text);
    document.body.appendChild(anim);

    // autoriser le clic après animation
    setTimeout(() => {
        anim.style.cursor = "pointer";
        anim.addEventListener("click", () => {
            anim.remove();
            if(callback) callback();
        }, { once: true });
    }, 1500);
}

// --- loadBoosterCounter ---
function loadBoosterCounter(uid) {
    db.collection("users").doc(uid).get()
      .then(doc => {
        if (doc.exists) {
            const count = doc.data().boostersOpened || 0;
            
            // On met à jour la variable globale (window pour être sûr)
            window.boostersOpened = count; 

            // Mise à jour de l'accueil
            if (typeof boosterCounterDiv !== 'undefined') {
                boosterCounterDiv.innerText = `Boosters ouverts : ${count}`;
            }

            // ON FORCE LA MISE À JOUR DU PROFIL ICI
            actualiserProfil(); 

        }
      })
      .catch(err => console.error("Erreur :", err));
}

// --- pickRandomCard ---
function pickRandomCard(){
  const total = Object.values(RARITY_PROBS).reduce((a,b)=>a+b,0);
  let r = Math.random()*total;
  let chosenRarity;
  for(const [rarity,prob] of Object.entries(RARITY_PROBS)){
    r -= prob;
    if(r <= 0){ chosenRarity = rarity; break; }
  }
  const cards = ALL_CARDS.filter(c=>c.rarity===chosenRarity);
  if(cards.length===0) return ALL_CARDS[Math.floor(Math.random()*ALL_CARDS.length)];
  return cards[Math.floor(Math.random()*cards.length)];
}

// --- showBigCard ---
function showBigCard() {
    if (currentCardIndex >= currentPack.length) {
        overlay.style.display = 'none';
        refreshCollection(); // C'est ici que les chiffres s'actualiseront dans la grille
        refreshLimit();
        return;
    }

    const c = currentPack[currentCardIndex];
    const wrapper = document.createElement("div");
    wrapper.className = "card-wrapper";

    if (c.isNew) {
        const label = document.createElement("div");
        label.className = "new-label";
        label.textContent = "NOUVEAU";
        wrapper.appendChild(label);
    }

    const cardDiv = document.createElement("div");

    // --- 🟢 AJOUT RARETÉS "PLEIN ÉCRAN" ICI ---

    if (c.rarity === "OG" || c.rarity === "Mythic Lucky Block"  || c.rarity === "Brainrot God Lucky Block"  || c.rarity === "Secret Lucky Block"  || c.rarity === "Admin Lucky Block") {
        
        // On copie le style exact de l'OG : Pas de bordure, pas de fond
        cardDiv.className = "card big-card big-" + c.rarity.replace(/ /g, "-");
        cardDiv.style.cssText = "border:none; padding:0; background:none; position:relative;";

        const cardImg = document.createElement("img");
        cardImg.src = c.image;
        // Taille maximale comme l'OG (90vw / 90vh)
        cardImg.style.cssText = "max-width:90vw; max-height:90vh; object-fit:contain; display:block; margin:auto; border-radius:12px;";
        cardDiv.appendChild(cardImg);

        // --- Animation feu d’artifice (Adaptée à la rareté) ---
        // 🚩 MODIFICATION ICI : On vérifie que ce n'est pas une récompense BP
        if (!window.isBPReward) {
            const canvas = document.createElement("canvas");
            canvas.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; pointer-events:none; z-index:20000;";
            document.body.appendChild(canvas);
            const ctx = canvas.getContext("2d");
            canvas.width = window.innerWidth; canvas.height = window.innerHeight;
            const particles = [];
            for (let i = 0; i < 150; i++) {
                // Couleur : Arc-en-ciel pour OG, Violet/Rose pour Mythic
                let hue = (c.rarity === "OG") ? Math.random() * 360 : (280 + Math.random() * 60);
                particles.push({
                    x: canvas.width / 2, y: canvas.height / 2,
                    vx: (Math.random() - 0.5) * 10, vy: (Math.random() - 1.5) * 10,
                    alpha: 1, radius: Math.random() * 3 + 2,
                    color: `hsl(${hue},100%,50%)`
                });
            }
            function animate() {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                particles.forEach((p, i) => {
                    p.x += p.vx; p.y += p.vy; p.alpha -= 0.02;
                    ctx.globalAlpha = p.alpha; ctx.fillStyle = p.color;
                    ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2); ctx.fill();
                    if (p.alpha <= 0) particles.splice(i, 1);
                });
                if (particles.length > 0) requestAnimationFrame(animate); else canvas.remove();
            }
            animate();
        }

        // --- BLOCAGE (1.5s) ---
        overlay.removeEventListener('click', overlayClickHandler);
        setTimeout(() => { overlay.addEventListener('click', overlayClickHandler); }, 1500);

    } else {
        // STYLE CLASSIQUE CONSERVÉ
        cardDiv.className = "card big-card big-" + c.rarity.replace(/ /g, "-");
        cardDiv.innerHTML = `
          <div style="font-size:1rem;color:#ccc;margin-bottom:6px;">${escapeHtml(c.rarity)}</div>
          <img src="${c.image}" alt="${c.name}">
          <strong>${escapeHtml(c.name)}</strong>
        `;

        // --- ⚡ LISTE DES LUCKY BLOCKS POUR L'EFFET ---
        const listLucky = ["Brainrot God Lucky Block", "Secret Lucky Block", "Admin Lucky Block"];

        // --- ✨ AJOUT FEU D'ARTIFICE ET FREEZE POUR SECRET OU LUCKY BLOCKS ---
        // 🚩 MODIFICATION ICI : On vérifie aussi que ce n'est pas une récompense BP
        if ((c.rarity === "Secret" || listLucky.includes(c.rarity)) && !window.isBPReward) {
            
            const canvas = document.createElement("canvas");
            canvas.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; pointer-events:none; z-index:20000;";
            document.body.appendChild(canvas);
            const ctx = canvas.getContext("2d");
            canvas.width = window.innerWidth; canvas.height = window.innerHeight;
            const particles = [];
            
            for (let i = 0; i < 150; i++) {
                let hue = listLucky.includes(c.rarity) ? (45 + Math.random() * 15) : (280 + Math.random() * 50);
                
                particles.push({
                    x: canvas.width / 2, y: canvas.height / 2,
                    vx: (Math.random() - 0.5) * 10, vy: (Math.random() - 1.5) * 10,
                    alpha: 1, radius: Math.random() * 3 + 2,
                    color: `hsl(${hue},100%,50%)`
                });
            }
            
            function animateSpecial() {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                particles.forEach((p, i) => {
                    p.x += p.vx; p.y += p.vy; p.alpha -= 0.02;
                    ctx.globalAlpha = p.alpha; ctx.fillStyle = p.color;
                    ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2); ctx.fill();
                    if (p.alpha <= 0) particles.splice(i, 1);
                });
                if (particles.length > 0) requestAnimationFrame(animateSpecial); else canvas.remove();
            }
            animateSpecial();

            // --- BLOCAGE (2.5s) ---
            overlay.removeEventListener('click', overlayClickHandler);
            setTimeout(() => { 
                overlay.addEventListener('click', overlayClickHandler); 
            }, 2500);
        }
    }

    wrapper.appendChild(cardDiv);
    overlay.innerHTML = "";
    overlay.appendChild(wrapper);
    overlay.style.display = "flex";
}

// --- overlayClickHandler ---
function overlayClickHandler() {
    currentCardIndex++;
    showBigCard();
}

// --- openPackSequence ---
function openPackSequence() {
    const chooseArea = document.getElementById("choosePackArea");
    chooseArea.style.display = "flex";
    chooseArea.style.justifyContent = "center";
    chooseArea.style.gap = "30px";
    chooseArea.style.marginTop = "40px";

chooseArea.innerHTML = BOOSTER_IMAGES.map((img, i) =>
     `<div class="booster" data-id="${i}" style="width:150px;height:220px;border-radius:14px;cursor:pointer;overflow:hidden;box-shadow:0 0 15px rgba(0,0,0,0.4);transition: transform 0.15s;">
  <img src="${img}" style="width:100%;height:100%;object-fit:cover;">
        </div>`
    ).join("");

    document.querySelectorAll(".booster").forEach(b => {
        b.onmouseenter = () => b.style.transform = "scale(1.08)";
        b.onmouseleave = () => b.style.transform = "scale(1)";

        b.onclick = () => {
            // 1️⃣ --- 🛡️ DÉTECTION AUTO-CLICKER ---
            const now = Date.now();
            if (typeof lastClickTimestamp !== 'undefined' && lastClickTimestamp !== 0) {
                const delta = now - lastClickTimestamp;
                clickHistory.push(delta);
                if (clickHistory.length > MAX_HISTORY) clickHistory.shift();

                if (clickHistory.length === MAX_HISTORY) {
                    const avg = clickHistory.reduce((a, b) => a + b) / MAX_HISTORY;
                    const variance = clickHistory.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / MAX_HISTORY;
                    const totalDuration = clickHistory.reduce((a, b) => a + b);
                    
                    if (variance < 20 || totalDuration < 1000) { 
                        alert("⚠️ Détection d'auto-clic : Veuillez cliquer normalement.");
                        clickHistory = []; lastClickTimestamp = 0; return;
                    }
                }
            }
            lastClickTimestamp = now;

            // 2️⃣ --- 🛡️ ANTI-SPAM ---
            if (isAnyBoosterOpening) return; 
            
            // 3️⃣ --- 🔊 SON ---
            let playPromise;
            if (isSoundEnabled) {
                soundBooster.currentTime = 0;
                playPromise = soundBooster.play();
            }

            // 4️⃣ --- ⚡ VERROUILLAGE ---
            isAnyBoosterOpening = true;

            (async () => {
                if (playPromise !== undefined) playPromise.catch(e => {});
                if (b.classList.contains("booster-opening")) return;
                b.classList.add("booster-opening");

                const flash = document.createElement("div");
                flash.className = "flash-effect";
                document.body.appendChild(flash);
                setTimeout(() => flash.remove(), 450);

                setTimeout(async () => {
                    chooseArea.style.display = "none";

                    // --- TIRAGE ---
                    currentPack = [pickRandomCard(), pickRandomCard(), pickRandomCard()];
                    
                    const user = firebase.auth().currentUser;
                    let serverLuckyTime = null;
                    let serverLuckyType = "";

                    // --- 🔍 VÉRIFICATION SERVEUR (LUCKY BLOCK) ---
                    if (user) {
                        try {
                            const doc = await db.collection("users").doc(user.uid).get();
                            if (doc.exists) {
                                const data = doc.data();
                                serverLuckyTime = data.luckyBlockUnlockTime || null;
                                serverLuckyType = data.luckyBlockType || "";
                            }
                        } catch (e) { console.error("Erreur check serveur:", e); }
                    }

                    const luckyPower = { 
                        "Mythic Lucky Block": 1, 
                        "Brainrot God Lucky Block": 2, 
                        "Secret Lucky Block": 3, 
                        "Admin Lucky Block": 4 
                    };

                    currentPack.forEach(c => {
                        if (Object.keys(luckyPower).includes(c.rarity)) {
                            let activePower = 0;
                            // Si le serveur dit qu'un bloc est déjà en cours (timer non fini)
                            if (serverLuckyTime && serverLuckyTime > Date.now()) {
                                activePower = luckyPower[serverLuckyType] || 0;
                            }

                            const newPower = luckyPower[c.rarity];

                            // On n'écrase que si le nouveau est plus puissant (ou si rien n'est actif)
                            if (activePower === 0 || newPower > activePower) {
                                let heures = 2;
                                if (c.rarity === "Brainrot God Lucky Block") heures = 6;
                                if (c.rarity === "Secret Lucky Block") heures = 12;
                                if (c.rarity === "Admin Lucky Block") heures = 24;

                                serverLuckyTime = Date.now() + (heures * 60 * 60 * 1000);
                                serverLuckyType = String(c.rarity);
                                
                                // Mise à jour locale pour l'interface
                                luckyBlockUnlockTime = serverLuckyTime;
                                luckyBlockType = serverLuckyType;
                                luckyBlockReady = false;

                                if (typeof updateLuckyTimer === "function") updateLuckyTimer(luckyBlockUnlockTime, luckyBlockType);
                            }
                        } else {
                            // --- LOGIQUE CARTES NORMALES ---
                            if (c.rarity === "Rare") avancerQuete("rare", 1);
                            if (c.rarity === "Mythic") { avancerQuete("mythic", 1); ajouterXP(25); }
                            if (c.rarity === "OG") ajouterXP(500);

                            const existingCard = collection.find(card => card.name === c.name);
                            if (!existingCard) {
                                c.isNew = true; c.level = 1; c.exp = 0;
                                collection.push({ ...c }); ajouterXP(20);
                            } else {
                                c.isNew = false; avancerQuete("duplicate", 1);
                                existingCard.exp = (existingCard.exp || 0) + 1;
                                const expTable = { "Commun": 15, "Rare": 12, "Epic": 10, "Legendary": 7, "Mythic": 4, "Brainrot God": 3, "Secret": 1, "OG": 1 };
                                let needed = expTable[existingCard.rarity] || 10;
                                while (existingCard.exp >= needed) {
                                    existingCard.exp -= needed;
                                    existingCard.level = (existingCard.level || 1) + 1;
                                    if (existingCard.level === 5) avancerQuete("lvlup", 1);
                                }
                                const dustValues = { "Commun": 1, "Rare": 3, "Epic": 8, "Legendary": 20, "Mythic": 50, "Brainrot God": 200, "Secret": 500, "OG": 10000 };
                                dust += dustValues[c.rarity] || 1;
                            }
                        }
                    });

                    // --- SAUVEGARDE FINALE ---
                    avancerQuete("open", 1);
                    ajouterXP(50);

if (typeof hitBoss === "function") {
    // On vérifie si l'event est actif dans les données reçues de Firebase
    if (typeof bossData !== "undefined" && bossData.active === true) {
        hitBoss(); // Retire les 100 PV sur Firebase
        hitBossEffect(); // Fait trembler l'écran
    } else {

    }
}


                    if (typeof window.boostersOpened !== "undefined") window.boostersOpened++;
                    save("collection", collection);
                    save("dust", dust);
                    updateStreak();

                    if (user) {
                        db.collection("users").doc(user.uid).set({
                            collection: collection,
                           dust: dust,
                           xp: xp,

                           streakCount: streakCount || 0,
                          boostersOpened: firebase.firestore.FieldValue.increment(1),
                          lastOpenDate: firebase.firestore.FieldValue.serverTimestamp(),
                          luckyBlockUnlockTime: serverLuckyTime,
                          luckyBlockType: String(serverLuckyType),
                          luckyBlockReady: false

                        }, { merge: true }).then(() => {
                            if (document.getElementById("boosterCounter")) {
                                let cur = parseInt(document.getElementById("boosterCounter").innerText.replace(/\D/g, "")) || 0;
                                document.getElementById("boosterCounter").innerText = `Boosters ouverts : ${cur + 1}`;
                            }
                            if (typeof actualiserProfil === "function") actualiserProfil();
                        });
                    }

                    currentCardIndex = 0;
                    showBigCard();
                    b.classList.remove("booster-opening");
                    isAnyBoosterOpening = false; 
                }, 500); 
            })();
        };
    });
}

// --- pickRandomRarity ---
        function pickRandomRarity() {
            const roll = Math.random() * totalWeight;
            let cumulative = 0;
            for (const [rarity, chance] of Object.entries(RARITY_PROBABILITIES)) {
                cumulative += chance;
                if (roll <= cumulative) return rarity;
            }
            return "Commun";
        }

// --- pickRandomCardWithProbability ---
        function pickRandomCardWithProbability() {
            const chosenRarity = pickRandomRarity();
            const possibleCards = ALL_CARDS.filter(c => c.rarity === chosenRarity);
            const card = possibleCards.length > 0 
                ? possibleCards[Math.floor(Math.random() * possibleCards.length)]
                : ALL_CARDS[Math.floor(Math.random() * ALL_CARDS.length)];

            return { ...card, price: RARITY_PRICES[card.rarity] || 1000 };
        }