// js/game/main.js
import { getGameState, createNewGameState, saveGame, loadGameFromStorage, loadWorldData, setSelectedCityId, worldData } from './state.js';
import { renderAll, showMessage, showTravelOverlay, hideTravelOverlay, updateTravelProgress } from './ui.js';

let travelIntervalId = null;

function computeReduction(level) {
    return Math.min(0.5, level * 0.02);
}

function addXp(amount) {
    const gameState = getGameState();
    const j = gameState.joueur;
    j.xp += amount;
    const oldLevel = j.niveau;
    j.niveau = 1 + Math.floor(j.xp / 100);
    if (j.niveau !== oldLevel) {
        j.reductionVoyage = computeReduction(j.niveau);
        showMessage(`Niveau ${j.niveau} atteint ! Réduction de voyage : ${(j.reductionVoyage * 100).toFixed(0)} %`);
    }
}

export function doTrade(type, resId, qtyStr) {
    const gameState = getGameState();
    if (gameState.voyage) {
        showMessage("Vous ne pouvez pas commercer pendant un voyage.");
        return;
    }
    const j = gameState.joueur;
    const ville = gameState.villes[j.villeActuelle];
    const qty = Math.max(1, Number(qtyStr) || 0);
    const info = ville.stocks[resId];

    if (!info) {
        showMessage("Ressource inconnue.");
        return;
    }
    const resourceName = gameState.ressources[resId].name;

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
        j.cargaison[resId] = (j.cargaison[resId] || 0) + qty;
        addXp(qty);
        showMessage(`Achat de ${qty} ${resourceName}.`);
    } else {
        const cargoQty = j.cargaison[resId] || 0;
        if (cargoQty < qty) {
            showMessage("Vous n'avez pas assez de marchandise à vendre.");
            return;
        }
        const totalGain = info.prix * qty;
        info.quantite += qty;
        j.cargaison[resId] -= qty;
        j.or += totalGain;
        addXp(qty);
        showMessage(`Vente de ${qty} ${resourceName}.`);
    }

    saveGame(false);
    renderAll();
}

export function startTravel(destinationId) {
    const gameState = getGameState();
    const j = gameState.joueur;
    const fromId = j.villeActuelle;
    if (fromId === destinationId) return;

    const routesFrom = gameState.routes[fromId] || {};
    const route = routesFrom[destinationId];
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
        depart: fromId,
        arrivee: destinationId,
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
    const gameState = getGameState();
    const v = gameState.voyage;
    if (!v) return;
    gameState.joueur.villeActuelle = v.arrivee;
    gameState.voyage = null;
    setSelectedCityId(v.arrivee);
    hideTravelOverlay();
    saveGame(false);
    showMessage(`Arrivé à ${gameState.villes[v.arrivee].name}.`);
    renderAll();
}

function showGameScreen() {
    const gameState = getGameState();
    document.getElementById("game-screen").classList.remove("hidden");
    renderAll();
    if (gameState.voyage) {
        showTravelOverlay();
        if (travelIntervalId) clearInterval(travelIntervalId);
        travelIntervalId = setInterval(updateTravelProgress, 100);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    loadWorldData();
    const btnLoad = document.getElementById("btn-load-game");

    if (!localStorage.getItem("merchant_save_v2")) {
        btnLoad.disabled = true;
    }

    document.getElementById("btn-new-game").addEventListener("click", () => {
        createNewGameState();
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
        localStorage.removeItem("merchant_save_v2");
        showMessage("Sauvegarde effacée.");
        btnLoad.disabled = true;
        document.getElementById("game-screen").classList.add("hidden");
    });

    document.getElementById("btn-save-game").addEventListener("click", () => {
        saveGame(true);
        showMessage("Partie sauvegardée.");
    });
});
