import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function RoomPlanningScene() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) {
      return undefined;
    }

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 80);
    camera.position.set(4.5, 5.2, 6.2);
    camera.lookAt(0.2, 0.85, 0.15);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance"
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
    mount.appendChild(renderer.domElement);

    const room = new THREE.Group();
    room.rotation.y = -0.48;
    scene.add(room);

    const wallMaterial = new THREE.MeshStandardMaterial({
      color: 0xd8edf3,
      roughness: 0.72,
      metalness: 0.02
    });
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0xb6d4dd,
      roughness: 0.82,
      metalness: 0.02
    });
    const furnitureMaterial = new THREE.MeshStandardMaterial({
      color: 0x1d637c,
      roughness: 0.62,
      metalness: 0.08
    });
    const accentMaterial = new THREE.MeshStandardMaterial({
      color: 0xedf8fa,
      roughness: 0.55,
      metalness: 0.04
    });
    const glassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xa4d7e5,
      transparent: true,
      opacity: 0.32,
      roughness: 0.2,
      transmission: 0.22
    });
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0xf0fbfd,
      transparent: true,
      opacity: 0.68
    });
    const planLineMaterial = new THREE.LineBasicMaterial({
      color: 0x3f91aa,
      transparent: true,
      opacity: 0.42
    });

    const floor = createBox(new THREE.BoxGeometry(4.4, 0.08, 3.1), floorMaterial, [0, 0, 0]);
    const backWall = createBox(new THREE.BoxGeometry(4.4, 1.85, 0.08), wallMaterial, [0, 0.94, -1.55]);
    const leftWall = createBox(new THREE.BoxGeometry(0.08, 1.85, 3.1), wallMaterial, [-2.2, 0.94, 0]);
    const halfWall = createBox(new THREE.BoxGeometry(1.45, 1.1, 0.08), wallMaterial, [1.42, 0.58, 0.82]);
    const island = createBox(new THREE.BoxGeometry(1.35, 0.32, 0.54), accentMaterial, [-0.7, 0.25, 0.72]);
    const sofa = createBox(new THREE.BoxGeometry(1.5, 0.34, 0.55), furnitureMaterial, [0.95, 0.27, -0.42]);
    const sofaBack = createBox(new THREE.BoxGeometry(1.5, 0.48, 0.14), furnitureMaterial, [0.95, 0.46, -0.72]);
    const table = createBox(new THREE.BoxGeometry(0.68, 0.12, 0.42), accentMaterial, [0.6, 0.18, 0.35]);
    const windowPanel = createBox(new THREE.BoxGeometry(1.2, 0.86, 0.04), glassMaterial, [0.92, 1.12, -1.61]);
    room.add(floor, backWall, leftWall, halfWall, island, sofa, sofaBack, table, windowPanel);

    [floor, backWall, leftWall, halfWall, island, sofa, sofaBack, table, windowPanel].forEach((mesh) => {
      const edges = new THREE.EdgesGeometry(mesh.geometry);
      const line = new THREE.LineSegments(edges, lineMaterial);
      mesh.add(line);
    });

    const planLines = new THREE.Group();
    [
      [[-2.2, 0.07, -1.55], [2.2, 0.07, -1.55]],
      [[-2.2, 0.07, -1.55], [-2.2, 0.07, 1.55]],
      [[2.2, 0.07, -1.55], [2.2, 0.07, 1.55]],
      [[-2.2, 0.07, 1.55], [2.2, 0.07, 1.55]],
      [[-0.1, 0.08, -1.55], [-0.1, 0.08, 1.55]],
      [[-2.2, 0.08, 0.2], [2.2, 0.08, 0.2]]
    ].forEach((points) => planLines.add(createLine(points, planLineMaterial)));
    room.add(planLines);

    const grid = new THREE.GridHelper(4.7, 8, 0xc9e5ed, 0x6798aa);
    grid.position.y = 0.055;
    grid.material.transparent = true;
    grid.material.opacity = 0.2;
    room.add(grid);

    const ambient = new THREE.AmbientLight(0xe7f8fb, 1.1);
    const key = new THREE.DirectionalLight(0xffffff, 2.2);
    key.position.set(3.2, 5, 2.6);
    const fill = new THREE.DirectionalLight(0x4f9eb8, 1.2);
    fill.position.set(-3.4, 2.2, -2.3);
    scene.add(ambient, key, fill);

    const clock = new THREE.Clock();
    let frameId = 0;

    function resize() {
      const { width, height } = mount.getBoundingClientRect();
      renderer.setSize(width, height, false);
      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();
    }

    function animate() {
      const elapsed = clock.getElapsedTime();
      if (!prefersReducedMotion) {
        const reveal = (Math.sin(elapsed * 0.55) + 1) / 2;
        room.rotation.y = -0.52 + Math.sin(elapsed * 0.2) * 0.12;
        room.position.y = Math.sin(elapsed * 0.45) * 0.035;
        backWall.scale.y = 0.18 + reveal * 0.82;
        leftWall.scale.y = 0.18 + reveal * 0.82;
        halfWall.scale.y = 0.3 + reveal * 0.7;
        windowPanel.material.opacity = 0.2 + reveal * 0.18;
        planLines.children.forEach((line, index) => {
          line.material.opacity = 0.25 + Math.sin(elapsed * 0.75 + index) * 0.12;
        });
      }
      renderer.render(scene, camera);
      frameId = window.requestAnimationFrame(animate);
    }

    resize();
    animate();

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(mount);

    return () => {
      window.cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
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

  return <div className="room-three-scene" aria-hidden="true" ref={mountRef} />;
}

function createBox(geometry, material, position) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(...position);
  return mesh;
}

function createLine(points, material) {
  const geometry = new THREE.BufferGeometry().setFromPoints(
    points.map(([x, y, z]) => new THREE.Vector3(x, y, z))
  );
  return new THREE.Line(geometry, material.clone());
}
