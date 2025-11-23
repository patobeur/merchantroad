// js/game/ui.js
import {
	gameState,
	selectedCityName,
	setSelectedCityName,
	listSaves,
	loadGameFromStorage,
	deleteSave,
} from "./state.js";
import { doTrade, startTravel, finishTravel, showGameScreen } from "./main.js";

let travelIntervalId = null;

function clearElement(el) {
	if (el) el.textContent = "";
}

function formatOr(value) {
	return value.toLocaleString("fr-FR", {
		minimumFractionDigits: 0,
		maximumFractionDigits: 2,
	});
}

export function showMessage(text) {
	const bar = document.getElementById("message-bar");
	bar.textContent = text;
	bar.classList.add("visible");
	setTimeout(() => bar.classList.remove("visible"), 2000);
}

export function renderAll() {
	if (!gameState) return;
	if (!selectedCityName || !gameState.villes[selectedCityName]) {
		setSelectedCityName(gameState.joueur.villeActuelle);
	}
	renderPlayerPanel();
	renderCityDetails(selectedCityName);
	renderTravelPanel();
}

function renderPlayerPanel() {
	const j = gameState.joueur;
	const info = document.getElementById("player-info");
	clearElement(info);

	const lines = [
		`Nom : ${j.nom}`,
		`Ville actuelle : ${j.villeActuelle}`,
		`Or : ${formatOr(j.or)}`,
		`Niveau : ${j.niveau}`,
		`XP : ${j.xp}`,
		`Réduction voyage : ${(j.reductionVoyage * 100).toFixed(0)} %`,
	];

	lines.forEach((text) => {
		const div = document.createElement("div");
		div.textContent = text;
		info.appendChild(div);
	});

	const cargoDiv = document.getElementById("cargo-list");
	clearElement(cargoDiv);
	const ul = document.createElement("ul");

	gameState.ressources.forEach((r) => {
		const li = document.createElement("li");
		const q = j.cargaison[r] || 0;
		li.textContent = `${r} : ${q}`;

		const sellAllBtn = document.createElement("button");
		sellAllBtn.textContent = "📈";
		sellAllBtn.className = "sellStock";
		sellAllBtn.title = "Vendre tous le stock";
		sellAllBtn.style.marginLeft = "10px";
		if (q === 0) {
			sellAllBtn.classList = "hidden";
			sellAllBtn.disabled = true;
		}
		sellAllBtn.addEventListener("click", () => {
			if (gameState.voyage) {
				showMessage("Vous ne pouvez pas commercer pendant un voyage.");
				return;
			}
			doTrade("sell", r, q.toString());
		});

		li.appendChild(sellAllBtn);
		ul.appendChild(li);
	});

	cargoDiv.appendChild(ul);
}

function renderCityDetails(cityName) {
	const container = document.getElementById("city-details");
	clearElement(container);
	const ville = gameState.villes[cityName];
	if (!ville) {
		container.textContent = "Ville inconnue.";
		return;
	}

	const j = gameState.joueur;
	const isCurrent = cityName === j.villeActuelle;

	const h3 = document.createElement("h3");
	h3.textContent = isCurrent ? `${cityName} (ville actuelle)` : cityName;
	container.appendChild(h3);

	const table = document.createElement("table");
	const thead = document.createElement("thead");
	const trHead = document.createElement("tr");

	["Ressource", "En stock", "Prix", "Possédé", "Actions"].forEach(
		(headerText) => {
			const th = document.createElement("th");
			th.textContent = headerText;
			trHead.appendChild(th);
		}
	);
	thead.appendChild(trHead);
	table.appendChild(thead);

	const tbody = document.createElement("tbody");
	gameState.ressources.forEach((res) => {
		const info = ville.stocks[res];
		if (!info) return;

		const tr = document.createElement("tr");
		tr.appendChild(document.createElement("td")).textContent = res;
		tr.appendChild(document.createElement("td")).textContent =
			info.quantite.toLocaleString("fr-FR");
		tr.appendChild(document.createElement("td")).textContent =
			info.prix.toLocaleString("fr-FR");
		tr.appendChild(document.createElement("td")).textContent = (
			j.cargaison[res] || 0
		).toLocaleString("fr-FR");

		const tdActions = document.createElement("td");
		const inputQty = document.createElement("input");
		inputQty.type = "number";
		inputQty.min = "1";
		inputQty.value = "1";
		inputQty.style.width = "60px";

		const btnBuy = document.createElement("button");
		btnBuy.textContent = "Acheter";
		btnBuy.addEventListener("click", () =>
			doTrade("buy", res, inputQty.value)
		);

		const btnSell = document.createElement("button");
		btnSell.textContent = "Vendre";
		btnSell.addEventListener("click", () =>
			doTrade("sell", res, inputQty.value)
		);

		const totalCostSpan = document.createElement("span");
		totalCostSpan.style.marginLeft = "10px";
		totalCostSpan.style.fontSize = "0.9em";

		function updateTotalCost() {
			const qty = Number(inputQty.value) || 0;
			const total = qty * info.prix;
			totalCostSpan.textContent = `(${formatOr(total)} or)`;
		}

		function setMaxForBuy() {
			const maxBuyableStock = info.quantite;
			const maxAffordable = info.prix > 0 ? Math.floor(j.or / info.prix) : 0;
			inputQty.max = String(Math.min(maxBuyableStock, maxAffordable));
		}

		function setMaxForSell() {
			inputQty.max = String(j.cargaison[res] || 0);
		}

		inputQty.addEventListener("input", updateTotalCost);
		btnBuy.addEventListener("focus", setMaxForBuy);
		btnSell.addEventListener("focus", setMaxForSell);

		tdActions.appendChild(inputQty);
		tdActions.appendChild(btnBuy);
		tdActions.appendChild(btnSell);
		tdActions.appendChild(totalCostSpan);

		if (!isCurrent || gameState.voyage) {
			inputQty.disabled = true;
			btnBuy.disabled = true;
			btnSell.disabled = true;
		}

		tr.appendChild(tdActions);
		tbody.appendChild(tr);

		updateTotalCost();
		setMaxForBuy();
	});

	table.appendChild(tbody);
	container.appendChild(table);
}

function renderTravelPanel() {
	const panel = document.getElementById("travel-panel-list");
	clearElement(panel);
	const j = gameState.joueur;
	const routesFrom = gameState.routes[j.villeActuelle] || {};
	const isTraveling = !!gameState.voyage;

	// --- Card for Current City ---
	const currentCityWrap = document.createElement("div");
	currentCityWrap.className = "travel-item";

	const currentCityStrong = document.createElement("strong");
	currentCityStrong.textContent = j.villeActuelle;
	currentCityWrap.appendChild(currentCityStrong);

	const currentCityLineTime = document.createElement("div");
	currentCityLineTime.textContent = `Temps : 0 s`;
	const currentCityLineCost = document.createElement("div");
	currentCityLineCost.textContent = `Coût : vous êtes ici`;

	currentCityWrap.appendChild(currentCityLineTime);
	currentCityWrap.appendChild(currentCityLineCost);

	const currentCityLineBtn = document.createElement("div");
	currentCityLineBtn.style.marginTop = ".3rem";
	const currentCityBtnPrices = document.createElement("button");
	currentCityBtnPrices.textContent = "Voir les prix";
	currentCityBtnPrices.addEventListener("click", () => {
		setSelectedCityName(j.villeActuelle);
		renderAll();
	});
	currentCityLineBtn.appendChild(currentCityBtnPrices);
	currentCityWrap.appendChild(currentCityLineBtn);

	panel.appendChild(currentCityWrap);

	// --- Cards for Destinations ---
	const routeNames = Object.keys(routesFrom);
	if (routeNames.length === 0) {
		const div = document.createElement("div");
		div.textContent = "Aucune autre destination depuis cette ville.";
		panel.appendChild(div);
	} else {
		routeNames.forEach((dest) => {
			const route = routesFrom[dest];
			const wrap = document.createElement("div");
			wrap.className = "travel-item";

			const strong = document.createElement("strong");
			strong.textContent = dest;
			wrap.appendChild(strong);

			const tempsSec = (route.temps / 1000).toFixed(1);
			const coutBase = route.cout;
			const coutReel = Math.round(coutBase * (1 - j.reductionVoyage));

			const lineTime = document.createElement("div");
			lineTime.textContent = `Temps : ${tempsSec} s`;
			const lineCost = document.createElement("div");
			lineCost.textContent = `Coût : ${coutReel.toLocaleString(
				"fr-FR"
			)} or (base ${coutBase})`;

			wrap.appendChild(lineTime);
			wrap.appendChild(lineCost);

			const lineBtn = document.createElement("div");
			lineBtn.style.marginTop = ".3rem";

			const btnPrices = document.createElement("button");
			btnPrices.textContent = "Voir les prix";
			btnPrices.addEventListener("click", () => {
				setSelectedCityName(dest);
				renderAll();
			});
			lineBtn.appendChild(btnPrices);

			const btnTravel = document.createElement("button");
			btnTravel.textContent = "Voyager";
			btnTravel.dataset.dest = dest;
			if (isTraveling) btnTravel.disabled = true;
			btnTravel.addEventListener("click", () => {
				startTravel(dest);
			});
			lineBtn.appendChild(btnTravel);

			wrap.appendChild(lineBtn);

			panel.appendChild(wrap);
		});
	}
}

export function showTravelOverlay() {
	const overlay = document.getElementById("travel-overlay");
	overlay.classList.remove("hidden");
	updateTravelProgress();
}

export function hideTravelOverlay() {
	const overlay = document.getElementById("travel-overlay");
	overlay.classList.add("hidden");
	const bar = document.getElementById("travel-progress");
	if (bar) bar.style.width = "0%";
}

export function updateTravelProgress() {
	const v = gameState && gameState.voyage;
	if (!v) {
		hideTravelOverlay();
		if (travelIntervalId) clearInterval(travelIntervalId);
		return;
	}

	const now = Date.now();
	let ratio = (now - v.startTime) / v.tempsTotal;
	if (ratio < 0) ratio = 0;
	if (ratio > 1) ratio = 1;

	const bar = document.getElementById("travel-progress");
	const text = document.getElementById("travel-text");

	if (bar) bar.style.width = ratio * 100 + "%";
	if (text)
		text.textContent = `Voyage de ${v.depart} vers ${
			v.arrivee
		} : ${Math.round(ratio * 100)} %`;

	if (ratio >= 1) {
		if (travelIntervalId) {
			clearInterval(travelIntervalId);
			travelIntervalId = null;
		}
		finishTravel();
	}
}

export function renderSaveList() {
	const container = document.getElementById("save-list-container");
	clearElement(container);
	const saves = listSaves();

	if (saves.length === 0) {
		container.textContent = "Aucune sauvegarde trouvée.";
		return;
	}

	saves
		.sort()
		.reverse()
		.forEach((key) => {
			const item = document.createElement("div");
			item.className = "save-item";

			const info = document.createElement("div");
			info.className = "save-item-info";
			if (key === "merchant_save_v1") {
				info.textContent = "Ancienne sauvegarde (Legacy Save)";
			} else {
				const date = new Date(
					parseInt(key.split("_").pop())
				).toLocaleString("fr-FR");
				info.textContent = `Sauvegarde du ${date}`;
			}
			item.appendChild(info);

			// Load save data to display stats
			const rawData = localStorage.getItem(key);
			if (rawData) {
				try {
					const saveData = JSON.parse(rawData);
					if (saveData && saveData.joueur) {
						const j = saveData.joueur;
						const stats = document.createElement("div");
						stats.className = "save-item-stats";
						stats.textContent = `Or: ${formatOr(j.or)} | Ville: ${
							j.villeActuelle
						} | Niv: ${j.niveau} (XP: ${j.xp})`;
						item.appendChild(stats);
					}
				} catch (e) {
					console.error(
						"Impossible de lire les données de sauvegarde:",
						key,
						e
					);
				}
			}

			const actions = document.createElement("div");
			actions.className = "save-item-actions";

			const btnLoad = document.createElement("button");
			btnLoad.textContent = "Charger";
			btnLoad.addEventListener("click", () => {
				if (loadGameFromStorage(key)) {
					hideStartScreen();
					hideLoadGameModal();
					showGameScreen();
				}
			});
			actions.appendChild(btnLoad);

			const btnDelete = document.createElement("button");
			btnDelete.textContent = "Effacer";
			btnDelete.addEventListener("click", () => {
				if (
					confirm("Êtes-vous sûr de vouloir effacer cette sauvegarde ?")
				) {
					deleteSave(key);
					renderSaveList();
				}
			});
			actions.appendChild(btnDelete);

			item.appendChild(actions);
			container.appendChild(item);
		});
}

export function showLoadGameModal() {
	renderSaveList();
	document.getElementById("load-game-modal").classList.remove("hidden");
}

export function hideLoadGameModal() {
	document.getElementById("load-game-modal").classList.add("hidden");
}

export function hideStartScreen() {
	document.getElementById("start-screen").classList.add("hidden");
}

export function setTheme(theme) {
	const body = document.body;

	if (theme === "default") {
		body.classList.remove("space-theme", "day-mode");
		localStorage.setItem("selectedTheme", "default");
		localStorage.removeItem("dayMode");
	} else if (theme === "space") {
		body.classList.remove("day-mode"); // Always reset to night mode when selecting space theme
		body.classList.add("space-theme");
		localStorage.setItem("selectedTheme", "space");
		localStorage.removeItem("dayMode");
	} else if (theme === "toggle-day-night") {
		if (body.classList.contains("space-theme")) {
			body.classList.toggle("day-mode");
			if (body.classList.contains("day-mode")) {
				localStorage.setItem("dayMode", "true");
			} else {
				localStorage.removeItem("dayMode");
			}
		}
	}
}

export function applySavedTheme() {
	const savedTheme = localStorage.getItem("selectedTheme");
	const dayMode = localStorage.getItem("dayMode");

	if (savedTheme === "space") {
		document.body.classList.add("space-theme");
		if (dayMode === "true") {
			document.body.classList.add("day-mode");
		}
	}
}
