import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

/* Smooth Scrolling */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if(target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

/* Fade-in Scroll Animations */
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if(entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, observerOptions);

document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

/* Dynamic Background Movement */
document.addEventListener('mousemove', (e) => {
  const orbs = document.querySelectorAll('.orb');
  const x = e.clientX / window.innerWidth;
  const y = e.clientY / window.innerHeight;

  orbs.forEach((orb, index) => {
    const speed = (index + 1) * 20;
    orb.style.transform = `translate(${x * speed}px, ${y * speed}px)`;
  });
});

/* THREE.JS VIEWERS */
class ThreeViewer {
  constructor(canvas, modelPath) {
    this.canvas = canvas;
    this.modelPath = modelPath;
    this.isDragging = false;
    this.previousMousePosition = { x: 0, y: 0 };
    this.model = null;
    this.animationType = this.getAnimationType(modelPath);
    this.time = 0;
    
    this.init();
  }
  
  getAnimationType(path) {
    if (path.includes('scene.glb')) return 'shapes';
    if (path.includes('Drone1.glb')) return 'drone';
    if (path.includes('t1.glb')) return 'dining';
    return 'default';
  }
  
  init() {
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0e27);

    // Camera - adjust based on model type
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    
    // Set camera position based on model type
    if (this.animationType === 'dining') {
      this.camera.position.set(0, 4, 12); // Much further back for dining room
    } else if (this.animationType === 'drone') {
      this.camera.position.set(0, 0, 6); // Further back to see full drone
    } else if (this.animationType === 'shapes') {
      this.camera.position.set(0, 0, 6); // Further back to see all shapes
    } else {
      this.camera.position.set(0, 2, 5);
    }
    this.camera.lookAt(0, 0, 0);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ 
      canvas: this.canvas, 
      antialias: true,
      alpha: true 
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    this.scene.add(directionalLight);

    const pointLight1 = new THREE.PointLight(0x00f5ff, 0.8);
    pointLight1.position.set(-5, 5, 5);
    this.scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xff006e, 0.8);
    pointLight2.position.set(5, 3, -5);
    this.scene.add(pointLight2);

    // Load Model
    this.loadModel();

    // Mouse Controls
    this.setupControls();

    // Start Animation
    this.animate();
  }

  loadModel() {
    const loader = new GLTFLoader();
    
    loader.load(
      this.modelPath,
      (gltf) => {
        this.model = gltf.scene;

        // Center and scale model
        const box = new THREE.Box3().setFromObject(this.model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        
        this.model.position.sub(center);
        
        // Adjust scale based on model type
        const maxDim = Math.max(size.x, size.y, size.z);
        let scale;
        
        if (this.animationType === 'dining') {
          scale = 1.8 / maxDim; // Much smaller scale for dining room
        } else if (this.animationType === 'drone') {
          scale = 2.5 / maxDim; // Adjusted for drone visibility
        } else if (this.animationType === 'shapes') {
          scale = 2.5 / maxDim; // Adjusted for shapes visibility
        } else {
          scale = 3 / maxDim;
        }
        
        this.model.scale.setScalar(scale);

        // Enable shadows
        this.model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        this.scene.add(this.model);
        console.log(`✅ Successfully loaded: ${this.modelPath}`);
      },
      (progress) => {
        const percent = (progress.loaded / progress.total * 100).toFixed(0);
        console.log(`Loading ${this.modelPath}: ${percent}%`);
      },
      (error) => {
        console.error(`❌ Error loading model: ${this.modelPath}`, error);
        
        // Create a fallback visual based on model type
        if (this.animationType === 'drone') {
          // Create a simple drone shape
          const group = new THREE.Group();
          
          // Body
          const bodyGeometry = new THREE.BoxGeometry(0.6, 0.2, 0.6);
          const bodyMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x333333,
            metalness: 0.7,
            roughness: 0.3
          });
          const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
          group.add(body);
          
          // Propellers
          const propellerGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.05, 32);
          const propellerMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x00f5ff,
            metalness: 0.5,
            roughness: 0.5
          });
          
          const positions = [
            [0.4, 0.15, 0.4],
            [-0.4, 0.15, 0.4],
            [0.4, 0.15, -0.4],
            [-0.4, 0.15, -0.4]
          ];
          
          positions.forEach(pos => {
            const propeller = new THREE.Mesh(propellerGeometry, propellerMaterial);
            propeller.position.set(pos[0], pos[1], pos[2]);
            group.add(propeller);
          });
          
          this.model = group;
          this.scene.add(this.model);
          
        } else if (this.animationType === 'dining') {
          // Create a simple dining room scene
          const group = new THREE.Group();
          
          // Table
          const tableTopGeometry = new THREE.BoxGeometry(2, 0.1, 1.2);
          const tableTopMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x8B4513,
            metalness: 0.1,
            roughness: 0.8
          });
          const tableTop = new THREE.Mesh(tableTopGeometry, tableTopMaterial);
          tableTop.position.y = 0.5;
          group.add(tableTop);
          
          // Table legs
          const legGeometry = new THREE.BoxGeometry(0.08, 0.5, 0.08);
          const legMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x654321,
            metalness: 0.1,
            roughness: 0.9
          });
          
          const legPositions = [
            [0.85, 0.25, 0.5],
            [-0.85, 0.25, 0.5],
            [0.85, 0.25, -0.5],
            [-0.85, 0.25, -0.5]
          ];
          
          legPositions.forEach(pos => {
            const leg = new THREE.Mesh(legGeometry, legMaterial);
            leg.position.set(pos[0], pos[1], pos[2]);
            group.add(leg);
          });
          
          // Chairs
          const chairBackGeometry = new THREE.BoxGeometry(0.4, 0.5, 0.05);
          const chairSeatGeometry = new THREE.BoxGeometry(0.4, 0.05, 0.4);
          const chairMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x654321,
            metalness: 0.1,
            roughness: 0.9
          });
          
          // Two chairs
          for (let i = 0; i < 2; i++) {
            const chair = new THREE.Group();
            const back = new THREE.Mesh(chairBackGeometry, chairMaterial);
            back.position.set(0, 0.35, -0.175);
            const seat = new THREE.Mesh(chairSeatGeometry, chairMaterial);
            seat.position.set(0, 0.1, 0);
            chair.add(back);
            chair.add(seat);
            
            if (i === 0) {
              chair.position.set(0, 0, 0.9);
            } else {
              chair.position.set(0, 0, -0.9);
              chair.rotation.y = Math.PI;
            }
            
            group.add(chair);
          }
          
          this.model = group;
          this.scene.add(this.model);
          
        } else {
          // Generic fallback cube
          const geometry = new THREE.BoxGeometry(1, 1, 1);
          const material = new THREE.MeshStandardMaterial({ 
            color: 0x00f5ff,
            metalness: 0.5,
            roughness: 0.5
          });
          this.model = new THREE.Mesh(geometry, material);
          this.scene.add(this.model);
        }
        
        console.log(`⚠️ Using fallback model for: ${this.modelPath}`);
      }
    );
  }

  setupControls() {
    this.canvas.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    this.canvas.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.isDragging = false;
    });

    this.canvas.addEventListener('mousemove', (e) => {
      if (this.isDragging && this.model) {
        const deltaX = e.clientX - this.previousMousePosition.x;
        const deltaY = e.clientY - this.previousMousePosition.y;

        this.model.rotation.y += deltaX * 0.01;
        this.model.rotation.x += deltaY * 0.01;

        this.previousMousePosition = { x: e.clientX, y: e.clientY };
      }
    });

    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.camera.position.z += e.deltaY * 0.005;
      this.camera.position.z = Math.max(2, Math.min(15, this.camera.position.z));
    }, { passive: false });
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    
    this.time += 0.016; // Approximate 60fps

    // Apply different animations based on model type
    if (!this.isDragging && this.model) {
      if (this.animationType === 'shapes') {
        // Smooth rotation AND position movement for shapes
        this.model.rotation.y += 0.008;
        this.model.rotation.x += 0.004;
        // Add gentle floating movement
        this.model.position.y = Math.sin(this.time * 1.5) * 0.2;
        this.model.position.x = Math.cos(this.time * 0.8) * 0.3;
      } else if (this.animationType === 'drone') {
        // Hovering/flying animation for drone
        this.model.rotation.y += 0.008; // Rotation
        // Bobbing up and down
        this.model.position.y = Math.sin(this.time * 2) * 0.4;
        // Slight side to side movement
        this.model.position.x = Math.cos(this.time * 1.2) * 0.2;
        // Slight tilt forward/backward
        this.model.rotation.x = Math.sin(this.time * 1.5) * 0.08;
      } else if (this.animationType === 'dining') {
        // Very slow rotation for dining room to show all angles
        this.model.rotation.y += 0.003;
      } else {
        // Default rotation
        this.model.rotation.y += 0.003;
      }
    }

    this.renderer.render(this.scene, this.camera);
  }
}

// Initialize all viewers
document.querySelectorAll('.three-viewer').forEach(canvas => {
  const modelPath = canvas.getAttribute('data-model');
  new ThreeViewer(canvas, modelPath);
});

/* FULLSCREEN MODAL VIEWER */
let modalViewer = null;

class ModalThreeViewer extends ThreeViewer {
  constructor(canvas, modelPath) {
    super(canvas, modelPath);
    this.autoRotate = true;
    this.wireframeMode = false;
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    
    this.time += 0.016;

    // Apply animations even in modal
    if (!this.isDragging && this.model) {
      if (this.autoRotate) {
        if (this.animationType === 'shapes') {
          this.model.rotation.y += 0.008;
          this.model.rotation.x += 0.004;
          this.model.position.y = Math.sin(this.time * 1.5) * 0.2;
          this.model.position.x = Math.cos(this.time * 0.8) * 0.3;
        } else if (this.animationType === 'drone') {
          this.model.rotation.y += 0.008;
          this.model.position.y = Math.sin(this.time * 2) * 0.4;
          this.model.position.x = Math.cos(this.time * 1.2) * 0.2;
          this.model.rotation.x = Math.sin(this.time * 1.5) * 0.08;
        } else {
          this.model.rotation.y += 0.005;
        }
      }
    }

    this.renderer.render(this.scene, this.camera);
  }

  toggleAutoRotation() {
    this.autoRotate = !this.autoRotate;
    return this.autoRotate;
  }

  toggleWireframe() {
    this.wireframeMode = !this.wireframeMode;
    if (this.model) {
      this.model.traverse((child) => {
        if (child.isMesh) {
          child.material.wireframe = this.wireframeMode;
        }
      });
    }
    return this.wireframeMode;
  }

  resetView() {
    // Reset camera based on model type
    if (this.animationType === 'dining') {
      this.camera.position.set(0, 4, 12);
    } else if (this.animationType === 'drone') {
      this.camera.position.set(0, 0, 6);
    } else if (this.animationType === 'shapes') {
      this.camera.position.set(0, 0, 6);
    } else {
      this.camera.position.set(0, 2, 5);
    }
    this.camera.lookAt(0, 0, 0);
    if (this.model) {
      this.model.rotation.set(0, 0, 0);
      this.model.position.set(0, 0, 0);
    }
  }

  dispose() {
    // Clean up resources
    if (this.model) {
      this.scene.remove(this.model);
    }
    this.renderer.dispose();
  }
}

// Handle fullscreen view buttons
document.querySelectorAll('.view-fullscreen').forEach(button => {
  button.addEventListener('click', (e) => {
    e.preventDefault();
    const modelPath = button.getAttribute('data-model');
    const title = button.getAttribute('data-title');
    openModal(modelPath, title);
  });
});

function openModal(modelPath, title) {
  const modal = document.getElementById('modelModal');
  const modalTitle = document.getElementById('modalTitle');
  const canvas = document.getElementById('modalCanvas');

  modalTitle.textContent = title;
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';

  // Create new viewer
  if (modalViewer) {
    modalViewer.dispose();
  }
  modalViewer = new ModalThreeViewer(canvas, modelPath);
}

function closeModal() {
  const modal = document.getElementById('modelModal');
  modal.classList.remove('active');
  document.body.style.overflow = 'auto';

  if (modalViewer) {
    modalViewer.dispose();
    modalViewer = null;
  }
}

// Modal controls
document.getElementById('closeModal').addEventListener('click', closeModal);

document.getElementById('resetView').addEventListener('click', () => {
  if (modalViewer) {
    modalViewer.resetView();
  }
});

document.getElementById('toggleRotation').addEventListener('click', (e) => {
  if (modalViewer) {
    const isRotating = modalViewer.toggleAutoRotation();
    e.target.textContent = isRotating ? 'Stop Rotation' : 'Start Rotation';
  }
});

document.getElementById('toggleWireframe').addEventListener('click', (e) => {
  if (modalViewer) {
    const isWireframe = modalViewer.toggleWireframe();
    e.target.textContent = isWireframe ? 'Solid View' : 'Wireframe';
  }
});

// Close modal on overlay click
document.getElementById('modelModal').addEventListener('click', (e) => {
  if (e.target.id === 'modelModal') {
    closeModal();
  }
});

// Close modal on ESC key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modalViewer) {
    closeModal();
  }
});
