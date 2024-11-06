//inspired by Mako1688 :https://github.com/Mako1688/cmpm-121-demo-3/blob/main/src/board.ts

import leaflet from "leaflet";

interface Cell {
  readonly column: number;
  readonly row: number;
}

//class to generate cells within range of the player
export class Board {
  readonly tileWidth: number;
  readonly tileVisibilityRadius: number;

  private readonly knownCells: Map<string, Cell>;

  constructor(tileWidth: number, tileVisibilityRadius: number) {
    this.tileWidth = tileWidth;
    this.tileVisibilityRadius = tileVisibilityRadius;
    this.knownCells = new Map<string, Cell>();
  }

  //ensures that the cells are unique
  private getCanonicalCell(cell: Cell): Cell {
    const { column, row } = cell;
    const key = [column, row].toString();
    if (!this.knownCells.has(key)) {
      this.knownCells.set(key, { column, row });
    }
    return this.knownCells.get(key)!;
  }

  //returns the cell that the player is looking at
  getCellForPoint(point: leaflet.Point): Cell {
    return this.getCanonicalCell({
      column: Math.floor(point.x / this.tileWidth),
      row: Math.floor(point.y / this.tileWidth),
    });
  }

  //returns the bounds of the cell
  getCellBounds(cell: Cell): leaflet.LatLngBounds {
    const { column, row } = cell;
    const SouthWest = { x: column * this.tileWidth, y: row * this.tileWidth };
    const NorthEast = {
      x: (column + 1) * this.tileWidth,
      y: (row + 1) * this.tileWidth,
    };
    return leaflet.latLngBounds(SouthWest, NorthEast);
  }

  //returns the cells that are within the visibility radius of the player
  getCellsNearPoint(point: leaflet.Point): Cell[] {
    const resultCells: Cell[] = [];
    const originCell = this.getCellForPoint(point);
    const { column, row } = originCell;

    for (
      let columnDistance = -this.tileVisibilityRadius;
      columnDistance <= this.tileVisibilityRadius;
      columnDistance++
    ) {
      for (
        let rowDistance = -this.tileVisibilityRadius;
        rowDistance <= this.tileVisibilityRadius;
        rowDistance++
      ) {
        resultCells.push(
          this.getCanonicalCell({
            column: column + columnDistance,
            row: row + rowDistance,
          }),
        );
      }
    }
    return resultCells;
  }
}
