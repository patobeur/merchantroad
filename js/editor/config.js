// js/editor/config.js

export const WORLD_KEY = "merchant_world_config_v1";

export function createDefaultWorldConfig() {
	return {
		ressources: [
			"Cacao",
			"Coton",
			"Pierres précieuses",
			"Raisins",
			"Poudre à canon",
			"Métal",
			"Rations",
			"Pimenter",
			"Canne à sucre",
			"Tabac vieilli",
		],
		villes: {
			Ville_A: {
				x: 5,
				y: 5,
				couleur: "#ffcc00",
				stocks: {
					Cacao: { quantite: 923, prix: 22 },
					Coton: { quantite: 626, prix: 23 },
					"Pierres précieuses": { quantite: 316, prix: 373 },
					Raisins: { quantite: 490, prix: 30 },
					"Poudre à canon": { quantite: 547, prix: 87 },
					Métal: { quantite: 272, prix: 37 },
					Rations: { quantite: 737, prix: 44 },
					Pimenter: { quantite: 936, prix: 21 },
					"Canne à sucre": { quantite: 754, prix: 16 },
					"Tabac vieilli": { quantite: 408, prix: 78 },
				},
			},
			Ville_B: {
				x: 20,
				y: 7,
				couleur: "#4fc3f7",
				stocks: {
					Cacao: { quantite: 575, prix: 29 },
					Coton: { quantite: 569, prix: 24 },
					"Pierres précieuses": { quantite: 385, prix: 364 },
					Raisins: { quantite: 510, prix: 29 },
					"Poudre à canon": { quantite: 502, prix: 89 },
					Métal: { quantite: 695, prix: 32 },
					Rations: { quantite: 593, prix: 47 },
					Pimenter: { quantite: 812, prix: 26 },
					"Canne à sucre": { quantite: 709, prix: 17 },
					"Tabac vieilli": { quantite: 429, prix: 77 },
				},
			},
			Ville_C: {
				x: 10,
				y: 15,
				couleur: "#81c784",
				stocks: {
					Cacao: { quantite: 890, prix: 25 },
					Coton: { quantite: 469, prix: 25 },
					"Pierres précieuses": { quantite: 502, prix: 349 },
					Raisins: { quantite: 606, prix: 28 },
					"Poudre à canon": { quantite: 473, prix: 91 },
					Métal: { quantite: 267, prix: 37 },
					Rations: { quantite: 572, prix: 48 },
					Pimenter: { quantite: 0, prix: 40 },
					"Canne à sucre": { quantite: 734, prix: 17 },
					"Tabac vieilli": { quantite: 173, prix: 76 },
				},
			},
			Ville_D: {
				x: 25,
				y: 18,
				couleur: "#ff8a65",
				stocks: {
					Cacao: { quantite: 992, prix: 15 },
					Coton: { quantite: 618, prix: 23 },
					"Pierres précieuses": { quantite: 384, prix: 364 },
					Raisins: { quantite: 552, prix: 29 },
					"Poudre à canon": { quantite: 694, prix: 80 },
					Métal: { quantite: 506, prix: 34 },
					Rations: { quantite: 533, prix: 49 },
					Pimenter: { quantite: 1638.23, prix: 15 },
					"Canne à sucre": { quantite: 536, prix: 19 },
					"Tabac vieilli": { quantite: 510, prix: 73 },
				},
			},
		},
		routes: {},
		meta: {
			gridWidth: 32,
			gridHeight: 20,
			distanceTimeFactor: 400,
			distanceCostFactor: 2,
		},
	};
}
