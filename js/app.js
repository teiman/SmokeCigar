/**
 * Main application logic: drag & drop, UI controls, vertex selection, code generation.
 */

(function () {
  // --- State ---
  let model = null;
  let currentFrame = 0;
  let selectedVertex = -1;
  const transforms = {}; // viewKey -> last transform from rendering

  // --- DOM elements ---
  const dropZone = document.getElementById('drop-zone');
  const appContent = document.getElementById('app-content');
  const canvasFront = document.getElementById('canvas-front');
  const canvasSide = document.getElementById('canvas-side');
  const canvasTop = document.getElementById('canvas-top');
  const frameSlider = document.getElementById('frame-slider');
  const frameLabel = document.getElementById('frame-label');
  const frameFrom = document.getElementById('frame-from');
  const frameTo = document.getElementById('frame-to');
  const templateArea = document.getElementById('template-area');
  const outputArea = document.getElementById('output-area');
  const vertexInfo = document.getElementById('vertex-info');
  const btnGenerate = document.getElementById('btn-generate');
  const btnCopy = document.getElementById('btn-copy');

  // --- Drag & Drop ---
  document.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
  });

  document.addEventListener('dragleave', (e) => {
    if (!e.relatedTarget || e.relatedTarget === document.documentElement) {
      dropZone.classList.remove('drag-over');
    }
  });

  document.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');

    const file = e.dataTransfer.files[0];
    if (!file || !file.name.toLowerCase().endsWith('.mdl')) {
      showError('Please drop a .mdl file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      try {
        model = parseMDL(reader.result);
        onModelLoaded();
      } catch (err) {
        showError('Failed to parse MDL: ' + err.message);
        console.error(err);
      }
    };
    reader.readAsArrayBuffer(file);
  });

  // --- Model loaded ---
  function onModelLoaded() {
    selectedVertex = -1;
    currentFrame = 0;

    dropZone.style.display = 'none';
    appContent.style.display = 'block';

    // Setup frame controls
    const maxFrame = model.frames.length - 1;
    frameSlider.max = maxFrame;
    frameSlider.value = 0;
    frameFrom.max = maxFrame;
    frameTo.max = maxFrame;
    frameFrom.value = 0;
    frameTo.value = maxFrame;

    updateFrameLabel();

    // Wait for layout before measuring canvas dimensions
    requestAnimationFrame(() => {
      resizeCanvases();
      render();
    });
  }

  // --- Rendering ---
  function resizeCanvases() {
    [canvasFront, canvasSide, canvasTop].forEach((c) => {
      c.width = c.clientWidth;
      c.height = c.clientHeight;
    });
  }

  function render() {
    if (!model) return;
    transforms.front = renderView(canvasFront, model, currentFrame, 'front', selectedVertex);
    transforms.side = renderView(canvasSide, model, currentFrame, 'side', selectedVertex);
    transforms.top = renderView(canvasTop, model, currentFrame, 'top', selectedVertex);
    updateVertexInfo();
  }

  // --- Frame slider ---
  frameSlider.addEventListener('input', () => {
    currentFrame = parseInt(frameSlider.value, 10);
    updateFrameLabel();
    render();
  });

  function updateFrameLabel() {
    if (!model) return;
    const frame = model.frames[currentFrame];
    frameLabel.textContent = `Frame ${currentFrame}: ${frame.name}`;
  }

  // --- Vertex selection via click on any canvas ---
  function handleCanvasClick(canvas, viewKey) {
    canvas.addEventListener('click', (e) => {
      if (!model || !transforms[viewKey]) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const idx = findNearestVertex(canvas, x, y, model, currentFrame, viewKey, transforms[viewKey]);
      if (idx >= 0) {
        selectedVertex = idx;
        render();
      }
    });
  }

  handleCanvasClick(canvasFront, 'front');
  handleCanvasClick(canvasSide, 'side');
  handleCanvasClick(canvasTop, 'top');

  // --- Vertex info ---
  function updateVertexInfo() {
    if (selectedVertex < 0 || !model) {
      vertexInfo.textContent = 'No vertex selected. Click on a canvas to select one.';
      return;
    }
    const v = model.frames[currentFrame].vertices[selectedVertex];
    vertexInfo.textContent = `Vertex #${selectedVertex} — Position: ${formatVector(v)}`;
  }

  function formatVector(v) {
    return `${v[0].toFixed(2)} ${v[1].toFixed(2)} ${v[2].toFixed(2)}`;
  }

  // --- Code generation ---
  btnGenerate.addEventListener('click', generateCode);

  function generateCode() {
    if (!model || selectedVertex < 0) {
      outputArea.value = '// Select a vertex first.';
      return;
    }

    const from = parseInt(frameFrom.value, 10);
    const to = parseInt(frameTo.value, 10);
    if (from > to || isNaN(from) || isNaN(to)) {
      outputArea.value = '// Invalid frame range.';
      return;
    }

    const template = templateArea.value;
    const lines = [];

    for (let f = from; f <= to; f++) {
      const v = model.frames[f].vertices[selectedVertex];
      let block = template
        .replace(/<num>/g, String(f))
        .replace(/<vector>/g, `'${formatVector(v)}'`);

      // Remove trailing "else" from the last block
      if (f === to) {
        block = block.replace(/\n?else\s*$/, '');
      }

      lines.push(block);
    }

    outputArea.value = lines.join('\n');
  }

  // --- Copy output ---
  btnCopy.addEventListener('click', () => {
    outputArea.select();
    navigator.clipboard.writeText(outputArea.value);
  });

  // --- Error display ---
  function showError(msg) {
    const el = document.getElementById('error-msg');
    el.textContent = msg;
    el.style.display = 'block';
    setTimeout(() => { el.style.display = 'none'; }, 4000);
  }

  // --- Resize handling ---
  window.addEventListener('resize', () => {
    resizeCanvases();
    render();
  });
})();
