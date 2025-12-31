import { Vector3 } from 'three';

/**
 * Spatial partitioning grid for efficient proximity queries
 * Divides 3D space into uniform cells for O(1) neighbor lookups
 */
export class SpatialGrid<T> {
  private cellSize: number;
  private grid: Map<string, T[]>;
  private minBounds: Vector3;
  private maxBounds: Vector3;

  constructor(cellSize: number, minBounds: Vector3, maxBounds: Vector3) {
    this.cellSize = cellSize;
    this.grid = new Map();
    this.minBounds = minBounds;
    this.maxBounds = maxBounds;
  }

  /**
   * Get cell key for a position
   */
  private getCellKey(x: number, y: number, z: number): string {
    const cx = Math.floor(x / this.cellSize);
    const cy = Math.floor(y / this.cellSize);
    const cz = Math.floor(z / this.cellSize);
    return `${cx},${cy},${cz}`;
  }

  /**
   * Insert an object at a position
   */
  insert(position: Vector3, item: T): void {
    const key = this.getCellKey(position.x, position.y, position.z);
    if (!this.grid.has(key)) {
      this.grid.set(key, []);
    }
    const cell = this.grid.get(key);
    if (cell) cell.push(item);
  }

  /**
   * Get all objects in the same cell as the given position
   */
  query(position: Vector3): T[] {
    const key = this.getCellKey(position.x, position.y, position.z);
    return this.grid.get(key) || [];
  }

  /**
   * Get all objects within a radius of a position (checks neighboring cells)
   */
  queryRadius(position: Vector3, radius: number): T[] {
    const results: T[] = [];
    const cellRadius = Math.ceil(radius / this.cellSize);
    
    const centerKey = this.getCellKey(position.x, position.y, position.z);
    const [cx, cy, cz] = centerKey.split(',').map(Number);

    // Check all cells within the radius
    for (let dx = -cellRadius; dx <= cellRadius; dx++) {
      for (let dy = -cellRadius; dy <= cellRadius; dy++) {
        for (let dz = -cellRadius; dz <= cellRadius; dz++) {
          const key = `${cx + dx},${cy + dy},${cz + dz}`;
          const items = this.grid.get(key);
          if (items) {
            results.push(...items);
          }
        }
      }
    }
    
    return results;
  }

  /**
   * Clear all items from the grid
   */
  clear(): void {
    this.grid.clear();
  }

  /**
   * Get total number of items in grid
   */
  size(): number {
    let count = 0;
    for (const items of this.grid.values()) {
      count += items.length;
    }
    return count;
  }
}
