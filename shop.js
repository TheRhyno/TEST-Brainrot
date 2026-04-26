// ============================================================
//  shop.js - Boutique quotidienne, timer, génération cartes
// ============================================================

// --- actualiserLeTimer ---
function actualiserLeTimer() {
        const maintenant = new Date();
        const minuit = new Date();
        minuit.setHours(24, 0, 0, 0); // Cible 00:00:00
        
        const difference = minuit - maintenant;

        if (difference <= 0) {
            // Si on arrive à minuit, on rafraîchit pour la nouvelle boutique
            location.reload();
            return;
        }

        // Calcul des heures, minutes, secondes
        const h = Math.floor(difference / 3600000);
        const m = Math.floor((difference % 3600000) / 60000);
        const s = Math.floor((difference % 60000) / 1000);

        // Formatage 00:00:00
        const format = 
            (h < 10 ? "0" + h : h) + ":" + 
            (m < 10 ? "0" + m : m) + ":" + 
            (s < 10 ? "0" + s : s);

        const cible = document.getElementById("boutiqueTimerDecompte");
        if (cible) {
            cible.innerText = format;
        }
    }

// --- showShop ---
function showShop() {
    // 1. Navigation
    homeSection.style.display = "none";
    collectionSection.style.display = "none";
    allCardsSection.style.display = "none";
    shopSection.style.display = "block";
    combatSection.style.display = "none";

    // --- MASQUER LE LUCKY BLOCK & BATTLE PASS (COMME DANS L'ACCUEIL) ---
    const hudBottomRow = document.getElementById("hudBottomRow");
    const speedyMenu = document.getElementById("speedyMenu");
    if (hudBottomRow) hudBottomRow.style.display = "none";
    if (speedyMenu) speedyMenu.style.display = "none";

    // --- AJOUT TRANSITION FLUIDE ---
    shopSection.classList.remove("section-fade");
    void shopSection.offsetWidth; // Force le redémarrage de l'animation
    shopSection.classList.add("section-fade");
    // -------------------------------

    // --- RÉAFFICHER LES BOUTONS CACHÉS EN COMBAT ---
    const accountBtn = document.getElementById("accountBtn");
    const musicBtn = document.getElementById("musicBtn");
    if (accountBtn) accountBtn.style.display = "flex";
    if (musicBtn) musicBtn.style.display = "flex";

    updateButtons();

    const shopDiv = document.getElementById("shopCards");
    if (!shopDiv) return;

    // --- FUSION : CARTES ALÉATOIRES D'ABORD, BOOSTERS EN BAS ---
    const fullShopList = [...shopCards, ...SHOP_CARDS];

    // 2. Génération du HTML
    shopDiv.innerHTML = fullShopList.map(c => {
        const owned = !c.isPack && collection.some(card => card.name === c.name);
        const btnText = owned ? "Possédé" : `Acheter (${c.price}💎)`;
        
        // Style différent pour les boosters (bordure dorée et fond sombre)
        const specialStyle = c.isPack 
            ? 'border: 4px double #ffd700; background: #1a1a1a; box-shadow: 0 0 10px rgba(255,215,0,0.2);' 
            : 'border: 1px solid #444; background: #222;';

        return `
            <div class="card r-${(c.rarity || "Commun").replace(/ /g, "-")}" 
                  style="display: flex; flex-direction: column; justify-content: space-between; min-height: 250px; padding: 12px; border-radius: 12px; ${specialStyle}">
                
                <div style="text-align: center;">
                    <div style="font-size:0.7rem; color: #aaa; font-weight: bold; margin-bottom: 5px; text-transform: uppercase;">${c.rarity}</div>
                    <img src="${c.image}" style="width:100%; height:110px; object-fit:contain; border-radius:8px; margin-bottom: 8px;">
                    <strong style="display:block; font-size:0.9rem; color: #fff; line-height: 1.2;">${c.name}</strong>
                </div>

                <button class="buyBtn" 
                        data-name="${c.name}" 
                        data-price="${c.price}" 
                        style="margin-top:12px; width:100%; padding:10px; border-radius:8px; border:0; background:#7c3aed; color:white; cursor:pointer; font-weight:bold; transition: 0.2s;"
                        ${owned ? "disabled" : ""}>
                    ${btnText}
                </button>
            </div>
        `;
    }).join("");

    // 3. Gestion des clics
    document.querySelectorAll(".buyBtn").forEach(btn => {
        btn.onclick = () => {
            const name = btn.getAttribute("data-name");
            const price = parseInt(btn.getAttribute("data-price"));
            const item = fullShopList.find(i => i.name === name);

            if (item) {
                // --- AJOUT DE LA CONFIRMATION ---
                const message = item.isPack 
                    ? `Voulez-vous acheter le booster "${name}" pour ${price} 💎 ?` 
                    : `Voulez-vous acheter la carte "${name}" pour ${price} 💎 ?`;

                if (!confirm(message)) {
                    return; // On arrête tout si l'utilisateur clique sur "Annuler"
                }
                // --------------------------------

                if (dust >= price) {

playPurchaseSound();

                    dust -= price;
                    save("dust", dust);


const sourceDust = document.getElementById("profileDust");
    if (sourceDust) {
        sourceDust.innerText = dust;
    }
    // On force la synchro immédiate pour le HUD
    if (typeof syncSubwayHUD === "function") {
        syncSubwayHUD();
    }


                    if (item.isPack) {
                        // --- AJOUT QUÊTE BOOSTER ---
                        if (typeof avancerQuete === "function") {
                            avancerQuete("shop_booster", 1);
                        }
                        
                        openSpecialPack(item.packType);
                    } else {
                        collection.push({...item});
                        save("collection", collection);
                        refreshCollection();
                        alert(`✅ Achat réussi : ${name} !`);
                    }
                    
                    // Sync Firebase
                    const user = firebase.auth().currentUser;
                    if (user) {
                        db.collection("users").doc(user.uid).set({ collection, dust }, { merge: true });
                    }
                    showShop(); 
                } else {
                    alert("💎 Pas assez de fragments !");
                }
            }
        };
    });
}

// --- escapeHtml ---
function escapeHtml(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}

// --- cardHTML ---
function cardHTML(c){return `<div class="card"><img src="${c.image}" style="width:100%;height:100px;object-fit:cover;border-radius:8px;margin-bottom:8px"><strong>${escapeHtml(c.name)}</strong><span style="color:#9bb0c8">${escapeHtml(c.rarity)}</span></div>`;}

// --- refreshLimit ---
function refreshLimit(){
  // Plus de limite quotidienne
  const remaining = document.getElementById("remaining");
  if(remaining){
    remaining.textContent = ""; // vide la ligne
  }
  const btn = document.getElementById("openPack");
  if(btn){
    btn.disabled = false; // toujours activé
  }
}

// --- checkDailyShop ---
async function checkDailyShop() {
    const now = new Date();
    // Identifiant unique du jour (ex: "22/03/2026") pour la règle Firestore
    const todayStr = now.toLocaleDateString("fr-FR");
    
    const updateHour = 0; 
    const updateMinute = 0;
    const updateTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), updateHour, updateMinute);

    const userId = auth.currentUser?.uid;
    if (!userId) return;

    // --- CIBLE LE DOCUMENT COMMUN ---
    const docRef = db.collection("globalShop").doc("today");
    
    let docSnap;
    try {
        docSnap = await docRef.get();
    } catch (e) {
        console.error("Erreur Firestore Shop:", e);
        return;
    }

    let shouldUpdate = false;
    let shopCardsFromDb = [];

    if (!docSnap.exists) {
        shouldUpdate = true;
    } else {
        const data = docSnap.data();
        const lastUpdate = data?.lastUpdate ? new Date(data.lastUpdate) : null;
        shopCardsFromDb = data?.cards || [];

        // Condition de mise à jour : 
        // Soit la date texte est différente, soit l'heure de reset est passée
        if (data.dateString !== todayStr || !lastUpdate || (now >= updateTime && lastUpdate < updateTime)) {
            shouldUpdate = true;
        }
    }

    if (shouldUpdate) {
        const RARITY_PRICES = {
            "Commun": 500, "Rare": 800, "Epic": 1500, "Legendary": 3000,
            "Mythic": 7000, "Brainrot God": 12000, "Secret": 27000, "OG": 55000
        };

        const RARITY_PROBABILITIES = {
            "Commun": 1, "Rare": 1, "Epic": 3, "Legendary": 15,
            "Mythic": 20, "Brainrot God": 18, "Secret": 15, "OG": 4
        };

        const totalWeight = Object.values(RARITY_PROBABILITIES).reduce((a, b) => a + b, 0);

        function pickRandomRarity() {
            const roll = Math.random() * totalWeight;
            let cumulative = 0;
            for (const [rarity, chance] of Object.entries(RARITY_PROBABILITIES)) {
                cumulative += chance;
                if (roll <= cumulative) return rarity;
            }
            return "Commun";
        }

        function pickRandomCardWithProbability() {
            const chosenRarity = pickRandomRarity();
            const possibleCards = ALL_CARDS.filter(c => c.rarity === chosenRarity);
            const card = possibleCards.length > 0 
                ? possibleCards[Math.floor(Math.random() * possibleCards.length)]
                : ALL_CARDS[Math.floor(Math.random() * ALL_CARDS.length)];

            return { ...card, price: RARITY_PRICES[card.rarity] || 1000 };
        }

        // --- GÉNÉRATION DES 4 CARTES UNIQUES ---
        const newShop = [];
        let attempts = 0;
        while (newShop.length < 4 && attempts < 50) {
            const candidate = pickRandomCardWithProbability();
            if (!newShop.some(c => c.name === candidate.name)) {
                newShop.push(candidate);
            }
            attempts++;
        }

        // --- TENTATIVE DE SAUVEGARDE COMMUNE ---
        try {
            await docRef.set({
                dateString: todayStr, // CRUCIAL pour tes règles Firestore
                lastUpdate: now.toISOString(),
                cards: newShop
            });
            shopCards = newShop;
            console.log("🏪 Boutique commune mise à jour pour tout le monde !");
        } catch (error) {
            // Si l'écriture échoue (ex: Permission Denied), cela signifie que 
            // quelqu'un a déjà créé la boutique pour aujourd'hui entre-temps.
            console.warn("Boutique déjà mise à jour par un autre joueur ou accès refusé.");
            // On récupère la version qui est sur le serveur pour être raccord
            const finalSnap = await docRef.get();
            if (finalSnap.exists) {
                shopCards = finalSnap.data().cards;
            }
        }
        
    } else {
        shopCards = shopCardsFromDb;

    }

    if (typeof showShop === "function" && isVisible(shopSection)) {
        showShop(); 
    }
}