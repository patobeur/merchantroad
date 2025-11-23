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

// Load world data from localStorage or use default (remains unchanged)
export function loadWorldData() {
    const raw = localStorage.getItem(WORLD_KEY);
    if (raw) {
        try {
            const parsed = JSON.parse(raw);
            if (parsed && parsed.villes && parsed.ressources && parsed.routes) {
                return parsed;
            }
        } catch (e) { console.error("Failed to load world config", e); }
    }
    return defaultWorld;
}

function computeReduction(level) {
    return Math.min(0.5, level * 0.02);
}

// --- Modified Functions ---

// Creates a new game state OBJECT, but doesn't save it yet.
export function createNewGameStateObject(worldData) {
    const startCity = Object.keys(worldData.villes)[0];
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
        save_id: null, // save_id will be set on the first save
        ressources: worldData.ressources.slice(),
        villes: deepClone(worldData.villes),
        routes: deepClone(worldData.routes),
        joueur,
        voyage: null,
    };
    selectedCityName = gameState.joueur.villeActuelle;
    return gameState;
}

export async function saveGame() {
    if (!gameState) return;
    try {
        const response = await fetch(`${API_URL}?action=save_game`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(gameState),
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const result = await response.json();
        if (result.save_id) {
            gameState.save_id = result.save_id; // Update the save_id on the client
        }
        console.log('Game saved:', result);
    } catch (error) {
        console.error('Error saving game:', error);
    }
}

export async function loadGameFromStorage(id) {
    try {
        const response = await fetch(`${API_URL}?action=load_game&id=${id}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const state = await response.json();

        // The loaded state needs to be complemented with static data
        const worldData = loadWorldData();
        state.ressources = worldData.ressources.slice();
        state.routes = deepClone(worldData.routes);

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
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error('Error listing saves:', error);
        return [];
    }
}

export async function deleteSave(id) {
    try {
        const response = await fetch(`${API_URL}?action=delete_save`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: id }),
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        console.log('Save deleted:', await response.json());
    } catch (error) {
        console.error('Error deleting save:', error);
    }
}
