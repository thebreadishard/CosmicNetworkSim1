import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { NetworkManager } from './networkManager';
import { SimulationSettings } from './settings';

/**
 * Main application entry point
 */
class CosmicNetworkSimulator {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private networkManager: NetworkManager;
  private clock: THREE.Clock;
  private isPaused: boolean;
  private timeScale: number;
  private showWaves: boolean;
  private showSupernovae: boolean;
  private flashOverlay: HTMLDivElement;
  private hasSimulationStarted: boolean;

  constructor() {
    this.clock = new THREE.Clock();
    this.isPaused = true;
    this.timeScale = 1.0;
    this.showWaves = true;
    this.showSupernovae = true;
    this.hasSimulationStarted = false;
    this.scene = this.createScene();
    this.camera = this.createCamera();
    this.renderer = this.createRenderer();
    this.controls = this.createControls();
    this.networkManager = new NetworkManager(this.scene);
    
    // Create flash overlay
    this.flashOverlay = this.createFlashOverlay();
    
    // Set supernova callback
    this.networkManager.onSupernovaFlash = () => this.triggerFlash();

    this.setupLighting();
    // Generate galaxies and dust using settings
    this.networkManager.initializeGalaxy(this.networkManager.settings.initialStarCount);
    this.networkManager.generateDustClouds(this.networkManager.settings.initialDustCloudCount);
    // Position camera using settings
    const armPos = this.networkManager.getArmPosition?.(0, 0, this.networkManager.settings.cameraInitialArmPosition);
    if (armPos) {
      this.camera.position.set(armPos.x, this.networkManager.settings.cameraInitialHeight, armPos.z);
      this.camera.lookAt(armPos.x, 0, armPos.z);
      this.controls.target.set(armPos.x, 0, armPos.z);
      this.controls.update();
    }
    
    this.setupControls();
    window.addEventListener('resize', () => this.onWindowResize());
    this.animate();
  }

  private createScene(): THREE.Scene {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000510);
    
    // Add starfield background
    this.addStarField(scene);
    
    return scene;
  }

  private addStarField(scene: THREE.Scene): void {
    const settings = new SimulationSettings();
    const starGeometry = new THREE.BufferGeometry();
    const starCount = settings.backgroundStarCount;
    const positions = new Float32Array(starCount * 3);
    
    for (let i = 0; i < starCount * 3; i++) {
      positions[i] = (Math.random() - 0.5) * settings.backgroundStarSpread;
    }
    
    starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const starMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: settings.backgroundStarSize,
      transparent: true,
      opacity: settings.backgroundStarOpacity
    });
    
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);
  }

  private createCamera(): THREE.PerspectiveCamera {
    const settings = new SimulationSettings();
    const camera = new THREE.PerspectiveCamera(
      settings.cameraFOV,
      window.innerWidth / window.innerHeight,
      settings.cameraNear,
      settings.cameraFar
    );
    // Initial position will be set after galaxy generation
    camera.position.set(185, 90, 125);
    camera.lookAt(185, 0, 125);
    return camera;
  }

  private createRenderer(): THREE.WebGLRenderer {
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    return renderer;
  }

  private createControls(): OrbitControls {
    const settings = new SimulationSettings();
    const controls = new OrbitControls(this.camera, this.renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = settings.controlsDampingFactor;
    controls.minDistance = settings.controlsMinDistance;
    controls.maxDistance = settings.controlsMaxDistance;
    controls.target.set(185, 0, 125);
    controls.enablePan = true;
    controls.screenSpacePanning = true;
    controls.keyPanSpeed = settings.controlsKeyPanSpeed;
    controls.keys = {
      LEFT: 'KeyA',
      UP: 'KeyW',
      RIGHT: 'KeyD',
      BOTTOM: 'KeyS'
    };
    controls.listenToKeyEvents(window);
    return controls;
  }

  private setupLighting(): void {
    const ambientLight = new THREE.AmbientLight(0x404040, 1);
    this.scene.add(ambientLight);
  }

  private createFlashOverlay(): HTMLDivElement {
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'white';
    overlay.style.opacity = '0';
    overlay.style.pointerEvents = 'none';
    overlay.style.zIndex = '9999';
    overlay.style.transition = 'opacity 0.05s';
    document.body.appendChild(overlay);
    return overlay;
  }

  private triggerFlash(): void {
    if (!this.showSupernovae) return;
    
    // Instant bright flash
    this.flashOverlay.style.opacity = '1';
    
    // Fade out over 200ms
    setTimeout(() => {
      this.flashOverlay.style.transition = 'opacity 0.2s';
      this.flashOverlay.style.opacity = '0';
      
      // Reset transition
      setTimeout(() => {
        this.flashOverlay.style.transition = 'opacity 0.05s';
      }, 200);
    }, 50);
  }

  private setupControls(): void {
    // Pause/Play button
    const playPauseBtn = document.getElementById('play-pause-btn');
    if (playPauseBtn) {
      playPauseBtn.textContent = this.isPaused ? '▶️ Start' : '⏸️ Pause';
      playPauseBtn.addEventListener('click', () => {
        this.isPaused = !this.isPaused;
        playPauseBtn.textContent = this.isPaused ? '▶️ Start' : '⏸️ Pause';
      });
    }

    // Reset button
    const resetBtn = document.getElementById('reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.resetSimulation();
      });
    }

    // Speed slider
    const speedSlider = document.getElementById('speed-slider') as HTMLInputElement;
    const speedValue = document.getElementById('speed-value');
    if (speedSlider && speedValue) {
      speedSlider.addEventListener('input', () => {
        this.timeScale = parseFloat(speedSlider.value);
        speedValue.textContent = this.timeScale.toFixed(1);
      });
    }

    // Toggle waves button
    const toggleWavesBtn = document.getElementById('toggle-waves-btn');
    if (toggleWavesBtn) {
      toggleWavesBtn.addEventListener('click', () => {
        this.showWaves = !this.showWaves;
        this.networkManager.showWaves = this.showWaves; // Update NetworkManager state
        toggleWavesBtn.textContent = this.showWaves ? '👁️ Hide Waves' : '👁️ Show Waves';
        this.updateWaveVisibility();
      });
    }

    // Toggle supernovae button
    const toggleSupernovaeBtn = document.getElementById('toggle-supernovae-btn');
    if (toggleSupernovaeBtn) {
      toggleSupernovaeBtn.addEventListener('click', () => {
        this.showSupernovae = !this.showSupernovae;
        toggleSupernovaeBtn.textContent = this.showSupernovae ? '✨ Hide Supernovae' : '✨ Show Supernovae';
      });
    }
    
    // Settings button and modal
    this.setupSettingsModal();
  }
  
  private setupSettingsModal(): void {
    const modal = document.getElementById('settings-modal');
    const settingsBtn = document.getElementById('settings-btn');
    const closeBtn = document.querySelector('.close-btn');
    const cancelBtn = document.getElementById('settings-cancel-btn');
    const saveBtn = document.getElementById('settings-save-btn');
    const resetBtn = document.getElementById('settings-reset-btn');
    
    if (!modal || !settingsBtn) return;
    
    // Open modal
    settingsBtn.addEventListener('click', () => {
      this.loadSettingsIntoModal();
      modal.style.display = 'block';
    });
    
    // Close modal handlers
    const closeModal = () => {
      modal.style.display = 'none';
    };
    
    closeBtn?.addEventListener('click', closeModal);
    cancelBtn?.addEventListener('click', closeModal);
    
    // Click outside modal to close
    window.addEventListener('click', (event) => {
      if (event.target === modal) {
        closeModal();
      }
    });
    
    // Save button
    saveBtn?.addEventListener('click', () => {
      const errors = this.saveSettingsFromModal();
      if (errors.length > 0) {
        // Show validation errors - do NOT close modal
        const errorMsg = errors.map(e => `• ${e.field}: ${e.error}`).join('\n');
        alert(`⚠️ Validation errors:\n\n${errorMsg}\n\nPlease correct the values and try again.`);
      } else {
        alert('✅ Settings saved! Changes will apply on next Reset.');
        closeModal();
      }
    });
    
    // Reset to defaults
    resetBtn?.addEventListener('click', () => {
      if (confirm('Reset all settings to default values?')) {
        const settings = new SimulationSettings();
        settings.save();
        this.loadSettingsIntoModal();
        this.clearValidationErrors();
        alert('✅ Settings reset to defaults!');
      }
    });
  }
  
  private loadSettingsIntoModal(): void {
    const settings = SimulationSettings.load();
    
    // Clear previous validation errors
    this.clearValidationErrors();
    
    // Load all settings into input fields
    for (const key in settings) {
      if (settings.hasOwnProperty(key)) {
        const input = document.getElementById(`set-${key}`) as HTMLInputElement;
        if (input) {
          const value = (settings as unknown as Record<string, string | number>)[key];
          if (input.type === 'color') {
            input.value = value.toString();
          } else {
            input.value = value.toString();
          }
        }
      }
    }
  }
  
  private saveSettingsFromModal(): { field: string; error: string }[] {
    const settings = new SimulationSettings();
    
    // Read all values from input fields
    for (const key in settings) {
      if (settings.hasOwnProperty(key)) {
        const input = document.getElementById(`set-${key}`) as HTMLInputElement;
        if (input) {
          const value = input.type === 'color' ? input.value : parseFloat(input.value);
          (settings as unknown as Record<string, string | number>)[key] = value;
        }
      }
    }
    
    // Validate settings
    const errors = settings.validate();
    
    // Highlight invalid fields
    this.highlightValidationErrors(errors);
    
    // Only save if validation passes
    if (errors.length === 0) {
      settings.save();
    }
    
    return errors;
  }

  private clearValidationErrors(): void {
    const inputs = document.querySelectorAll('.settings-section input');
    inputs.forEach(input => {
      input.classList.remove('validation-error');
    });
  }

  private highlightValidationErrors(errors: { field: string; error: string }[]): void {
    // Clear previous errors
    this.clearValidationErrors();
    
    // Highlight fields with errors
    errors.forEach(error => {
      const input = document.getElementById(`set-${error.field}`) as HTMLInputElement;
      if (input) {
        input.classList.add('validation-error');
      }
    });
  }

  private updateStats(): void {
    const stats = this.networkManager.getStats();
    
    const starCountEl = document.getElementById('star-count');
    const activeStarsEl = document.getElementById('active-stars');
    const waveCountEl = document.getElementById('wave-count');
    const connectionCountEl = document.getElementById('connection-count');
    const cameraPosEl = document.getElementById('camera-pos');
    
    if (starCountEl) starCountEl.textContent = stats.starCount.toString();
    if (activeStarsEl) activeStarsEl.textContent = stats.activeStars.toString();
    if (waveCountEl) waveCountEl.textContent = stats.waveCount.toString();
    if (connectionCountEl) connectionCountEl.textContent = stats.connectionCount.toString();
    if (cameraPosEl) {
      const pos = this.camera.position;
      cameraPosEl.textContent = `${Math.round(pos.x)}, ${Math.round(pos.y)}, ${Math.round(pos.z)}`;
    }
  }

  private updateWaveVisibility(): void {
    this.networkManager.radioWaves.forEach(wave => {
      wave.line.visible = this.showWaves;
    });
  }

  private animate(): void {
    requestAnimationFrame(() => this.animate());
    
    const deltaTime = this.clock.getDelta();
    
    // Update simulation with time scaling and pause control
    if (!this.isPaused) {
      this.networkManager.update(deltaTime * this.timeScale, this.camera);
      
      const stats = this.networkManager.getStats();
      
      // Track if simulation has actually started (at least 5 active civilizations)
      if (!this.hasSimulationStarted && stats.activeStars >= 5) {
        this.hasSimulationStarted = true;
      }
      
      // Auto-pause when simulation ends (≤1 active star after having started)
      if (this.hasSimulationStarted && stats.activeStars <= 1) {
        this.isPaused = true;
        const playPauseBtn = document.getElementById('play-pause-btn');
        if (playPauseBtn) {
          playPauseBtn.textContent = '🏁 Ended';
        }
        const activeStarsEl = document.getElementById('active-stars');
        if (activeStarsEl && activeStarsEl.parentElement) {
          activeStarsEl.parentElement.style.color = '#ff6b6b';
        }
      }
    }
    
    // Update controls
    this.controls.update();
    
    // Update stats display
    this.updateStats();
    
    // Render
    this.renderer.render(this.scene, this.camera);
  }

  private resetSimulation(): void {
    // Reset network manager (clears all objects from scene)
    this.networkManager.reset();
    
    // Reinitialize galaxy using current settings
    this.networkManager.initializeGalaxy(this.networkManager.settings.initialStarCount);
    this.networkManager.generateDustClouds(this.networkManager.settings.initialDustCloudCount);
    
    // Reset clock and flags
    this.clock = new THREE.Clock();
    this.hasSimulationStarted = false;
    
    // Pause after reset
    this.isPaused = true;
    const playPauseBtn = document.getElementById('play-pause-btn');
    if (playPauseBtn) {
      playPauseBtn.textContent = '▶️ Start';
    }
    
    // Restore active stars color
    const activeStarsEl = document.getElementById('active-stars');
    if (activeStarsEl && activeStarsEl.parentElement) {
      activeStarsEl.parentElement.style.color = '';
    }
  }

  private onWindowResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}

// Start simulation directly
new CosmicNetworkSimulator();
