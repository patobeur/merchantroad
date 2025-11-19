// js/editor/main.js
import { createDefaultWorldConfig } from "./config.js";
import { renderAll } from "./renderer.js";
import {
	worldConfig,
	setWorldConfig,
	setSelectedCityId,
	loadWorldConfig,
	saveWorldConfig,
} from "./state.js";
import {
	recalcRoutes,
	generateUniqueId,
    getUniqueName,
	ensureCityStocksFollowResources,
	showMessage,
	handleCanvasClick,
} from "./utils.js";

function setupTopButtons() {
	const btnNew = document.getElementById("btn-new-config");
	const btnLoad = document.getElementById("btn-load-config");
	const btnSave = document.getElementById("btn-save-config");
	const btnExport = document.getElementById("btn-export-config");
	const btnAddCity = document.getElementById("btn-add-city");
	const btnAddRes = document.getElementById("btn-add-resource");
	const btnRecalcRoutes = document.getElementById("btn-recalc-routes");

	btnNew.addEventListener("click", () => {
		if (
			!confirm(
				"Créer une nouvelle configuration et écraser la précédente ?"
			)
		)
			return;
		setWorldConfig(createDefaultWorldConfig());
		recalcRoutes();
		setSelectedCityId(Object.keys(worldConfig.villes)[0] || null);
		renderAll();
		showMessage("Nouvelle configuration créée.");
	});

	btnLoad.addEventListener("click", () => {
		const cfg = loadWorldConfig();
		if (!cfg) {
			showMessage(
				"Aucune configuration trouvée, création d'un monde par défaut."
			);
			setWorldConfig(createDefaultWorldConfig());
		} else {
			setWorldConfig(cfg);
			if (!worldConfig.meta) {
				worldConfig.meta = {
					gridWidth: 32,
					gridHeight: 20,
					distanceTimeFactor: 400,
					distanceCostFactor: 2,
				};
			}
		}
		if (!worldConfig.routes) {
			recalcRoutes();
		}
		setSelectedCityId(Object.keys(worldConfig.villes)[0] || null);
		renderAll();
		showMessage("Configuration chargée.");
	});

	btnSave.addEventListener("click", () => {
		saveWorldConfig(true);
        showMessage("Configuration sauvegardée.");
	});

	btnExport.addEventListener("click", () => {
		const blob = new Blob([JSON.stringify(worldConfig, null, 2)], {
			type: "application/json",
		});
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "merchant_world_config.json";
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	});

	btnAddCity.addEventListener("click", () => {
        const id = generateUniqueId("ville");
        const name = getUniqueName("NouvelleVille", worldConfig.villes);
		const meta = worldConfig.meta;
		const newCity = {
            id,
            name,
			x: Math.floor(meta.gridWidth / 2),
			y: Math.floor(meta.gridHeight / 2),
			couleur: "#ffffff",
			stocks: {},
		};
		worldConfig.villes[id] = newCity;
		setSelectedCityId(id);
		ensureCityStocksFollowResources();
		recalcRoutes();
		renderAll();
		showMessage("Ville ajoutée.");
	});

	btnAddRes.addEventListener("click", () => {
        const id = generateUniqueId("res");
        const name = getUniqueName("Ressource", worldConfig.ressources);
		worldConfig.ressources[id] = { id, name };
		ensureCityStocksFollowResources();
		renderAll();
        showMessage("Ressource ajoutée.");
	});

	btnRecalcRoutes.addEventListener("click", () => {
		recalcRoutes();
		showMessage("Routes recalculées.");
	});
}

document.addEventListener("DOMContentLoaded", () => {
	setWorldConfig(loadWorldConfig() || createDefaultWorldConfig());
	if (!worldConfig.meta) {
		worldConfig.meta = {
			gridWidth: 32,
			gridHeight: 20,
			distanceTimeFactor: 400,
			distanceCostFactor: 2,
		};
	}
	if (!worldConfig.routes || Object.keys(worldConfig.routes).length === 0) {
		recalcRoutes();
	}
	setSelectedCityId(Object.keys(worldConfig.villes)[0] || null);

	setupTopButtons();

	const canvas = document.getElementById("map-canvas");
	canvas.addEventListener("click", handleCanvasClick);

	renderAll();
});
