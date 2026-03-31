# Smokecigar

**Quake 1 MDL Vertex Tracker** — a 100% client-side web app to inspect Quake 1 `.mdl` model files, select vertices, and generate templated QuakeC code with vertex positions across animation frames.

Live at [zerror.com/smokecigar](https://zerror.com/smokecigar/)

## Features

- Drag & drop any Quake 1 `.mdl` file onto the page
- Three orthogonal 2D views (Front, Side, Top) rendered on HTML5 Canvas
- Click any view to select a vertex
- Navigate animation frames with a slider
- Generate QuakeC code from a customizable template using `<num>` and `<vector>` placeholders
- Copy output to clipboard

## Quick start

```bash
npm install
npm start
```

This starts a local server on port 3000 via `serve`.

## Usage

1. **Drop a `.mdl` file** onto the drop zone.
2. Three canvas panels appear showing the model from different angles. Click on any panel to select a vertex.
3. Adjust the **frame range** to choose which frames to include.
4. Edit the **template** (uses `<num>` for frame number and `<vector>` for vertex position) and click **Generate**.

### Template example

```
if ( self.frame==<num>)
    return <vector>;
else
```

Output (last block omits the trailing `else`):

```
if ( self.frame==1)
    return '3 4 2';
else
if ( self.frame==2)
    return '1 4 1';
if ( self.frame==3)
    return '2 5 3';
```

## Project structure

```
index.html              Entry point
css/style.css           Styles (dark theme)
js/
  mdl-parser.js         Quake 1 MDL binary format parser
  renderer.js           Canvas 2D orthogonal projection renderer
  app.js                Main application logic (drag-drop, UI, code generation)
scripts/
  dist.js               Build script — copies source files to dist/
tests/
  mdl-drop.spec.js      Playwright E2E tests
  deploy-check.spec.js  Production deployment smoke tests
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start local dev server |
| `npm run dist` | Copy source files to `dist/` |
| `npm run deploy` | Build and deploy to production via scp |
| `npx playwright test` | Run E2E tests |

## Tech stack

- Vanilla JavaScript (no frameworks, no build step)
- HTML5 Canvas 2D API
- [Playwright](https://playwright.dev/) for E2E testing
- [serve](https://www.npmjs.com/package/serve) for local development

## MDL format notes

The parser handles Quake 1 MDL format specifically (magic `IDPO`, version 6). The MDL format varies between Quake 1, Quake 2, Quake 3, and Half-Life — they are not binary-compatible.

## License

All rights reserved.
