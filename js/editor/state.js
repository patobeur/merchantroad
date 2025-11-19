// js/editor/state.js
import { WORLD_KEY } from "./config.js";

export let worldConfig = null;
export let selectedCityName = null;

export function setWorldConfig(newConfig) {
	worldConfig = newConfig;
}

export function setSelectedCityName(newName) {
	selectedCityName = newName;
}

export function loadWorldConfig() {
	const raw = localStorage.getItem(WORLD_KEY);
	if (!raw) return null;
	try {
		return JSON.parse(raw);
	} catch (e) {
		console.error("Erreur de parsing config :", e);
		return null;
	}
}

export function saveWorldConfig(show = true) {
	localStorage.setItem(WORLD_KEY, JSON.stringify(worldConfig));
	if (show) {
		// We'll need a UI function for this.
		console.log("Configuration sauvegardée.");
	}
}
