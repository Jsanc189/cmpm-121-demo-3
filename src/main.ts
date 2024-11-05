// @deno-types="npm:@types/leaflet@^1.9.14"
import leaflet from "leaflet";

//style sheets
import "leaflet/dist/leaflet.css";
import "./style.css";

// fix missing marker images
import "./leafletWorkaround.ts";

// Derministic randome number generator
import luck from "./luck.ts";

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
const TILE_DEGREES = 1E-4;
const NEIGHBORHOOD_SIZE = 8;
const CACHE_SPAWN_PROBABILITY = 0.1;

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

//Display  player points
let playerPoints = 0;
const statusPanel = document.querySelector("#statusPanel")!; // defined in index.html
statusPanel.textContent = `Points: ${playerPoints}`;

//interface of coins that holds a cell and points (for now)
interface Coins {
  readonly cell: Cell;
  readonly coins: number;
}

// inface of cache that holds coins
interface Cache {
  readonly coins: Coins[];
}

//add caches tot he map with cells
function spawnCache(newCell: Cell) {
  const origin = LOCATION;
  const offset = 1;
  const bounds = leaflet.latLngBounds([
    [
      origin.lat + newCell.i * TILE_DEGREES,
      origin.lng + newCell.j * TILE_DEGREES,
    ],
    [
      origin.lat + (newCell.i + offset) * TILE_DEGREES,
      origin.lng + (newCell.j + offset) * TILE_DEGREES,
    ],
  ]);

  //adds rectangle to map
  const rect = leaflet.rectangle(bounds);
  rect.addTo(map);

  rect.bindPopup(() => {
    //Each Cache has a random point value, mutable by the player
    let pointValue = Math.floor(
      luck([newCell.i, newCell.j, "initialValue"].toString()) * 100,
    );

    //popup description and button
    const popUp = document.createElement("div");
    popUp.innerHTML =
      `<div>You found a cache! Location: ${newCell.i}, ${newCell.j}.  Points: <span id="value">${pointValue}</span></div>
        <button id="collectButton">Collect</button>
        <button id="depositButton">Deposit</button>`;

    //Clicking button decrements cache value and increments player points
    popUp
      .querySelector<HTMLButtonElement>("#collectButton")!
      .addEventListener("click", () => {
        pointValue--;
        popUp.querySelector<HTMLSpanElement>("#value")!.innerHTML =
          `Points: ${pointValue}`;
        playerPoints++;
        statusPanel.innerHTML = `Points: ${playerPoints}`;
      });

    popUp
      .querySelector<HTMLButtonElement>("#depositButton")!
      .addEventListener("click", () => {
        pointValue++;
        popUp.querySelector<HTMLSpanElement>("#value")!.innerHTML =
          `Points: ${pointValue}`;
        playerPoints--;
        statusPanel.innerHTML = `Points: ${playerPoints}`;
      });
    return popUp;
  });
}

// check player location and find caches 10% of the time
for (let i = -NEIGHBORHOOD_SIZE; i <= NEIGHBORHOOD_SIZE; i++) {
  for (let j = -NEIGHBORHOOD_SIZE; j <= NEIGHBORHOOD_SIZE; j++) {
    if (luck([i, j].toString()) < CACHE_SPAWN_PROBABILITY) {
      spawnCache({ i, j });
    }
  }
}
