import * as THREE from 'three';
import { SimulationSettings } from './settings';

export interface GalaxyGlowTarget {
  center: THREE.Vector3;
  radius: number;
}

/**
 * Adds one additive glow sprite per galaxy, visible only while the galaxy's
 * on-screen size is below `galaxyGlowPixelThreshold` pixels (zoomed out view).
 * Purely visual: stars stay visible and the simulation keeps running; the
 * sprites exist from construction — nothing is allocated per frame.
 */
export class GalaxyGlowLayer {
  private scene: THREE.Scene;
  private sprites: THREE.Sprite[] = [];
  private texture: THREE.Texture;
  private settings: SimulationSettings;

  // Reused per-frame vectors to avoid allocations in the animation loop
  private toSprite: THREE.Vector3 = new THREE.Vector3();
  private cameraDir: THREE.Vector3 = new THREE.Vector3();

  constructor(scene: THREE.Scene, targets: GalaxyGlowTarget[], settings: SimulationSettings) {
    this.scene = scene;
    this.settings = settings;
    this.texture = this.createGlowTexture();

    for (const target of targets) {
      const material = new THREE.SpriteMaterial({
        map: this.texture,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const sprite = new THREE.Sprite(material);
      sprite.position.copy(target.center);
      // Glow disc spans twice the galaxy radius, matching the galaxy's extent
      sprite.scale.set(target.radius * 2, target.radius * 2, 1);
      sprite.visible = false;
      scene.add(sprite);
      this.sprites.push(sprite);
    }
  }

  private createGlowTexture(): THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('2D canvas context unavailable for galaxy glow texture');
    }

    const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, 'rgba(190, 210, 255, 0.55)');
    gradient.addColorStop(0.4, 'rgba(140, 175, 255, 0.25)');
    gradient.addColorStop(1, 'rgba(80, 120, 220, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);

    return new THREE.CanvasTexture(canvas);
  }

  /**
   * Per frame: show a sprite when its galaxy spans fewer than the configured
   * pixel threshold on screen. Cost: O(galaxies) projections, no allocations.
   */
  update(camera: THREE.PerspectiveCamera): void {
    const threshold = this.settings.galaxyGlowPixelThreshold;
    if (threshold <= 0) {
      for (const sprite of this.sprites) {
        sprite.visible = false;
      }
      return;
    }
    const halfFovTan = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
    const heightPx = window.innerHeight;
    camera.getWorldDirection(this.cameraDir);

    for (const sprite of this.sprites) {
      this.toSprite.subVectors(sprite.position, camera.position);
      const dist = this.toSprite.length();

      // Behind the camera, or effectively at the camera position: hide
      if (dist < 1e-3 || this.toSprite.dot(this.cameraDir) <= 0) {
        sprite.visible = false;
        continue;
      }

      // Perspective projection: pixels per world unit at the sprite's distance
      const pixelsPerUnit = heightPx / (2 * dist * halfFovTan);
      const onScreenRadiusPx = (sprite.scale.x / 2) * pixelsPerUnit;
      sprite.visible = onScreenRadiusPx < threshold;
    }
  }

  dispose(): void {
    for (const sprite of this.sprites) {
      this.scene.remove(sprite);
      sprite.material.dispose();
    }
    this.sprites = [];
    this.texture.dispose();
  }
}
