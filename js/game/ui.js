// js/game/ui.js
import { gameState, selectedCityName, setSelectedCityName } from './state.js';
import { doTrade, startTravel, finishTravel } from './main.js';

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
    renderCitiesList();
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

    lines.forEach(text => {
        const div = document.createElement("div");
        div.textContent = text;
        info.appendChild(div);
    });

    const cargoDiv = document.getElementById("cargo-list");
    clearElement(cargoDiv);
    const ul = document.createElement("ul");

    gameState.ressources.forEach(r => {
        const li = document.createElement("li");
        const q = j.cargaison[r] || 0;
        li.textContent = `${r} : ${q}`;

        const sellAllBtn = document.createElement("button");
        sellAllBtn.textContent = "Tout vendre";
        sellAllBtn.style.marginLeft = "10px";
        if (q === 0) {
            sellAllBtn.disabled = true;
        }
        sellAllBtn.addEventListener("click", () => {
            if (gameState.voyage) {
                showMessage("Vous ne pouvez pas commercer pendant un voyage.");
                return;
            }
            doTrade('sell', r, q.toString());
        });

        li.appendChild(sellAllBtn);
        ul.appendChild(li);
    });

    cargoDiv.appendChild(ul);
}

function renderCitiesList() {
    const list = document.getElementById("cities-list");
    clearElement(list);
    const current = gameState.joueur.villeActuelle;

    Object.keys(gameState.villes).forEach(name => {
        const btn = document.createElement("button");
        btn.className = "city-btn";
        btn.textContent = name;
        if (name === current) btn.classList.add("current-city");
        if (name === selectedCityName) btn.classList.add("selected-city");
        btn.addEventListener("click", () => {
            setSelectedCityName(name);
            renderAll();
        });
        list.appendChild(btn);
    });
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

    ["Ressource", "En stock", "Prix", "Possédé", "Actions"].forEach(headerText => {
        const th = document.createElement("th");
        th.textContent = headerText;
        trHead.appendChild(th);
    });
    thead.appendChild(trHead);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    gameState.ressources.forEach(res => {
        const info = ville.stocks[res];
        if (!info) return;

        const tr = document.createElement("tr");

        const tdRes = document.createElement("td");
        tdRes.textContent = res;
        tr.appendChild(tdRes);

        const tdQ = document.createElement("td");
        tdQ.textContent = info.quantite.toLocaleString("fr-FR");
        tr.appendChild(tdQ);

        const tdP = document.createElement("td");
        tdP.textContent = info.prix.toLocaleString("fr-FR");
        tr.appendChild(tdP);

        const tdPlayerQ = document.createElement("td");
        tdPlayerQ.textContent = (j.cargaison[res] || 0).toLocaleString("fr-FR");
        tr.appendChild(tdPlayerQ);

        const tdActions = document.createElement("td");
        const inputQty = document.createElement("input");
        inputQty.type = "number";
        inputQty.min = "1";
        inputQty.value = "1";
        inputQty.style.width = "50px";

        const btnBuy = document.createElement("button");
        btnBuy.textContent = "Acheter";
        btnBuy.addEventListener("click", () => doTrade("buy", res, inputQty.value));

        const btnSell = document.createElement("button");
        btnSell.textContent = "Vendre";
        btnSell.addEventListener("click", () => doTrade("sell", res, inputQty.value));

        tdActions.appendChild(inputQty);
        tdActions.appendChild(btnBuy);
        tdActions.appendChild(btnSell);

        if (!isCurrent || gameState.voyage) {
            inputQty.disabled = true;
            btnBuy.disabled = true;
            btnSell.disabled = true;
        }

        tr.appendChild(tdActions);
        tbody.appendChild(tr);
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

    const routeNames = Object.keys(routesFrom);
    if (routeNames.length === 0) {
        const div = document.createElement("div");
        div.textContent = "Aucune route depuis cette ville.";
        panel.appendChild(div);
        return;
    }

    routeNames.forEach(dest => {
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
        const btn = document.createElement("button");
        btn.textContent = "Voyager";
        btn.dataset.dest = dest;
        if (isTraveling) btn.disabled = true;
        btn.addEventListener("click", () => {
            startTravel(dest);
        });
        lineBtn.appendChild(btn);
        wrap.appendChild(lineBtn);

        panel.appendChild(wrap);
    });
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
    if(bar) bar.style.width = "0%";
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

    if(bar) bar.style.width = ratio * 100 + "%";
    if(text) text.textContent = `Voyage de ${v.depart} vers ${
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
