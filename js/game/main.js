// js/game/main.js
import { gameState, createNewGameState, saveGame, loadWorldData, setSelectedCityName, listSaves, deleteSave } from './state.js';
import { renderAll, showMessage, showTravelOverlay, hideTravelOverlay, updateTravelProgress, showLoadGameModal, hideLoadGameModal, showSaveGameModal, hideSaveGameModal, setTheme, applySavedTheme, showAuthScreen, showStartScreen, showGameScreenUI, toggleDayNight } from './ui.js';
import { register, login, logout, getStatus } from './api.js';

let travelIntervalId = null;
let worldData = null; // To store loaded world data
let currentUserName = null;

// Helper to get the standardized name for the autosave slot
function getAutosaveSlotName() {
    return `${currentUserName}_1`;
}

// --- Core Game Logic (largely unchanged) ---

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

    saveGame(getAutosaveSlotName()).then(() => console.log("Autosave complete."));
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

    gameState.voyage = {
        depart: from,
        arrivee: destination,
        tempsTotal: route.temps,
        startTime: Date.now(),
    };

    saveGame(getAutosaveSlotName()).then(() => console.log("Travel started, saved."));
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
    saveGame(getAutosaveSlotName()).then(() => showMessage(`Arrivé à ${v.arrivee}.`));
    renderAll();
}

export function showGameScreen() {
    renderAll();
    if (gameState.voyage) {
        showTravelOverlay();
        if (travelIntervalId) clearInterval(travelIntervalId);
        travelIntervalId = setInterval(updateTravelProgress, 100);
    }
}

// --- Application Initialization ---

document.addEventListener("DOMContentLoaded", async () => {
    applySavedTheme();
    worldData = loadWorldData();
    setupEventListeners();

    const status = await getStatus();
    if (status.loggedIn) {
        currentUserName = status.user_name;
        showStartScreen(status.user_name);
        const saves = await listSaves();
        document.getElementById("start-load-game").disabled = saves.length === 0;
    } else {
        showAuthScreen();
    }
});

function setupEventListeners() {
    // --- Auth Forms ---
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('register-form').addEventListener('submit', handleRegister);
    document.getElementById('show-register').addEventListener('click', toggleAuthForms);
    document.getElementById('show-login').addEventListener('click', toggleAuthForms);
    document.getElementById('btn-logout').addEventListener('click', handleLogout);

    // --- Theme Logic ---
    document.getElementById("theme-default").addEventListener("click", () => setTheme('default'));
    document.getElementById("theme-space").addEventListener("click", () => setTheme('space'));
    document.getElementById("theme-toggle-day-night").addEventListener("click", () => toggleDayNight());

    // --- Start Screen Logic ---
    document.getElementById("start-new-game").addEventListener("click", handleNewGame);
    document.getElementById("start-load-game").addEventListener("click", showLoadGameModal);

    // --- In-Game Menu Logic ---
    document.getElementById("btn-new-game").addEventListener("click", () => {
        if (confirm("Êtes-vous sûr ? Votre partie actuelle sera écrasée par la nouvelle sauvegarde.")) {
            handleNewGame();
        }
    });
    document.getElementById("btn-load-game").addEventListener("click", showLoadGameModal);
    document.getElementById("btn-save-game").addEventListener("click", () => showSaveGameModal(currentUserName));
    document.getElementById("btn-reset-save").addEventListener("click", handleResetSaves);


    // --- Modal Logic ---
    const loadModal = document.getElementById("load-game-modal");
    loadModal.querySelector(".close-button").addEventListener("click", hideLoadGameModal);

    const saveModal = document.getElementById("save-game-modal");
    saveModal.querySelector(".close-button").addEventListener("click", hideSaveGameModal);

    window.addEventListener("click", (event) => {
        if (event.target === loadModal) hideLoadGameModal();
        if (event.target === saveModal) hideSaveGameModal();
    });
}

// --- Event Handlers ---

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const result = await login(email, password);
    if (result.success) {
        currentUserName = result.user_name;
        showMessage('Connexion réussie !');
        showStartScreen(result.user_name);
        const saves = await listSaves();
        document.getElementById("start-load-game").disabled = saves.length === 0;
    } else {
        showMessage(result.message || 'Erreur de connexion.');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const result = await register(name, email, password);
    if (result.success) {
        showMessage('Inscription réussie ! Vous pouvez maintenant vous connecter.');
        toggleAuthForms(); // Switch to login form
    } else {
        showMessage(result.message || 'Erreur d\'inscription.');
    }
}

async function handleLogout() {
    await logout();
    showMessage('Vous avez été déconnecté.');
    window.location.reload();
}

async function handleNewGame() {
    createNewGameState(worldData);
    // A new game always populates the autosave slot.
    await saveGame(getAutosaveSlotName());
    const status = await getStatus();
    showGameScreenUI(status.user_name);
    showGameScreen();
}

async function handleResetSaves() {
    if (confirm("Êtes-vous sûr de vouloir effacer TOUTES vos sauvegardes sur le serveur ?")) {
        const saves = await listSaves();
        for (const save of saves) {
            await deleteSave(save.save_name);
        }
        showMessage("Toutes les sauvegardes ont été effacées.");
        document.getElementById("start-load-game").disabled = true;
    }
}

function toggleAuthForms(e) {
    if (e) e.preventDefault();
    document.getElementById('login-form-container').classList.toggle('hidden');
    document.getElementById('register-form-container').classList.toggle('hidden');
}
