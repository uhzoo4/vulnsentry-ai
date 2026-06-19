import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { Connection } from "../../types/finding";

interface TopologyMapProps {
  connections?: Connection[];
  onNodeClick?: (nodeId: string, processName: string) => void;
  activeNodeId?: string | null;
}

const MOCK_CONNECTIONS: Connection[] = [
  { processName: "mysqld", processPid: 4821, port: 3306, protocol: "tcp", state: "listening", severity: "critical" },
  { processName: "sshd", processPid: 1240, port: 22, protocol: "tcp", state: "listening", severity: "high" },
  { processName: "nginx", processPid: 2201, port: 80, protocol: "tcp", state: "listening", severity: "medium" },
  { processName: "redis", processPid: 3102, port: 6379, protocol: "tcp", state: "listening", severity: "medium" },
  { processName: "smbd", processPid: 1040, port: 139, protocol: "tcp", state: "listening", severity: "low" },
];

const SEVERITY_COLOR_HEX = {
  critical: 0xef4444,
  high: 0xf97316,
  medium: 0xeab308,
  low: 0x22c55e,
};

const SEVERITY_COLOR_STR = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#eab308",
  low: "#22c55e",
};

export default function TopologyMap({
  connections = [],
  onNodeClick,
  activeNodeId = null,
}: TopologyMapProps) {
  const activeConnections = connections.length > 0 ? connections : MOCK_CONNECTIONS;

  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const labelsContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const canvasContainer = canvasContainerRef.current;
    if (!canvasContainer) return;

    let width = canvasContainer.clientWidth || 400;
    let height = canvasContainer.clientHeight || 300;

    // 1. Scene, Camera, Renderer Setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(0, 3, 6);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    canvasContainer.appendChild(renderer.domElement);

    // 2. Volumetric Lights Setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 0.8, 10);
    pointLight.position.set(0, 4, 4);
    scene.add(pointLight);

    // 3. Central Host Node
    const hostGeo = new THREE.SphereGeometry(0.32, 32, 32);
    const hostMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.9,
    });
    const hostNode = new THREE.Mesh(hostGeo, hostMat);
    scene.add(hostNode);

    // Host inner core glow ring
    const coreGeo = new THREE.RingGeometry(0.45, 0.50, 32);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.12,
    });
    const hostCoreRing = new THREE.Mesh(coreGeo, coreMat);
    hostCoreRing.rotation.x = Math.PI / 2;
    scene.add(hostCoreRing);

    // 4. Orbiting Service Nodes
    const serviceNodeMeshes: Record<string, THREE.Mesh> = {};
    const edgeLines: Record<string, THREE.Line> = {};

    activeConnections.forEach((conn, idx) => {
      const key = `${conn.processName}-${conn.port}`;
      const color = SEVERITY_COLOR_HEX[conn.severity] ?? 0x22c55e;

      // Outer breathing ring
      const nodeGeo = new THREE.SphereGeometry(0.12, 16, 16);
      const nodeMat = new THREE.MeshPhongMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: 0.45,
        transparent: true,
        opacity: 0.9,
      });

      const mesh = new THREE.Mesh(nodeGeo, nodeMat);
      // Store node keys and phase details
      mesh.userData = {
        key,
        processName: conn.processName,
        port: conn.port,
        phase: (idx * 2 * Math.PI) / activeConnections.length,
        isDragged: false,
      };

      scene.add(mesh);
      serviceNodeMeshes[key] = mesh;

      // Edge link from center host to service node
      const lineMat = new THREE.LineBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.22,
      });
      const points = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0)];
      const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(lineGeo, lineMat);
      
      scene.add(line);
      edgeLines[key] = line;
    });

    // 5. Stitch Background Integration: 40 drifting background nodes & breathing lines
    const bgNodes: THREE.Mesh[] = [];
    const bgNodeCount = 40;
    const bgNodeGroup = new THREE.Group();

    const bgNodeMaterial = new THREE.MeshBasicMaterial({
      color: 0x4682B4, // Steel Blue accent
      transparent: true,
      opacity: 0.15,
    });

    for (let i = 0; i < bgNodeCount; i++) {
      const geo = new THREE.SphereGeometry(0.025, 8, 8);
      const mesh = new THREE.Mesh(geo, bgNodeMaterial);
      mesh.position.set(
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 5,
        (Math.random() - 0.5) * 5
      );
      mesh.userData = {
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.003,
          (Math.random() - 0.5) * 0.003,
          (Math.random() - 0.5) * 0.003
        ),
      };
      bgNodes.push(mesh);
      bgNodeGroup.add(mesh);
    }
    scene.add(bgNodeGroup);

    // Background segment links
    const bgLineMaterial = new THREE.LineBasicMaterial({
      color: 0xC0C0C0, // Pale Silver
      transparent: true,
      opacity: 0.08,
    });
    const bgLineGeometry = new THREE.BufferGeometry();
    const bgLinePositions = new Float32Array(bgNodeCount * bgNodeCount * 3);
    bgLineGeometry.setAttribute("position", new THREE.BufferAttribute(bgLinePositions, 3));
    const bgConnections = new THREE.LineSegments(bgLineGeometry, bgLineMaterial);
    scene.add(bgConnections);

    function updateBgLines() {
      const positions = bgConnections.geometry.attributes.position.array as Float32Array;
      let counter = 0;
      for (let i = 0; i < bgNodeCount; i++) {
        for (let j = i + 1; j < bgNodeCount; j++) {
          const dist = bgNodes[i].position.distanceTo(bgNodes[j].position);
          if (dist < 1.8) {
            positions[counter++] = bgNodes[i].position.x;
            positions[counter++] = bgNodes[i].position.y;
            positions[counter++] = bgNodes[i].position.z;
            positions[counter++] = bgNodes[j].position.x;
            positions[counter++] = bgNodes[j].position.y;
            positions[counter++] = bgNodes[j].position.z;
          }
        }
      }
      bgConnections.geometry.attributes.position.needsUpdate = true;
    }

    // 6. Interactive Raycasting & Pointer Mechanics
    const raycaster = new THREE.Raycaster();
    const dragPlane = new THREE.Plane();
    const planeNormal = new THREE.Vector3();

    let draggedNodeKey: string | null = null;
    let targetMouseX = 0;
    let targetMouseY = 0;
    let mouseX = 0;
    let mouseY = 0;

    const handlePointerDown = (e: PointerEvent) => {
      const rect = canvasContainer.getBoundingClientRect();
      const pointer = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );

      raycaster.setFromCamera(pointer, camera);
      const intersects = raycaster.intersectObjects(Object.values(serviceNodeMeshes));

      if (intersects.length > 0) {
        const hitNode = intersects[0].object as THREE.Mesh;
        draggedNodeKey = hitNode.userData.key;

        camera.getWorldDirection(planeNormal);
        planeNormal.negate(); // Face camera
        dragPlane.setFromNormalAndCoplanarPoint(planeNormal, hitNode.position);
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      const rect = canvasContainer.getBoundingClientRect();
      targetMouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      targetMouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (draggedNodeKey) {
        const pointer = new THREE.Vector2(targetMouseX, targetMouseY);
        raycaster.setFromCamera(pointer, camera);

        const intersection = new THREE.Vector3();
        raycaster.ray.intersectPlane(dragPlane, intersection);

        if (intersection) {
          const node = serviceNodeMeshes[draggedNodeKey];
          if (node) {
            node.position.copy(intersection);
            node.userData.isDragged = true;
          }
        }
      }
    };

    const handlePointerUp = () => {
      if (draggedNodeKey) {
        const node = serviceNodeMeshes[draggedNodeKey];
        if (node) {
          node.userData.isDragged = false;
        }
        draggedNodeKey = null;
      }
    };

    canvasContainer.addEventListener("pointerdown", handlePointerDown);
    canvasContainer.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    // 7. Animation Tick Loop
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();

      // ── Animate Drifting Background ──
      bgNodes.forEach((node) => {
        node.position.add(node.userData.velocity);
        if (Math.abs(node.position.x) > 4) node.userData.velocity.x *= -1;
        if (Math.abs(node.position.y) > 2.5) node.userData.velocity.y *= -1;
        if (Math.abs(node.position.z) > 2.5) node.userData.velocity.z *= -1;
      });
      bgNodeGroup.rotation.y += 0.0006;
      updateBgLines();

      // ── Orbiting Service Nodes & Breathing Lines ──
      activeConnections.forEach((conn, idx) => {
        const key = `${conn.processName}-${conn.port}`;
        const node = serviceNodeMeshes[key];
        const line = edgeLines[key];
        if (!node) return;

        const timeFactor = time * 0.6;
        const orbitRadius = 1.8 + idx * 0.28;
        const speed = 0.35 + idx * 0.06;
        const phase = node.userData.phase;
        const angle = timeFactor * speed + phase;

        const orbitX = orbitRadius * Math.cos(angle);
        const orbitZ = orbitRadius * Math.sin(angle);
        const orbitY = Math.sin(timeFactor * 1.5 + idx) * 0.15;

        if (node.userData.isDragged) {
          // Anchor phase to node coordinates so it doesn't snap back on drag release
          const currentAngle = Math.atan2(node.position.z, node.position.x);
          node.userData.phase = currentAngle - timeFactor * speed;
        } else {
          // Drifts and orbits smoothly with lerp physics
          node.position.x += (orbitX - node.position.x) * 0.07;
          node.position.z += (orbitZ - node.position.z) * 0.07;
          node.position.y += (orbitY - node.position.y) * 0.07;
        }

        // Pulse outer mesh emission
        if (node.material instanceof THREE.MeshPhongMaterial) {
          node.material.emissiveIntensity = 0.35 + Math.sin(time * 3 + idx) * 0.25;
        }

        // Draw and update edge lines
        if (line) {
          const points = [new THREE.Vector3(0, 0, 0), node.position];
          line.geometry.setFromPoints(points);
          
          // Pulse edge lines opacity
          if (line.material instanceof THREE.LineBasicMaterial) {
            line.material.opacity = 0.15 + 0.18 * Math.sin(time * 3.5 + idx);
          }
        }
      });

      // ── Central Host Node breathing pulse ──
      const hostPulse = 1 + Math.sin(time * 2.2) * 0.04;
      hostNode.scale.set(hostPulse, hostPulse, hostPulse);
      hostCoreRing.rotation.z += 0.001;

      // ── Mouse Parallax (Slow drift + mouse nudge) ──
      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;

      const baseCamX = Math.sin(time * 0.15) * 1.8;
      const baseCamZ = 6.5 + Math.cos(time * 0.15) * 1.2;
      const baseCamY = 2.4 + Math.sin(time * 0.1) * 0.8;

      camera.position.x = baseCamX + mouseX * 2.2;
      camera.position.y = baseCamY - mouseY * 1.8;
      camera.position.z = baseCamZ;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);

      // ── Direct DOM tracking for Floating HTML Labels ──
      const labelsContainer = labelsContainerRef.current;
      if (labelsContainer) {
        const containerRect = canvasContainer.getBoundingClientRect();
        activeConnections.forEach((conn) => {
          const key = `${conn.processName}-${conn.port}`;
          const node = serviceNodeMeshes[key];
          if (!node) return;

          const tempV = new THREE.Vector3();
          node.getWorldPosition(tempV);
          tempV.project(camera);

          const px = (tempV.x * 0.5 + 0.5) * containerRect.width;
          const py = (-(tempV.y * 0.5) + 0.5) * containerRect.height;

          const labelEl = labelsContainer.querySelector(`[data-label-key="${key}"]`) as HTMLElement | null;
          if (labelEl) {
            labelEl.style.transform = `translate3d(${px + 12}px, ${py - 8}px, 0)`;
          }
        });
      }
    };

    animate();

    // 8. Canvas Resize Handler
    const handleResize = () => {
      width = canvasContainer.clientWidth;
      height = canvasContainer.clientHeight;

      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(canvasContainer);

    // 9. Cleanup resources on unmounting
    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      canvasContainer.removeEventListener("pointerdown", handlePointerDown);
      canvasContainer.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);

      if (canvasContainer.contains(renderer.domElement)) {
        canvasContainer.removeChild(renderer.domElement);
      }

      scene.clear();
      renderer.dispose();
    };
  }, [activeConnections]);

  return (
    <div className="w-full select-none bg-slate-950/20 rounded-2xl border border-white/[0.03] p-4 relative overflow-hidden backdrop-blur-md h-[340px] md:h-[380px]">
      
      {/* Three.js canvas mount point */}
      <div ref={canvasContainerRef} className="w-full h-full relative" />

      {/* Floating 2D overlay text labels (tracks 3D node meshes directly in DOM) */}
      <div ref={labelsContainerRef} className="absolute inset-0 pointer-events-none overflow-hidden">
        {activeConnections.map((conn) => {
          const key = `${conn.processName}-${conn.port}`;
          const color = SEVERITY_COLOR_STR[conn.severity] ?? "#22c55e";
          const isSelected = activeNodeId === key;

          return (
            <div
              key={key}
              data-label-key={key}
              onClick={() => onNodeClick?.(key, conn.processName)}
              className={`absolute left-0 top-0 pointer-events-auto cursor-pointer font-mono text-[9px] select-none whitespace-nowrap bg-slate-950/80 px-2 py-0.5 rounded border transition-colors duration-300 ${
                isSelected
                  ? "border-white text-white font-bold"
                  : "border-white/5 text-slate-400 hover:text-white"
              }`}
              style={{ transform: "translate3d(-9999px, -9999px, 0)" }}
            >
              {conn.processName} <span style={{ color }} className="font-bold">:{conn.port}</span>
            </div>
          );
        })}
      </div>

      {/* Dynamic Mini Live Feed Tag */}
      <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/[0.02] border border-white/5 pointer-events-none">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-[9px] uppercase tracking-wider text-slate-400 font-mono">Live Feed</span>
      </div>

      {/* Legends */}
      <div className="absolute bottom-4 left-4 right-4 flex justify-center gap-4 text-[8px] md:text-[9px] font-mono text-slate-500 pointer-events-none">
        {(["critical", "high", "medium", "low"] as const).map((sev) => (
          <div key={sev} className="flex items-center gap-1">
            <div
              className="w-1 h-1 rounded-full"
              style={{ background: SEVERITY_COLOR_STR[sev] }}
            />
            <span className="capitalize">{sev}</span>
          </div>
        ))}
      </div>

    </div>
  );
}
