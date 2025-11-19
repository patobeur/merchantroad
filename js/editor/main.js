// js/editor/main.js
import { worldConfig, loadWorldConfig, saveWorldConfig, setSelectedCityName, getUniqueCityName, createDefaultWorldConfig } from './config.js';
import { renderMap, handleCanvasClick } from './map.js';
import { renderAll, showMessage } from './ui.js';

function calcDistance(a, b) {
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

function ensureCityStocksFollowResources() {
    const resList = worldConfig.ressources;
    const resSet = new Set(resList);
    Object.values(worldConfig.villes).forEach((ville) => {
        if (!ville.stocks) ville.stocks = {};
        resList.forEach((r) => {
            if (!ville.stocks[r]) {
                ville.stocks[r] = { quantite: 0, prix: 10 };
            }
        });
        Object.keys(ville.stocks).forEach((key) => {
            if (!resSet.has(key)) {
                delete ville.stocks[key];
            }
        });
    });
}

function onCitySelect(cityName) {
    setSelectedCityName(cityName);
    renderAll();
}

function onCityMove(gx, gy) {
    const ville = worldConfig.villes[selectedCityName];
    ville.x = gx;
    ville.y = gy;
    showMessage(`Ville déplacée en (${gx}, ${gy}).`);
    recalcRoutes();
    renderAll();
}

function setupEventListeners() {
    document.getElementById("map-canvas").addEventListener("click", (evt) => handleCanvasClick(evt, onCitySelect, onCityMove));

    document.getElementById("btn-new-config").addEventListener("click", () => {
        if (confirm("Créer une nouvelle configuration et écraser la précédente ?")) {
            worldConfig = createDefaultWorldConfig();
            recalcRoutes();
            setSelectedCityName(Object.keys(worldConfig.villes)[0] || null);
            renderAll();
            showMessage("Nouvelle configuration créée.");
        }
    });

    document.getElementById("btn-load-config").addEventListener("click", () => {
        loadWorldConfig();
        if (!worldConfig.routes) recalcRoutes();
        setSelectedCityName(Object.keys(worldConfig.villes)[0] || null);
        renderAll();
        showMessage("Configuration chargée.");
    });

    document.getElementById("btn-save-config").addEventListener("click", () => saveWorldConfig(true));

    document.getElementById("btn-export-config").addEventListener("click", () => {
        const blob = new Blob([JSON.stringify(worldConfig, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "merchant_world_config.json";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    document.getElementById("btn-add-city").addEventListener("click", () => {
        const name = getUniqueCityName("NouvelleVille");
        const meta = worldConfig.meta;
        worldConfig.villes[name] = { x: Math.floor(meta.gridWidth / 2), y: Math.floor(meta.gridHeight / 2), couleur: "#ffffff", stocks: {} };
        setSelectedCityName(name);
        ensureCityStocksFollowResources();
        recalcRoutes();
        renderAll();
        showMessage("Ville ajoutée.");
    });

    document.getElementById("btn-add-resource").addEventListener("click", () => {
        let idx = worldConfig.ressources.length + 1;
        let name = "Ressource_" + idx;
        while (worldConfig.ressources.includes(name)) {
            idx++;
            name = "Ressource_" + idx;
        }
        worldConfig.ressources.push(name);
        ensureCityStocksFollowResources();
        renderAll();
    });

    document.getElementById("btn-recalc-routes").addEventListener("click", () => {
        recalcRoutes();
        showMessage("Routes recalculées.");
    });
}

document.addEventListener("DOMContentLoaded", () => {
    loadWorldConfig();
    if (!worldConfig.routes || Object.keys(worldConfig.routes).length === 0) {
        recalcRoutes();
    }
    setSelectedCityName(Object.keys(worldConfig.villes)[0] || null);

    setupEventListeners();
    ensureCityStocksFollowResources();
    renderAll();
});
