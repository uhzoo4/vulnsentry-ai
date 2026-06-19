import { useEffect, useRef } from "react";

// ============================================================================
// Delaunay Triangulation Helper
// Type-safe port of the Delaunay triangulation algorithm from Max Surguy's engine
// ============================================================================
type Point = [number, number];

const EPSILON = 1.0 / 1048576.0;

function supertriangle(vertices: Point[]): [Point, Point, Point] {
  let xmin = Number.POSITIVE_INFINITY;
  let ymin = Number.POSITIVE_INFINITY;
  let xmax = Number.NEGATIVE_INFINITY;
  let ymax = Number.NEGATIVE_INFINITY;

  for (let i = vertices.length; i--; ) {
    const x = vertices[i][0];
    const y = vertices[i][1];
    if (x < xmin) xmin = x;
    if (x > xmax) xmax = x;
    if (y < ymin) ymin = y;
    if (y > ymax) ymax = y;
  }

  const dx = xmax - xmin;
  const dy = ymax - ymin;
  const dmax = Math.max(dx, dy);
  const xmid = xmin + dx * 0.5;
  const ymid = ymin + dy * 0.5;

  return [
    [xmid - 20 * dmax, ymid - dmax],
    [xmid, ymid + 20 * dmax],
    [xmid + 20 * dmax, ymid - dmax],
  ];
}

function circumcircle(vertices: Point[], i: number, j: number, k: number) {
  const x1 = vertices[i][0];
  const y1 = vertices[i][1];
  const x2 = vertices[j][0];
  const y2 = vertices[j][1];
  const x3 = vertices[k][0];
  const y3 = vertices[k][1];
  const fabsy1y2 = Math.abs(y1 - y2);
  const fabsy2y3 = Math.abs(y2 - y3);

  if (fabsy1y2 < EPSILON && fabsy2y3 < EPSILON) {
    throw new Error("Coincident points in circumcircle check.");
  }

  let xc = 0;
  let yc = 0;

  if (fabsy1y2 < EPSILON) {
    const m2 = -((x3 - x2) / (y3 - y2));
    const mx2 = (x2 + x3) / 2.0;
    const my2 = (y2 + y3) / 2.0;
    xc = (x2 + x1) / 2.0;
    yc = m2 * (xc - mx2) + my2;
  } else if (fabsy2y3 < EPSILON) {
    const m1 = -((x2 - x1) / (y2 - y1));
    const mx1 = (x1 + x2) / 2.0;
    const my1 = (y1 + y2) / 2.0;
    xc = (x3 + x2) / 2.0;
    yc = m1 * (xc - mx1) + my1;
  } else {
    const m1 = -((x2 - x1) / (y2 - y1));
    const m2 = -((x3 - x2) / (y3 - y2));
    const mx1 = (x1 + x2) / 2.0;
    const mx2 = (x2 + x3) / 2.0;
    const my1 = (y1 + y2) / 2.0;
    const my2 = (y2 + y3) / 2.0;
    xc = (m1 * mx1 - m2 * mx2 + my2 - my1) / (m1 - m2);
    yc = fabsy1y2 > fabsy2y3 ? m1 * (xc - mx1) + my1 : m2 * (xc - mx2) + my2;
  }

  const dx = x2 - xc;
  const dy = y2 - yc;
  return { i, j, k, x: xc, y: yc, r: dx * dx + dy * dy };
}

function dedup(edges: number[]) {
  for (let j = edges.length; j; ) {
    const b = edges[--j];
    const a = edges[--j];

    for (let i = j; i; ) {
      const n = edges[--i];
      const m = edges[--i];

      if ((a === m && b === n) || (a === n && b === m)) {
        edges.splice(j, 2);
        edges.splice(i, 2);
        break;
      }
    }
  }
}

function triangulate(vertices: Point[]): number[] {
  const n = vertices.length;
  if (n < 3) return [];

  // Clone vertices array to avoid side effects
  const pts = vertices.slice(0);

  // Sort vertex indices by X position
  const indices = new Array(n);
  for (let i = n; i--; ) indices[i] = i;
  indices.sort((i, j) => pts[j][0] - pts[i][0]);

  // Construct supertriangle containing all points
  const st = supertriangle(pts);
  pts.push(st[0], st[1], st[2]);

  const open = [circumcircle(pts, n + 0, n + 1, n + 2)];
  const closed: typeof open = [];
  const edges: number[] = [];

  for (let i = indices.length; i--; edges.length = 0) {
    const c = indices[i];

    for (let j = open.length; j--; ) {
      const dx = pts[c][0] - open[j].x;
      if (dx > 0.0 && dx * dx > open[j].r) {
        closed.push(open[j]);
        open.splice(j, 1);
        continue;
      }

      const dy = pts[c][1] - open[j].y;
      if (dx * dx + dy * dy - open[j].r > EPSILON) continue;

      edges.push(
        open[j].i, open[j].j,
        open[j].j, open[j].k,
        open[j].k, open[j].i
      );
      open.splice(j, 1);
    }

    dedup(edges);

    for (let j = edges.length; j; ) {
      const b = edges[--j];
      const a = edges[--j];
      open.push(circumcircle(pts, a, b, c));
    }
  }

  const resultIndices: number[] = [];
  for (let i = closed.length; i--; ) {
    if (closed[i].i < n && closed[i].j < n && closed[i].k < n) {
      resultIndices.push(closed[i].i, closed[i].j, closed[i].k);
    }
  }

  return resultIndices;
}

// ============================================================================
// DelaunayBackground Component
// ============================================================================
export default function DelaunayBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef<{ x: number; y: number; targetX: number; targetY: number }>({
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Initial mouse center position
    mouseRef.current.x = width / 2;
    mouseRef.current.y = height / 2;
    mouseRef.current.targetX = width / 2;
    mouseRef.current.targetY = height / 2;

    // Node & Mesh Generation Variables
    let baseVertices: Point[] = [];
    let triangleIndices: number[] = [];
    let vertexOffsets: { angle: number; speed: number; range: number }[] = [];

    const initializeMesh = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;

      // 1. Generate grid count based on screen density
      const colWidth = 180;
      const rowHeight = 180;
      const cols = Math.ceil(width / colWidth) + 1;
      const rows = Math.ceil(height / rowHeight) + 1;

      baseVertices = [];
      vertexOffsets = [];

      // 2. Generate points with slight jitter to create organic Delaunay shapes
      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
          const x = (c * colWidth) - 50 + (Math.random() - 0.5) * 60;
          const y = (r * rowHeight) - 50 + (Math.random() - 0.5) * 60;
          baseVertices.push([x, y]);

          // Set up animation offsets for breathing effect
          vertexOffsets.push({
            angle: Math.random() * Math.PI * 2,
            speed: 0.0005 + Math.random() * 0.0008,
            range: 15 + Math.random() * 15,
          });
        }
      }

      // Add static boundary edge points to prevent border gaps
      const edgePadding = 100;
      const stepX = width / 5;
      const stepY = height / 5;

      for (let i = 0; i <= 5; i++) {
        // Top Edge
        baseVertices.push([i * stepX, -edgePadding]);
        vertexOffsets.push({ angle: 0, speed: 0, range: 0 });
        // Bottom Edge
        baseVertices.push([i * stepX, height + edgePadding]);
        vertexOffsets.push({ angle: 0, speed: 0, range: 0 });
      }
      for (let i = 1; i < 5; i++) {
        // Left Edge
        baseVertices.push([-edgePadding, i * stepY]);
        vertexOffsets.push({ angle: 0, speed: 0, range: 0 });
        // Right Edge
        baseVertices.push([width + edgePadding, i * stepY]);
        vertexOffsets.push({ angle: 0, speed: 0, range: 0 });
      }

      // 3. Triangulate cached coordinates
      triangleIndices = triangulate(baseVertices);
    };

    initializeMesh();

    // Resize event listener
    const handleResize = () => {
      initializeMesh();
    };
    window.addEventListener("resize", handleResize);

    // Mouse movement tracker
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.targetX = e.clientX;
      mouseRef.current.targetY = e.clientY;
    };
    window.addEventListener("mousemove", handleMouseMove);

    // Animation Loop
    const draw = (time: number) => {
      // Smooth mouse interpolation (ease-out follow)
      const mouse = mouseRef.current;
      mouse.x += (mouse.targetX - mouse.x) * 0.08;
      mouse.y += (mouse.targetY - mouse.y) * 0.08;

      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "#070a13";
      ctx.fillRect(0, 0, width, height);

      // Apply breathing movement to vertices
      const currentVertices: Point[] = baseVertices.map((vertex, i) => {
        const offset = vertexOffsets[i];
        if (offset.range === 0) return vertex; // Static edge vertices

        const deltaX = Math.cos(offset.angle + time * offset.speed) * offset.range;
        const deltaY = Math.sin(offset.angle + time * offset.speed) * offset.range;
        return [vertex[0] + deltaX, vertex[1] + deltaY];
      });

      // Render Triangles
      for (let i = 0; i < triangleIndices.length; i += 3) {
        const idxA = triangleIndices[i];
        const idxB = triangleIndices[i + 1];
        const idxC = triangleIndices[i + 2];

        const ptA = currentVertices[idxA];
        const ptB = currentVertices[idxB];
        const ptC = currentVertices[idxC];

        // Compute centroid
        const cx = (ptA[0] + ptB[0] + ptC[0]) / 3;
        const cy = (ptA[1] + ptB[1] + ptC[1]) / 3;

        // Proximity calculation relative to cursor light source
        const dx = cx - mouse.x;
        const dy = cy - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Ambient Ocean lighting logic (Spotlight gradient)
        const maxRadius = 400;
        let intensity = 0;

        if (dist < maxRadius) {
          // Quadratic attenuation for soft spotlight falloff
          intensity = Math.pow((maxRadius - dist) / maxRadius, 2);
        }

        // Color interpolation: Deep Ocean Dark Slate (#070a13) to Soft Glowing Emerald-Indigo
        // Hue rotates based on mouse proximity for a luxury cinematic look
        const alpha = 0.02 + intensity * 0.09;
        const red = Math.round(7 + intensity * 15);
        const green = Math.round(15 + intensity * 45);
        const blue = Math.round(25 + intensity * 70);

        ctx.fillStyle = `rgba(${red}, ${green}, ${blue}, ${alpha})`;
        
        ctx.beginPath();
        ctx.moveTo(ptA[0], ptA[1]);
        ctx.lineTo(ptB[0], ptB[1]);
        ctx.lineTo(ptC[0], ptC[1]);
        ctx.closePath();
        ctx.fill();

        // Subtle wireframe overlay
        const outlineIntensity = 0.015 + intensity * 0.035;
        ctx.strokeStyle = `rgba(255, 255, 255, ${outlineIntensity})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    animationFrameId = requestAnimationFrame(draw);

    // Cleanups
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full -z-10 no-interaction block"
    />
  );
}
