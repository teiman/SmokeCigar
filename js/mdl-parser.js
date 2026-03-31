/**
 * Quake 1 MDL file parser.
 * Format reference: https://formats.kaitai.io/quake_mdl/index.html
 *
 * MDL files use little-endian byte order.
 * Magic: "IDPO" (0x4F504449), Version: 6
 */

const MDL_MAGIC = 0x4F504449; // "IDPO"
const MDL_VERSION = 6;

/**
 * Parse a Quake 1 .mdl file from an ArrayBuffer.
 * Returns { header, triangles, frames }.
 */
function parseMDL(arrayBuffer) {
  const view = new DataView(arrayBuffer);
  let offset = 0;

  function readInt32() {
    const val = view.getInt32(offset, true);
    offset += 4;
    return val;
  }

  function readFloat32() {
    const val = view.getFloat32(offset, true);
    offset += 4;
    return val;
  }

  function readUint8() {
    const val = view.getUint8(offset);
    offset += 1;
    return val;
  }

  // --- Header (84 bytes) ---
  const ident = readInt32();
  if (ident !== MDL_MAGIC) {
    throw new Error('Not a valid Quake 1 MDL file (bad magic)');
  }

  const version = readInt32();
  if (version !== MDL_VERSION) {
    throw new Error(`Unsupported MDL version: ${version} (expected ${MDL_VERSION})`);
  }

  const scale = [readFloat32(), readFloat32(), readFloat32()];
  const origin = [readFloat32(), readFloat32(), readFloat32()];
  const boundingRadius = readFloat32();
  const eyePosition = [readFloat32(), readFloat32(), readFloat32()];
  const numSkins = readInt32();
  const skinWidth = readInt32();
  const skinHeight = readInt32();
  const numVerts = readInt32();
  const numTris = readInt32();
  const numFrames = readInt32();
  const syncType = readInt32();
  const flags = readInt32();
  const size = readFloat32();

  const header = {
    scale, origin, boundingRadius, eyePosition,
    numSkins, skinWidth, skinHeight,
    numVerts, numTris, numFrames,
    syncType, flags, size
  };

  // --- Skins (skip over them) ---
  for (let i = 0; i < numSkins; i++) {
    const group = readInt32(); // 0 = single, 1 = group
    if (group === 0) {
      // Single skin: skinWidth * skinHeight bytes of indexed color data
      offset += skinWidth * skinHeight;
    } else {
      // Skin group: number of skins, then timing, then pixel data
      const numGroupSkins = readInt32();
      offset += numGroupSkins * 4; // float time per skin
      offset += numGroupSkins * skinWidth * skinHeight;
    }
  }

  // --- Texture coordinates (skin vertices) ---
  // We skip these since we only need geometry for wireframe views.
  // Each entry: int32 onseam, int32 s, int32 t
  offset += numVerts * 12;

  // --- Triangles ---
  const triangles = [];
  for (let i = 0; i < numTris; i++) {
    const facesFront = readInt32();
    const v0 = readInt32();
    const v1 = readInt32();
    const v2 = readInt32();
    triangles.push({ facesFront, vertices: [v0, v1, v2] });
  }

  // --- Frames ---
  const frames = [];
  for (let i = 0; i < numFrames; i++) {
    const frameType = readInt32(); // 0 = simple, != 0 = group

    if (frameType === 0) {
      // Simple frame
      frames.push(readSimpleFrame());
    } else {
      // Frame group
      const numGroupFrames = readInt32();
      // bboxmin for group (4 bytes: 3 coords + 1 normal index)
      offset += 4;
      // bboxmax for group
      offset += 4;
      // Timing: float per sub-frame
      offset += numGroupFrames * 4;
      // Read each sub-frame as a simple frame
      for (let j = 0; j < numGroupFrames; j++) {
        frames.push(readSimpleFrame());
      }
    }
  }

  function readSimpleFrame() {
    // bboxmin: 3 bytes + 1 normal index
    const bboxmin = [readUint8(), readUint8(), readUint8()];
    readUint8(); // normal index (unused)
    // bboxmax: 3 bytes + 1 normal index
    const bboxmax = [readUint8(), readUint8(), readUint8()];
    readUint8(); // normal index (unused)

    // Frame name: 16 bytes, null-terminated ASCII
    let name = '';
    let terminated = false;
    for (let c = 0; c < 16; c++) {
      const ch = readUint8();
      if (ch === 0) terminated = true;
      if (!terminated) name += String.fromCharCode(ch);
    }

    // Vertices: numVerts entries, each 4 bytes (3 compressed coords + 1 normal index)
    const vertices = [];
    for (let v = 0; v < numVerts; v++) {
      const cx = readUint8();
      const cy = readUint8();
      const cz = readUint8();
      readUint8(); // normal index (unused for our purposes)

      // Decompress: real = compressed * scale + origin
      vertices.push([
        cx * scale[0] + origin[0],
        cy * scale[1] + origin[1],
        cz * scale[2] + origin[2]
      ]);
    }

    return { name: name.trim(), vertices };
  }

  return { header, triangles, frames };
}
