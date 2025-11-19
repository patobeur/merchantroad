// js/editor/utils.js

import { worldConfig, selectedCityName, setSelectedCityName } from "./state.js";
import { renderAll, renderMap, renderCitiesPanel, renderResourcesPanel } from "./renderer.js";


export function showMessage(text) {
    const bar = document.getElementById("message-bar");
    bar.textContent = text;
    bar.classList.add("visible");
    setTimeout(() => bar.classList.remove("visible"), 1800);
}

export function clearElement(el) {
    el.textContent = "";
}

export function ensureCityStocksFollowResources() {
    const resList = worldConfig.ressources;
    const resSet = new Set(resList);
    Object.values(worldConfig.villes).forEach((ville) => {
        if (!ville.stocks) ville.stocks = {};
        // Ajouter manquantes
        resList.forEach((r) => {
            if (!ville.stocks[r]) {
                ville.stocks[r] = { quantite: 0, prix: 10 };
            }
        });
        // Supprimer celles qui ne sont plus dans la liste
        Object.keys(ville.stocks).forEach((key) => {
            if (!resSet.has(key)) {
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
    const names = Object.keys(worldConfig.villes);
    const meta = worldConfig.meta;
    for (let i = 0; i < names.length; i++) {
        for (let j = i + 1; j < names.length; j++) {
            const n1 = names[i];
            const n2 = names[j];
            const v1 = worldConfig.villes[n1];
            const v2 = worldConfig.villes[n2];
            const d = calcDistance(v1, v2);
            const t = Math.round(d * meta.distanceTimeFactor);
            const c = Math.round(d * meta.distanceCostFactor);

            if (!worldConfig.routes[n1]) worldConfig.routes[n1] = {};
            if (!worldConfig.routes[n2]) worldConfig.routes[n2] = {};
            worldConfig.routes[n1][n2] = { temps: t, cout: c };
            worldConfig.routes[n2][n1] = { temps: t, cout: c };
        }
    }
}

export function getUniqueCityName(base) {
    let idx = 1;
    let name = base;
    while (worldConfig.villes[name]) {
        idx++;
        name = base + "_" + idx;
    }
    return name;
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

    // si on clique sur une ville -> sélection
    let clickedCity = null;
    Object.entries(worldConfig.villes).forEach(([name, ville]) => {
        if (ville.x === gx && ville.y === gy) {
            clickedCity = name;
        }
    });

    if (clickedCity) {
        setSelectedCityName(clickedCity);
        renderAll();
        return;
    }

    // si une ville est sélectionnée -> déplacer cette ville
    if (selectedCityName) {
        const ville = worldConfig.villes[selectedCityName];
        ville.x = gx;
        ville.y = gy;
        showMessage(`Ville déplacée en (${gx}, ${gy}).`);
        recalcRoutes();
        renderAll();
    }
}
