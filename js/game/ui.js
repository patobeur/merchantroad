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
    renderTradePanel();
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
    const isCurrent = cityName === gameState.joueur.villeActuelle;
    const h3 = document.createElement("h3");
    h3.textContent = isCurrent ? `${cityName} (ville actuelle)` : cityName;
    container.appendChild(h3);

    const table = document.createElement("table");
    const thead = document.createElement("thead");
    const trHead = document.createElement("tr");
    const thRes = document.createElement("th");
    thRes.textContent = "Ressource";
    const thQ = document.createElement("th");
    thQ.textContent = "Quantité";
    const thP = document.createElement("th");
    thP.textContent = "Prix d'achat";
    trHead.appendChild(thRes);
    trHead.appendChild(thQ);
    trHead.appendChild(thP);
    thead.appendChild(trHead);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");

    gameState.ressources.forEach(res => {
        const info = ville.stocks[res];
        if (!info) return;
        const tr = document.createElement("tr");
        const tdRes = document.createElement("td");
        const tdQ = document.createElement("td");
        const tdP = document.createElement("td");
        tdRes.textContent = res;
        tdQ.textContent = info.quantite.toLocaleString("fr-FR");
        tdP.textContent = info.prix.toLocaleString("fr-FR");
        tr.appendChild(tdRes);
        tr.appendChild(tdQ);
        tr.appendChild(tdP);
        tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    container.appendChild(table);
}

function renderTradePanel() {
    const tradeDiv = document.getElementById("trade-content");
    clearElement(tradeDiv);
    const j = gameState.joueur;
    const canTrade = !gameState.voyage;

    const p = document.createElement("p");
    p.textContent = `Vous pouvez commercer uniquement dans ${j.villeActuelle}.`;
    tradeDiv.appendChild(p);

    const form = document.createElement("form");
    form.id = "trade-form";
    form.addEventListener("submit", (event) => event.preventDefault());

    // Choix ressource
    const groupRes = document.createElement("div");
    const labelRes = document.createElement("label");
    labelRes.setAttribute("for", "trade-resource");
    labelRes.textContent = "Ressource";
    const selectRes = document.createElement("select");
    selectRes.id = "trade-resource";
    gameState.ressources.forEach(r => {
        const opt = document.createElement("option");
        opt.value = r;
        opt.textContent = r;
        selectRes.appendChild(opt);
    });
    groupRes.appendChild(labelRes);
    groupRes.appendChild(selectRes);

    // Quantité
    const groupQty = document.createElement("div");
    const labelQty = document.createElement("label");
    labelQty.setAttribute("for", "trade-quantity");
    labelQty.textContent = "Quantité";
    const inputQty = document.createElement("input");
    inputQty.type = "number";
    inputQty.id = "trade-quantity";
    inputQty.min = "1";
    inputQty.value = "1";
    groupQty.appendChild(labelQty);
    groupQty.appendChild(inputQty);

    // Bouton acheter
    const groupBuy = document.createElement("div");
    const btnBuy = document.createElement("button");
    btnBuy.id = "btn-acheter";
    btnBuy.type = "button";
    btnBuy.textContent = "Acheter";
    groupBuy.appendChild(btnBuy);

    // Bouton vendre
    const groupSell = document.createElement("div");
    const btnSell = document.createElement("button");
    btnSell.id = "btn-vendre";
    btnSell.type = "button";
    btnSell.textContent = "Vendre";
    groupSell.appendChild(btnSell);

    form.appendChild(groupRes);
    form.appendChild(groupQty);
    form.appendChild(groupBuy);
    form.appendChild(groupSell);
    tradeDiv.appendChild(form);

    const hint = document.createElement("small");
    hint.id = "trade-hint";
    tradeDiv.appendChild(hint);

    function updateHint() {
        const res = selectRes.value;
        const qty = Number(inputQty.value) || 0;
        const ville = gameState.villes[j.villeActuelle];
        const info = ville.stocks[res];
        const prix = info.prix;
        const total = prix * qty;
        const stockVille = info.quantite;
        const cargo = j.cargaison[res] || 0;
        hint.textContent =
            `Prix unitaire : ${prix.toLocaleString("fr-FR")} | ` +
            `Coût total (achat) : ${total.toLocaleString("fr-FR")} | ` +
            `Stock ville : ${stockVille.toLocaleString("fr-FR")} | ` +
            `Vous : ${cargo}`;
    }

    selectRes.addEventListener("change", updateHint);
    inputQty.addEventListener("input", updateHint);
    updateHint();

    btnBuy.addEventListener("click", () => {
        doTrade("buy", selectRes.value, inputQty.value);
    });
    btnSell.addEventListener("click", () => {
        doTrade("sell", selectRes.value, inputQty.value);
    });

    if (!canTrade) {
        const controls = tradeDiv.querySelectorAll(
            "input, select, button"
        );
        controls.forEach(el => (el.disabled = true));
        hint.textContent = "Impossible de commercer pendant un voyage.";
    }
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
