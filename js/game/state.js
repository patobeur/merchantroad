// js/game/state.js
import { defaultWorld } from './data.js';
import { saveGame as apiSaveGame, loadGame as apiLoadGame, listSaves as apiListSaves, deleteSave as apiDeleteSave } from './api.js';

const WORLD_KEY = "merchant_world_config_v1";

export let gameState = null;
export let selectedCityName = null;

export function setSelectedCityName(name) {
    selectedCityName = name;
}

// Deep clone utility
const deepClone = (obj) => JSON.parse(JSON.stringify(obj));

// Load world data from localStorage or use default
export function loadWorldData() {
    const raw = localStorage.getItem(WORLD_KEY);
    if (raw) {
        try {
            const parsed = JSON.parse(raw);
            if (parsed && parsed.villes && parsed.ressources && parsed.routes) {
                console.log("Custom world configuration loaded.");
                return parsed;
            }
        } catch (e) {
            console.error("Failed to load world configuration, using default.", e);
        }
    }
    console.log("Using default world configuration.");
    return defaultWorld;
}

// Random city name utility
function randomCityName(worldData) {
    const keys = Object.keys(worldData.villes);
    return keys[Math.floor(Math.random() * keys.length)];
}

// Compute travel reduction based on level
function computeReduction(level) {
    return Math.min(0.5, level * 0.02); // 2% per level, max 50%
}

// Create a new game state
export function createNewGameState(worldData) {
    const startCity = randomCityName(worldData);
    const cargaison = {};
    worldData.ressources.forEach((r) => (cargaison[r] = 0));

    const joueur = {
        nom: "Marchand",
        villeActuelle: startCity,
        or: 1000,
        cargaison,
        niveau: 1,
        xp: 0,
        reductionVoyage: 0,
    };
    joueur.reductionVoyage = computeReduction(joueur.niveau);

    gameState = {
        ressources: worldData.ressources.slice(),
        villes: deepClone(worldData.villes),
        routes: deepClone(worldData.routes),
        joueur,
        voyage: null,
    };
    selectedCityName = gameState.joueur.villeActuelle;
}

// Save and Load game state
export async function saveGame(saveName) {
    if (!gameState) return;
    const response = await apiSaveGame(saveName, gameState);
    if (!response.success) {
        console.error("Failed to save game:", response.message);
    }
}

export async function loadGame(saveName) {
    const response = await apiLoadGame(saveName);
    if (response.success && response.data) {
        const state = response.data;
        // Clean up any malformed or finished voyages
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
        selectedCityName = gameState.joueur.villeActuelle;
        return state;
    }
    console.error("Failed to load game:", response.message);
    return null;
}

export async function listSaves() {
    const response = await apiListSaves();
    if (response.success) {
        return response.data;
    }
    console.error("Failed to list saves:", response.message);
    return [];
}

export async function deleteSave(saveName) {
	const response = await apiDeleteSave(saveName);
    if (!response.success) {
        console.error("Failed to delete save:", response.message);
    }
}
