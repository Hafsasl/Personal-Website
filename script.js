import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

/* Smooth Scrolling */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if(target) target.scrollIntoView({ behavior: 'smooth' });
  });
});

/* Fade-in Animation */
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if(entry.isIntersecting) entry.target.classList.add('visible');
  });
}, { threshold: 0.1 });

document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

/* Background MOVE */
document.addEventListener('mousemove', e => {
  const orbs = document.querySelectorAll('.orb');
  const x = e.clientX / window.innerWidth;
  const y = e.clientY / window.innerHeight;
  orbs.forEach((orb, i) => {
    const s = (i + 1) * 20;
    orb.style.transform = `translate(${x * s}px, ${y * s}px)`;
  });
});

/* THREE.JS VIEWER */
class ThreeViewer {
  constructor(canvas, modelPath) {
    this.canvas = canvas;
    this.modelPath = modelPath;
    this.isDragging = false;
    this.previousMousePosition = { x: 0, y: 0 };
    this.model = null;
    this.init();
  }

  init() {
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0e27);

    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    this.camera.position.set(0, 2, 5);

    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const light = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(light);

    this.loadModel();
    this.animate();
  }

  loadModel() {
    const loader = new GLTFLoader();
    loader.load(this.modelPath, (gltf) => {
      this.model = gltf.scene;
      this.scene.add(this.model);
    });
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    if (this.model) this.model.rotation.y += 0.005;
    this.renderer.render(this.scene, this.camera);
  }
}

document.querySelectorAll('.three-viewer').forEach(canvas => {
  new ThreeViewer(canvas, canvas.dataset.model);
});
