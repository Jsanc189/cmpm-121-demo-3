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
    return `${this.column},${this.row},${this.numCoins}`;
  }

  //restores caches state
  fromMemento(memento: string): void {
    const [column, row, numCoins] = memento.split(",").map(Number);
    this.column = column;
    this.row = row;
    this.numCoins = numCoins;
  }
}

//add a board
const board = new Board(TILE_DEGREES, NEIGHBORHOOD_SIZE);
let cells = board.getCellsNearPoint(LOCATION);
const currentGeoCaches: Geocache[] = [];
const savedMementos: string[] = [];

//iterate through the cells object  check luck of each cell to spawn cache

function makeCacheCells() {
  cells = board.getCellsNearPoint(LOCATION);

  cells.forEach((cell) => {
    //check if cache already exists for this cell in saved momentos
    const cacheExists = savedMementos.some((memento) => {
      //console.log("saved memento: " + memento);
      //console.log(cell);
      const [column, row] = memento.split(",").map(Number);
      return column === cell.column && row === cell.row;
    });

    if (
      !cacheExists &&
      luck([cell.column, cell.row].toString()) < CACHE_SPAWN_PROBABILITY
    ) {
      //if cache does not exist, create a new one
      const newCache = new Geocache();
      newCache.column = cell.column;
      newCache.row = cell.row;
      newCache.numCoins = Math.floor(
        luck([cell.column, cell.row].toString()) * 100,
      );

      //add new cache to the list
      currentGeoCaches.push(newCache);
      spawnCache(cell);
    } else {
      //find the memento for this cell
      const memento = savedMementos.find((memento) => {
        const [column, row] = memento.split(",").map(Number);
        return column === cell.column && row === cell.row;
      });

      if (memento) {
        const [column, row, numCoins] = memento.split(",").map(Number);
        const existingCache = new Geocache();
        existingCache.column = column;
        existingCache.row = row;
        existingCache.numCoins = numCoins;
        currentGeoCaches.push(existingCache);
        spawnCache(cell);
      }
    }
  });
}

//add caches to the map with cells
function spawnCache(newCell: Cell) {
  const bounds = board.getCellBounds(newCell);

  //adds rectangle to map
  const rect = leaflet.rectangle(bounds);
  rect.addTo(map);

  const cache = currentGeoCaches.find(
    (c) => c.column === newCell.column && c.row === newCell.row,
  );

  if (!cache) {
    console.error("Cache not found for cell:", newCell);
    return;
  }

  let numCoins = cache.numCoins;

  //generate cache interactions
  rect.bindPopup(() => {
    const serlializedCoins: Array<Coin> = [];

    //create new serialized coin and add to list
    for (let i = 0; i <= numCoins; i++) {
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
        cache.numCoins = numCoins;
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
        cache.numCoins = numCoins;
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
  return `${coin.cell.column}:${coin.cell.row}#${coin.serial}`;
}

//function that removes rectangles and caches from map
//modify this to make sure this saves cache states that are currently on board and clear board
function removeCaches() {
  //for each cache in the screen I want to save memento of it in an savedMementos array
  currentGeoCaches.forEach((cache) => {
    savedMementos.push(cache.toMemento());
  });

  //remove all rectangles from map
  map.eachLayer((layer) => {
    if (layer instanceof leaflet.Rectangle) {
      map.removeLayer(layer);
    }
  });
  currentGeoCaches.length = 0;
}

function playerMoved(column: number, row: number) {
  LOCATION.lat += column;
  LOCATION.lng += row;
  playerMarker.setLatLng(LOCATION);
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
