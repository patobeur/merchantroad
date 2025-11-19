// js/editor/renderer.js
import { worldConfig, selectedCityName, setSelectedCityName } from "./state.js";
import { clearElement, ensureCityStocksFollowResources, recalcRoutes, showMessage } from "./utils.js";

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

	Object.entries(worldConfig.villes).forEach(([name, ville]) => {
		const cx = (ville.x + 0.5) * cellW;
		const cy = (ville.y + 0.5) * cellH;
		const radius = Math.min(cellW, cellH) * 0.35;

		const color = ville.couleur || "#ffd54f";
		ctx.beginPath();
		ctx.arc(cx, cy, radius, 0, Math.PI * 2);
		ctx.fillStyle = color;
		ctx.fill();

		if (name === selectedCityName) {
			ctx.lineWidth = 3;
			ctx.strokeStyle = "#4fc3f7";
			ctx.stroke();
		}

		ctx.fillStyle = "#000";
		ctx.font = `${Math.round(radius)}px system-ui`;
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		ctx.fillText(name[0] || "?", cx, cy);
	});
}

function renderCitiesPanel() {
	const listDiv = document.getElementById("cities-list");
	const formContainer = document.getElementById("city-form-container");
	clearElement(listDiv);
	clearElement(formContainer);

	const names = Object.keys(worldConfig.villes);
	names.forEach((name) => {
		const pill = document.createElement("button");
		pill.className = "city-pill";
		pill.type = "button";
		pill.textContent = name;
		if (name === selectedCityName) pill.classList.add("selected");
		pill.addEventListener("click", () => {
			setSelectedCityName(name);
			renderAll();
		});
		listDiv.appendChild(pill);
	});

	if (!selectedCityName || !worldConfig.villes[selectedCityName]) {
		const info = document.createElement("div");
		info.textContent = "Sélectionnez une ville pour la modifier.";
		formContainer.appendChild(info);
		return;
	}

	const ville = worldConfig.villes[selectedCityName];

	const title = document.createElement("h3");
	title.textContent = `Édition : ${selectedCityName}`;
	formContainer.appendChild(title);

	const labelName = document.createElement("label");
	labelName.textContent = "Nom de la ville";
	const inputName = document.createElement("input");
	inputName.type = "text";
	inputName.value = selectedCityName;
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
		if (!newName || newName === selectedCityName) {
			inputName.value = selectedCityName;
			return;
		}
		if (worldConfig.villes[newName]) {
			showMessage("Une ville porte déjà ce nom.");
			inputName.value = selectedCityName;
			return;
		}
		worldConfig.villes[newName] = worldConfig.villes[selectedCityName];
		delete worldConfig.villes[selectedCityName];

		const routes = worldConfig.routes || {};
		routes[newName] = routes[selectedCityName] || {};
		delete routes[selectedCityName];
		Object.keys(routes).forEach((other) => {
			if (routes[other][selectedCityName]) {
				routes[other][newName] = routes[other][selectedCityName];
				delete routes[other][selectedCityName];
			}
		});

		setSelectedCityName(newName);
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
		if (!confirm(`Supprimer la ville "${selectedCityName}" ?`)) return;
		delete worldConfig.villes[selectedCityName];
		if (worldConfig.routes) {
			delete worldConfig.routes[selectedCityName];
			Object.keys(worldConfig.routes).forEach((other) => {
				if (worldConfig.routes[other][selectedCityName]) {
					delete worldConfig.routes[other][selectedCityName];
				}
			});
		}
		const remaining = Object.keys(worldConfig.villes);
		setSelectedCityName(remaining[0] || null);
		recalcRoutes();
		renderAll();
		showMessage("Ville supprimée.");
	});
}

function renderResourcesPanel() {
	const listDiv = document.getElementById("resources-list");
	clearElement(listDiv);

	worldConfig.ressources.forEach((res, index) => {
		const row = document.createElement("div");
		row.className = "resource-row";

		const input = document.createElement("input");
		input.type = "text";
		input.value = res;

		const btnUp = document.createElement("button");
		btnUp.type = "button";
		btnUp.textContent = "↑";

		const btnDown = document.createElement("button");
		btnDown.type = "button";
		btnDown.textContent = "↓";

		const btnDel = document.createElement("button");
		btnDel.type = "button";
		btnDel.textContent = "X";
		btnDel.style.background = "#b71c1c";

		row.appendChild(input);
		row.appendChild(btnUp);
		row.appendChild(btnDown);
		row.appendChild(btnDel);

		listDiv.appendChild(row);

		input.addEventListener("change", () => {
			const newName = input.value.trim();
			if (!newName) {
				input.value = res;
				return;
			}
			if (newName === res) return;

			if (worldConfig.ressources.includes(newName)) {
				showMessage("Cette ressource existe déjà.");
				input.value = res;
				return;
			}

			worldConfig.ressources[index] = newName;
			Object.values(worldConfig.villes).forEach((ville) => {
				if (!ville.stocks) ville.stocks = {};
				if (ville.stocks[newName]) return;
				if (ville.stocks[res]) {
					ville.stocks[newName] = ville.stocks[res];
					delete ville.stocks[res];
				} else {
					ville.stocks[newName] = { quantite: 0, prix: 10 };
				}
			});
			renderCitiesPanel();
		});

		btnUp.addEventListener("click", () => {
			if (index === 0) return;
			const arr = worldConfig.ressources;
			const tmp = arr[index - 1];
			arr[index - 1] = arr[index];
			arr[index] = tmp;
			renderResourcesPanel();
		});

		btnDown.addEventListener("click", () => {
			const arr = worldConfig.ressources;
			if (index >= arr.length - 1) return;
			const tmp = arr[index + 1];
			arr[index + 1] = arr[index];
			arr[index] = tmp;
			renderResourcesPanel();
		});

		btnDel.addEventListener("click", () => {
			if (!confirm(`Supprimer la ressource "${res}" ?`)) return;
			worldConfig.ressources.splice(index, 1);
			Object.values(worldConfig.villes).forEach((ville) => {
				if (ville.stocks && ville.stocks[res]) {
					delete ville.stocks[res];
				}
			});
			renderResourcesPanel();
			renderCitiesPanel();
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
