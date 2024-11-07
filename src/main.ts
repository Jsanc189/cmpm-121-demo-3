// @deno-types="npm:@types/leaflet@^1.9.14"
import leaflet from "leaflet";

//style sheets
import "leaflet/dist/leaflet.css";
import "./style.css";

// fix missing marker images
import "./leafletWorkaround.ts";

// Derministic randome number generator
import luck from "./luck.ts";

// import board.ts
import { Board } from "./board.ts";

//create cell interface for mapping
interface Cell {
  readonly column: number;
  readonly row: number;
}

//location set to Oakes Classroom
const playerCell = [36.98949379578401, -122.06277128548504];

const LOCATION = leaflet.latLng(playerCell[0], playerCell[1]);

//Gameplay map constants
const ZOOM_LEVEL = 18;
//const TILE_DEGREES = 1E-4;
const NEIGHBORHOOD_SIZE = 8;
const CACHE_SPAWN_PROBABILITY = 0.1;
const TILE_WIDTH = 0.0001;

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
interface Coin {
  readonly cell: Cell;
  readonly coins: number;
}

// inface of cache that holds coins
interface Cache {
  readonly coins: Coin[];
}

//add caches to the map with cells
function spawnCache(newCell: Cell) {
  const bounds = board.getCellBounds(newCell);
  console.log(bounds);

  //adds rectangle to map
  const rect = leaflet.rectangle(bounds);
  rect.addTo(map);

  //generate cache interactions
  rect.bindPopup(() => {
    //Each Cache has a random point value, mutable by the player
    let pointValue = Math.floor(
      luck([newCell.column, newCell.row, "initialValue"].toString()) * 100,
    );

    //popup description and buttons
    const popUp = document.createElement("div");
    popUp.innerHTML =
      `<div>You found a cache! Location: ${newCell.column}, ${newCell.row}.  Points: <span id="value">${pointValue}</span></div>
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

    //clicking button increments cache value and decrements player points
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

//add a board
const board = new Board(TILE_WIDTH, NEIGHBORHOOD_SIZE);
const cells = board.getCellsNearPoint(LOCATION);
console.log(cells);

// iterate through the cells object  check luck of each cell to spawn cache
for (let i = 0; i < cells.length; i++) {
  if (
    luck([cells[i].column, cells[i].row].toString()) < CACHE_SPAWN_PROBABILITY
  ) {
    //console.log("i'm lucky");
    spawnCache(cells[i]);
  }
}

// // check player location and find caches 10% of the time
// for (let i = -NEIGHBORHOOD_SIZE; i <= NEIGHBORHOOD_SIZE; i++) {
//   for (let j = -NEIGHBORHOOD_SIZE; j <= NEIGHBORHOOD_SIZE; j++) {
//     if (luck([i, j].toString()) < CACHE_SPAWN_PROBABILITY) {
//       spawnCache({ column: i, row: j });
//     }
//   }
// }

// function collect(coin: Coin, cell: Cell){
//     return;
// }

// function deposit(coinn: Coin, cell: Cell){
//     return;
// }
