// js/game/main.js
import { gameState, createNewGameState, saveGame, loadGameFromStorage, loadWorldData, setSelectedCityName } from './state.js';
import { renderAll, showMessage, showTravelOverlay, hideTravelOverlay, updateTravelProgress } from './ui.js';

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

    saveGame(false);
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

    saveGame(false);
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
    saveGame(false);
    showMessage(`Arrivé à ${v.arrivee}.`);
    renderAll();
}

function showGameScreen() {
    document.getElementById("game-screen").classList.remove("hidden");
    renderAll();
    if (gameState.voyage) {
        showTravelOverlay();
        if (travelIntervalId) clearInterval(travelIntervalId);
        travelIntervalId = setInterval(updateTravelProgress, 100);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const worldData = loadWorldData();
    const btnLoad = document.getElementById("btn-load-game");

    if (!localStorage.getItem("merchant_save_v1")) {
        btnLoad.disabled = true;
    }

    document.getElementById("btn-new-game").addEventListener("click", () => {
        createNewGameState(worldData);
        saveGame(false);
        showGameScreen();
        btnLoad.disabled = false;
    });

    btnLoad.addEventListener("click", () => {
        if (loadGameFromStorage()) {
            showGameScreen();
        } else {
            showMessage("Aucune sauvegarde trouvée.");
        }
    });

    document.getElementById("btn-reset-save").addEventListener("click", () => {
        localStorage.removeItem("merchant_save_v1");
        showMessage("Sauvegarde effacée.");
        btnLoad.disabled = true;
        document.getElementById("game-screen").classList.add("hidden");
    });

    document.getElementById("btn-save-game").addEventListener("click", () => {
        saveGame(true);
    });
});
