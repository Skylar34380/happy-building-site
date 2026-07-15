import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function ArchitecturalScene() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) {
      return undefined;
    }

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    camera.position.set(6.8, 4.8, 8.4);
    camera.lookAt(0, 0.8, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance"
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    mount.appendChild(renderer.domElement);

    const group = new THREE.Group();
    group.rotation.y = -0.35;
    scene.add(group);

    const pointer = { x: 0, y: 0 };
    let scrollProgress = 0;

    const slabMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xd6edf4,
      transparent: true,
      opacity: 0.36,
      roughness: 0.78,
      metalness: 0.02,
      transmission: 0.08
    });
    const darkMaterial = new THREE.MeshStandardMaterial({
      color: 0x14546e,
      roughness: 0.68,
      metalness: 0.08
    });
    const glassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x9fd0df,
      transparent: true,
      opacity: 0.24,
      roughness: 0.18,
      metalness: 0,
      transmission: 0.28
    });
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0xe3f6fa,
      transparent: true,
      opacity: 0.72
    });
    const detailMaterial = new THREE.LineBasicMaterial({
      color: 0x6eb4c8,
      transparent: true,
      opacity: 0.5
    });
    const siteMaterial = new THREE.MeshBasicMaterial({
      color: 0x4c9ab2,
      transparent: true,
      opacity: 0.11,
      side: THREE.DoubleSide
    });

    const slabGeometry = new THREE.BoxGeometry(4.4, 0.16, 2.5);
    const lowerSlab = createBox(slabGeometry, slabMaterial, [0, 0, 0]);
    const upperSlab = createBox(slabGeometry, slabMaterial, [0.42, 1.38, -0.12]);
    const roofSlab = createBox(new THREE.BoxGeometry(4.9, 0.13, 2.85), slabMaterial, [0.75, 2.62, -0.2]);
    group.add(lowerSlab, upperSlab, roofSlab);

    const columnGeometry = new THREE.BoxGeometry(0.12, 2.62, 0.12);
    [
      [-1.75, 1.25, -0.95],
      [1.75, 1.25, -0.95],
      [-1.75, 1.25, 0.95],
      [1.75, 1.25, 0.95],
      [2.55, 1.25, -1.12]
    ].forEach((position) => {
      group.add(createBox(columnGeometry, darkMaterial, position));
    });

    const core = createBox(new THREE.BoxGeometry(0.52, 2.2, 0.7), darkMaterial, [-1.1, 1.12, 0.15]);
    const glassWall = createBox(new THREE.BoxGeometry(2.35, 1.05, 0.08), glassMaterial, [0.72, 1.86, 1.16]);
    group.add(core, glassWall);

    const mullionGeometry = new THREE.BoxGeometry(0.035, 1.02, 0.06);
    for (let index = 0; index < 8; index += 1) {
      const x = -0.32 + index * 0.3;
      group.add(createBox(mullionGeometry, darkMaterial, [x, 1.86, 1.23]));
    }

    const balconyGeometry = new THREE.BoxGeometry(2.8, 0.04, 0.08);
    const balconyLine = createBox(balconyGeometry, darkMaterial, [0.86, 1.43, 1.25]);
    group.add(balconyLine);

    [lowerSlab, upperSlab, roofSlab, core, glassWall].forEach((mesh) => {
      const edges = new THREE.EdgesGeometry(mesh.geometry);
      const line = new THREE.LineSegments(edges, lineMaterial);
      mesh.add(line);
    });

    const grid = new THREE.GridHelper(7.5, 12, 0x9fd0df, 0x4a8094);
    grid.position.set(0.2, -0.16, 0);
    grid.material.transparent = true;
    grid.material.opacity = 0.24;
    group.add(grid);

    const sitePlane = createSitePlane(5.7, 3.6, siteMaterial, [0.35, -0.18, 0]);
    const terracePlane = createSitePlane(2.6, 1.0, siteMaterial, [1.28, -0.17, 1.55]);
    group.add(sitePlane, terracePlane);

    const measurementLines = new THREE.Group();
    measurementLines.add(
      createLine([[-2.7, 0.04, -1.55], [2.75, 0.04, -1.55]], detailMaterial),
      createLine([[-2.7, 0.04, -1.55], [-2.7, 0.32, -1.55]], detailMaterial),
      createLine([[2.75, 0.04, -1.55], [2.75, 0.32, -1.55]], detailMaterial),
      createLine([[3.1, 0.08, -1.15], [3.1, 2.72, -1.15]], detailMaterial),
      createLine([[2.9, 2.72, -1.15], [3.28, 2.72, -1.15]], detailMaterial),
      createLine([[2.9, 0.08, -1.15], [3.28, 0.08, -1.15]], detailMaterial)
    );
    group.add(measurementLines);

    const ambient = new THREE.AmbientLight(0xe2f6fb, 1.15);
    const key = new THREE.DirectionalLight(0xffffff, 2.6);
    key.position.set(3, 5, 4);
    const fill = new THREE.DirectionalLight(0x58a8c2, 1.1);
    fill.position.set(-4, 2, -2);
    scene.add(ambient, key, fill);

    let frameId = 0;
    const clock = new THREE.Clock();
    const target = new THREE.Vector3(0.05, 1.02, 0);

    function updatePointer(event) {
      pointer.x = event.clientX / Math.max(window.innerWidth, 1) - 0.5;
      pointer.y = event.clientY / Math.max(window.innerHeight, 1) - 0.5;
    }

    function updateScrollProgress() {
      scrollProgress = clamp(window.scrollY / Math.max(window.innerHeight * 0.8, 1), 0, 1);
    }

    function resize() {
      const { width, height } = mount.getBoundingClientRect();
      renderer.setSize(width, height, false);
      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();
    }

    function animate() {
      const elapsed = clock.getElapsedTime();
      if (!prefersReducedMotion) {
        const scrollAngle = scrollProgress * 0.34;
        group.rotation.y = -0.35 + scrollAngle + Math.sin(elapsed * 0.18) * 0.13 + pointer.x * 0.12;
        group.rotation.x = Math.sin(elapsed * 0.14) * 0.025 - pointer.y * 0.04;
        group.position.y = Math.sin(elapsed * 0.5) * 0.035;
        upperSlab.position.x = 0.42 + scrollProgress * 0.16;
        roofSlab.position.x = 0.75 + scrollProgress * 0.28;
        roofSlab.position.y = 2.62 + scrollProgress * 0.08;
        glassWall.material.opacity = 0.2 + Math.sin(elapsed * 0.55) * 0.04 + scrollProgress * 0.04;
        measurementLines.children.forEach((line, index) => {
          line.material.opacity = 0.34 + Math.sin(elapsed * 0.75 + index * 0.8) * 0.16;
        });
        camera.position.x = 6.8 - scrollProgress * 0.8 + pointer.x * 0.55;
        camera.position.y = 4.8 + scrollProgress * 0.3 - pointer.y * 0.28;
        camera.lookAt(target);
      }
      renderer.render(scene, camera);
      frameId = window.requestAnimationFrame(animate);
    }

    resize();
    updateScrollProgress();
    animate();

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(mount);
    window.addEventListener("pointermove", updatePointer, { passive: true });
    window.addEventListener("scroll", updateScrollProgress, { passive: true });

    return () => {
      window.cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      window.removeEventListener("pointermove", updatePointer);
      window.removeEventListener("scroll", updateScrollProgress);
      mount.removeChild(renderer.domElement);
      renderer.dispose();
      scene.traverse((object) => {
        if (object.geometry) {
          object.geometry.dispose();
        }
        if (object.material) {
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((material) => material.dispose());
        }
      });
    };
  }, []);

  return <div className="architectural-scene" aria-hidden="true" ref={mountRef} />;
}

function createBox(geometry, material, position) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(...position);
  return mesh;
}

function createSitePlane(width, depth, material, position) {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(...position);
  return mesh;
}

function createLine(points, material) {
  const geometry = new THREE.BufferGeometry().setFromPoints(
    points.map(([x, y, z]) => new THREE.Vector3(x, y, z))
  );
  return new THREE.Line(geometry, material.clone());
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
