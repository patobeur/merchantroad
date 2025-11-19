// js/game/data.js

const res_cacao = 'res_cacao';
const res_coton = 'res_coton';
const res_gems = 'res_gems';
const res_raisins = 'res_raisins';
const res_poudre = 'res_poudre';
const res_metal = 'res_metal';
const res_rations = 'res_rations';
const res_pimenter = 'res_pimenter';
const res_sucre = 'res_sucre';
const res_tabac = 'res_tabac';

const ville_a = 'ville_a';
const ville_b = 'ville_b';
const ville_c = 'ville_c';
const ville_d = 'ville_d';

export const defaultWorld = {
	ressources: {
		[res_cacao]: { id: res_cacao, name: "Cacao" },
		[res_coton]: { id: res_coton, name: "Coton" },
		[res_gems]: { id: res_gems, name: "Pierres précieuses" },
		[res_raisins]: { id: res_raisins, name: "Raisins" },
		[res_poudre]: { id: res_poudre, name: "Poudre à canon" },
		[res_metal]: { id: res_metal, name: "Métal" },
		[res_rations]: { id: res_rations, name: "Rations" },
		[res_pimenter]: { id: res_pimenter, name: "Pimenter" },
		[res_sucre]: { id: res_sucre, name: "Canne à sucre" },
		[res_tabac]: { id: res_tabac, name: "Tabac vieilli" },
	},
	villes: {
		[ville_a]: {
            id: ville_a,
            name: "Ville A",
			stocks: {
				[res_cacao]: { quantite: 923, prix: 22 },
				[res_coton]: { quantite: 626, prix: 23 },
				[res_gems]: { quantite: 316, prix: 373 },
				[res_raisins]: { quantite: 490, prix: 30 },
				[res_poudre]: { quantite: 547, prix: 87 },
				[res_metal]: { quantite: 272, prix: 37 },
				[res_rations]: { quantite: 737, prix: 44 },
				[res_pimenter]: { quantite: 936, prix: 21 },
				[res_sucre]: { quantite: 754, prix: 16 },
				[res_tabac]: { quantite: 408, prix: 78 },
			},
		},
		[ville_b]: {
            id: ville_b,
            name: "Ville B",
			stocks: {
				[res_cacao]: { quantite: 575, prix: 29 },
				[res_coton]: { quantite: 569, prix: 24 },
				[res_gems]: { quantite: 385, prix: 364 },
				[res_raisins]: { quantite: 510, prix: 29 },
				[res_poudre]: { quantite: 502, prix: 89 },
				[res_metal]: { quantite: 695, prix: 32 },
				[res_rations]: { quantite: 593, prix: 47 },
				[res_pimenter]: { quantite: 812, prix: 26 },
				[res_sucre]: { quantite: 709, prix: 17 },
				[res_tabac]: { quantite: 429, prix: 77 },
			},
		},
		[ville_c]: {
            id: ville_c,
            name: "Ville C",
			stocks: {
				[res_cacao]: { quantite: 890, prix: 25 },
				[res_coton]: { quantite: 469, prix: 25 },
				[res_gems]: { quantite: 502, prix: 349 },
				[res_raisins]: { quantite: 606, prix: 28 },
				[res_poudre]: { quantite: 473, prix: 91 },
				[res_metal]: { quantite: 267, prix: 37 },
				[res_rations]: { quantite: 572, prix: 48 },
				[res_pimenter]: { quantite: 0, prix: 40 },
				[res_sucre]: { quantite: 734, prix: 17 },
				[res_tabac]: { quantite: 173, prix: 76 },
			},
		},
		[ville_d]: {
            id: ville_d,
            name: "Ville D",
			stocks: {
				[res_cacao]: { quantite: 992, prix: 15 },
				[res_coton]: { quantite: 618, prix: 23 },
				[res_gems]: { quantite: 384, prix: 364 },
				[res_raisins]: { quantite: 552, prix: 29 },
				[res_poudre]: { quantite: 694, prix: 80 },
				[res_metal]: { quantite: 506, prix: 34 },
				[res_rations]: { quantite: 533, prix: 49 },
				[res_pimenter]: { quantite: 1638.23, prix: 15 },
				[res_sucre]: { quantite: 536, prix: 19 },
				[res_tabac]: { quantite: 510, prix: 73 },
			},
		},
	},
	routes: {
		[ville_a]: { [ville_b]: { temps: 8000, cout: 40 }, [ville_c]: { temps: 12000, cout: 70 }, [ville_d]: { temps: 10000, cout: 60 } },
		[ville_b]: { [ville_a]: { temps: 8000, cout: 40 }, [ville_c]: { temps: 7000, cout: 35 }, [ville_d]: { temps: 15000, cout: 90 } },
		[ville_c]: { [ville_a]: { temps: 12000, cout: 70 }, [ville_b]: { temps: 7000, cout: 35 }, [ville_d]: { temps: 9000, cout: 55 } },
		[ville_d]: { [ville_a]: { temps: 10000, cout: 60 }, [ville_b]: { temps: 15000, cout: 90 }, [ville_c]: { temps: 9000, cout: 55 } },
	},
};
