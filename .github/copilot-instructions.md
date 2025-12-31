# CosmicNetworkSim1 - AI Coding Instructions

## Project Overview
A 3D galaxy network visualization showing ~1,000 stars with orbiting planets that emit radio waves to discover other civilizations. When two planets' waves intersect, a laser connection forms between their star systems, creating an emerging galactic communication network.

## Architecture

### Core Components
- **entities.ts**: Simulation entities (Star, Planet, RadioWave, Connection)
  - `Star`: Position, color (yellow/red/blue), planets, Three.js mesh with point light
  - `Planet`: Orbits star, triggers radio emissions at random intervals (5-15s)
  - `RadioWave`: Expands from planet at 20 units/sec up to 150 units radius
  - `Connection`: Laser link rendered as Three.js Line between two stars
  
- **NetworkManager.ts**: Simulation state and network logic
  - Manages all stars, waves, connections in the scene
  - Handles wave intersection detection (O(n²) - consider spatial partitioning if performance issues)
  - Creates connections when waves from different star systems intersect
  - Deduplicates connections between star pairs

- **main.ts**: Three.js scene setup and animation loop
  - OrbitControls for camera manipulation
  - 5000-point starfield background for depth
  - 60 FPS animation loop with delta time updates

### Data Flow
1. Animation loop calls `NetworkManager.update(deltaTime)`
2. Stars update → Planets update orbital position
3. Planets trigger emissions → New RadioWaves created
4. RadioWaves expand and check intersections
5. Intersections create Connections between star systems
6. Stats displayed in UI overlay

## Development Workflow

### Setup
```bash
npm install
```

### Building & Running
```bash
npm run dev      # Start Vite dev server on http://localhost:3000
npm run build    # TypeScript compile + production build
npm run preview  # Preview production build
```

### Debugging
- Use browser DevTools for Three.js scene inspection
- Stats overlay shows live counts (stars, active waves, connections)
- Wave opacity fades with distance - check if waves are visible/active

## Code Conventions

### Project Structure
```
src/
  entities.ts         # All simulation entity classes
  NetworkManager.ts   # Galaxy state and connection logic
  main.ts            # Three.js bootstrap and render loop
  styles.css         # UI overlay styling
```

### Patterns
- **Entity classes** own their Three.js meshes/geometry - created in constructor
- **Time-based updates**: All motion uses `deltaTime` for frame-rate independence
- **Object pooling**: Not implemented yet, but consider for RadioWaves if GC issues arise
- **Type safety**: TypeScript strict mode - no implicit `any`
- **Three.js imports**: Use named imports from 'three', OrbitControls from examples/jsm

### Performance Considerations
- Wave intersection is O(n²) nested loop - works for ~10-50 waves, needs optimization for >100
- Consider quadtree or grid-based spatial partitioning if wave count increases
- Inactive waves are removed from scene and arrays immediately
- Connection deduplication prevents duplicate laser links

## Key Technical Details
- **Galaxy generation**: Disk-shaped distribution (radius 100, height ±5)
- **Star colors**: 70% yellow-red (HSL hue 0-0.15), 30% blue (hue 0.5-0.6)
- **Planet counts**: 1-5 planets per star at orbit radii 2, 4, 6, 8, 10 units
- **Emission timing**: Random intervals prevent synchronized wave patterns
- **Camera**: PerspectiveCamera at (0, 80, 120) looking at origin, FOV 75°

## Dependencies
- **three**: 3D rendering engine, entity meshes, lights, geometries
- **OrbitControls**: User camera manipulation (from three/examples)
- **Vite**: Dev server and bundler
- **TypeScript**: Type safety and modern JS features

---
*Last updated: December 28, 2025*
