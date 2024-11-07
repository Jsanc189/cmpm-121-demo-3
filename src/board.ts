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
      this.knownCells.set(key, cell);
    }
    return this.knownCells.get(key)!;
  }

  //returns the cell that the player is looking at
  getCellForPoint(point: leaflet.latLng): Cell {
    return this.getCanonicalCell({
      column: point.lat,
      row: point.lng,
    });
  }

  //returns the bounds of the cell
  getCellBounds(cell: Cell): leaflet.LatLngBounds {
    const column = cell.column;
    const row = cell.row;
    const SouthWest = leaflet.latLng(
      column * this.tileWidth,
      row * this.tileWidth,
    );
    const NorthEast = leaflet.latLng(
      (column + 1) * this.tileWidth,
      (row + 1) * this.tileWidth,
    );
    return leaflet.latLngBounds(SouthWest, NorthEast);
  }

  //returns the cells that are within the visibility radius of the player
  getCellsNearPoint(point: leaflet.latLng): Cell[] {
    const resultCells: Cell[] = [];
    const originCell = this.getCellForPoint(point);
    const column = originCell.column;
    const row = originCell.row;

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
