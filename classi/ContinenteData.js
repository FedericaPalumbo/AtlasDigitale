/**
 * ContinenteData — modello dati per ogni continente
 * Contiene informazioni statistiche e il colore pastello associato.
 */
class ContinenteData {
  constructor({ nome, area, paesi, pop, colore }) {
    this.nome   = nome;
    this.area   = area;
    this.paesi  = paesi;
    this.pop    = pop;
    this.colore = colore;
  }
}

const CONTINENTI = {
  "Africa": new ContinenteData({
    nome: "Africa", area: "30.37 M km²", paesi: 54, pop: "1.4 Md", colore: "#f2c4a0"
  }),
  "Antarctica": new ContinenteData({
    nome: "Antarctica", area: "14.20 M km²", paesi: 0, pop: "~1.000 ricercatori", colore: "#c8d8e8"
  }),
  "Asia": new ContinenteData({
    nome: "Asia", area: "44.58 M km²", paesi: 49, pop: "4.7 Md", colore: "#f4d0c4"
  }),
  "Europe": new ContinenteData({
    nome: "Europe", area: "10.53 M km²", paesi: 44, pop: "748 M", colore: "#c4b8d8"
  }),
  "North America": new ContinenteData({
    nome: "North America", area: "24.71 M km²", paesi: 23, pop: "597 M", colore: "#b8d4c0"
  }),
  "Oceania": new ContinenteData({
    nome: "Oceania", area: "8.53 M km²", paesi: 14, pop: "43 M", colore: "#f8e0a8"
  }),
  "South America": new ContinenteData({
    nome: "South America", area: "17.84 M km²", paesi: 12, pop: "434 M", colore: "#c4dab4"
  }),
};
