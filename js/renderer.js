/**
 * Canvas 2D renderer for orthogonal views of MDL models.
 * Three projections: Front (X,Y), Side (Z,Y), Top (X,Z).
 */

const VIEWS = {
  front: { axisH: 0, axisV: 1, label: 'Front (X, Y)' },  // X horizontal, Y vertical
  side:  { axisH: 2, axisV: 1, label: 'Side (Z, Y)' },    // Z horizontal, Y vertical
  top:   { axisH: 0, axisV: 2, label: 'Top (X, Z)' }      // X horizontal, Z vertical
};

const WIREFRAME_COLOR = '#555';
const VERTEX_COLOR = '#999';
const SELECTED_COLOR = '#ff3333';
const VERTEX_RADIUS = 2.5;
const SELECTED_RADIUS = 5;
const PADDING = 20;

/**
 * Compute a bounding box across all vertices of a frame.
 */
function computeBounds(vertices) {
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

  for (const v of vertices) {
    if (v[0] < minX) minX = v[0];
    if (v[1] < minY) minY = v[1];
    if (v[2] < minZ) minZ = v[2];
    if (v[0] > maxX) maxX = v[0];
    if (v[1] > maxY) maxY = v[1];
    if (v[2] > maxZ) maxZ = v[2];
  }

  return { min: [minX, minY, minZ], max: [maxX, maxY, maxZ] };
}

/**
 * Calculate transform (scale + offset) to fit model bounds into canvas.
 */
function fitTransform(canvas, bounds, axisH, axisV) {
  const w = canvas.width - PADDING * 2;
  const h = canvas.height - PADDING * 2;

  const rangeH = bounds.max[axisH] - bounds.min[axisH];
  const rangeV = bounds.max[axisV] - bounds.min[axisV];

  // Uniform scale to fit both axes
  const scale = Math.min(
    rangeH > 0 ? w / rangeH : w,
    rangeV > 0 ? h / rangeV : h
  );

  // Center in canvas
  const offsetH = PADDING + (w - rangeH * scale) / 2;
  const offsetV = PADDING + (h - rangeV * scale) / 2;

  return { scale, offsetH, offsetV, minH: bounds.min[axisH], minV: bounds.min[axisV] };
}

/**
 * Project a 3D vertex to 2D canvas coordinates for a given view.
 * Y axis is flipped so that positive Y points up.
 */
function project(vertex, view, transform, canvasHeight) {
  const h = (vertex[view.axisH] - transform.minH) * transform.scale + transform.offsetH;
  const v = (vertex[view.axisV] - transform.minV) * transform.scale + transform.offsetV;
  // Flip vertical axis so Y-up in model = up on screen
  return { x: h, y: canvasHeight - v };
}

/**
 * Render a frame on a canvas with the given orthogonal view.
 * Returns the transform used (needed for hit-testing).
 */
function renderView(canvas, model, frameIndex, viewKey, selectedVertex) {
  const ctx = canvas.getContext('2d');
  const view = VIEWS[viewKey];
  const frame = model.frames[frameIndex];
  const bounds = computeBounds(frame.vertices);
  const transform = fitTransform(canvas, bounds, view.axisH, view.axisV);

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Background
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Label
  ctx.fillStyle = '#666';
  ctx.font = '12px monospace';
  ctx.fillText(view.label, 8, 16);

  // Frame name
  ctx.fillStyle = '#444';
  ctx.fillText(`Frame ${frameIndex}: ${frame.name}`, 8, canvas.height - 8);

  // Wireframe
  ctx.strokeStyle = WIREFRAME_COLOR;
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  for (const tri of model.triangles) {
    const p0 = project(frame.vertices[tri.vertices[0]], view, transform, canvas.height);
    const p1 = project(frame.vertices[tri.vertices[1]], view, transform, canvas.height);
    const p2 = project(frame.vertices[tri.vertices[2]], view, transform, canvas.height);
    ctx.moveTo(p0.x, p0.y);
    ctx.lineTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.lineTo(p0.x, p0.y);
  }
  ctx.stroke();

  // Vertices
  for (let i = 0; i < frame.vertices.length; i++) {
    const p = project(frame.vertices[i], view, transform, canvas.height);
    const isSelected = i === selectedVertex;
    ctx.beginPath();
    ctx.arc(p.x, p.y, isSelected ? SELECTED_RADIUS : VERTEX_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = isSelected ? SELECTED_COLOR : VERTEX_COLOR;
    ctx.fill();
  }

  return transform;
}

/**
 * Find the nearest vertex to a click position on a canvas.
 * Returns the vertex index, or -1 if none is close enough.
 */
function findNearestVertex(canvas, clickX, clickY, model, frameIndex, viewKey, transform) {
  const view = VIEWS[viewKey];
  const frame = model.frames[frameIndex];
  const maxDist = 15; // pixels

  let bestIdx = -1;
  let bestDist = maxDist;

  for (let i = 0; i < frame.vertices.length; i++) {
    const p = project(frame.vertices[i], view, transform, canvas.height);
    const dx = p.x - clickX;
    const dy = p.y - clickY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < bestDist) {
      bestDist = dist;
      bestIdx = i;
    }
  }

  return bestIdx;
}
