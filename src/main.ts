// @deno-types="npm:@types/leaflet@^1.9.14"
import leaflet from "leaflet";

//style sheets
import "leaflet/dist/leaflet.css";
import "./style.css";

// fix missing marker images
import "./leafletWorkaround.ts";

// Derministic randome number generator
//import luck from "./luck.ts";

//create cell interface for mapping
interface Cell {
  readonly i: number;
  readonly j: number;
}

//location set to Oakes Classroom
const playerCell: Cell = { i: 36.98949379578401, j: -122.06277128548504 };
const LOCATION = leaflet.latLng(playerCell.i, playerCell.j);

//Gameplay map variables
const ZOOM_LEVEL = 18;
//const TILE_DEGREES = 1E-4;
//const NEIGHBORHOOD_SIZE = 8;
//const CACHE_SPAWN_PROBABILITY = 0.1;

//create a map
const map = leaflet.map(document.getElementById("map")!, {
  center: LOCATION,
  zoom: ZOOM_LEVEL,
  minZoom: ZOOM_LEVEL,
  maxZoom: ZOOM_LEVEL,
  zoomControl: false,
  scrollWheelZoom: false,
});

// Populate the map with a background tile layer
leaflet
  .tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution:
      '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  })
  .addTo(map);

const playerMarker = leaflet.marker(LOCATION);
playerMarker.bindTooltip("You are here");
playerMarker.addTo(map);
