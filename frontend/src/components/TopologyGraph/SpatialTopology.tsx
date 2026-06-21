/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/immutability */
/* eslint-disable react-hooks/purity */
import React, { useRef, useState, useMemo, useEffect, useContext } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import type { Connection } from "../../types/finding";
import HostCard from "./HostCard";
import { getTopologyIntensity, type TopologyIntensity, type ScanStatus, type ScanPhase } from "../../hooks/scanDirector";

// React context to pipe scan intensity into R3F sub-components
const IntensityCtx = React.createContext<TopologyIntensity>({
  orbitSpeedMultiplier: 1.0,
  connectionOpacityBoost: 0,
  hostGlowMultiplier: 1.0,
});

interface SpatialTopologyProps {
  connections?: Connection[];
  onNodeClick?: (nodeId: string, processName: string) => void;
  activeNodeId?: string | null;
  isScanning?: boolean;
  scanPhase?: ScanPhase;
  scanProgress?: number;
}

const MOCK_CONNECTIONS: Connection[] = [
  { processName: "mysqld", processPid: 4821, port: 3306, protocol: "tcp", state: "listening", severity: "critical" },
  { processName: "sshd", processPid: 1240, port: 22, protocol: "tcp", state: "listening", severity: "high" },
  { processName: "nginx", processPid: 2201, port: 80, protocol: "tcp", state: "listening", severity: "medium" },
  { processName: "redis", processPid: 3102, port: 6379, protocol: "tcp", state: "listening", severity: "medium" },
  { processName: "explorer", processPid: 1040, port: 3000, protocol: "tcp", state: "listening", severity: "low" },
];

const SEVERITY_COLOR_STR = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#eab308",
  low: "#22c55e",
};

const SEVERITY_COLOR_HEX = {
  critical: 0xef4444,
  high: 0xf97316,
  medium: 0xeab308,
  low: 0x22c55e,
};

// ── Background constellation particles ──
function ConstellationBackground() {
  const pointsRef = useRef<THREE.Points>(null);
  const lineRef = useRef<THREE.LineSegments>(null);
  const count = 150;

  const [positions, velocities] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vels = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 8;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 6;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 6;

      vels[i * 3] = (Math.random() - 0.5) * 0.002;
      vels[i * 3 + 1] = (Math.random() - 0.5) * 0.002;
      vels[i * 3 + 2] = (Math.random() - 0.5) * 0.002;
    }
    return [pos, vels];
  }, []);

  useFrame(() => {
    if (!pointsRef.current || !lineRef.current) return;

    const array = pointsRef.current.geometry.attributes.position.array as Float32Array;
    const lineArray = lineRef.current.geometry.attributes.position.array as Float32Array;

    // Update point positions
    for (let i = 0; i < count; i++) {
      array[i * 3] += velocities[i * 3];
      array[i * 3 + 1] += velocities[i * 3 + 1];
      array[i * 3 + 2] += velocities[i * 3 + 2];

      // Boundary wrap checks
      if (Math.abs(array[i * 3]) > 4) velocities[i * 3] *= -1;
      if (Math.abs(array[i * 3 + 1]) > 3) velocities[i * 3 + 1] *= -1;
      if (Math.abs(array[i * 3 + 2]) > 3) velocities[i * 3 + 2] *= -1;
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;

    // Draw constellation lines between nearby stars
    let counter = 0;
    for (let i = 0; i < count; i++) {
      for (let j = i + 1; j < count; j++) {
        const dx = array[i * 3] - array[j * 3];
        const dy = array[i * 3 + 1] - array[j * 3 + 1];
        const dz = array[i * 3 + 2] - array[j * 3 + 2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (dist < 1.4 && counter < count * count) {
          lineArray[counter++] = array[i * 3];
          lineArray[counter++] = array[i * 3 + 1];
          lineArray[counter++] = array[i * 3 + 2];
          lineArray[counter++] = array[j * 3];
          lineArray[counter++] = array[j * 3 + 1];
          lineArray[counter++] = array[j * 3 + 2];
        }
      }
    }
    lineRef.current.geometry.attributes.position.needsUpdate = true;
  });

  const linePositions = useMemo(() => new Float32Array(count * 6), []);

  return (
    <group>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          color="#bac8dc"
          size={0.035}
          transparent
          opacity={0.15}
          sizeAttenuation
        />
      </points>

      <lineSegments ref={lineRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[linePositions, 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial
          color="#bac8dc"
          transparent
          opacity={0.05}
        />
      </lineSegments>
    </group>
  );
}

// ── Central Host Node ──
function HostNode() {
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const intensity = useContext(IntensityCtx);

  useFrame(({ clock }) => {
    if (!meshRef.current || !ringRef.current) return;
    const t = clock.getElapsedTime();

    // Slow volumetric breathing pulse every 4 seconds, amplified by hostGlowMultiplier
    const breathe = Math.sin(t * (Math.PI / 2)) * 0.05 * intensity.hostGlowMultiplier;
    const scale = 1.0 + breathe;
    meshRef.current.scale.set(scale, scale, scale);

    // Rotate core glowing ring
    ringRef.current.rotation.z = t * 0.12;

    // Increase ring opacity during correlation phase glow
    if (ringRef.current.material instanceof THREE.MeshBasicMaterial) {
      ringRef.current.material.opacity = 0.15 * intensity.hostGlowMultiplier;
    }
  });

  return (
    <group>
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.36, 32, 32]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.92} />
      </mesh>

      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.55, 0.60, 32]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.15} side={THREE.DoubleSide} />
      </mesh>

      <Html
        distanceFactor={8}
        position={[0, -0.65, 0]}
        center
      >
        <HostCard />
      </Html>
    </group>
  );
}

// ── Orbiting Service Node & Pulse Connections ──
interface ServiceNodeProps {
  conn: Connection;
  index: number;
  total: number;
  onHover: (key: string | null) => void;
  onClick: (key: string, name: string) => void;
  activeNodeId: string | null;
  hoveredNodeId: string | null;
}

function ServiceNode({
  conn,
  index,
  total,
  onHover,
  onClick,
  activeNodeId,
  hoveredNodeId,
}: ServiceNodeProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const lineRef = useRef<THREE.Line>(null);
  const particleRefs = useRef<THREE.Mesh[]>([]);

  const key = `${conn.processName}-${conn.port}`;
  const colorHex = SEVERITY_COLOR_HEX[conn.severity] ?? 0x22c55e;
  const colorStr = SEVERITY_COLOR_STR[conn.severity] ?? "#22c55e";
  const isSelected = activeNodeId === key;
  const isHovered = hoveredNodeId === key;

  // Orbit calculations
  const orbitRadius = 1.8 + index * 0.35;
  const speed = 0.3 + index * 0.05;
  const phase = (index * 2 * Math.PI) / total;

  const dragPlane = useMemo(() => new THREE.Plane(), []);
  const planeNormal = useMemo(() => new THREE.Vector3(), []);
  const planeIntersection = useMemo(() => new THREE.Vector3(), []);
  const velocity = useRef(new THREE.Vector3(0, 0, 0));
  const [dragging, setDragging] = useState(false);

  const intensity = useContext(IntensityCtx);

  useFrame(({ clock, raycaster }) => {
    if (!meshRef.current || !lineRef.current) return;

    const t = clock.getElapsedTime();
    const currentPos = meshRef.current.position;

    if (dragging) {
      // Direct drag handling
      raycaster.ray.intersectPlane(dragPlane, planeIntersection);
      if (planeIntersection) {
        velocity.current.subVectors(planeIntersection, currentPos);
        currentPos.copy(planeIntersection);
      }
    } else {
      // Orbit coordinate mapping — speed scaled by scan intensity
      const angle = t * (speed * intensity.orbitSpeedMultiplier) + phase;
      const targetX = Math.cos(angle) * orbitRadius;
      const targetZ = Math.sin(angle) * orbitRadius;
      const targetY = Math.sin(t * 1.5 + index) * 0.15;

      const targetPos = new THREE.Vector3(targetX, targetY, targetZ);
      const springForce = new THREE.Vector3().subVectors(targetPos, currentPos).multiplyScalar(0.08);

      velocity.current.add(springForce);
      velocity.current.multiplyScalar(0.85); // Damping damping / inertia friction
      currentPos.add(velocity.current);
    }

    // Connect node to central host
    const points = [new THREE.Vector3(0, 0, 0), currentPos];
    lineRef.current.geometry.setFromPoints(points);

    // Pulse energy path lines — boosted by connectionOpacityBoost during assessment
    if (lineRef.current.material instanceof THREE.LineBasicMaterial) {
      lineRef.current.material.opacity = 0.15 + Math.sin(t * 3.5 + index) * 0.15 + intensity.connectionOpacityBoost;
    }

    // Pulse node emissive glow
    if (meshRef.current.material instanceof THREE.MeshPhongMaterial) {
      meshRef.current.material.emissiveIntensity = 0.35 + Math.sin(clock.getElapsedTime() * 3 + index) * 0.25;
    }

    // Animate flow particles along connection paths
    particleRefs.current.forEach((particle, pIdx) => {
      if (!particle) return;
      const pSpeed = 0.35 + pIdx * 0.12;
      const pProgress = (t * pSpeed + pIdx * 0.33) % 1.0;
      particle.position.copy(currentPos).multiplyScalar(pProgress);
    });
  });

  const handlePointerDown = (e: any) => {
    e.stopPropagation();
    e.target.setPointerCapture(e.pointerId);
    setDragging(true);
    document.body.style.cursor = "grabbing";

    const camera = e.camera;
    camera.getWorldDirection(planeNormal);
    planeNormal.negate(); // Face camera
    dragPlane.setFromNormalAndCoplanarPoint(planeNormal, meshRef.current!.position);
  };

  const handlePointerUp = (e: any) => {
    e.stopPropagation();
    e.target.releasePointerCapture(e.pointerId);
    setDragging(false);
    document.body.style.cursor = "grab";
  };

  return (
    <group>
      {/* Animated Connection Path */}
      <line ref={lineRef as any}>
        <bufferGeometry />
        <lineBasicMaterial color={colorStr} transparent opacity={0.25} />
      </line>

      {/* Path flow particles */}
      {[0, 1, 2].map((i) => (
        <mesh key={i} ref={(el) => (particleRefs.current[i] = el as THREE.Mesh)}>
          <sphereGeometry args={[0.032, 8, 8]} />
          <meshBasicMaterial color={colorStr} transparent opacity={0.7} />
        </mesh>
      ))}

      {/* Node Sphere */}
      <mesh
        ref={meshRef}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover(key);
          document.body.style.cursor = "grab";
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          onHover(null);
          document.body.style.cursor = "auto";
        }}
        onClick={(e) => {
          e.stopPropagation();
          onClick(key, conn.processName);
        }}
        scale={isSelected ? [1.3, 1.3, 1.3] : isHovered ? [1.2, 1.2, 1.2] : [1.0, 1.0, 1.0]}
      >
        <sphereGeometry args={[0.13, 16, 16]} />
        <meshPhongMaterial
          color={colorHex}
          emissive={colorHex}
          emissiveIntensity={0.5}
          transparent
          opacity={0.9}
        />

        {/* Hover card using Drei HTML panel */}
        {(isHovered || isSelected) && (
          <Html distanceFactor={8} position={[0, 0.45, 0]} center>
            <div className="bg-slate-950/95 border border-white/10 p-3 rounded shadow-2xl text-left select-none font-mono text-[9px] text-slate-400 min-w-[130px] backdrop-blur-md">
              <div className="font-bold text-white tracking-wider text-[10px] mb-1 capitalize flex justify-between items-center">
                <span>{conn.processName}</span>
                <span style={{ color: colorStr }} className="text-[8px] font-mono">:{conn.port}</span>
              </div>
              <div className="h-px w-full bg-white/10 my-1.5" />
              <div>Risk: <span style={{ color: colorStr }} className="font-bold uppercase">{conn.severity}</span></div>
              <div>State: <span className="text-slate-300">{conn.state}</span></div>
              <div className="text-[7px] text-slate-500 mt-1 uppercase">PID: {conn.processPid}</div>
            </div>
          </Html>
        )}
      </mesh>
    </group>
  );
}

// ── Camera Controller (Drift & Mouse Parallax) ──
function CameraController() {
  const { camera } = useThree();
  const mouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    // camera slow drift path + mouse parallax nudge (5-8 degrees)
    const targetX = Math.sin(t * 0.15) * 1.6 + mouse.current.x * 1.4;
    const targetY = 2.4 + Math.sin(t * 0.1) * 0.6 - mouse.current.y * 1.2;
    const targetZ = 6.2 + Math.cos(t * 0.15) * 0.8;

    camera.position.x += (targetX - camera.position.x) * 0.05;
    camera.position.y += (targetY - camera.position.y) * 0.05;
    camera.position.z += (targetZ - camera.position.z) * 0.05;
    camera.lookAt(0, 0, 0);
  });

  return null;
}

// ── Main SpatialTopology Container Component ──
export default function SpatialTopology({
  connections = [],
  onNodeClick,
  activeNodeId = null,
  isScanning = false,
  scanPhase = "",
  scanProgress: _scanProgress = 0,
}: SpatialTopologyProps) {
  const active = connections.length > 0 ? connections : MOCK_CONNECTIONS;
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // Derive scan intensity from scanDirector
  const scanStatus: ScanStatus = isScanning ? "running" : "idle";
  const intensity = getTopologyIntensity(scanStatus, scanPhase);

  return (
    <div className="flex flex-col lg:flex-row w-full justify-between items-stretch h-full relative z-10 pt-24 pb-20 gap-8 px-margin-desktop select-none">

      {/* Left Column: Briefing Panel (35% width) */}
      <div className="w-full lg:w-[35%] flex flex-col justify-between py-6 text-left z-20">
        <div>
          <div className="flex items-center gap-4 mb-6">
            <div className="h-px w-10 bg-white/20 flex-shrink-0" />
            <span className="label-eyebrow">Section 05 // Spatial Telemetry</span>
          </div>

          <h2 className="font-display text-white leading-[0.92] tracking-tight mb-8 uppercase text-5xl md:text-6xl xl:text-7xl">
            Connection <br />
            <span className="text-primary italic font-semibold block mt-2">Landscape</span>
          </h2>

          <p className="font-sans text-sm text-slate-400 opacity-80 leading-relaxed max-w-sm mb-10">
            Visualizing the invisible. Aether constructs a live spatial map of active network interfaces, listener sockets, and process bindings to identify exposed service entry points.
          </p>

          {/* Topology Stats Overview Panel */}
          <div className="p-6 rounded-2xl border border-white/[0.04] bg-white/[0.003] backdrop-blur-sm max-w-sm mb-10">
            <p className="label-eyebrow text-slate-500 mb-4 tracking-wider">Topology Overview</p>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div>
                <div className="text-[8px] font-mono uppercase tracking-widest text-slate-500">Nodes</div>
                <div className="text-2xl font-mono font-bold text-white mt-1">139</div>
              </div>
              <div>
                <div className="text-[8px] font-mono uppercase tracking-widest text-slate-500">Conns</div>
                <div className="text-2xl font-mono font-bold text-white mt-1">284</div>
              </div>
              <div>
                <div className="text-[8px] font-mono uppercase tracking-widest text-slate-500">Exposed</div>
                <div className="text-2xl font-mono font-bold text-primary mt-1">5</div>
              </div>
              <div>
                <div className="text-[8px] font-mono uppercase tracking-widest text-slate-500">Critical</div>
                <div className="text-2xl font-mono font-bold text-rose-500 mt-1">2</div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <button
            onClick={() => onNodeClick?.("mysqld-3306", "mysqld")}
            className="group px-8 py-4 rounded-full font-mono text-[9px] font-bold bg-white text-slate-950 hover:bg-slate-200 transition-all duration-300 uppercase tracking-widest flex items-center gap-3 shadow-[0_0_15px_rgba(255,255,255,0.06)]"
          >
            <span>Examine Nodes</span>
            <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
          </button>
        </div>
      </div>

      {/* Right Column: R3F Canvas Container (65% width) */}
      <div className="w-full lg:w-[65%] h-[420px] lg:h-auto min-h-[480px] relative rounded-3xl border border-white/[0.03] bg-slate-950/20 backdrop-blur-md overflow-hidden z-10 flex items-stretch">
        <div className="w-full h-full relative flex-1">

          <Canvas camera={{ position: [0, 3, 6], fov: 50 }}>
            <IntensityCtx.Provider value={intensity}>
              {/* Ambient + volumetric lighting */}
              <ambientLight intensity={0.45} />
              <pointLight position={[0, 4, 4]} intensity={0.8} />

              {/* Camera Drift + Mouse Parallax */}
              <CameraController />

              {/* Constellation background of stars and lines */}
              <ConstellationBackground />

              {/* Central glowing host node */}
              <HostNode />

              {/* Orbiting service nodes */}
              {active.map((conn, idx) => (
                <ServiceNode
                  key={`${conn.processName}-${conn.port}`}
                  conn={conn}
                  index={idx}
                  total={active.length}
                  activeNodeId={activeNodeId}
                  hoveredNodeId={hoveredNodeId}
                  onHover={setHoveredNodeId}
                  onClick={onNodeClick || (() => { })}
                />
              ))}
            </IntensityCtx.Provider>
          </Canvas>

          {/* Mini Live Tag overlay */}
          <div className="absolute top-6 right-6 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/[0.02] border border-white/5 pointer-events-none">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[9px] uppercase tracking-wider text-slate-400 font-mono">Live Feed</span>
          </div>

          {/* Mouse interaction indicator */}
          <div className="absolute bottom-6 right-6 flex items-center gap-2 pointer-events-none text-slate-500 font-mono text-[8px] uppercase tracking-widest">
            <span className="text-slate-400">⚡</span> Drag nodes / Zoom / Rotate
          </div>

          {/* Bottom legend block */}
          <div className="absolute bottom-6 left-6 flex gap-4 text-[8px] font-mono text-slate-500 pointer-events-none">
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
      </div>

    </div>
  );
}
