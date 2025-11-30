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
      this.camera.position.set(0, 4, 12); // Far back for dining room
    } else if (this.animationType === 'drone') {
      this.camera.position.set(0, 0, 6); // Closer to see drone
    } else if (this.animationType === 'shapes') {
      this.camera.position.set(0, 0, 6); // Closer to see shapes
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
          scale = 1.8 / maxDim; // Smaller for dining room
        } else if (this.animationType === 'drone') {
          scale = 2.5 / maxDim; // Good size for drone
        } else if (this.animationType === 'shapes') {
          scale = 2.5 / maxDim; // Good size for shapes
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
        console.log(`✅ Loaded: ${this.modelPath}`);
      },
      (progress) => {
        console.log(`Loading ${this.modelPath}: ${(progress.loaded / progress.total * 100).toFixed(0)}%`);
      },
      (error) => {
        console.error(`❌ Error: ${this.modelPath}`, error);
        // Fallback cube
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshStandardMaterial({ 
          color: 0x00f5ff,
          metalness: 0.5,
          roughness: 0.5
        });
        this.model = new THREE.Mesh(geometry, material);
        this.scene.add(this.model);
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
    
    this.time += 0.016; // ~60fps

    // Apply animations based on model type
    if (!this.isDragging && this.model) {
      if (this.animationType === 'shapes') {
        // Shapes: Rotate AND move around
        this.model.rotation.y += 0.008;
        this.model.rotation.x += 0.004;
        // Float up/down
        this.model.position.y = Math.sin(this.time * 1.5) * 0.2;
        // Drift side to side
        this.model.position.x = Math.cos(this.time * 0.8) * 0.3;
      } else if (this.animationType === 'drone') {
        // Drone: Flying animation
        this.model.rotation.y += 0.008;
        // Bob up/down
        this.model.position.y = Math.sin(this.time * 2) * 0.4;
        // Sway side to side
        this.model.position.x = Math.cos(this.time * 1.2) * 0.2;
        // Tilt
        this.model.rotation.x = Math.sin(this.time * 1.5) * 0.08;
      } else if (this.animationType === 'dining') {
        // Dining: Slow rotation
        this.model.rotation.y += 0.003;
      } else {
        // Default: Simple rotation
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

    // Apply animations in modal
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
    // Reset based on model type
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
