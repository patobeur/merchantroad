// js/game/main.js
import { gameState, createNewGameState, saveGame, loadGameFromStorage, loadWorldData, setSelectedCityName, listSaves, deleteSave } from './state.js';
import { renderAll, showMessage, showTravelOverlay, hideTravelOverlay, updateTravelProgress, showLoadGameModal, hideLoadGameModal, setTheme, applySavedTheme } from './ui.js';

let travelIntervalId = null;

function computeReduction(level) {
    return Math.min(0.5, level * 0.02);
}

function addXp(amount) {
    const j = gameState.joueur;
    j.xp += amount;
    const oldLevel = j.niveau;
    j.niveau = 1 + Math.floor(j.xp / 100);
    if (j.niveau !== oldLevel) {
        j.reductionVoyage = computeReduction(j.niveau);
        showMessage(`Niveau ${j.niveau} atteint ! Réduction de voyage : ${(j.reductionVoyage * 100).toFixed(0)} %`);
    }
}

export function doTrade(type, res, qtyStr) {
    if (gameState.voyage) {
        showMessage("Vous ne pouvez pas commercer pendant un voyage.");
        return;
    }
    const j = gameState.joueur;
    const ville = gameState.villes[j.villeActuelle];
    const qty = Math.max(1, Number(qtyStr) || 0);
    const info = ville.stocks[res];

    if (!info) {
        showMessage("Ressource inconnue.");
        return;
    }

    if (type === "buy") {
        const totalCost = info.prix * qty;
        if (info.quantite < qty) {
            showMessage("Stock insuffisant dans la ville.");
            return;
        }
        if (j.or < totalCost) {
            showMessage("Vous n'avez pas assez d'or.");
            return;
        }
        info.quantite -= qty;
        j.or -= totalCost;
        j.cargaison[res] = (j.cargaison[res] || 0) + qty;
        addXp(qty);
        showMessage(`Achat de ${qty} ${res}.`);
    } else {
        const cargoQty = j.cargaison[res] || 0;
        if (cargoQty < qty) {
            showMessage("Vous n'avez pas assez de marchandise à vendre.");
            return;
        }
        const totalGain = info.prix * qty;
        info.quantite += qty;
        j.cargaison[res] = cargoQty - qty;
        j.or += totalGain;
        addXp(qty);
        showMessage(`Vente de ${qty} ${res}.`);
    }

    saveGame();
    renderAll();
}

export function startTravel(destination) {
    const j = gameState.joueur;
    const from = j.villeActuelle;
    if (from === destination) return;

    const routesFrom = gameState.routes[from] || {};
    const route = routesFrom[destination];
    if (!route) {
        showMessage("Aucune route disponible.");
        return;
    }
    if (gameState.voyage) {
        showMessage("Un voyage est déjà en cours.");
        return;
    }

    const coutBase = route.cout;
    const coutReel = Math.round(coutBase * (1 - j.reductionVoyage));
    if (j.or < coutReel) {
        showMessage("Pas assez d'or pour ce voyage.");
        return;
    }

    j.or -= coutReel;

    const now = Date.now();
    gameState.voyage = {
        depart: from,
        arrivee: destination,
        tempsTotal: route.temps,
        startTime: now,
    };

    saveGame();
    showTravelOverlay();

    if (travelIntervalId) clearInterval(travelIntervalId);
    travelIntervalId = setInterval(updateTravelProgress, 100);
    renderAll();
}

export function finishTravel() {
    const v = gameState.voyage;
    if (!v) return;
    gameState.joueur.villeActuelle = v.arrivee;
    gameState.voyage = null;
    setSelectedCityName(v.arrivee);
    hideTravelOverlay();
    saveGame();
    showMessage(`Arrivé à ${v.arrivee}.`);
    renderAll();
}

export function showGameScreen() {
    document.getElementById("game-screen").classList.remove("hidden");
    renderAll();
    if (gameState.voyage) {
        showTravelOverlay();
        if (travelIntervalId) clearInterval(travelIntervalId);
        travelIntervalId = setInterval(updateTravelProgress, 100);
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    applySavedTheme();
    const worldData = loadWorldData();

    // --- Theme Logic ---
    document.getElementById("theme-default").addEventListener("click", () => setTheme('default'));
    document.getElementById("theme-space").addEventListener("click", () => setTheme('space'));
    document.getElementById("theme-toggle-day-night").addEventListener("click", () => setTheme('toggle-day-night'));

    // --- Start Screen Logic ---
    const startScreen = document.getElementById("start-screen");
    const startNewGameBtn = document.getElementById("start-new-game");
    const startLoadGameBtn = document.getElementById("start-load-game");

    const saves = await listSaves();
    if (saves.length === 0) {
        startLoadGameBtn.disabled = true;
    }

    startNewGameBtn.addEventListener("click", async () => {
        startScreen.classList.add("hidden");
        createNewGameState(worldData);
        await saveGame();
        showGameScreen();
    });

    startLoadGameBtn.addEventListener("click", () => {
        showLoadGameModal();
    });

    // --- In-Game Menu Logic ---
    document.getElementById("btn-new-game").addEventListener("click", async () => {
        if (confirm("Êtes-vous sûr de vouloir commencer une nouvelle partie ? Votre progression non sauvegardée sera perdue.")) {
            createNewGameState(worldData);
            await saveGame();
            showGameScreen();
        }
    });

    document.getElementById("btn-load-game").addEventListener("click", () => {
        showLoadGameModal();
    });

    document.getElementById("btn-reset-save").addEventListener("click", async () => {
        if (confirm("Êtes-vous sûr de vouloir effacer TOUTES les sauvegardes ? Cette action est irréversible.")) {
            const saves = await listSaves();
            for (const save of saves) {
                await deleteSave(save.id);
            }
            showMessage("Toutes les sauvegardes ont été effacées.");
            window.location.reload(); // Reload to show the start screen
        }
    });

    document.getElementById("btn-save-game").addEventListener("click", async () => {
        await saveGame();
        showMessage("Partie sauvegardée.");
    });

    // --- Modal Logic ---
    const modal = document.getElementById("load-game-modal");
    modal.querySelector(".close-button").addEventListener("click", hideLoadGameModal);
    window.addEventListener("click", (event) => {
        if (event.target === modal) {
            hideLoadGameModal();
        }
    });
});
