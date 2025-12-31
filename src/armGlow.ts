import * as THREE from 'three';
import { SimulationSettings } from './settings';

/**
 * Creates a soft glow effect along spiral galaxy arms using sprite particles
 */
export class ArmGlow {
  sprites: THREE.Sprite[] = [];
  private glowTexture: THREE.Texture;
  private settings: SimulationSettings;

  constructor(settings: SimulationSettings) {
    this.settings = settings;
    this.glowTexture = this.createGlowTexture();
  }

  /**
   * Create a radial gradient texture for the glow effect
   */
  private createGlowTexture(): THREE.Texture {
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get 2d context');

    // Create radial gradient from center to edge
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
    gradient.addColorStop(0.3, 'rgba(200, 220, 255, 0.10)');
    gradient.addColorStop(0.6, 'rgba(150, 180, 255, 0.03)');
    gradient.addColorStop(1, 'rgba(100, 150, 255, 0.0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  /**
   * Generate glow sprites along a spiral arm path
   * @param center Galaxy center position
   * @param radius Galaxy radius
   * @param arms Number of spiral arms
   * @param armIndex Which arm to generate glow for (0 to arms-1)
   * @param armCurveFactor Spiral tightness
   * @param armWidthFactor Arm thickness
   * @param scene Scene to add sprites to
   */
  generateArmGlow(
    center: THREE.Vector3,
    radius: number,
    arms: number,
    armIndex: number,
    armCurveFactor: number,
    armWidthFactor: number,
    scene: THREE.Scene
  ): void {
    const baseAngle = (armIndex / arms) * Math.PI * 2;
    const glowCount = Math.floor(radius / this.settings.armGlowSpacing); // One glow sprite per spacing units
    const armWidth = armWidthFactor * radius * 0.07;

    for (let i = 0; i < glowCount; i++) {
      const t = (i + 1) / glowCount;
      const r = this.settings.centralBulgeRadius + t * (radius - this.settings.centralBulgeRadius);
      const angle = baseAngle + armCurveFactor * (r / radius);

      // Create sprite at this position along the arm
      const spriteMaterial = new THREE.SpriteMaterial({
        map: this.glowTexture,
        color: 0x88aaff, // Soft blue-white tint
        transparent: true,
        opacity: 0.4 * t, // Fade towards outer edge
        blending: THREE.AdditiveBlending, // Additive for glow effect
        depthWrite: false,
      });

      const sprite = new THREE.Sprite(spriteMaterial);
      
      // Position along the spiral arm
      const x = center.x + Math.cos(angle) * r;
      const z = center.z + Math.sin(angle) * r;
      const y = center.y;
      sprite.position.set(x, y, z);

      // Scale based on arm width - larger sprites for thicker arms
      const scale = armWidth * 2.5;
      sprite.scale.set(scale, scale, 1);

      this.sprites.push(sprite);
      scene.add(sprite);
    }
  }

  /**
   * Clean up all glow sprites
   */
  dispose(scene: THREE.Scene): void {
    for (const sprite of this.sprites) {
      if (sprite.parent) scene.remove(sprite);
      sprite.material.dispose();
    }
    this.sprites = [];
    this.glowTexture.dispose();
  }
}
