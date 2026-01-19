import * as THREE from 'three';

/**
 * Level of Detail levels for rendering optimization
 */
export enum LODLevel {
  CLOSE = 'close',      // Full detail: individual stars, planets, waves
  MEDIUM = 'medium',    // Galaxy detail: galaxy sprites, galaxy-to-galaxy connections
  FAR = 'far'          // Cosmic web: cluster sprites, cluster filaments
}

/**
 * Distance thresholds for LOD switching (in world units)
 */
export interface LODThresholds {
  closeToMedium: number;  // Distance to switch from close to medium view
  mediumToFar: number;    // Distance to switch from medium to far view
}

/**
 * Manages Level of Detail switching based on camera distance
 * Optimizes rendering and simulation based on zoom level
 */
export class LODManager {
  private currentLevel: LODLevel;
  private camera: THREE.Camera;
  private galaxyCenters: THREE.Vector3[];
  private thresholds: LODThresholds;
  private hysteresis: number; // Prevents rapid switching at boundaries
  
  // Callbacks for LOD level changes
  onLevelChange?: (oldLevel: LODLevel, newLevel: LODLevel) => void;

  constructor(
    camera: THREE.Camera,
    galaxyCenters: THREE.Vector3[],
    thresholds: LODThresholds = {
      closeToMedium: 800,
      mediumToFar: 2500
    },
    hysteresis: number = 50
  ) {
    this.camera = camera;
    this.galaxyCenters = galaxyCenters;
    this.thresholds = thresholds;
    this.hysteresis = hysteresis;
    this.currentLevel = LODLevel.CLOSE;
  }

  /**
   * Update LOD level based on camera position
   * Call this every frame from the animation loop
   */
  update(): void {
    const newLevel = this.calculateLODLevel();
    
    if (newLevel !== this.currentLevel) {
      const oldLevel = this.currentLevel;
      this.currentLevel = newLevel;
      
      if (this.onLevelChange) {
        this.onLevelChange(oldLevel, newLevel);
      }
    }
  }

  /**
   * Calculate which LOD level should be active based on camera distance
   */
  private calculateLODLevel(): LODLevel {
    const minDistance = this.getMinDistanceToGalaxies();
    
    // Apply hysteresis to prevent rapid switching
    const closeThreshold = this.currentLevel === LODLevel.CLOSE
      ? this.thresholds.closeToMedium + this.hysteresis
      : this.thresholds.closeToMedium - this.hysteresis;
      
    const mediumThreshold = this.currentLevel === LODLevel.MEDIUM
      ? this.thresholds.mediumToFar + this.hysteresis
      : this.thresholds.mediumToFar - this.hysteresis;

    if (minDistance < closeThreshold) {
      return LODLevel.CLOSE;
    } else if (minDistance < mediumThreshold) {
      return LODLevel.MEDIUM;
    } else {
      return LODLevel.FAR;
    }
  }

  /**
   * Get the minimum distance from camera to any galaxy center
   */
  private getMinDistanceToGalaxies(): number {
    let minDistance = Infinity;
    
    for (const center of this.galaxyCenters) {
      const distance = this.camera.position.distanceTo(center);
      minDistance = Math.min(minDistance, distance);
    }
    
    return minDistance;
  }

  /**
   * Get the current LOD level
   */
  getCurrentLevel(): LODLevel {
    return this.currentLevel;
  }

  /**
   * Force a specific LOD level (useful for debugging/testing)
   */
  setLevel(level: LODLevel): void {
    if (level !== this.currentLevel) {
      const oldLevel = this.currentLevel;
      this.currentLevel = level;
      
      if (this.onLevelChange) {
        this.onLevelChange(oldLevel, level);
      }
    }
  }

  /**
   * Update galaxy centers (call when galaxies are regenerated)
   */
  updateGalaxyCenters(centers: THREE.Vector3[]): void {
    this.galaxyCenters = centers;
  }

  /**
   * Update thresholds (useful for runtime tuning)
   */
  updateThresholds(thresholds: Partial<LODThresholds>): void {
    this.thresholds = { ...this.thresholds, ...thresholds };
  }

  /**
   * Get debug information about current state
   */
  getDebugInfo(): {
    currentLevel: LODLevel;
    minDistance: number;
    thresholds: LODThresholds;
  } {
    return {
      currentLevel: this.currentLevel,
      minDistance: this.getMinDistanceToGalaxies(),
      thresholds: this.thresholds
    };
  }
}
