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
//const playerCell = [0,0];

const LOCATION = leaflet.latLng(playerCell[0], playerCell[1]);

//Gameplay map constants
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
const playerPoints: Array<Coin> = [];
const statusPanel = document.querySelector("#statusPanel")!; // defined in index.html
statusPanel.textContent = `Coins: ${playerPoints.length}`;

//interface of coins that holds a cell and points (for now)
interface Coin {
  readonly cell: Cell;
  readonly serial: number;
}

// inface of cache that holds coins
interface Cache {
  readonly coins: Coin[];
}

//memento interface to save Geocaches
interface Memento<T> {
  toMemento(): T;
  fromMemento(memento: T): void;
}

//class for Geocaches
class Geocache implements Memento<string> {
  column: number;
  row: number;
  numCoins: number;

  constructor() {
    this.column = 0;
    this.row = 1;
    this.numCoins = 2;
  }

  //saves caches state
  toMemento() {
    return this.numCoins.toString();
  }

  //restores caches state
  fromMemento(memento: string): void {
    this.numCoins = parseInt(memento);
  }
}

//add a board
const board = new Board(TILE_DEGREES, NEIGHBORHOOD_SIZE);
let cells = board.getCellsNearPoint(LOCATION);
const Geocaches: Geocache[] = [];

function makeCacheCells() {
  cells = board.getCellsNearPoint(LOCATION);
  // iterate through the cells object  check luck of each cell to spawn cache
  for (let i = 0; i < cells.length; i++) {
    if (
      luck([cells[i].column, cells[i].row].toString()) < CACHE_SPAWN_PROBABILITY
    ) {
      spawnCache(cells[i]);
      // if geocache is not in Geocaches list
      if (
        !Geocaches.some((cache) =>
          cache.column === cells[i].column && cache.row === cells[i].row
        )
      ) {
        //create new cache and add to list
        const newCache = new Geocache();
        newCache.column = cells[i].column;
        newCache.row = cells[i].row;
        Geocaches.push(newCache);
      }
    }
  }
}

//add caches to the map with cells
function spawnCache(newCell: Cell) {
  const bounds = board.getCellBounds(newCell);

  //adds rectangle to map
  const rect = leaflet.rectangle(bounds);
  rect.addTo(map);

  //generate cache interactions
  rect.bindPopup(() => {
    let numCoins = Math.floor(
      luck([newCell.column, newCell.row, "initialValue"].toString()) * 100,
    );
    const serlializedCoins: Array<Coin> = [];

    //create new serialized coin and add to list
    for (let i = numCoins; i > 0; i--) {
      const newCoin: Coin = { cell: newCell, serial: i };
      serlializedCoins.push(newCoin);
    }

    //popup description and buttons
    const popUp = document.createElement("div");
    popUp.innerHTML =
      `<div>You found a cache! Location: ${newCell.column}, ${newCell.row}.  Number of Coins: <span id="value"> ${numCoins} </span></div>
        <button id="collectButton">Collect</button>
        <button id="depositButton">Deposit</button>`;

    //Clicking button decrements cache value and increments player points
    popUp
      .querySelector<HTMLButtonElement>("#collectButton")!
      .addEventListener("click", () => {
        numCoins--;
        playerPoints.push(serlializedCoins.pop()!);
        const serial = coinName(playerPoints[playerPoints.length - 1]);
        popUp.querySelector<HTMLSpanElement>("#value")!.innerHTML =
          `${numCoins}`;
        statusPanel.innerHTML = `Coin Collected: ${serial}`;
      });

    //clicking button increments cache value and decrements player points
    popUp
      .querySelector<HTMLButtonElement>("#depositButton")!
      .addEventListener("click", () => {
        numCoins++;
        serlializedCoins.push(playerPoints.pop()!);
        const serial = coinName(serlializedCoins[serlializedCoins.length - 1]);
        popUp.querySelector<HTMLSpanElement>("#value")!.innerHTML =
          `${numCoins}`;
        statusPanel.innerHTML = `Coin Deposited: ${serial}`;
      });
    return popUp;
  });
}

function coinName(coin: Coin) {
  return `${coin.cell.column}:-${coin.cell.row}#${coin.serial}`;
}

//function that removes rectangles and caches from map
function removeCaches() {
  map.eachLayer((layer) => {
    if (layer instanceof leaflet.Rectangle) {
      map.removeLayer(layer);
    }
  });
  Geocaches.length = 0;
}

function playerMoved(column: number, row: number) {
  LOCATION.lat += column;
  LOCATION.lng += row;
  playerMarker.setLatLng(LOCATION);
  console.log(LOCATION);
}

function game() {
  makeCacheCells();
  document.getElementById("north")?.addEventListener("click", () => {
    playerMoved(TILE_DEGREES, 0);
    removeCaches();
    makeCacheCells();
  });

  document.getElementById("south")?.addEventListener("click", () => {
    playerMoved(-TILE_DEGREES, 0);
    removeCaches();
    makeCacheCells();
  });

  document.getElementById("east")?.addEventListener("click", () => {
    playerMoved(0, TILE_DEGREES);
    removeCaches();
    makeCacheCells();
  });

  document.getElementById("west")?.addEventListener("click", () => {
    playerMoved(0, -TILE_DEGREES);
    removeCaches();
    makeCacheCells();
  });
}
game();
