import * as THREE from 'three';
import { SimulationSettings } from './settings';

/**
 * Represents a star system with planets
 */
export class Star {
  static nextId: number = 0;
  id: number;
  position: THREE.Vector3;
  galaxyCenter: THREE.Vector3; // Center of this star's galaxy
  color: THREE.Color;
  baseColor: THREE.Color; // Original color before dust obscuration
  mesh: THREE.Mesh;
  age: number;
  lifetime: number;
  hasDormantPlanet: boolean; // Track if star went dormant
  isActive: boolean;
  activationTime: number | null;
  emissionTimer: number;
  emissionInterval: number;
  isEmitting: boolean;
  canSupportLife: boolean; // 70% of stars can support life
  isGoingSupernova: boolean; // Flag for supernova event
  isObscured: boolean; // Currently in dust cloud
  settings: SimulationSettings;

  constructor(position: THREE.Vector3, galaxyCenter: THREE.Vector3 = new THREE.Vector3(0, 0, 0), colorProfile: 'middle-aged' | 'young' | 'old' = 'middle-aged', settings?: SimulationSettings) {
    this.id = Star.nextId++;
    this.position = position;
    this.galaxyCenter = galaxyCenter.clone();
    this.settings = settings || new SimulationSettings();
    this.color = this.generateStarColor(colorProfile);
    this.baseColor = this.color.clone(); // Store original color
    this.mesh = this.createStarMesh();
    this.age = 0;
    this.lifetime = this.settings.starMinLifetime + Math.random() * this.settings.starLifetimeRange;
    this.hasDormantPlanet = false;
    
    // Probability that star can support life
    this.canSupportLife = Math.random() > (1 - this.settings.starLifeSupportProbability);
    
    // Activation state
    this.isActive = false;
    this.activationTime = null;
    
    // Emission timing
    this.emissionTimer = Math.random() * this.settings.starEmissionIntervalRange;
    this.emissionInterval = Math.random() * this.settings.starEmissionIntervalRange + this.settings.starEmissionMinInterval;
    this.isEmitting = false;
    this.isGoingSupernova = false;
    this.isObscured = false;
  }

  private generateStarColor(colorProfile: 'middle-aged' | 'young' | 'old' = 'middle-aged'): THREE.Color {
    // Realistic spectral type distribution based on H-R diagram
    const rand = Math.random();
    
    // Adjust distribution based on galaxy age
    if (colorProfile === 'old') {
      // Old galaxy: More red/orange stars (60% red, 25% orange, 15% others)
      if (rand < 0.60) {
        return new THREE.Color().setHSL(0.0 + Math.random() * 0.05, 1.0, 0.4); // M-type red
      } else if (rand < 0.85) {
        return new THREE.Color().setHSL(0.05 + Math.random() * 0.08, 0.9, 0.5); // K-type orange
      } else if (rand < 0.95) {
        return new THREE.Color().setHSL(0.13 + Math.random() * 0.05, 0.8, 0.65); // G-type yellow
      } else {
        return new THREE.Color().setHSL(0.15 + Math.random() * 0.05, 0.5, 0.8); // F-type
      }
    } else if (colorProfile === 'young') {
      // Young galaxy: More blue/white stars (30% red, 20% orange, 30% yellow-white, 20% blue-white)
      if (rand < 0.30) {
        return new THREE.Color().setHSL(0.0 + Math.random() * 0.05, 1.0, 0.4); // M-type red
      } else if (rand < 0.50) {
        return new THREE.Color().setHSL(0.05 + Math.random() * 0.08, 0.9, 0.5); // K-type orange
      } else if (rand < 0.65) {
        return new THREE.Color().setHSL(0.13 + Math.random() * 0.05, 0.8, 0.65); // G-type yellow
      } else if (rand < 0.80) {
        return new THREE.Color().setHSL(0.15 + Math.random() * 0.05, 0.5, 0.8); // F-type yellow-white
      } else if (rand < 0.90) {
        return new THREE.Color().setHSL(0.55, 0.2, 0.95); // A-type white
      } else if (rand < 0.97) {
        return new THREE.Color().setHSL(0.58, 0.6, 0.85); // B-type blue-white
      } else {
        return new THREE.Color().setHSL(0.6 + Math.random() * 0.05, 0.9, 0.7); // O-type blue
      }
    } else {
      // Middle-aged galaxy: Standard distribution (76% red, 12% orange, 8% yellow, 4% others)
      if (rand < 0.76) {
        return new THREE.Color().setHSL(0.0 + Math.random() * 0.05, 1.0, 0.4); // M-type red
      } else if (rand < 0.88) {
        return new THREE.Color().setHSL(0.05 + Math.random() * 0.08, 0.9, 0.5); // K-type orange
      } else if (rand < 0.96) {
        return new THREE.Color().setHSL(0.13 + Math.random() * 0.05, 0.8, 0.65); // G-type yellow
      } else if (rand < 0.99) {
        return new THREE.Color().setHSL(0.15 + Math.random() * 0.05, 0.5, 0.8); // F-type
      } else if (rand < 0.996) {
        return new THREE.Color().setHSL(0.55, 0.2, 0.95); // A-type white
      } else if (rand < 0.999) {
        return new THREE.Color().setHSL(0.58, 0.6, 0.85); // B-type blue-white
      } else {
        return new THREE.Color().setHSL(0.6 + Math.random() * 0.05, 0.9, 0.7); // O-type blue
      }
    }
  }

  private createStarMesh(): THREE.Mesh {
    const geometry = new THREE.SphereGeometry(
      this.settings.starGeometryRadius, 
      this.settings.starGeometrySegments, 
      this.settings.starGeometrySegments
    );
    const material = new THREE.MeshBasicMaterial({ 
      color: this.color,
      transparent: true,
      opacity: this.settings.clearOpacity
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(this.position);
    
    // No light by default - only add when star becomes active for performance
    
    return mesh;
  }

  /**
   * Add a point light to make active stars glow brightly
   */
  addLight(): void {
    // Only add if not already present
    if (this.mesh.children.length === 0) {
      const light = new THREE.PointLight(
        this.baseColor, 
        this.settings.activeStarLightIntensity, 
        10
      );
      this.mesh.add(light);
    }
  }

  /**
   * Remove point light to save performance when star goes dormant
   */
  removeLight(): void {
    if (this.mesh.children.length > 0) {
      const light = this.mesh.children[0];
      this.mesh.remove(light);
      (light as THREE.PointLight).dispose();
    }
  }

  update(deltaTime: number): void {
    this.age += deltaTime;
    
    // Check for supernova at end of life (only 0.05% of stars go supernova)
    if (this.age >= this.lifetime && !this.isGoingSupernova) {
      if (Math.random() < this.settings.activationChance) {
        this.isGoingSupernova = true;
        return;
      }
    }
    
    // Visual indication of aging
    const lifeFraction = this.age / this.lifetime;
    if (lifeFraction > this.settings.starAgingThreshold) {
      const fadeFactor = 1 - (lifeFraction - this.settings.starAgingThreshold) * this.settings.starAgingFadeFactor;
      (this.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(this.settings.starMinAgingOpacity, fadeFactor * this.settings.clearOpacity);
    }
    
    // Check civilization emergence
    if (!this.isActive && !this.hasDormantPlanet && this.canSupportLife) {
      // Don't activate stars in central bulge (too much radiation)
      // Cache distance calculation for reuse
      const dx = this.position.x - this.galaxyCenter.x;
      const dz = this.position.z - this.galaxyCenter.z;
      const distanceFromCenter = Math.sqrt(dx * dx + dz * dz);
      if (distanceFromCenter >= this.settings.minDistanceFromCenter && Math.random() < this.settings.activationChance * deltaTime) {
        this.isActive = true;
        this.activationTime = Date.now() / 1000;
        this.emissionTimer = 0; // Emit first wave immediately
        
        // Make active stars larger and add bright light
        this.mesh.scale.set(this.settings.activeStarScale, this.settings.activeStarScale, this.settings.activeStarScale);
        this.addLight(); // Create light only when active
        
        // Brighten color for active stars
        const material = this.mesh.material as THREE.MeshBasicMaterial;
        material.color = this.baseColor.clone().multiplyScalar(this.settings.activeStarColorMultiplier);
      }
    } else if (this.isActive) {
      // Check for dormancy
      if (Math.random() < this.settings.deactivationChance * deltaTime) {
        this.isActive = false;
        this.isEmitting = false;
        this.activationTime = null;
        this.hasDormantPlanet = true;
        
        // Reset scale and remove light
        this.mesh.scale.set(1, 1, 1);
        this.removeLight();
        
        // Reset color to normal
        const material = this.mesh.material as THREE.MeshBasicMaterial;
        material.color.copy(this.baseColor);
      }
      
      // Update emission timer for active stars
      this.emissionTimer -= deltaTime;
      if (this.emissionTimer <= 0) {
        // Only emit if not in central bulge (too much radiation)
        // Reuse distance calculation from activation check
        const dx = this.position.x - this.galaxyCenter.x;
        const dz = this.position.z - this.galaxyCenter.z;
        const distanceFromCenter = Math.sqrt(dx * dx + dz * dz);
        if (distanceFromCenter >= this.settings.minDistanceFromCenter) {
          this.isEmitting = true;
        }
        this.emissionTimer = this.emissionInterval;
      }
    }
  }
  
  consumeEmission(): boolean {
    const wasEmitting = this.isEmitting;
    this.isEmitting = false;
    return wasEmitting;
  }
  
  isAlive(): boolean {
    return this.age < this.lifetime;
  }

  applyDustObscuration(insideCloud: boolean, behindCloud: boolean = false): void {
    const obscured = insideCloud || behindCloud;
    if (obscured === this.isObscured) return;
    
    this.isObscured = obscured;
    const material = this.mesh.material as THREE.MeshBasicMaterial;
    const light = this.mesh.children[0] as THREE.PointLight | undefined;
    
    if (behindCloud) {
      // Star is behind cloud from camera: make almost invisible
      material.opacity = this.settings.behindCloudOpacity;
      const dimmedColor = this.baseColor.clone().multiplyScalar(0.1);
      dimmedColor.r = Math.min(1, dimmedColor.r * 2.0);
      material.color.copy(dimmedColor);
      if (light) light.intensity = this.settings.behindCloudLightIntensity;
    } else if (insideCloud) {
      // Star is inside cloud: significantly dimmed
      material.opacity = this.settings.insideCloudOpacity;
      const dimmedColor = this.baseColor.clone().multiplyScalar(0.3);
      dimmedColor.r = Math.min(1, dimmedColor.r * 1.5);
      material.color.copy(dimmedColor);
      if (light) light.intensity = this.settings.insideCloudLightIntensity;
    } else {
      // Restore original appearance
      material.opacity = this.settings.clearOpacity;
      // Restore appropriate color based on active state
      if (this.isActive) {
        material.color = this.baseColor.clone().multiplyScalar(this.settings.activeStarColorMultiplier);
      } else {
        material.color.copy(this.baseColor);
      }
      if (light) light.intensity = this.settings.activeStarLightIntensity;
    }
  }
}

/**
 * Represents an expanding radio wave from a star
 */
export class RadioWave {
  star: Star;
  origin: THREE.Vector3;
  radius: number;
  maxRadius: number;
  speed: number;
  line: THREE.Line;
  isActive: boolean;
  settings: SimulationSettings;

  constructor(star: Star, settings?: SimulationSettings) {
    this.star = star;
    this.origin = star.position.clone();
    this.radius = 0;
    this.settings = settings || new SimulationSettings();
    this.maxRadius = this.settings.waveMaxRadius;
    this.speed = this.settings.waveSpeed;
    this.isActive = true;
    this.line = this.createWaveLine();
  }

  private createWaveLine(): THREE.Line {
    // Create circle geometry with just the outer edge
    const segments = this.settings.waveSegments;
    const points: THREE.Vector3[] = [];
    
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      points.push(new THREE.Vector3(
        Math.cos(theta),
        0,
        Math.sin(theta)
      ));
    }
    
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: this.settings.waveColor,
      transparent: true,
      opacity: this.settings.waveOpacity
    });
    const line = new THREE.Line(geometry, material);
    line.position.copy(this.origin);
    return line;
  }

  update(deltaTime: number): void {
    this.radius += this.speed * deltaTime;
    
    if (this.radius >= this.maxRadius) {
      this.isActive = false;
      return;
    }
    
    // Update line scale
    this.line.scale.set(this.radius, 1, this.radius);
    
    // Fade out as it expands
    const material = this.line.material as THREE.LineBasicMaterial;
    material.opacity = 0.6 * (1 - this.radius / this.maxRadius);
  }
}

/**
 * Connection between two star systems
 */
export class Connection {
  star1: Star;
  star2: Star;
  line: THREE.Line;

  constructor(star1: Star, star2: Star) {
    this.star1 = star1;
    this.star2 = star2;
    this.line = this.createLine();
  }

  private createLine(): THREE.Line {
    const points = [this.star1.position, this.star2.position];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: 0x00ff00,
      transparent: true,
      opacity: 0.6,
      linewidth: 2
    });
    return new THREE.Line(geometry, material);
  }
}

/**
 * Interstellar dust cloud that blocks communication
 */
export class DustCloud {
  position: THREE.Vector3;
  radius: number;
  mesh: THREE.Mesh;

  constructor(position: THREE.Vector3, radius: number) {
    this.position = position;
    this.radius = radius;
    this.mesh = this.createMesh();
  }

  private createMesh(): THREE.Mesh {
    // Create irregular, lumpy cloud shape
    const geometry = new THREE.SphereGeometry(this.radius, 8, 8);
    
    // Distort vertices for irregular appearance
    const positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const vertex = new THREE.Vector3(
        positions.getX(i),
        positions.getY(i),
        positions.getZ(i)
      );
      const noise = 0.3 + Math.random() * 0.4; // Random size variation per vertex
      vertex.multiplyScalar(noise);
      positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }
    geometry.computeVertexNormals();
    
    const material = new THREE.MeshBasicMaterial({
      color: 0x3a2810,
      transparent: true,
      opacity: 0.6,
      fog: true
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(this.position);
    return mesh;
  }

  /**
   * Check if a line segment intersects this dust cloud
   */
  intersectsLine(start: THREE.Vector3, end: THREE.Vector3): boolean {
    // Vector from start to end
    const d = new THREE.Vector3().subVectors(end, start);
    const f = new THREE.Vector3().subVectors(start, this.position);
    
    const a = d.dot(d);
    const b = 2 * f.dot(d);
    const c = f.dot(f) - this.radius * this.radius;
    
    let discriminant = b * b - 4 * a * c;
    
    if (discriminant < 0) {
      return false; // No intersection
    }
    
    discriminant = Math.sqrt(discriminant);
    const t1 = (-b - discriminant) / (2 * a);
    const t2 = (-b + discriminant) / (2 * a);
    
    // Check if intersection is within the line segment
    return (t1 >= 0 && t1 <= 1) || (t2 >= 0 && t2 <= 1) || (t1 < 0 && t2 > 1);
  }  
  /**
   * Check if a ray from camera intersects this dust cloud before reaching the star
   */
  intersectsRay(rayOrigin: THREE.Vector3, rayDirection: THREE.Vector3, maxDistance: number): boolean {
    // Ray-sphere intersection test
    const toCloud = this.position.clone().sub(rayOrigin);
    const projection = toCloud.dot(rayDirection);
    
    // Cloud is behind ray origin
    if (projection < 0) return false;
    
    // Cloud is beyond the target star
    if (projection > maxDistance) return false;
    
    // Check perpendicular distance from ray to cloud center
    const closestPoint = rayOrigin.clone().add(rayDirection.clone().multiplyScalar(projection));
    const distance = closestPoint.distanceTo(this.position);
    
    return distance <= this.radius;
  }}
