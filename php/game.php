<?php
// php/game.php

require_once __DIR__ . '/database.php';
require_once __DIR__ . '/auth.php';

// Helper function to get IDs from names to avoid repetitive code
function getIdsFromNames($pdo, $table, $names) {
    if (empty($names)) return [];
    $placeholders = implode(',', array_fill(0, count($names), '?'));
    $stmt = $pdo->prepare("SELECT nom, id FROM $table WHERE nom IN ($placeholders)");
    $stmt->execute($names);
    return $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
}

function saveGameData($saveName, $gameState) {
    if (!isLoggedIn()) {
        return ['success' => false, 'message' => 'User not logged in.'];
    }

    $userId = getCurrentUserId();
    $pdo = getDbConnection();

    try {
        $pdo->beginTransaction();

        // 1. Get IDs for villes and ressources
        $villeNames = array_keys($gameState['villes']);
        $ressourceNames = $gameState['ressources'];

        $villeIds = getIdsFromNames($pdo, 'mr_villes', $villeNames);
        $ressourceIds = getIdsFromNames($pdo, 'mr_ressources', $ressourceNames);

        $villeActuelleId = $villeIds[$gameState['joueur']['villeActuelle']] ?? null;

        // 2. Enforce save limit: check for existing save and count total saves.
        $stmt = $pdo->prepare("SELECT id FROM mr_saves WHERE user_id = ? AND save_name = ?");
        $stmt->execute([$userId, $saveName]);
        $existingSave = $stmt->fetch();

        if (!$existingSave) {
            // This is a new save slot. Check if the user is at their limit.
            $stmt = $pdo->prepare("SELECT count(id) FROM mr_saves WHERE user_id = ?");
            $stmt->execute([$userId]);
            $saveCount = $stmt->fetchColumn();
            if ($saveCount >= 3) {
                $pdo->rollBack();
                return ['success' => false, 'message' => 'You have reached the maximum of 3 save slots.'];
            }
        }

        // 3. Upsert the save data
        $saveId = null;
        if ($existingSave) {
            $saveId = $existingSave['id'];
            // Clear old data for this save
            $pdo->prepare("DELETE FROM mr_stocks WHERE save_id = ?")->execute([$saveId]);
            $pdo->prepare("DELETE FROM mr_cargaisons WHERE save_id = ?")->execute([$saveId]);

            // Update player data in mr_saves
            $stmt = $pdo->prepare(
                "UPDATE mr_saves SET gold = ?, niveau = ?, xp = ?, villeActuelle_id = ? WHERE id = ?"
            );
            $stmt->execute([
                $gameState['joueur']['or'],
                $gameState['joueur']['niveau'],
                $gameState['joueur']['xp'],
                $villeActuelleId,
                $saveId
            ]);

        } else {
            // Insert new save entry
            $stmt = $pdo->prepare(
                "INSERT INTO mr_saves (user_id, save_name, gold, niveau, xp, villeActuelle_id) VALUES (?, ?, ?, ?, ?, ?)"
            );
            $stmt->execute([
                $userId,
                $saveName,
                $gameState['joueur']['or'],
                $gameState['joueur']['niveau'],
                $gameState['joueur']['xp'],
                $villeActuelleId
            ]);
            $saveId = $pdo->lastInsertId();
        }

        // 3. Insert new stocks
        $stmtStock = $pdo->prepare(
            "INSERT INTO mr_stocks (save_id, ville_id, ressource_id, quantite, prix) VALUES (?, ?, ?, ?, ?)"
        );
        foreach ($gameState['villes'] as $villeNom => $villeData) {
            $villeId = $villeIds[$villeNom];
            foreach ($villeData['stocks'] as $ressourceNom => $stockData) {
                if (isset($ressourceIds[$ressourceNom])) {
                    $ressourceId = $ressourceIds[$ressourceNom];
                    $stmtStock->execute([
                        $saveId,
                        $villeId,
                        $ressourceId,
                        $stockData['quantite'],
                        $stockData['prix']
                    ]);
                }
            }
        }

        // 4. Insert new cargaison
        $stmtCargaison = $pdo->prepare(
            "INSERT INTO mr_cargaisons (save_id, ressource_id, quantite) VALUES (?, ?, ?)"
        );
        foreach ($gameState['joueur']['cargaison'] as $ressourceNom => $quantite) {
            if ($quantite > 0 && isset($ressourceIds[$ressourceNom])) {
                $ressourceId = $ressourceIds[$ressourceNom];
                $stmtCargaison->execute([$saveId, $ressourceId, $quantite]);
            }
        }

        $pdo->commit();
        return ['success' => true, 'message' => 'Game saved successfully.'];

    } catch (Exception $e) {
        $pdo->rollBack();
        error_log("Save failed: " . $e->getMessage());
        return ['success' => false, 'message' => 'Failed to save game: ' . $e->getMessage()];
    }
}


function loadGameData($saveName) {
    if (!isLoggedIn()) {
        return ['success' => false, 'message' => 'User not logged in.'];
    }

    $userId = getCurrentUserId();
    $pdo = getDbConnection();

    try {
        // 1. Find the save ID
        $stmt = $pdo->prepare("SELECT id FROM mr_saves WHERE user_id = ? AND save_name = ?");
        $stmt->execute([$userId, $saveName]);
        $save = $stmt->fetch();
        if (!$save) {
            return ['success' => false, 'message' => 'Save not found.'];
        }
        $saveId = $save['id'];

        // 2. Fetch all static data (villes, ressources, routes from defaultWorld logic)
        // For simplicity, we'll fetch them from the DB, assuming setup.php ran.
        // In a more complex app, this could be cached.
        $ressources = $pdo->query("SELECT nom FROM mr_ressources ORDER BY id")->fetchAll(PDO::FETCH_COLUMN);

        // 3. Reconstruct the gameState object
        $gameState = [
            'ressources' => $ressources,
            'villes' => [],
            'routes' => [], // Routes are static, they will be merged from client-side data.
            'joueur' => [],
            'voyage' => null // Voyage is transient and not saved in the normalized schema.
        ];

        // 4. Fetch player data
        $stmt = $pdo->prepare(
            "SELECT s.gold, s.niveau, s.xp, v.nom as villeActuelle_nom
             FROM mr_saves s
             JOIN mr_villes v ON s.villeActuelle_id = v.id
             WHERE s.id = ?"
        );
        $stmt->execute([$saveId]);
        $playerData = $stmt->fetch(PDO::FETCH_ASSOC);

        $gameState['joueur'] = [
            'nom' => $_SESSION['user_name'], // Get user name from session
            'villeActuelle' => $playerData['villeActuelle_nom'],
            'or' => (int)$playerData['gold'],
            'niveau' => (int)$playerData['niveau'],
            'xp' => (int)$playerData['xp'],
            'cargaison' => [],
            'reductionVoyage' => 0 // This will be calculated on the client
        ];

        // 5. Fetch player's cargaison
        $stmt = $pdo->prepare(
            "SELECT r.nom, c.quantite
             FROM mr_cargaisons c
             JOIN mr_ressources r ON c.ressource_id = r.id
             WHERE c.save_id = ?"
        );
        $stmt->execute([$saveId]);
        $cargaisonData = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
        // Ensure all resources are present in the cargaison map
        $gameState['joueur']['cargaison'] = array_merge(array_fill_keys($ressources, 0), $cargaisonData);


        // 6. Fetch all city stocks for this save
        $stmt = $pdo->prepare(
            "SELECT v.nom as ville_nom, r.nom as ressource_nom, s.quantite, s.prix
             FROM mr_stocks s
             JOIN mr_villes v ON s.ville_id = v.id
             JOIN mr_ressources r ON s.ressource_id = r.id
             WHERE s.save_id = ?"
        );
        $stmt->execute([$saveId]);
        $stocksData = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Initialize all villes with empty stock lists
        $villesNoms = $pdo->query("SELECT nom FROM mr_villes")->fetchAll(PDO::FETCH_COLUMN);
        foreach ($villesNoms as $villeNom) {
            $gameState['villes'][$villeNom] = ['stocks' => []];
        }

        foreach ($stocksData as $stock) {
            $gameState['villes'][$stock['ville_nom']]['stocks'][$stock['ressource_nom']] = [
                'quantite' => (int)$stock['quantite'],
                'prix' => (int)$stock['prix']
            ];
        }

        return ['success' => true, 'data' => $gameState];

    } catch (Exception $e) {
        error_log("Load failed: " . $e->getMessage());
        return ['success' => false, 'message' => 'Failed to load game: ' . $e->getMessage()];
    }
}


function listSavesForCurrentUser() {
    if (!isLoggedIn()) {
        return ['success' => false, 'message' => 'User not logged in.'];
    }

    $userId = getCurrentUserId();
    $pdo = getDbConnection();

    $stmt = $pdo->prepare("SELECT save_name, updated_at FROM mr_saves WHERE user_id = ? ORDER BY updated_at DESC");
    $stmt->execute([$userId]);
    $saves = $stmt->fetchAll(PDO::FETCH_ASSOC);

    return ['success' => true, 'data' => $saves];
}

function deleteSaveData($saveName) {
    if (!isLoggedIn()) {
        return ['success' => false, 'message' => 'User not logged in.'];
    }

    $userId = getCurrentUserId();
    $pdo = getDbConnection();

    // The save and its related data will be deleted via cascading foreign keys.
    $stmt = $pdo->prepare("DELETE FROM mr_saves WHERE user_id = ? AND save_name = ?");
    $success = $stmt->execute([$userId, $saveName]);

    return ['success' => $success];
}
