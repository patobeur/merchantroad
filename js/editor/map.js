// js/editor/map.js
import { worldConfig, selectedCityName } from './config.js';

let canvas, ctx;

function getCanvasAndContext() {
    if (!canvas) {
        canvas = document.getElementById("map-canvas");
        ctx = canvas.getContext("2d");
    }
    return { canvas, ctx };
}

export function renderMap() {
    const { canvas, ctx } = getCanvasAndContext();
    const { meta, villes } = worldConfig;
    const cellW = canvas.width / meta.gridWidth;
    const cellH = canvas.height / meta.gridHeight;

    // Clear and draw background
    ctx.fillStyle = "#050709";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = "#222";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x <= meta.gridWidth; x++) ctx.moveTo(x * cellW, 0); ctx.lineTo(x * cellW, canvas.height);
    for (let y = 0; y <= meta.gridHeight; y++) ctx.moveTo(0, y * cellH); ctx.lineTo(canvas.width, y * cellH);
    ctx.stroke();

    // Draw cities
    Object.entries(villes).forEach(([name, ville]) => {
        const cx = (ville.x + 0.5) * cellW;
        const cy = (ville.y + 0.5) * cellH;
        const radius = Math.min(cellW, cellH) * 0.35;

        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fillStyle = ville.couleur || "#ffd54f";
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

export function handleCanvasClick(evt, onCitySelect, onCityMove) {
    const { canvas } = getCanvasAndContext();
    const rect = canvas.getBoundingClientRect();
    const x = evt.clientX - rect.left;
    const y = evt.clientY - rect.top;
    const { meta, villes } = worldConfig;
    const gx = Math.floor(x / (canvas.width / meta.gridWidth));
    const gy = Math.floor(y / (canvas.height / meta.gridHeight));

    const clickedCity = Object.keys(villes).find(name => villes[name].x === gx && villes[name].y === gy);

    if (clickedCity) {
        onCitySelect(clickedCity);
    } else if (selectedCityName) {
        onCityMove(gx, gy);
    }
}
