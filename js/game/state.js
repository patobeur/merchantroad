// js/game/state.js
import { defaultWorld } from './data.js';

const API_URL = 'php/api.php';
const WORLD_KEY = "merchant_world_config_v1";

export let gameState = null;
export let selectedCityName = null;

export function setSelectedCityName(name) {
    selectedCityName = name;
}

// Deep clone utility
const deepClone = (obj) => JSON.parse(JSON.stringify(obj));

// Load world data from localStorage or use default (This can remain as is, as it's for world configuration)
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
export async function saveGame() {
    if (!gameState) return;
    try {
        const response = await fetch(`${API_URL}?action=save_game`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(gameState),
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        console.log('Game saved:', result);
    } catch (error) {
        console.error('Error saving game:', error);
    }
}

export async function loadGameFromStorage(id) {
    try {
        const response = await fetch(`${API_URL}?action=load_game&id=${id}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const state = await response.json();

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
    } catch (error) {
        console.error('Error loading game:', error);
        return null;
    }
}

export async function listSaves() {
    try {
        const response = await fetch(`${API_URL}?action=list_saves`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const saves = await response.json();
        return saves;
    } catch (error) {
        console.error('Error listing saves:', error);
        return [];
    }
}

export async function deleteSave(id) {
    try {
        const response = await fetch(`${API_URL}?action=delete_save`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `id=${id}`,
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        console.log('Save deleted:', result);
    } catch (error) {
        console.error('Error deleting save:', error);
    }
}
