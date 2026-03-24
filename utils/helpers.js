/**
 * helpers.js — mappatura ID ISO numerico → continente
 * Basata sul dataset world-atlas@2 countries-50m.json
 * Aggiunta di stati micro e isole rispetto alla versione 110m originale.
 */

function getContinentMap() {
  const m = {};

  // ── AFRICA ──────────────────────────────────────────────────────────────
  // Continentale + isole atlantiche/indiane
  [
    12,   // Algeria
    24,   // Angola
    72,   // Botswana
    86,   // Territorio britannico Oceano Indiano
    108,  // Burundi
    120,  // Camerun
    132,  // Capo Verde
    140,  // Rep. Centrafricana
    148,  // Ciad
    174,  // Comore
    175,  // Mayotte
    178,  // Congo
    180,  // Rep. Dem. Congo
    204,  // Benin
    226,  // Guinea Equatoriale
    231,  // Etiopia
    232,  // Eritrea
    262,  // Gibuti
    266,  // Gabon
    270,  // Gambia
    288,  // Ghana
    324,  // Guinea
    384,  // Costa d'Avorio
    404,  // Kenya
    426,  // Lesotho
    430,  // Liberia
    434,  // Libia
    450,  // Madagascar
    454,  // Malawi
    466,  // Mali
    478,  // Mauritania
    480,  // Mauritius
    504,  // Marocco
    508,  // Mozambico
    516,  // Namibia
    562,  // Niger
    566,  // Nigeria
    624,  // Guinea-Bissau
    638,  // Réunion
    646,  // Ruanda
    654,  // Sant'Elena, Ascensione e Tristan da Cunha
    678,  // São Tomé e Príncipe
    686,  // Senegal
    694,  // Sierra Leone
    706,  // Somalia
    710,  // Sudafrica
    716,  // Zimbabwe
    728,  // Sudan del Sud
    729,  // Sudan
    732,  // Sahara Occidentale
    748,  // Eswatini
    768,  // Togo
    788,  // Tunisia
    800,  // Uganda
    818,  // Egitto
    834,  // Tanzania
    854,  // Burkina Faso
    894,  // Zambia
  ].forEach(id => m[id] = "Africa");

  // ── EUROPA ──────────────────────────────────────────────────────────────
  [
    8,    // Albania
    20,   // Andorra
    40,   // Austria
    56,   // Belgio
    70,   // Bosnia Erzegovina
    100,  // Bulgaria
    112,  // Bielorussia
    191,  // Croazia
    196,  // Cipro
    203,  // Rep. Ceca
    208,  // Danimarca
    233,  // Estonia
    234,  // Isole Fær Øer
    246,  // Finlandia
    250,  // Francia (territorio metropolitano)
    276,  // Germania
    292,  // Gibilterra
    300,  // Grecia
    336,  // Vaticano
    348,  // Ungheria
    352,  // Islanda
    372,  // Irlanda
    380,  // Italia
    383,  // Kosovo
    428,  // Lettonia
    438,  // Liechtenstein
    440,  // Lituania
    442,  // Lussemburgo
    470,  // Malta
    492,  // Monaco
    498,  // Moldova
    499,  // Montenegro
    528,  // Paesi Bassi
    578,  // Norvegia
    616,  // Polonia
    620,  // Portogallo
    642,  // Romania
    674,  // San Marino
    688,  // Serbia
    703,  // Slovacchia
    705,  // Slovenia
    724,  // Spagna
    744,  // Svalbard e Jan Mayen
    752,  // Svezia
    756,  // Svizzera
    804,  // Ucraina
    807,  // Macedonia del Nord
    826,  // Regno Unito
    831,  // Guernsey
    832,  // Jersey
    833,  // Isola di Man
  ].forEach(id => m[id] = "Europe");

  // ── ASIA ────────────────────────────────────────────────────────────────
  [
    4,    // Afghanistan
    31,   // Azerbaigian
    48,   // Bahrein
    50,   // Bangladesh
    51,   // Armenia
    64,   // Bhutan
    96,   // Brunei
    104,  // Myanmar
    116,  // Cambogia
    144,  // Sri Lanka
    156,  // Cina
    158,  // Taiwan
    268,  // Georgia
    275,  // Palestina (West Bank e Gaza)
    344,  // Hong Kong
    356,  // India
    364,  // Iran
    368,  // Iraq
    376,  // Israele
    392,  // Giappone
    398,  // Kazakistan
    400,  // Giordania
    408,  // Corea del Nord
    410,  // Corea del Sud
    414,  // Kuwait
    418,  // Laos
    422,  // Libano
    458,  // Malaysia
    462,  // Maldive
    496,  // Mongolia
    512,  // Oman
    524,  // Nepal
    586,  // Pakistan
    608,  // Filippine
    626,  // Timor Est
    634,  // Qatar
    643,  // Russia
    682,  // Arabia Saudita
    702,  // Singapore
    704,  // Vietnam
    760,  // Siria
    762,  // Tagikistan
    764,  // Thailandia
    784,  // Emirati Arabi Uniti
    792,  // Turchia
    795,  // Turkmenistan
    860,  // Uzbekistan
    887,  // Yemen
  ].forEach(id => m[id] = "Asia");

  // ── NORD AMERICA ────────────────────────────────────────────────────────
  [
    28,   // Antigua e Barbuda
    44,   // Bahamas
    52,   // Barbados
    60,   // Bermuda
    84,   // Belize
    92,   // Isole Vergini Britanniche
    124,  // Canada
    136,  // Isole Cayman
    192,  // Cuba
    212,  // Dominica
    214,  // Rep. Dominicana
    222,  // El Salvador
    304,  // Groenlandia
    308,  // Grenada
    312,  // Guadalupa
    320,  // Guatemala
    332,  // Haiti
    340,  // Honduras
    388,  // Giamaica
    474,  // Martinica
    484,  // Messico
    500,  // Montserrat
    531,  // Curaçao
    534,  // Sint Maarten
    535,  // BES (Bonaire, Sint Eustatius, Saba)
    558,  // Nicaragua
    591,  // Panama
    630,  // Porto Rico
    659,  // Saint Kitts e Nevis
    660,  // Anguilla
    662,  // Saint Lucia
    663,  // Saint Martin
    666,  // Saint-Pierre e Miquelon
    670,  // Saint Vincent e Grenadine
    780,  // Trinidad e Tobago
    796,  // Isole Turks e Caicos
    840,  // Stati Uniti
    850,  // Isole Vergini Americane
  ].forEach(id => m[id] = "North America");

  // ── SUD AMERICA ─────────────────────────────────────────────────────────
  [
    32,   // Argentina
    68,   // Bolivia
    76,   // Brasile
    152,  // Cile
    170,  // Colombia
    218,  // Ecuador
    238,  // Isole Falkland
    254,  // Guyana Francese
    328,  // Guyana
    600,  // Paraguay
    604,  // Perù
    740,  // Suriname
    858,  // Uruguay
    862,  // Venezuela
  ].forEach(id => m[id] = "South America");

  // ── OCEANIA ─────────────────────────────────────────────────────────────
  [
    16,   // Samoa Americane
    36,   // Australia
    90,   // Isole Salomone
    162,  // Isola Christmas
    166,  // Isole Cocos (Keeling)
    184,  // Isole Cook
    242,  // Figi
    258,  // Polinesia Francese
    296,  // Kiribati
    316,  // Guam
    334,  // Isole Heard e McDonald
    520,  // Nauru
    540,  // Nuova Caledonia
    548,  // Vanuatu
    554,  // Nuova Zelanda
    570,  // Niue
    574,  // Isola Norfolk
    580,  // Isole Marianne Settentrionali
    583,  // Micronesia
    584,  // Isole Marshall
    585,  // Palau
    598,  // Papua Nuova Guinea
    612,  // Pitcairn
    772,  // Tokelau
    776,  // Tonga
    798,  // Tuvalu
    876,  // Wallis e Futuna
    882,  // Samoa
  ].forEach(id => m[id] = "Oceania");

  // ── ANTARTIDE ───────────────────────────────────────────────────────────
  m[10] = "Antarctica";

  return m;
}
