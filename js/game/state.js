// js/game/state.js
import { defaultWorld } from './data.js';

const SAVE_KEY = "merchant_save_v2";
const WORLD_KEY = "merchant_world_config_v2";

export let gameState = null;
export let selectedCityId = null;
export let worldData = null;

export function setSelectedCityId(id) {
    selectedCityId = id;
}

const deepClone = (obj) => JSON.parse(JSON.stringify(obj));

export function loadWorldData() {
    const raw = localStorage.getItem(WORLD_KEY);
    if (raw) {
        try {
            const parsed = JSON.parse(raw);
            if (parsed && parsed.villes && parsed.ressources && parsed.routes) {
                console.log("Custom world configuration loaded.");
                worldData = parsed;
                return;
            }
        } catch (e) {
            console.error("Failed to load world configuration, using default.", e);
        }
    }
    console.log("Using default world configuration.");
    worldData = defaultWorld;
}

function randomCityId() {
    const keys = Object.keys(worldData.villes);
    return keys[Math.floor(Math.random() * keys.length)];
}

function computeReduction(level) {
    return Math.min(0.5, level * 0.02);
}

export function createNewGameState() {
    const startCityId = randomCityId();
    const cargaison = {};
    Object.keys(worldData.ressources).forEach(resId => cargaison[resId] = 0);

    const joueur = {
        nom: "Marchand",
        villeActuelle: startCityId,
        or: 1000,
        cargaison,
        niveau: 1,
        xp: 0,
        reductionVoyage: 0,
    };
    joueur.reductionVoyage = computeReduction(joueur.niveau);

    gameState = {
        ressources: deepClone(worldData.ressources),
        villes: deepClone(worldData.villes),
        routes: deepClone(worldData.routes),
        joueur,
        voyage: null,
    };
    selectedCityId = gameState.joueur.villeActuelle;
}

export function saveGame(showMsg = true) {
    if (!gameState) return;
    localStorage.setItem(SAVE_KEY, JSON.stringify(gameState));
    if (showMsg) {
        // This function will need to be imported from ui.js
        console.log("Partie sauvegardée.");
    }
}

export function loadGameFromStorage() {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    try {
        const state = JSON.parse(raw);
        if (state.voyage) {
            const v = state.voyage;
            const now = Date.now();
            if (!v.startTime || !v.tempsTotal || isNaN(v.startTime) || isNaN(v.tempsTotal)) {
                if (v.arrivee && state.joueur) state.joueur.villeActuelle = v.arrivee;
                state.voyage = null;
            } else {
                const elapsed = now - v.startTime;
                if (elapsed >= v.tempsTotal) {
                    if (v.arrivee && state.joueur) state.joueur.villeActuelle = v.arrivee;
                    state.voyage = null;
                }
            }
        }
        if (!state.joueur) return null;
        if (!state.joueur.niveau) state.joueur.niveau = 1;
        state.joueur.reductionVoyage = computeReduction(state.joueur.niveau);

        gameState = state;
        selectedCityId = gameState.joueur.villeActuelle;
        return state;
    } catch (e) {
        console.error("Error loading game:", e);
        return null;
    }
}

export function getGameState() {
    return gameState;
}
