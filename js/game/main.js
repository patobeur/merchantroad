// js/game/main.js
import { gameState, createNewGameStateObject, saveGame, loadGameFromStorage, loadWorldData, setSelectedCityName, listSaves, deleteSave } from './state.js';
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
    if (gameState.voyage) return showMessage("Commerce impossible pendant un voyage.");

    const j = gameState.joueur;
    const ville = gameState.villes[j.villeActuelle];
    const qty = parseInt(qtyStr) || 0;
    if (qty <= 0) return;

    const info = ville.stocks[res];
    if (!info) return showMessage("Ressource inconnue.");

    if (type === "buy") {
        const totalCost = info.prix * qty;
        if (info.quantite < qty) return showMessage("Stock insuffisant.");
        if (j.or < totalCost) return showMessage("Or insuffisant.");

        info.quantite -= qty;
        j.or -= totalCost;
        j.cargaison[res] = (j.cargaison[res] || 0) + qty;
        addXp(qty);
        showMessage(`Achat de ${qty} ${res}.`);
    } else { // sell
        const cargoQty = j.cargaison[res] || 0;
        if (cargoQty < qty) return showMessage("Marchandise insuffisante.");

        const totalGain = info.prix * qty;
        info.quantite += qty;
        j.cargaison[res] -= qty;
        j.or += totalGain;
        addXp(qty);
        showMessage(`Vente de ${qty} ${res}.`);
    }

    saveGame(); // Auto-save after trade
    renderAll();
}

export function startTravel(destination) {
    const j = gameState.joueur;
    const from = j.villeActuelle;
    if (from === destination || gameState.voyage) return;

    const route = gameState.routes[from]?.[destination];
    if (!route) return showMessage("Aucune route disponible.");

    const coutReel = Math.round(route.cout * (1 - j.reductionVoyage));
    if (j.or < coutReel) return showMessage("Or insuffisant pour ce voyage.");

    j.or -= coutReel;
    gameState.voyage = {
        depart: from,
        arrivee: destination,
        tempsTotal: route.temps,
        startTime: Date.now(),
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

async function startNewGame(worldData) {
    document.getElementById("start-screen").classList.add("hidden");
    createNewGameStateObject(worldData);
    await saveGame(); // Initial save to get the save_id
    showGameScreen();
}

document.addEventListener("DOMContentLoaded", async () => {
    applySavedTheme();
    const worldData = loadWorldData();

    document.getElementById("theme-default").addEventListener("click", () => setTheme('default'));
    document.getElementById("theme-space").addEventListener("click", () => setTheme('space'));
    document.getElementById("theme-toggle-day-night").addEventListener("click", () => setTheme('toggle-day-night'));

    const startLoadGameBtn = document.getElementById("start-load-game");
    const saves = await listSaves();
    if (saves.length === 0) {
        startLoadGameBtn.disabled = true;
    }

    document.getElementById("start-new-game").addEventListener("click", () => startNewGame(worldData));
    startLoadGameBtn.addEventListener("click", showLoadGameModal);

    document.getElementById("btn-new-game").addEventListener("click", () => {
        if (confirm("Commencer une nouvelle partie ? La progression non sauvegardée sera perdue.")) {
            startNewGame(worldData);
        }
    });

    document.getElementById("btn-load-game").addEventListener("click", showLoadGameModal);

    document.getElementById("btn-reset-save").addEventListener("click", async () => {
        if (confirm("Effacer TOUTES les sauvegardes ? Action irréversible.")) {
            const saves = await listSaves();
            for (const save of saves) {
                await deleteSave(save.id);
            }
            window.location.reload();
        }
    });

    document.getElementById("btn-save-game").addEventListener("click", async () => {
        await saveGame();
        showMessage("Partie sauvegardée.");
    });

    const modal = document.getElementById("load-game-modal");
    modal.querySelector(".close-button").addEventListener("click", hideLoadGameModal);
    window.addEventListener("click", (event) => {
        if (event.target === modal) hideLoadGameModal();
    });
});
