// js/editor/renderer.js
import { worldConfig, selectedCityId, setSelectedCityId } from "./state.js";
import { clearElement, ensureCityStocksFollowResources, recalcRoutes, showMessage, getUniqueName } from "./utils.js";

function renderMap() {
	const canvas = document.getElementById("map-canvas");
	const ctx = canvas.getContext("2d");

	const w = canvas.width;
	const h = canvas.height;
	const meta = worldConfig.meta;
	const cellW = w / meta.gridWidth;
	const cellH = h / meta.gridHeight;

	ctx.fillStyle = "#050709";
	ctx.fillRect(0, 0, w, h);

	ctx.strokeStyle = "#222";
	ctx.lineWidth = 1;
	ctx.beginPath();
	for (let x = 0; x <= meta.gridWidth; x++) {
		const px = x * cellW;
		ctx.moveTo(px, 0);
		ctx.lineTo(px, h);
	}
	for (let y = 0; y <= meta.gridHeight; y++) {
		const py = y * cellH;
		ctx.moveTo(0, py);
		ctx.lineTo(w, py);
	}
	ctx.stroke();

	for (const [id, ville] of Object.entries(worldConfig.villes)) {
		const cx = (ville.x + 0.5) * cellW;
		const cy = (ville.y + 0.5) * cellH;
		const radius = Math.min(cellW, cellH) * 0.35;

		const color = ville.couleur || "#ffd54f";
		ctx.beginPath();
		ctx.arc(cx, cy, radius, 0, Math.PI * 2);
		ctx.fillStyle = color;
		ctx.fill();

		if (id === selectedCityId) {
			ctx.lineWidth = 3;
			ctx.strokeStyle = "#4fc3f7";
			ctx.stroke();
		}

		ctx.fillStyle = "#000";
		ctx.font = `${Math.round(radius)}px system-ui`;
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		ctx.fillText(ville.name[0] || "?", cx, cy);
	}
}

function renderCitiesPanel() {
	const listDiv = document.getElementById("cities-list");
	const formContainer = document.getElementById("city-form-container");
	clearElement(listDiv);
	clearElement(formContainer);

	Object.values(worldConfig.villes).forEach((ville) => {
		const pill = document.createElement("button");
		pill.className = "city-pill";
		pill.type = "button";
		pill.textContent = ville.name;
		if (ville.id === selectedCityId) pill.classList.add("selected");
		pill.addEventListener("click", () => {
			setSelectedCityId(ville.id);
			renderAll();
		});
		listDiv.appendChild(pill);
	});

	if (!selectedCityId || !worldConfig.villes[selectedCityId]) {
		const info = document.createElement("div");
		info.textContent = "Sélectionnez une ville pour la modifier.";
		formContainer.appendChild(info);
		return;
	}

	const ville = worldConfig.villes[selectedCityId];

	const title = document.createElement("h3");
	title.textContent = `Édition : ${ville.name}`;
	formContainer.appendChild(title);

	const labelName = document.createElement("label");
	labelName.textContent = "Nom de la ville";
	const inputName = document.createElement("input");
	inputName.type = "text";
	inputName.value = ville.name;
	formContainer.appendChild(labelName);
	formContainer.appendChild(inputName);

	const posWrap = document.createElement("div");
	posWrap.className = "inline-inputs";

	const labelX = document.createElement("label");
	labelX.textContent = "X";
	const inputX = document.createElement("input");
	inputX.type = "number";
	inputX.value = ville.x ?? 0;
	inputX.min = 0;
	inputX.max = worldConfig.meta.gridWidth - 1;

	const labelY = document.createElement("label");
	labelY.textContent = "Y";
	const inputY = document.createElement("input");
	inputY.type = "number";
	inputY.value = ville.y ?? 0;
	inputY.min = 0;
	inputY.max = worldConfig.meta.gridHeight - 1;

	const wrapX = document.createElement("div");
	wrapX.appendChild(labelX);
	wrapX.appendChild(inputX);
	const wrapY = document.createElement("div");
	wrapY.appendChild(labelY);
	wrapY.appendChild(inputY);
	posWrap.appendChild(wrapX);
	posWrap.appendChild(wrapY);
	formContainer.appendChild(posWrap);

	const labelColor = document.createElement("label");
	labelColor.textContent = "Couleur sur la carte";
	const inputColor = document.createElement("input");
	inputColor.type = "color";
	inputColor.value = ville.couleur || "#ffffff";
	formContainer.appendChild(labelColor);
	formContainer.appendChild(inputColor);

	const btnRow = document.createElement("div");
	btnRow.style.marginTop = ".4rem";
	const btnDelete = document.createElement("button");
	btnDelete.textContent = "Supprimer la ville";
	btnDelete.type = "button";
	btnDelete.style.background = "#b71c1c";

	btnRow.appendChild(btnDelete);
	formContainer.appendChild(btnRow);

	inputName.addEventListener("change", () => {
		const newName = inputName.value.trim();
        if (!newName) {
            inputName.value = ville.name;
            return;
        }

        const isDuplicate = Object.values(worldConfig.villes).some(
            (v) => v.name === newName && v.id !== selectedCityId
        );

		if (isDuplicate) {
			showMessage("Une autre ville porte déjà ce nom.");
			inputName.value = ville.name;
			return;
		}

        ville.name = newName;
		showMessage("Ville renommée.");
		renderAll();
	});

	inputX.addEventListener("change", () => {
		let v = Number(inputX.value);
		if (Number.isNaN(v)) v = 0;
		v = Math.max(0, Math.min(worldConfig.meta.gridWidth - 1, v));
		ville.x = v;
		inputX.value = v;
		recalcRoutes();
		renderMap();
	});

	inputY.addEventListener("change", () => {
		let v = Number(inputY.value);
		if (Number.isNaN(v)) v = 0;
		v = Math.max(0, Math.min(worldConfig.meta.gridHeight - 1, v));
		ville.y = v;
		inputY.value = v;
		recalcRoutes();
		renderMap();
	});

	inputColor.addEventListener("change", () => {
		ville.couleur = inputColor.value;
		renderMap();
	});

	btnDelete.addEventListener("click", () => {
		if (!confirm(`Supprimer la ville "${ville.name}" ?`)) return;

        delete worldConfig.villes[selectedCityId];

        if (worldConfig.routes) {
			delete worldConfig.routes[selectedCityId];
			Object.keys(worldConfig.routes).forEach((other) => {
				if (worldConfig.routes[other][selectedCityId]) {
					delete worldConfig.routes[other][selectedCityId];
				}
			});
		}

		const remainingIds = Object.keys(worldConfig.villes);
		setSelectedCityId(remainingIds[0] || null);
		recalcRoutes();
		renderAll();
		showMessage("Ville supprimée.");
	});
}

function renderResourcesPanel() {
	const listDiv = document.getElementById("resources-list");
	clearElement(listDiv);

	Object.values(worldConfig.ressources).forEach((res) => {
		const row = document.createElement("div");
		row.className = "resource-row";

		const input = document.createElement("input");
		input.type = "text";
		input.value = res.name;

		const btnDel = document.createElement("button");
		btnDel.type = "button";
		btnDel.textContent = "X";
		btnDel.style.background = "#b71c1c";

		row.appendChild(input);
		row.appendChild(btnDel);
		listDiv.appendChild(row);

		input.addEventListener("change", () => {
			const newName = input.value.trim();
            if (!newName) {
                input.value = res.name;
                return;
            }

            const isDuplicate = Object.values(worldConfig.ressources).some(
                r => r.name === newName && r.id !== res.id
            );

			if (isDuplicate) {
				showMessage("Cette ressource existe déjà.");
				input.value = res.name;
				return;
			}

            res.name = newName;
            showMessage("Ressource renommée.");
			renderAll();
		});

		btnDel.addEventListener("click", () => {
			if (!confirm(`Supprimer la ressource "${res.name}" ?`)) return;

            delete worldConfig.ressources[res.id];

			Object.values(worldConfig.villes).forEach((ville) => {
				if (ville.stocks && ville.stocks[res.id]) {
					delete ville.stocks[res.id];
				}
			});

			renderAll();
            showMessage("Ressource supprimée.");
		});
	});
}

function renderRoutesMeta() {
	const container = document.getElementById("routes-meta");
	clearElement(container);
	const meta = worldConfig.meta;

	const gridWrap = document.createElement("div");
	gridWrap.className = "inline-inputs";

	const labelGW = document.createElement("label");
	labelGW.textContent = "Largeur de la grille";
	const inputGW = document.createElement("input");
	inputGW.type = "number";
	inputGW.value = meta.gridWidth;
	inputGW.min = "4";
	inputGW.max = "80";
	const divGW = document.createElement("div");
	divGW.appendChild(labelGW);
	divGW.appendChild(inputGW);

	const labelGH = document.createElement("label");
	labelGH.textContent = "Hauteur de la grille";
	const inputGH = document.createElement("input");
	inputGH.type = "number";
	inputGH.value = meta.gridHeight;
	inputGH.min = "4";
	inputGH.max = "80";
	const divGH = document.createElement("div");
	divGH.appendChild(labelGH);
	divGH.appendChild(inputGH);

	gridWrap.appendChild(divGW);
	gridWrap.appendChild(divGH);
	container.appendChild(gridWrap);

	const timeWrap = document.createElement("div");
	timeWrap.className = "inline-inputs";

	const labelTF = document.createElement("label");
	labelTF.textContent = "Facteur temps (ms / distance)";
	const inputTF = document.createElement("input");
	inputTF.type = "number";
	inputTF.value = meta.distanceTimeFactor;
	inputTF.min = "1";

	const labelCF = document.createElement("label");
	labelCF.textContent = "Facteur coût (or / distance)";
	const inputCF = document.createElement("input");
	inputCF.type = "number";
	inputCF.value = meta.distanceCostFactor;
	inputCF.min = "0";

	const divTF = document.createElement("div");
	divTF.appendChild(labelTF);
	divTF.appendChild(inputTF);
	const divCF = document.createElement("div");
	divCF.appendChild(labelCF);
	divCF.appendChild(inputCF);

	timeWrap.appendChild(divTF);
	timeWrap.appendChild(divCF);
	container.appendChild(timeWrap);

	inputGW.addEventListener("change", () => {
		let v = Number(inputGW.value);
		if (Number.isNaN(v) || v < 4) v = 4;
		if (v > 80) v = 80;
		meta.gridWidth = v;
		inputGW.value = v;
		renderMap();
	});

	inputGH.addEventListener("change", () => {
		let v = Number(inputGH.value);
		if (Number.isNaN(v) || v < 4) v = 4;
		if (v > 80) v = 80;
		meta.gridHeight = v;
		inputGH.value = v;
		renderMap();
	});

	inputTF.addEventListener("change", () => {
		let v = Number(inputTF.value);
		if (Number.isNaN(v) || v < 1) v = 1;
		meta.distanceTimeFactor = v;
		inputTF.value = v;
	});

	inputCF.addEventListener("change", () => {
		let v = Number(inputCF.value);
		if (Number.isNaN(v) || v < 0) v = 0;
		meta.distanceCostFactor = v;
		inputCF.value = v;
	});
}

export function renderAll() {
	ensureCityStocksFollowResources();
	renderMap();
	renderCitiesPanel();
	renderResourcesPanel();
	renderRoutesMeta();
}

export { renderMap, renderCitiesPanel, renderResourcesPanel, renderRoutesMeta };
