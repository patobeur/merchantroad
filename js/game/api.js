// js/game/api.js

const API_BASE = 'php/api.php';

async function apiCall(action, params = {}, method = 'GET') {
    let url = `${API_BASE}?action=${action}`;
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
        },
    };

    if (method === 'GET' && Object.keys(params).length > 0) {
        url += '&' + new URLSearchParams(params).toString();
    } else if (method === 'POST') {
        options.body = JSON.stringify(params);
    }

    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('API call failed:', error);
        return { success: false, message: 'API call failed.' };
    }
}

// --- Auth Functions ---
export const register = (name, email, password) => apiCall('register', { name, email, password }, 'POST');
export const login = (email, password) => apiCall('login', { email, password }, 'POST');
export const logout = () => apiCall('logout', 'POST');
export const getStatus = () => apiCall('status');

// --- Game Functions ---
export const saveGame = (saveName, gameData) => apiCall('save_game', { save_name: saveName, game_data: gameData }, 'POST');
export const loadGame = (saveName) => apiCall('load_game', { save_name: saveName });
export const listSaves = () => apiCall('list_saves');
export const deleteSave = (saveName) => apiCall('delete_save', { save_name: saveName }, 'POST');
