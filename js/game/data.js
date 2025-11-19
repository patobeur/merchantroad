// js/game/data.js

export const defaultWorld = {
    ressources: [
        "Cacao", "Coton", "Pierres précieuses", "Raisins", "Poudre à canon",
        "Métal", "Rations", "Pimenter", "Canne à sucre", "Tabac vieilli",
    ],
    villes: {
        Ville_A: {
            stocks: {
                "Cacao": { quantite: 923, prix: 22 }, "Coton": { quantite: 626, prix: 23 },
                "Pierres précieuses": { quantite: 316, prix: 373 }, "Raisins": { quantite: 490, prix: 30 },
                "Poudre à canon": { quantite: 547, prix: 87 }, "Métal": { quantite: 272, prix: 37 },
                "Rations": { quantite: 737, prix: 44 }, "Pimenter": { quantite: 936, prix: 21 },
                "Canne à sucre": { quantite: 754, prix: 16 }, "Tabac vieilli": { quantite: 408, prix: 78 },
            },
        },
        Ville_B: {
            stocks: {
                "Cacao": { quantite: 575, prix: 29 }, "Coton": { quantite: 569, prix: 24 },
                "Pierres précieuses": { quantite: 385, prix: 364 }, "Raisins": { quantite: 510, prix: 29 },
                "Poudre à canon": { quantite: 502, prix: 89 }, "Métal": { quantite: 695, prix: 32 },
                "Rations": { quantite: 593, prix: 47 }, "Pimenter": { quantite: 812, prix: 26 },
                "Canne à sucre": { quantite: 709, prix: 17 }, "Tabac vieilli": { quantite: 429, prix: 77 },
            },
        },
        Ville_C: {
            stocks: {
                "Cacao": { quantite: 890, prix: 25 }, "Coton": { quantite: 469, prix: 25 },
                "Pierres précieuses": { quantite: 502, prix: 349 }, "Raisins": { quantite: 606, prix: 28 },
                "Poudre à canon": { quantite: 473, prix: 91 }, "Métal": { quantite: 267, prix: 37 },
                "Rations": { quantite: 572, prix: 48 }, "Pimenter": { quantite: 0, prix: 40 },
                "Canne à sucre": { quantite: 734, prix: 17 }, "Tabac vieilli": { quantite: 173, prix: 76 },
            },
        },
        Ville_D: {
            stocks: {
                "Cacao": { quantite: 992, prix: 15 }, "Coton": { quantite: 618, prix: 23 },
                "Pierres précieuses": { quantite: 384, prix: 364 }, "Raisins": { quantite: 552, prix: 29 },
                "Poudre à canon": { quantite: 694, prix: 80 }, "Métal": { quantite: 506, prix: 34 },
                "Rations": { quantite: 533, prix: 49 }, "Pimenter": { quantite: 1638.23, prix: 15 },
                "Canne à sucre": { quantite: 536, prix: 19 }, "Tabac vieilli": { quantite: 510, prix: 73 },
            },
        },
    },
    routes: {
        Ville_A: { Ville_B: { temps: 8000, cout: 40 }, Ville_C: { temps: 12000, cout: 70 }, Ville_D: { temps: 10000, cout: 60 } },
        Ville_B: { Ville_A: { temps: 8000, cout: 40 }, Ville_C: { temps: 7000, cout: 35 }, Ville_D: { temps: 15000, cout: 90 } },
        Ville_C: { Ville_A: { temps: 12000, cout: 70 }, Ville_B: { temps: 7000, cout: 35 }, Ville_D: { temps: 9000, cout: 55 } },
        Ville_D: { Ville_A: { temps: 10000, cout: 60 }, Ville_B: { temps: 15000, cout: 90 }, Ville_C: { temps: 9000, cout: 55 } },
    },
};
