/**
 * Centralized settings for the simulation
 * All "magic numbers" are configured here
 */

/**
 * Configuration for individual galaxy characteristics
 */
export interface GalaxyConfig {
  position: { x: number; y: number; z: number };
  radius: number;
  arms: number;
  armCurveFactor: number;  // Spiral tightness
  armWidthFactor: number;  // Arm thickness
  centralBulgeFraction: number; // Bulge size
  ageProfile: 'young' | 'middle-aged' | 'old'; // Star population age
  starCount: number; // Number of stars in this galaxy
  rotation: { x: number; y: number; z: number }; // Galaxy orientation in radians
}

export class SimulationSettings {
  // Star Activation/Deactivation
  activationChance: number = 0.0005;
  deactivationChance: number = 0.0005;

  // Galaxy Structure (global defaults for fallback)
  centralBulgeRadius: number = 50;
  minDistanceFromCenter: number = 50;
  diskRadius: number = 500;
  diskThickness: number = 10;
  // Note: armCurveFactor, armWidthFactor, centralBulgeFraction are now per-galaxy in galaxyConfigs
  // These remain as fallbacks for any legacy code
  centralBulgeFraction: number = 0.15;
  armWidthFactor: number = 5.5;
  armCurveFactor: number = 5;

  // Active Star Visuals
  activeStarScale: number = 1.5;
  activeStarColorMultiplier: number = 1.5;
  activeStarLightIntensity: number = 4;

  // Dust Obscuration Opacities
  behindCloudOpacity: number = 0.05;
  insideCloudOpacity: number = 0.2;
  clearOpacity: number = 0.9;
  behindCloudLightIntensity: number = 0.05;
  insideCloudLightIntensity: number = 0.2;

  // Radio Waves
  waveSpeed: number = 5;
  waveMaxRadius: number = 30;
  waveColor: string = '#00ffff';
  waveOpacity: number = 0.6;
  waveSegments: number = 64;

  // Network Connections
  // Maximum distance is 40% of spiral arm width to keep connections within same arm
  // Use the first galaxy's config as reference (the one in initial view)
  get maxConnectionDistance(): number {
    const config = this.galaxyConfigs[0];
    return config.armWidthFactor * config.radius * this.spiralArmWidthMultiplier * 0.4;
  }

  // Star Birth
  starBirthReplacementRatio: number = 0.10;  // Low rate so simulation eventually ends
  starBirthPopulationThreshold: number = 5000;
  maxStars: number = 50000;

  // Star Appearance
  starGeometryRadius: number = 0.15;
  starGeometrySegments: number = 12;

  // Galaxy Layout (fixed positions for deterministic galaxies)
  // Each galaxy has unique characteristics for variety
  galaxyConfigs: GalaxyConfig[] = [
    // Galaxy 0: The one in initial view - keep as original
    {
      position: { x: -450, y: -120, z: -150 },
      radius: 200,
      arms: 3,
      armCurveFactor: 5,
      armWidthFactor: 5.5,
      centralBulgeFraction: 0.15,
      ageProfile: 'middle-aged',
      starCount: 15000,
      rotation: { x: 0.2, y: 0.3, z: 0.1 } // Slight tilt for viewing angle
    },
    // Galaxy 1: Larger elliptical-like spiral with tight arms
    {
      position: { x: 450, y: 180, z: -150 },
      radius: 240,
      arms: 2,
      armCurveFactor: 7,  // Tighter spiral
      armWidthFactor: 4.0,  // Thinner arms
      centralBulgeFraction: 0.25,  // Larger bulge
      ageProfile: 'old',
      starCount: 10000,
      rotation: { x: 1.4, y: -0.5, z: 0.8 } // Nearly edge-on view
    },
    // Galaxy 2: Young barred spiral with loose arms
    {
      position: { x: 0, y: 60, z: 450 },
      radius: 180,
      arms: 4,
      armCurveFactor: 3.5,  // Looser spiral
      armWidthFactor: 6.5,  // Thicker arms
      centralBulgeFraction: 0.10,  // Smaller bulge
      ageProfile: 'young',
      starCount: 15000,
      rotation: { x: -0.6, y: 0.9, z: -0.4 } // Tilted at different angle
    }
  ];
  
  // Initial Simulation Parameters
  initialStarCount: number = 40000;
  initialDustCloudCount: number = 243;
  
  // Star Lifecycle
  starMinLifetime: number = 60;
  starLifetimeRange: number = 120;
  starLifeSupportProbability: number = 0.4; // 40% can support life
  starEmissionMinInterval: number = 5;
  starEmissionIntervalRange: number = 10;
  starAgingThreshold: number = 0.8; // Start fading at 80% of lifetime
  starAgingFadeFactor: number = 5;
  starMinAgingOpacity: number = 0.3;
  
  // Dust Cloud Generation
  dustCloudMinRadius: number = 2.7075;
  dustCloudRadiusRange: number = 9.025;
  dustCloudArmWidthMultiplier: number = 0.06;
  dustCloudRadialStart: number = 0.25; // Start at 25% of galaxy radius
  dustCloudRadialEnd: number = 0.75; // End at 75% coverage
  dustCloudAngleJitter: number = 0.15;
  dustCloudThicknessFactor: number = 0.5;
  
  // Spiral Arm Generation
  spiralArmWidthMultiplier: number = 0.07;
  spiralRadialDistributionPower: number = 0.8;
  spiralAngleJitter: number = 0.4;
  spiralYoungStarRadiusFraction: number = 0.35; // Stars within 35% radius are young
  spiralYoungStarProbability: number = 0.25;
  spiralOldStarProbability: number = 0.8;
  
  // Camera Settings
  cameraInitialArmPosition: number = 0.65; // Position along spiral arm (0-1)
  cameraInitialHeight: number = 60;
  cameraFOV: number = 50;
  cameraNear: number = 0.1;
  cameraFar: number = 5000;
  
  // Camera Controls
  controlsDampingFactor: number = 0.05;
  controlsMinDistance: number = 10;
  controlsMaxDistance: number = 5000;
  controlsKeyPanSpeed: number = 50;
  
  // Background Starfield
  backgroundStarCount: number = 1500;
  backgroundStarSpread: number = 4000;
  backgroundStarSize: number = 0.5;
  backgroundStarOpacity: number = 0.4;
  
  // Dust Cloud Scaling (for fallback generation)
  dustCloudFallbackRadiusMultiplier: number = 2.7;
  dustCloudFallbackRangeMultiplier: number = 2.4;
  dustCloudFallbackThicknessMultiplier: number = 1.6;
  
  // Star Population Distribution
  youngStarBulgeProbability: number = 0.3; // Probability young stars appear in bulge
  youngGalaxyYoungStarProbability: number = 0.6; // Higher young star rate in young galaxies
  oldGalaxyOldStarProbability: number = 0.7; // Higher old star rate in old galaxies
  
  // Star Birth Timing
  starBirthTimeDivisor: number = 60; // Divisor for birth rate calculation (seconds)
  
  // Arm Glow Visual
  armGlowSpacing: number = 8; // Units between glow sprites along spiral arms

  private static readonly STORAGE_KEY = 'cosmicNetworkSimSettings';

  /**
   * Load settings from localStorage or return defaults
   */
  static load(): SimulationSettings {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const settings = new SimulationSettings();
        Object.assign(settings, parsed);
        return settings;
      }
    } catch (e) {
      console.warn('Failed to load settings from localStorage:', e);
    }
    return new SimulationSettings();
  }

  /**
   * Save settings to localStorage
   */
  save(): void {
    try {
      localStorage.setItem(SimulationSettings.STORAGE_KEY, JSON.stringify(this));
    } catch (e) {
      console.error('Failed to save settings to localStorage:', e);
    }
  }

  /**
   * Reset to default values
   */
  reset(): void {
    const defaults = new SimulationSettings();
    Object.assign(this, defaults);
  }

  /**
   * Validate all settings and return validation errors
   */
  validate(): { field: string; error: string }[] {
    const errors: { field: string; error: string }[] = [];

    // Validate probabilities (0 to 1, exclusive)
    if (this.activationChance <= 0 || this.activationChance >= 1) {
      errors.push({ field: 'activationChance', error: 'Must be between 0 and 1' });
    }
    if (this.deactivationChance <= 0 || this.deactivationChance >= 1) {
      errors.push({ field: 'deactivationChance', error: 'Must be between 0 and 1' });
    }

    // Validate positive numbers
    if (this.centralBulgeRadius <= 0) {
      errors.push({ field: 'centralBulgeRadius', error: 'Must be positive' });
    }
    if (this.minDistanceFromCenter < 0) {
      errors.push({ field: 'minDistanceFromCenter', error: 'Cannot be negative' });
    }
    if (this.diskRadius <= 0) {
      errors.push({ field: 'diskRadius', error: 'Must be positive' });
    }
    if (this.diskThickness <= 0) {
      errors.push({ field: 'diskThickness', error: 'Must be positive' });
    }
    if (this.armWidthFactor <= 0) {
      errors.push({ field: 'armWidthFactor', error: 'Must be positive' });
    }
    if (this.armCurveFactor <= 0) {
      errors.push({ field: 'armCurveFactor', error: 'Must be positive' });
    }
    if (this.activeStarScale <= 0) {
      errors.push({ field: 'activeStarScale', error: 'Must be positive' });
    }
    if (this.activeStarColorMultiplier <= 0) {
      errors.push({ field: 'activeStarColorMultiplier', error: 'Must be positive' });
    }
    if (this.activeStarLightIntensity <= 0) {
      errors.push({ field: 'activeStarLightIntensity', error: 'Must be positive' });
    }
    if (this.waveSpeed <= 0) {
      errors.push({ field: 'waveSpeed', error: 'Must be positive' });
    }
    if (this.waveMaxRadius <= 0) {
      errors.push({ field: 'waveMaxRadius', error: 'Must be positive' });
    }
    if (this.maxConnectionDistance <= 0) {
      errors.push({ field: 'maxConnectionDistance', error: 'Must be positive' });
    }
    if (this.starGeometryRadius <= 0) {
      errors.push({ field: 'starGeometryRadius', error: 'Must be positive' });
    }

    // Validate fractions (0 to 1, inclusive)
    if (this.centralBulgeFraction < 0 || this.centralBulgeFraction > 1) {
      errors.push({ field: 'centralBulgeFraction', error: 'Must be between 0 and 1' });
    }
    if (this.starBirthReplacementRatio < 0 || this.starBirthReplacementRatio > 1) {
      errors.push({ field: 'starBirthReplacementRatio', error: 'Must be between 0 and 1' });
    }

    // Validate opacities (0 to 1, inclusive)
    if (this.behindCloudOpacity < 0 || this.behindCloudOpacity > 1) {
      errors.push({ field: 'behindCloudOpacity', error: 'Must be between 0 and 1' });
    }
    if (this.insideCloudOpacity < 0 || this.insideCloudOpacity > 1) {
      errors.push({ field: 'insideCloudOpacity', error: 'Must be between 0 and 1' });
    }
    if (this.clearOpacity < 0 || this.clearOpacity > 1) {
      errors.push({ field: 'clearOpacity', error: 'Must be between 0 and 1' });
    }
    if (this.behindCloudLightIntensity < 0) {
      errors.push({ field: 'behindCloudLightIntensity', error: 'Cannot be negative' });
    }
    if (this.insideCloudLightIntensity < 0) {
      errors.push({ field: 'insideCloudLightIntensity', error: 'Cannot be negative' });
    }
    if (this.waveOpacity < 0 || this.waveOpacity > 1) {
      errors.push({ field: 'waveOpacity', error: 'Must be between 0 and 1' });
    }

    // Validate integers
    if (!Number.isInteger(this.waveSegments) || this.waveSegments < 3) {
      errors.push({ field: 'waveSegments', error: 'Must be an integer ≥ 3' });
    }
    if (!Number.isInteger(this.starGeometrySegments) || this.starGeometrySegments < 3) {
      errors.push({ field: 'starGeometrySegments', error: 'Must be an integer ≥ 3' });
    }
    if (!Number.isInteger(this.starBirthPopulationThreshold) || this.starBirthPopulationThreshold < 0) {
      errors.push({ field: 'starBirthPopulationThreshold', error: 'Must be a non-negative integer' });
    }
    if (!Number.isInteger(this.maxStars) || this.maxStars < 1000) {
      errors.push({ field: 'maxStars', error: 'Must be an integer ≥ 1000' });
    }

    // Validate hex color
    if (!/^#[0-9A-Fa-f]{6}$/.test(this.waveColor)) {
      errors.push({ field: 'waveColor', error: 'Must be a valid hex color (e.g., #00ffff)' });
    }

    // Logical constraints
    if (this.minDistanceFromCenter > this.diskRadius) {
      errors.push({ field: 'minDistanceFromCenter', error: 'Cannot exceed disk radius' });
    }
    if (this.centralBulgeRadius > this.diskRadius) {
      errors.push({ field: 'centralBulgeRadius', error: 'Cannot exceed disk radius' });
    }

    return errors;
  }

  /**
   * Sanitize settings by clamping values to valid ranges
   */
  sanitize(): void {
    // Clamp probabilities
    this.activationChance = Math.max(0.00001, Math.min(0.99999, this.activationChance));
    this.deactivationChance = Math.max(0.00001, Math.min(0.99999, this.deactivationChance));

    // Clamp positive numbers
    this.centralBulgeRadius = Math.max(1, this.centralBulgeRadius);
    this.minDistanceFromCenter = Math.max(0, this.minDistanceFromCenter);
    this.diskRadius = Math.max(10, this.diskRadius);
    this.diskThickness = Math.max(1, this.diskThickness);
    this.armWidthFactor = Math.max(0.1, this.armWidthFactor);
    this.armCurveFactor = Math.max(0.1, this.armCurveFactor);
    this.activeStarScale = Math.max(0.1, this.activeStarScale);
    this.activeStarColorMultiplier = Math.max(0.1, this.activeStarColorMultiplier);
    this.activeStarLightIntensity = Math.max(0.1, this.activeStarLightIntensity);
    this.waveSpeed = Math.max(0.1, this.waveSpeed);
    this.waveMaxRadius = Math.max(1, this.waveMaxRadius);
    // maxConnectionDistance is now a computed getter, don't sanitize it
    this.starGeometryRadius = Math.max(0.1, this.starGeometryRadius);

    // Clamp fractions and opacities
    this.centralBulgeFraction = Math.max(0, Math.min(1, this.centralBulgeFraction));
    this.starBirthReplacementRatio = Math.max(0, Math.min(1, this.starBirthReplacementRatio));
    this.behindCloudOpacity = Math.max(0, Math.min(1, this.behindCloudOpacity));
    this.insideCloudOpacity = Math.max(0, Math.min(1, this.insideCloudOpacity));
    this.clearOpacity = Math.max(0, Math.min(1, this.clearOpacity));
    this.behindCloudLightIntensity = Math.max(0, this.behindCloudLightIntensity);
    this.insideCloudLightIntensity = Math.max(0, this.insideCloudLightIntensity);
    this.waveOpacity = Math.max(0, Math.min(1, this.waveOpacity));

    // Round integers
    this.waveSegments = Math.max(3, Math.round(this.waveSegments));
    this.starGeometrySegments = Math.max(3, Math.round(this.starGeometrySegments));
    this.starBirthPopulationThreshold = Math.max(0, Math.round(this.starBirthPopulationThreshold));
    this.maxStars = Math.max(1000, Math.round(this.maxStars));
    this.initialStarCount = Math.max(100, Math.round(this.initialStarCount));
    this.initialDustCloudCount = Math.max(10, Math.round(this.initialDustCloudCount));
    this.galaxyRadius = Math.max(50, this.galaxyRadius);
    this.backgroundStarCount = Math.max(100, Math.round(this.backgroundStarCount));

    // Clamp new numeric parameters
    this.starMinLifetime = Math.max(1, this.starMinLifetime);
    this.starLifetimeRange = Math.max(1, this.starLifetimeRange);
    this.starEmissionMinInterval = Math.max(0.1, this.starEmissionMinInterval);
    this.starEmissionIntervalRange = Math.max(0.1, this.starEmissionIntervalRange);
    this.dustCloudMinRadius = Math.max(0.1, this.dustCloudMinRadius);
    this.dustCloudRadiusRange = Math.max(0.1, this.dustCloudRadiusRange);
    this.spiralArmWidthMultiplier = Math.max(0.01, this.spiralArmWidthMultiplier);
    this.dustCloudArmWidthMultiplier = Math.max(0.01, this.dustCloudArmWidthMultiplier);
    this.cameraInitialHeight = Math.max(10, this.cameraInitialHeight);
    this.cameraFOV = Math.max(10, Math.min(120, this.cameraFOV));
    this.cameraNear = Math.max(0.01, this.cameraNear);
    this.cameraFar = Math.max(100, this.cameraFar);
    this.controlsMinDistance = Math.max(1, this.controlsMinDistance);
    this.controlsMaxDistance = Math.max(100, this.controlsMaxDistance);
    this.controlsKeyPanSpeed = Math.max(1, this.controlsKeyPanSpeed);
    this.backgroundStarSpread = Math.max(100, this.backgroundStarSpread);
    this.backgroundStarSize = Math.max(0.1, this.backgroundStarSize);
    
    // Clamp new fractions and probabilities
    this.starLifeSupportProbability = Math.max(0, Math.min(1, this.starLifeSupportProbability));
    this.starAgingThreshold = Math.max(0, Math.min(1, this.starAgingThreshold));
    this.spiralYoungStarProbability = Math.max(0, Math.min(1, this.spiralYoungStarProbability));
    this.spiralOldStarProbability = Math.max(0, Math.min(1, this.spiralOldStarProbability));
    this.cameraInitialArmPosition = Math.max(0, Math.min(1, this.cameraInitialArmPosition));
    this.dustCloudRadialStart = Math.max(0, Math.min(1, this.dustCloudRadialStart));
    this.dustCloudRadialEnd = Math.max(0, Math.min(1, this.dustCloudRadialEnd));
    this.spiralYoungStarRadiusFraction = Math.max(0, Math.min(1, this.spiralYoungStarRadiusFraction));
    this.backgroundStarOpacity = Math.max(0, Math.min(1, this.backgroundStarOpacity));
    this.controlsDampingFactor = Math.max(0.001, Math.min(0.5, this.controlsDampingFactor));
    this.spiralRadialDistributionPower = Math.max(0.1, Math.min(2, this.spiralRadialDistributionPower));
    this.starAgingFadeFactor = Math.max(0.1, this.starAgingFadeFactor);
    this.starMinAgingOpacity = Math.max(0, Math.min(1, this.starMinAgingOpacity));
    this.dustCloudThicknessFactor = Math.max(0.1, this.dustCloudThicknessFactor);
    this.spiralAngleJitter = Math.max(0, this.spiralAngleJitter);
    this.dustCloudAngleJitter = Math.max(0, this.dustCloudAngleJitter);

    // Fix logical constraints
    this.minDistanceFromCenter = Math.min(this.minDistanceFromCenter, this.diskRadius);
    this.centralBulgeRadius = Math.min(this.centralBulgeRadius, this.diskRadius);
  }
}
