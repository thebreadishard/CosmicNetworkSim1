import * as THREE from 'three';
import { Star } from '../entities';

/**
 * Represents a group of galaxies for medium/far LOD rendering
 * At medium distances, renders as a simplified sprite representation
 * At far distances, becomes part of cosmic web filament structure
 */
export class GalaxyCluster {
  id: number;
  center: THREE.Vector3;
  radius: number;
  stars: Star[];
  galaxyCount: number;
  
  // Visual representations at different LOD levels
  mediumLODSprite: THREE.Sprite | null = null;
  farLODSprite: THREE.Sprite | null = null;
  
  // Galaxy centers within this cluster
  galaxyCenters: THREE.Vector3[];

  private static nextId: number = 0;

  constructor(
    galaxyCenters: THREE.Vector3[],
    stars: Star[] = [],
    radius?: number
  ) {
    this.id = GalaxyCluster.nextId++;
    this.galaxyCenters = galaxyCenters;
    this.stars = stars;
    this.galaxyCount = galaxyCenters.length;
    
    // Calculate cluster center as average of galaxy centers
    this.center = this.calculateCenter();
    
    // Calculate radius if not provided
    this.radius = radius ?? this.calculateRadius();
  }

  /**
   * Calculate the geometric center of the cluster
   */
  private calculateCenter(): THREE.Vector3 {
    const center = new THREE.Vector3(0, 0, 0);
    
    for (const galaxyCenter of this.galaxyCenters) {
      center.add(galaxyCenter);
    }
    
    if (this.galaxyCenters.length > 0) {
      center.divideScalar(this.galaxyCenters.length);
    }
    
    return center;
  }

  /**
   * Calculate the radius that encompasses all galaxies
   */
  private calculateRadius(): number {
    let maxDistance = 0;
    
    for (const galaxyCenter of this.galaxyCenters) {
      const distance = this.center.distanceTo(galaxyCenter);
      maxDistance = Math.max(maxDistance, distance);
    }
    
    // Add buffer for galaxy radius (assume ~300 units)
    return maxDistance + 300;
  }

  /**
   * Create sprite representation for medium LOD
   * Shows galaxy as a glowing point cloud
   */
  createMediumLODSprite(): THREE.Sprite {
    if (this.mediumLODSprite) {
      return this.mediumLODSprite;
    }

    // Create a canvas texture with glow effect
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    // Radial gradient for glow (reduced brightness)
    const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    gradient.addColorStop(0, 'rgba(200, 220, 255, 0.5)');
    gradient.addColorStop(0.2, 'rgba(150, 180, 255, 0.4)');
    gradient.addColorStop(0.5, 'rgba(100, 150, 255, 0.2)');
    gradient.addColorStop(1.0, 'rgba(50, 100, 200, 0.0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.mediumLODSprite = new THREE.Sprite(spriteMaterial);
    this.mediumLODSprite.position.copy(this.center);
    this.mediumLODSprite.scale.set(this.radius * 1.5, this.radius * 1.5, 1);
    this.mediumLODSprite.visible = false;

    return this.mediumLODSprite;
  }

  /**
   * Create sprite representation for far LOD
   * Shows cluster as a single bright point
   */
  createFarLODSprite(): THREE.Sprite {
    if (this.farLODSprite) {
      return this.farLODSprite;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;

    // Brighter, smaller point for far view
    const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
    gradient.addColorStop(0.5, 'rgba(200, 220, 255, 0.6)');
    gradient.addColorStop(1.0, 'rgba(150, 180, 255, 0.0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.farLODSprite = new THREE.Sprite(spriteMaterial);
    this.farLODSprite.position.copy(this.center);
    this.farLODSprite.scale.set(this.radius * 2, this.radius * 2, 1);
    this.farLODSprite.visible = false;

    return this.farLODSprite;
  }

  /**
   * Show/hide all stars in this cluster
   */
  setStarsVisible(visible: boolean): void {
    for (const star of this.stars) {
      star.setVisible(visible);
    }
  }

  /**
   * Show medium LOD representation
   */
  showMediumLOD(scene: THREE.Scene): void {
    if (!this.mediumLODSprite) {
      const sprite = this.createMediumLODSprite();
      scene.add(sprite);
    }
    if (this.mediumLODSprite) {
      this.mediumLODSprite.visible = true;
    }
    if (this.farLODSprite) {
      this.farLODSprite.visible = false;
    }
  }

  /**
   * Show far LOD representation
   */
  showFarLOD(scene: THREE.Scene): void {
    if (!this.farLODSprite) {
      const sprite = this.createFarLODSprite();
      scene.add(sprite);
    }
    if (this.farLODSprite) {
      this.farLODSprite.visible = true;
    }
    if (this.mediumLODSprite) {
      this.mediumLODSprite.visible = false;
    }
  }

  /**
   * Hide all LOD representations
   */
  hideLODRepresentations(): void {
    if (this.mediumLODSprite) {
      this.mediumLODSprite.visible = false;
    }
    if (this.farLODSprite) {
      this.farLODSprite.visible = false;
    }
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    if (this.mediumLODSprite) {
      this.mediumLODSprite.material.dispose();
      if (this.mediumLODSprite.material.map) {
        this.mediumLODSprite.material.map.dispose();
      }
    }
    if (this.farLODSprite) {
      this.farLODSprite.material.dispose();
      if (this.farLODSprite.material.map) {
        this.farLODSprite.material.map.dispose();
      }
    }
  }
}
