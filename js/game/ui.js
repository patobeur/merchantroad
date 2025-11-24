// js/game/ui.js
import { gameState, selectedCityName, setSelectedCityName, listSaves, loadGame, deleteSave } from "./state.js";
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
	setTimeout(() => bar.classList.remove("visible"), 3000);
}

// --- Screen Management ---
export function showAuthScreen() {
    document.getElementById('auth-screen').classList.remove('hidden');
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.add('hidden');
    document.getElementById('user-info').classList.add('hidden');
}

export function showStartScreen(userName) {
    document.getElementById('auth-screen').classList.add('hidden');
    document.getElementById('start-screen').classList.remove('hidden');
    document.getElementById('game-screen').classList.add('hidden');
    updateUserInfo(userName);
}

export function showGameScreenUI(userName) {
    document.getElementById('auth-screen').classList.add('hidden');
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
    updateUserInfo(userName);
}

function updateUserInfo(userName) {
    const userInfo = document.getElementById('user-info');
    if (userName) {
        document.getElementById('user-name-display').textContent = `Bonjour, ${userName}`;
        userInfo.classList.remove('hidden');
    } else {
        userInfo.classList.add('hidden');
    }
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
			sellAllBtn.classList.add("hidden");
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

	Object.keys(routesFrom).forEach((dest) => {
		const route = routesFrom[dest];
		const wrap = document.createElement("div");
		wrap.className = "travel-item";

		const strong = document.createElement("strong");
		strong.textContent = dest;
		wrap.appendChild(strong);

		const tempsSec = (route.temps / 1000).toFixed(1);
		const coutBase = route.cout;
		const coutReel = Math.round(coutBase * (1 - j.reductionVoyage));

		wrap.appendChild(document.createElement("div")).textContent = `Temps : ${tempsSec} s`;
		wrap.appendChild(document.createElement("div")).textContent = `Coût : ${coutReel.toLocaleString("fr-FR")} or`;

		const btnTravel = document.createElement("button");
		btnTravel.textContent = "Voyager";
		btnTravel.dataset.dest = dest;
		if (isTraveling) btnTravel.disabled = true;
		btnTravel.addEventListener("click", () => startTravel(dest));

        const btnPrices = document.createElement("button");
        btnPrices.textContent = "Voir les prix";
        btnPrices.addEventListener("click", () => {
            setSelectedCityName(dest);
            renderCityDetails(dest);
        });

		wrap.appendChild(btnTravel);
        wrap.appendChild(btnPrices);
		panel.appendChild(wrap);
	});
}

export function showTravelOverlay() {
	document.getElementById("travel-overlay").classList.remove("hidden");
	updateTravelProgress();
}

export function hideTravelOverlay() {
	document.getElementById("travel-overlay").classList.add("hidden");
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
	ratio = Math.max(0, Math.min(1, ratio));

	const bar = document.getElementById("travel-progress");
	if (bar) bar.style.width = ratio * 100 + "%";
	const text = document.getElementById("travel-text");
	if (text) text.textContent = `Voyage de ${v.depart} vers ${v.arrivee}: ${Math.round(ratio * 100)}%`;

	if (ratio >= 1) {
		if (travelIntervalId) clearInterval(travelIntervalId);
		travelIntervalId = null;
		finishTravel();
	}
}

export async function renderSaveList() {
    const container = document.getElementById("save-list-container");
    clearElement(container);
    const saves = await listSaves();

    if (saves.length === 0) {
        container.textContent = "Aucune sauvegarde trouvée.";
        return;
    }

    saves.forEach((save) => {
        const item = document.createElement("div");
        item.className = "save-item";

        const info = document.createElement("div");
        info.className = "save-item-info";
        const date = new Date(save.updated_at).toLocaleString("fr-FR");
        info.textContent = `${save.save_name} - ${date}`;
        item.appendChild(info);

        const actions = document.createElement("div");
        actions.className = "save-item-actions";

        const btnLoad = document.createElement("button");
        btnLoad.textContent = "Charger";
        btnLoad.addEventListener("click", async () => {
            if (await loadGame(save.save_name)) {
                hideLoadGameModal();
                const userName = document.getElementById('user-name-display').textContent.replace('Bonjour, ', '');
                showGameScreenUI(userName);
                showGameScreen();
            }
        });
        actions.appendChild(btnLoad);

        const btnDelete = document.createElement("button");
        btnDelete.textContent = "Effacer";
        btnDelete.addEventListener("click", async () => {
            if (confirm("Êtes-vous sûr de vouloir effacer cette sauvegarde ?")) {
                await deleteSave(save.save_name);
                renderSaveList(); // Refresh the list
            }
        });
        actions.appendChild(btnDelete);

        item.appendChild(actions);
        container.appendChild(item);
    });
}

export async function showLoadGameModal() {
	await renderSaveList();
	document.getElementById("load-game-modal").classList.remove("hidden");
}

export function hideLoadGameModal() {
	document.getElementById("load-game-modal").classList.add("hidden");
}

async function renderSaveSlots(userName) {
    const container = document.getElementById("save-slot-container");
    clearElement(container);
    const saves = await listSaves();
    const saveMap = new Map(saves.map(s => [s.save_name, s]));

    for (let i = 1; i <= 3; i++) {
        const slotName = `${userName}_${i}`;
        const save = saveMap.get(slotName);

        const item = document.createElement("div");
        item.className = "save-item";

        const info = document.createElement("div");
        info.className = "save-item-info";

        let slotLabel = `Emplacement ${i}`;
        if (i === 1) slotLabel += " (Auto-Save)";

        if (save) {
            const date = new Date(save.updated_at).toLocaleString("fr-FR");
            info.textContent = `${slotLabel}: ${date}`;
        } else {
            info.textContent = `${slotLabel}: Vide`;
        }
        item.appendChild(info);

        const actions = document.createElement("div");
        actions.className = "save-item-actions";

        const btnSave = document.createElement("button");
        btnSave.textContent = "Sauvegarder ici";
        btnSave.addEventListener("click", async () => {
            await saveGame(slotName);
            showMessage(`Partie sauvegardée dans l'emplacement ${i}.`);
            hideSaveGameModal();
        });
        actions.appendChild(btnSave);
        item.appendChild(actions);
        container.appendChild(item);
    }
}

export async function showSaveGameModal(userName) {
    await renderSaveSlots(userName);
    document.getElementById("save-game-modal").classList.remove("hidden");
}

export function hideSaveGameModal() {
    document.getElementById("save-game-modal").classList.add("hidden");
}

export function setTheme(theme) {
	const body = document.body;
	localStorage.setItem('selectedTheme', theme);
	body.className = ''; // Reset classes

	if (theme === 'space') {
		body.classList.add('space-theme');
		if (localStorage.getItem('dayMode') === 'true') {
			body.classList.add('day-mode');
		}
	}
}

export function toggleDayNight() {
	const body = document.body;
	if (body.classList.contains('space-theme')) {
		body.classList.toggle('day-mode');
		localStorage.setItem('dayMode', body.classList.contains('day-mode'));
	}
}

export function applySavedTheme() {
	const savedTheme = localStorage.getItem("selectedTheme") || 'default';
	setTheme(savedTheme);
}
