// js/editor/utils.js
import { worldConfig, selectedCityId, setSelectedCityId } from "./state.js";
import { renderAll } from "./renderer.js";

export function showMessage(text) {
	const bar = document.getElementById("message-bar");
	bar.textContent = text;
	bar.classList.add("visible");
	setTimeout(() => bar.classList.remove("visible"), 1800);
}

export function clearElement(el) {
	el.textContent = "";
}

export function generateUniqueId(prefix) {
	return prefix + "_" + Date.now() + Math.random().toString(36).substring(2, 9);
}

export function getUniqueName(base, collection) {
    const existingNames = new Set(Object.values(collection).map(item => item.name));
    let name = base;
    let idx = 1;
    while (existingNames.has(name)) {
        name = `${base}_${idx}`;
        idx++;
    }
    return name;
}


export function ensureCityStocksFollowResources() {
	const resourceIds = Object.keys(worldConfig.ressources);
	const resourceIdSet = new Set(resourceIds);

	Object.values(worldConfig.villes).forEach((ville) => {
		if (!ville.stocks) {
			ville.stocks = {};
		}
		// Add missing resources
		resourceIds.forEach((resId) => {
			if (!ville.stocks[resId]) {
				ville.stocks[resId] = { quantite: 0, prix: 10 };
			}
		});
		// Remove obsolete resources
		Object.keys(ville.stocks).forEach((key) => {
			if (!resourceIdSet.has(key)) {
				delete ville.stocks[key];
			}
		});
	});
}

export function calcDistance(a, b) {
	const dx = (a.x ?? 0) - (b.x ?? 0);
	const dy = (a.y ?? 0) - (b.y ?? 0);
	return Math.sqrt(dx * dx + dy * dy);
}

export function recalcRoutes() {
	worldConfig.routes = {};
	const cityIds = Object.keys(worldConfig.villes);
	const meta = worldConfig.meta;

	for (let i = 0; i < cityIds.length; i++) {
		for (let j = i + 1; j < cityIds.length; j++) {
			const id1 = cityIds[i];
			const id2 = cityIds[j];
			const v1 = worldConfig.villes[id1];
			const v2 = worldConfig.villes[id2];
			const d = calcDistance(v1, v2);
			const t = Math.round(d * meta.distanceTimeFactor);
			const c = Math.round(d * meta.distanceCostFactor);

			if (!worldConfig.routes[id1]) worldConfig.routes[id1] = {};
			if (!worldConfig.routes[id2]) worldConfig.routes[id2] = {};
			worldConfig.routes[id1][id2] = { temps: t, cout: c };
			worldConfig.routes[id2][id1] = { temps: t, cout: c };
		}
	}
}

export function handleCanvasClick(evt) {
	const canvas = document.getElementById("map-canvas");
	const rect = canvas.getBoundingClientRect();
	const x = evt.clientX - rect.left;
	const y = evt.clientY - rect.top;

	const meta = worldConfig.meta;
	const cellW = canvas.width / meta.gridWidth;
	const cellH = canvas.height / meta.gridHeight;

	const gx = Math.floor(x / cellW);
	const gy = Math.floor(y / cellH);

	let clickedCityId = null;
	for (const [id, ville] of Object.entries(worldConfig.villes)) {
		if (ville.x === gx && ville.y === gy) {
			clickedCityId = id;
			break;
		}
	}

	if (clickedCityId) {
		setSelectedCityId(clickedCityId);
		renderAll();
		return;
	}

	if (selectedCityId) {
		const ville = worldConfig.villes[selectedCityId];
		ville.x = gx;
		ville.y = gy;
		showMessage(`Ville déplacée en (${gx}, ${gy}).`);
		recalcRoutes();
		renderAll();
	}
}
