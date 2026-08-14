export interface SpatialPoint {
  x: number;
  z: number;
}

export class SpatialHash<T extends SpatialPoint> {
  private readonly cells = new Map<string, T[]>();

  constructor(private readonly cellSize: number) {}

  rebuild(items: readonly T[]): void {
    this.cells.clear();
    for (const item of items) {
      const key = this.keyFor(item.x, item.z);
      const cell = this.cells.get(key);
      if (cell) cell.push(item);
      else this.cells.set(key, [item]);
    }
  }

  forEachNearby(x: number, z: number, radius: number, visit: (item: T) => void): void {
    const minimumX = Math.floor((x - radius) / this.cellSize);
    const maximumX = Math.floor((x + radius) / this.cellSize);
    const minimumZ = Math.floor((z - radius) / this.cellSize);
    const maximumZ = Math.floor((z + radius) / this.cellSize);
    for (let cellX = minimumX; cellX <= maximumX; cellX += 1) {
      for (let cellZ = minimumZ; cellZ <= maximumZ; cellZ += 1) {
        const cell = this.cells.get(`${cellX}:${cellZ}`);
        if (!cell) continue;
        for (const item of cell) visit(item);
      }
    }
  }

  private keyFor(x: number, z: number): string {
    return `${Math.floor(x / this.cellSize)}:${Math.floor(z / this.cellSize)}`;
  }
}
