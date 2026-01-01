import { Scene, Vector3 } from 'three';
import * as THREE from 'three';
import { Star, RadioWave, Connection, DustCloud } from './entities';
import { SimulationSettings, GalaxyConfig } from './settings';
import { SpatialGrid } from './spatialGrid';
import { ArmGlow } from './armGlow';

/**
 * Manages the galaxy: stars, waves, and connections.
 * Responsible for creation, updates, and statistics.
 */
export class NetworkManager {
  scene: Scene;
  settings: SimulationSettings;

  stars: Star[] = [];
  waves: RadioWave[] = [];
  connections: Connection[] = [];
  dustClouds: DustCloud[] = [];
  private armGlows: ArmGlow[] = [];
  // Keep last generated galaxy configs so dust generation can align with arms
  private lastGalaxies: Array<{ 
    center: Vector3; 
    radius: number; 
    arms: number; 
    count: number;
    config?: GalaxyConfig;
  }> = [];

  // Spatial partitioning for performance
  private waveGrid: SpatialGrid<RadioWave>;
  private dustGrid: SpatialGrid<DustCloud>;
  private starGrid: SpatialGrid<Star>;

  // Hooks / UI flags expected by main.ts
  onSupernovaFlash?: () => void;
  showWaves: boolean = true;

  constructor(scene: Scene, settings?: SimulationSettings) {
    this.scene = scene;
    // Use fresh settings instead of loading from localStorage to ensure updates apply
    this.settings = settings ?? new SimulationSettings();
    this.settings.sanitize();
    
    // Initialize spatial grids with appropriate cell sizes
    // Wave grid: cell size = max wave radius * 2 for efficient intersection checks
    this.waveGrid = new SpatialGrid<RadioWave>(
      this.settings.waveMaxRadius * 2,
      new Vector3(-1000, -100, -1000),
      new Vector3(1000, 100, 1000)
    );
    
    // Dust grid: cell size based on typical cloud radius
    this.dustGrid = new SpatialGrid<DustCloud>(
      this.settings.dustCloudMinRadius + this.settings.dustCloudRadiusRange,
      new Vector3(-1000, -100, -1000),
      new Vector3(1000, 100, 1000)
    );
    
    // Star grid: cell size = max connection distance for efficient neighbor lookups
    this.starGrid = new SpatialGrid<Star>(
      this.settings.maxConnectionDistance,
      new Vector3(-1000, -100, -1000),
      new Vector3(1000, 100, 1000)
    );
  }

  // Compatibility wrapper expected by main.ts
  initializeGalaxy(_count: number = 1000) {
    this.clearSceneObjects();
    // Create three spiral galaxies with unique characteristics
    this.lastGalaxies = [];
    
    // Use galaxy configs from settings for varied, deterministic galaxies
    for (let i = 0; i < this.settings.galaxyConfigs.length; i++) {
      const config = this.settings.galaxyConfigs[i];
      const center = new Vector3(
        config.position.x,
        config.position.y,
        config.position.z
      );
      // Use per-galaxy star count from config
      const galaxyStarCount = Math.min(config.starCount, this.settings.maxStars);
      this.createSpiralGalaxy(center, galaxyStarCount, config.radius, config.arms, config);
      this.lastGalaxies.push({ 
        center: center.clone(), 
        radius: config.radius, 
        arms: config.arms, 
        count: galaxyStarCount,
        config  // Store config for dust generation
      });
      
      // Generate soft glow for each spiral arm
      const armGlow = new ArmGlow(this.settings);
      for (let armIndex = 0; armIndex < config.arms; armIndex++) {
        armGlow.generateArmGlow(
          center,
          config.radius,
          config.arms,
          armIndex,
          config.armCurveFactor,
          config.armWidthFactor,
          this.scene,
          config.rotation // Pass rotation to arm glow
        );
      }
      this.armGlows.push(armGlow);
    }
  }

  generateDustClouds(count: number) {
    // Helper function to rotate a position by Euler angles
    const rotatePosition = (pos: Vector3, rotation: { x: number; y: number; z: number }): Vector3 => {
      const euler = new THREE.Euler(rotation.x, rotation.y, rotation.z, 'XYZ');
      const quaternion = new THREE.Quaternion().setFromEuler(euler);
      return pos.clone().applyQuaternion(quaternion);
    };
    
    // If we have lastGalaxies recorded, place clouds aligned to their arms
    if (this.lastGalaxies && this.lastGalaxies.length > 0) {
      for (const g of this.lastGalaxies) {
        const perG = Math.max(4, Math.floor(count / (this.lastGalaxies.length || 1)));
        // Use per-galaxy config if available
        const twist = g.config?.armCurveFactor ?? this.settings.armCurveFactor;
        const armWidthFactor = g.config?.armWidthFactor ?? this.settings.armWidthFactor;
        const armWidth = armWidthFactor * (g.radius * this.settings.dustCloudArmWidthMultiplier);

        for (let a = 0; a < g.arms; a++) {
          for (let s = 0; s < Math.ceil(perG / g.arms); s++) {
            // t goes 0..1 along the arm; bias slightly towards outer regions
            const t = Math.max(this.settings.dustCloudRadialStart / 5, Math.pow((s + Math.random()) / (perG / g.arms), this.settings.spiralRadialDistributionPower));
            const r = (this.settings.dustCloudRadialStart + this.settings.dustCloudRadialEnd * t) * g.radius;
            const baseAngle = (a / g.arms) * Math.PI * 2;
            const angle = baseAngle + twist * (r / g.radius) + (Math.random() - 0.5) * this.settings.dustCloudAngleJitter;

            const perp = (Math.random() - 0.5) * armWidth;
            let localPos = new Vector3(
              Math.cos(angle) * r - Math.sin(angle) * perp,
              (Math.random() - 0.5) * this.settings.diskThickness * this.settings.dustCloudThicknessFactor,
              Math.sin(angle) * r + Math.cos(angle) * perp
            );
            
            // Apply galaxy rotation if config provided
            if (g.config?.rotation) {
              localPos = rotatePosition(localPos, g.config.rotation);
            }
            
            const cloudPos = new Vector3(
              g.center.x + localPos.x,
              g.center.y + localPos.y,
              g.center.z + localPos.z
            );

            const rad = this.settings.dustCloudMinRadius + Math.random() * this.settings.dustCloudRadiusRange;
            const cloud = new DustCloud(cloudPos, rad);
            this.dustClouds.push(cloud);
            this.dustGrid.insert(cloud.position, cloud);
            this.scene.add(cloud.mesh);
          }
        }
      }
    } else {
      // Fallback: few scattered clouds
      const perGalaxy = Math.max(6, Math.floor(count / 3));
      const galaxyCenters = [
        new Vector3(-this.settings.diskRadius * 0.6, 0, 0),
        new Vector3(this.settings.diskRadius * 0.6, 0, 0),
        new Vector3(0, 0, this.settings.diskRadius * 0.6),
      ];

      for (const center of galaxyCenters) {
        for (let i = 0; i < perGalaxy; i++) {
          const angle = Math.random() * Math.PI * 2;
          const dist = (Math.random() * 0.6 + 0.4) * (this.settings.diskRadius * 0.2);
          const pos = new Vector3(
            center.x + Math.cos(angle) * dist,
            center.y + (Math.random() - 0.5) * this.settings.diskThickness * this.settings.dustCloudThicknessFactor * this.settings.dustCloudFallbackThicknessMultiplier,
            center.z + Math.sin(angle) * dist
          );
          const r = this.settings.dustCloudMinRadius * this.settings.dustCloudFallbackRadiusMultiplier + Math.random() * this.settings.dustCloudRadiusRange * this.settings.dustCloudFallbackRangeMultiplier;
          const cloud = new DustCloud(pos, r);
          this.dustClouds.push(cloud);
          this.dustGrid.insert(cloud.position, cloud);
          this.scene.add(cloud.mesh);
        }
      }
    }
  }

  /**
   * Create a spiral galaxy at a center point.
   * - center: galaxy center position
   * - count: number of stars
   * - radius: approximate disk radius
   * - arms: number of spiral arms
   * - config: optional per-galaxy configuration overrides
   */
  private createSpiralGalaxy(center: Vector3, count: number, radius: number, arms: number, config?: GalaxyConfig) {
    // Helper function to rotate a position by Euler angles
    const rotatePosition = (pos: Vector3, rotation: { x: number; y: number; z: number }): Vector3 => {
      const euler = new THREE.Euler(rotation.x, rotation.y, rotation.z, 'XYZ');
      const quaternion = new THREE.Quaternion().setFromEuler(euler);
      return pos.clone().applyQuaternion(quaternion);
    };
    
    // Use per-galaxy config if provided, otherwise fall back to global settings
    const twist = config?.armCurveFactor ?? this.settings.armCurveFactor;
    const armWidthFactor = config?.armWidthFactor ?? this.settings.armWidthFactor;
    const armWidth = armWidthFactor * (radius * this.settings.spiralArmWidthMultiplier);
    const bulgeFraction = config?.centralBulgeFraction ?? this.settings.centralBulgeFraction;
    const ageProfile = config?.ageProfile ?? 'middle-aged';
    
    // Calculate how many stars go in the central bulge vs spiral arms
    const bulgeCount = Math.floor(count * bulgeFraction);
    const armCount = count - bulgeCount;

    // Generate central bulge stars (dense spherical distribution)
    for (let i = 0; i < bulgeCount; i++) {
      // Spherical distribution within centralBulgeRadius
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = Math.pow(Math.random(), 0.5) * this.settings.centralBulgeRadius;
      
      let localPos = new Vector3(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      );
      
      // Apply galaxy rotation if config provided
      if (config?.rotation) {
        localPos = rotatePosition(localPos, config.rotation);
      }
      
      const x = center.x + localPos.x;
      const y = center.y + localPos.y;
      const z = center.z + localPos.z;
      
      // Bulge stars follow galaxy age profile, mostly old
      const profile = ageProfile === 'young' ? (Math.random() < this.settings.youngStarBulgeProbability ? 'young' : 'middle-aged') : 
                     (Math.random() < this.settings.spiralOldStarProbability ? 'old' : 'middle-aged');
      const star = new Star(new Vector3(x, y, z), center, profile, this.settings);
      this.stars.push(star);
      this.scene.add(star.mesh);
    }

    // Generate spiral arm stars
    for (let i = 0; i < armCount; i++) {
      // radial distribution biased towards center, starting outside bulge
      const t = Math.pow(Math.random(), this.settings.spiralRadialDistributionPower);
      const r = this.settings.centralBulgeRadius + t * (radius - this.settings.centralBulgeRadius);
      const armIndex = Math.floor(Math.random() * arms);
      const baseAngle = (armIndex / arms) * Math.PI * 2;

      // angle follows a logarithmic-ish spiral
      const angle = baseAngle + twist * (r / radius) + (Math.random() - 0.5) * this.settings.spiralAngleJitter;

      // position with small perpendicular noise to create arm thickness
      const perpNoise = (Math.random() - 0.5) * armWidth;
      let localPos = new Vector3(
        Math.cos(angle) * r - Math.sin(angle) * perpNoise,
        (Math.random() - 0.5) * this.settings.diskThickness,
        Math.sin(angle) * r + Math.cos(angle) * perpNoise
      );
      
      // Apply galaxy rotation if config provided
      if (config?.rotation) {
        localPos = rotatePosition(localPos, config.rotation);
      }
      
      const x = center.x + localPos.x;
      const y = center.y + localPos.y;
      const z = center.z + localPos.z;

      // Star color distribution based on galaxy age profile
      let profile: 'young' | 'middle-aged' | 'old';
      if (ageProfile === 'young') {
        // Young galaxies have more young stars in arms
        profile = r < radius * this.settings.spiralYoungStarRadiusFraction ? 'young' : 
                 (Math.random() < this.settings.youngGalaxyYoungStarProbability ? 'young' : 'middle-aged');
      } else if (ageProfile === 'old') {
        // Old galaxies have mostly old stars
        profile = Math.random() < this.settings.oldGalaxyOldStarProbability ? 'old' : 'middle-aged';
      } else {
        // Middle-aged: standard distribution
        profile = r < radius * this.settings.spiralYoungStarRadiusFraction ? 'young' : 
                 (Math.random() < this.settings.spiralYoungStarProbability ? 'young' : 'middle-aged');
      }
      
      const star = new Star(new Vector3(x, y, z), center, profile, this.settings);
      this.stars.push(star);
      this.scene.add(star.mesh);
    }
  }

  update(deltaTime: number) {
    // Update stars and emit waves when stars trigger emissions
    for (const star of this.stars) {
      star.update(deltaTime);
      if (star.consumeEmission()) {
        const wave = new RadioWave(star, this.settings);
        this.addWave(wave);
      }

      // Handle supernova trigger
      if (star.isGoingSupernova) {
        star.isGoingSupernova = false;
        if (this.onSupernovaFlash) this.onSupernovaFlash();
      }
    }

    // Remove dead stars and their connections
    const deadStars = new Set<number>();
    for (let i = this.stars.length - 1; i >= 0; i--) {
      const star = this.stars[i];
      if (!star.isAlive()) {
        deadStars.add(star.id);
        // Properly dispose of Three.js resources
        star.mesh.geometry.dispose();
        (star.mesh.material as THREE.Material).dispose();
        if (star.mesh.parent) this.scene.remove(star.mesh);
        // Remove point light if it exists
        if (star.mesh.children.length > 0) {
          const light = star.mesh.children[0];
          if (light.parent) star.mesh.remove(light);
        }
        this.stars.splice(i, 1);
      }
    }

    // Star birth: occasionally spawn new stars at low rate
    if (this.stars.length < this.settings.maxStars && 
        this.stars.length < this.settings.starBirthPopulationThreshold) {
      // Random chance based on replacement ratio
      if (Math.random() < this.settings.starBirthReplacementRatio * deltaTime / this.settings.starBirthTimeDivisor) {
        // Spawn in a random galaxy
        const galaxyIndex = Math.floor(Math.random() * this.lastGalaxies.length);
        const galaxy = this.lastGalaxies[galaxyIndex];
        if (galaxy.config) {
          this.createSpiralGalaxy(galaxy.config, 1); // Spawn just 1 star
        }
      }
    }

    // Remove connections where either star has become inactive or dead
    for (let i = this.connections.length - 1; i >= 0; i--) {
      const conn = this.connections[i];
      if (!conn.star1.isActive || !conn.star2.isActive || 
          deadStars.has(conn.star1.id) || deadStars.has(conn.star2.id)) {
        // Properly dispose of Three.js resources
        if (conn.line) {
          conn.line.geometry.dispose();
          (conn.line.material as THREE.Material).dispose();
          if (conn.line.parent) this.scene.remove(conn.line);
        }
        this.connections.splice(i, 1);
      }
    }

    // Update waves and remove finished ones
    for (let i = this.waves.length - 1; i >= 0; i--) {
      const wave = this.waves[i];
      wave.update(deltaTime);
      if (!wave.isActive) {
        // Properly dispose of Three.js resources
        if (wave.line) {
          wave.line.geometry.dispose();
          (wave.line.material as THREE.Material).dispose();
          if (wave.line.parent) this.scene.remove(wave.line);
        }
        this.waves.splice(i, 1);
      }
    }

    // Rebuild wave grid each frame (waves are constantly moving/growing)
    this.waveGrid.clear();
    for (const wave of this.waves) {
      this.waveGrid.insert(wave.origin, wave);
    }
    
    // Rebuild star grid with active stars
    this.starGrid.clear();
    const activeStars = this.stars.filter(s => s.isActive && s.activationTime !== null);
    for (const star of activeStars) {
      this.starGrid.insert(star.position, star);
    }

    // Check for two-way handshake between active stars using spatial grid
    // Both stars must have had enough time for their signals to reach the other and return
    const currentTime = Date.now() / 1000;
    const checkedPairs = new Set<string>();
    
    for (const starA of activeStars) {
      // Only check nearby stars using spatial grid (much faster than O(n²))
      const nearbyStars = this.starGrid.queryRadius(starA.position, this.settings.maxConnectionDistance);
      
      for (const starB of nearbyStars) {
        if (starA === starB) continue;
        
        // Create consistent pair key using star IDs to avoid duplicate checks
        const minId = Math.min(starA.id, starB.id);
        const maxId = Math.max(starA.id, starB.id);
        const pairKey = `${minId}-${maxId}`;
        if (checkedPairs.has(pairKey)) continue;
        checkedPairs.add(pairKey);
        
        // Calculate distance between stars
        const distance = starA.position.distanceTo(starB.position);
        
        // Skip if too far apart
        if (distance > this.settings.maxConnectionDistance) continue;
        
        // Calculate time needed for signal to travel to other star and back (2x distance)
        const timeForRoundTrip = (2 * distance) / this.settings.waveSpeed;
        
        // Check if both stars have been active long enough
        if (starA.activationTime === null || starB.activationTime === null) continue;
        const starAActiveTime = currentTime - starA.activationTime;
        const starBActiveTime = currentTime - starB.activationTime;
        
        if (starAActiveTime >= timeForRoundTrip && starBActiveTime >= timeForRoundTrip) {
          this.createConnection(starA, starB);
        }
      }
    }

    // Apply dust obscuration using spatial grid (much faster than O(n×m))
    for (const star of this.stars) {
      // Only check nearby dust clouds using spatial grid
      const nearbyClouds = this.dustGrid.queryRadius(star.position, this.settings.dustCloudMinRadius + this.settings.dustCloudRadiusRange);
      let isObscured = false;
      for (const cloud of nearbyClouds) {
        const dx = star.position.x - cloud.position.x;
        const dz = star.position.z - cloud.position.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist <= cloud.radius) {
          isObscured = true;
          break;
        }
      }
      star.applyDustObscuration(isObscured, false);
    }
  }

  addWave(wave: RadioWave) {
    this.waves.push(wave);
    this.scene.add(wave.line);
    wave.line.visible = this.showWaves;
  }

  createConnection(starA: Star, starB: Star) {
    // Check if connection already exists using star IDs
    const existingConnection = this.connections.some(c => 
      (c.star1.id === starA.id && c.star2.id === starB.id) || 
      (c.star1.id === starB.id && c.star2.id === starA.id)
    );
    if (existingConnection) return;
    
    // Check distance limit from settings
    const distance = starA.position.distanceTo(starB.position);
    if (distance > this.settings.maxConnectionDistance) return;
    
    // Check if either star is inside a dust cloud
    if (this.isStarInDustCloud(starA) || this.isStarInDustCloud(starB)) return;
    
    // Check if connection would pass through a dust cloud
    if (this.isBlockedByDust(starA.position, starB.position)) return;
    
    const conn = new Connection(starA, starB);
    this.connections.push(conn);
    this.scene.add(conn.line);
  }

  /**
   * Check if a star is inside a dust cloud
   */
  private isStarInDustCloud(star: Star): boolean {
    for (const cloud of this.dustClouds) {
      const distance = star.position.distanceTo(cloud.position);
      if (distance < cloud.radius) return true;
    }
    return false;
  }

  /**
   * Check if a line segment between two points passes through any dust cloud
   */
  private isBlockedByDust(pointA: Vector3, pointB: Vector3): boolean {
    const direction = new Vector3().subVectors(pointB, pointA);
    const length = direction.length();
    direction.normalize();
    
    for (const cloud of this.dustClouds) {
      // Check if line segment intersects with dust cloud sphere
      const toCloud = new Vector3().subVectors(cloud.position, pointA);
      const projectionLength = toCloud.dot(direction);
      
      // If projection is outside the segment, skip
      if (projectionLength < 0 || projectionLength > length) continue;
      
      // Find closest point on line segment to cloud center
      const closestPoint = new Vector3().copy(pointA).addScaledVector(direction, projectionLength);
      const distanceToCloud = closestPoint.distanceTo(cloud.position);
      
      // If line passes through cloud sphere, connection is blocked
      if (distanceToCloud < cloud.radius) return true;
    }
    
    return false;
  }

  getStats() {
    const activeStars = this.stars.filter(s => s.isActive).length;
    return {
      starCount: this.stars.length,
      activeStars,
      waveCount: this.waves.length,
      connectionCount: this.connections.length,
    };
  }

  get radioWaves() {
    return this.waves;
  }

  reset() {
    this.clearSceneObjects();
  }

  private clearSceneObjects() {
    // Dispose arm glows
    for (const armGlow of this.armGlows) {
      armGlow.dispose(this.scene);
    }
    this.armGlows = [];
    
    // Properly dispose of all Three.js resources to prevent memory leaks
    for (const star of this.stars) {
      if (star.mesh) {
        star.mesh.geometry.dispose();
        (star.mesh.material as THREE.Material).dispose();
        if (star.mesh.parent) this.scene.remove(star.mesh);
      }
    }
    for (const wave of this.waves) {
      if (wave.line) {
        wave.line.geometry.dispose();
        (wave.line.material as THREE.Material).dispose();
        if (wave.line.parent) this.scene.remove(wave.line);
      }
    }
    for (const conn of this.connections) {
      if (conn.line) {
        conn.line.geometry.dispose();
        (conn.line.material as THREE.Material).dispose();
        if (conn.line.parent) this.scene.remove(conn.line);
      }
    }
    for (const cloud of this.dustClouds) {
      if (cloud.mesh) {
        cloud.mesh.geometry.dispose();
        (cloud.mesh.material as THREE.Material).dispose();
        if (cloud.mesh.parent) this.scene.remove(cloud.mesh);
      }
    }
    this.stars = [];
    this.waves = [];
    this.connections = [];
    this.dustClouds = [];
    this.waveGrid.clear();
    this.dustGrid.clear();
    this.starGrid.clear();
  }

  /**
   * Return a sample position along a given galaxy arm.
   * galaxyIndex: index into lastGalaxies (0 = first galaxy)
   * armIndex: which arm (0..arms-1)
   * t: fraction along arm (0..1)
   */
  getArmPosition(galaxyIndex: number = 0, armIndex: number = 0, t: number = 0.5) {
    const g = this.lastGalaxies && this.lastGalaxies[galaxyIndex];
    if (!g) return null;
    const r = Math.max(0, Math.min(1, t)) * g.radius;
    const baseAngle = (armIndex % g.arms) / g.arms * Math.PI * 2;
    // Use per-galaxy config if available, otherwise fall back to global settings
    const twist = g.config?.armCurveFactor ?? this.settings.armCurveFactor;
    const angle = baseAngle + twist * (r / g.radius);
    const perp = 0; // center line of arm
    const x = g.center.x + Math.cos(angle) * r - Math.sin(angle) * perp;
    const z = g.center.z + Math.sin(angle) * r + Math.cos(angle) * perp;
    const y = g.center.y;
    return new Vector3(x, y, z);
  }
}

export default NetworkManager;
