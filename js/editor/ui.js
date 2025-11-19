// js/editor/ui.js
import { worldConfig, selectedCityName, setSelectedCityName, getUniqueCityName } from './config.js';
import { renderMap } from './map.js';
import { recalcRoutes } from './main.js';

function clearElement(el) {
    if (el) el.textContent = "";
}

export function showMessage(text) {
    const bar = document.getElementById("message-bar");
    bar.textContent = text;
    bar.classList.add("visible");
    setTimeout(() => bar.classList.remove("visible"), 1800);
}

export function renderAll() {
    renderCitiesPanel();
    renderResourcesPanel();
    renderRoutesMeta();
    renderMap();
}

function renderCitiesPanel() {
    const listDiv = document.getElementById("cities-list");
    const formContainer = document.getElementById("city-form-container");
    clearElement(listDiv);
    clearElement(formContainer);

    Object.keys(worldConfig.villes).forEach(name => {
        const pill = document.createElement("button");
        pill.className = "city-pill";
        pill.textContent = name;
        if (name === selectedCityName) pill.classList.add("selected");
        pill.addEventListener("click", () => {
            setSelectedCityName(name);
            renderAll();
        });
        listDiv.appendChild(pill);
    });

    if (!selectedCityName || !worldConfig.villes[selectedCityName]) {
        formContainer.textContent = "Sélectionnez une ville pour la modifier.";
        return;
    }

    const ville = worldConfig.villes[selectedCityName];

    const title = document.createElement("h3");
    title.textContent = `Édition : ${selectedCityName}`;
    formContainer.appendChild(title);

    // Name, Position, Color inputs...
    // Delete button...
    // Event listeners for all inputs and buttons...
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
        // ... event listener for input change

        const btnUp = document.createElement("button");
        // ... event listener for up button
        const btnDown = document.createElement("button");
        // ... event listener for down button
        const btnDel = document.createElement("button");
        // ... event listener for delete button

        row.appendChild(input);
        row.appendChild(btnUp);
        row.appendChild(btnDown);
        row.appendChild(btnDel);

        listDiv.appendChild(row);
    });
}

function renderRoutesMeta() {
    const container = document.getElementById("routes-meta");
    clearElement(container);
    // ... logic for rendering the grid width/height and other meta inputs
    // ... with their event listeners
}
