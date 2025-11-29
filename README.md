# Galactic — macOS Desktop App

Galactic is a Vite + React application bundled as a native macOS desktop experience using Electron. The project ships with a streamlined development workflow, sensible production builds, and packaging via `electron-builder`.

---

## Prerequisites

- **macOS** Sonoma (or newer recommended)
- **Node.js** ≥ 18 and npm ≥ 9  
  Install via [nvm](https://github.com/nvm-sh/nvm#installing-and-updating) if you don't already have a compatible runtime.
- **Apple tooling** for signed builds  
  ```sh
  xcode-select --install
  ```
  Code signing is optional for local development, but required for distributing the DMG outside your machine.

---

## Project Structure

```
galactic-ide/
├─ electron/          # Main & preload processes (TypeScript)
├─ src/               # React renderer (Vite)
├─ dist/              # Renderer production build (generated)
├─ dist-electron/     # Compiled Electron main/preload JS (generated)
├─ release/           # Packaged macOS builds (generated)
├─ electron-builder.yml
└─ package.json
```

---

## Installation

Clone the repository and install dependencies once:

```sh
git clone <REPO_URL> galactic-ide
cd galactic-ide
npm install
```

---

## Development Workflow

Electron development runs three processes in parallel: the Vite dev server, the Electron main process compiler watcher, and Electron itself. Start everything with:

```sh
npm run dev
```

What happens behind the scenes:

1. `npm run build:main` performs an initial TypeScript compilation of `electron/main.ts` and `electron/preload.ts` into `dist-electron/`.
2. `npm run dev:vite` launches Vite on `http://127.0.0.1:8080`.
3. `npm run watch:electron` keeps the main/preload bundle in sync with your changes.
4. `npm run start:electron` waits for Vite to become available, then opens the Electron shell pointed at the dev server.

Hot reload is handled by Vite on the renderer side. When you edit Electron files, the watcher recompiles and Electron restarts automatically.

---

## Building for Production (macOS)

Generate a production-ready macOS binary (DMG + ZIP) using:

```sh
npm run build
```

This script:

1. Builds the renderer with `vite build` (output in `dist/`).
2. Compiles Electron sources into `dist-electron/`.
3. Packages the app with `electron-builder`, producing artifacts inside `release/`.
4. Generates a DMG with a custom window and app icon.

### Icon Generation

The application uses a custom generated icon. The source is located at `src/assets/logo.svg`. The build process expects a high-resolution PNG at `src/assets/icon.png`.

To regenerate the icon from the SVG (e.g., after modifying the logo):

1.  Ensure `sharp` is installed: `npm install -D sharp`
2.  Create a conversion script (or use the one below) to convert the SVG to a 1024x1024 PNG with transparency.
3.  Run the script to update `src/assets/icon.png`.

### Running the Packaged App Locally

After a successful build, open the DMG from `release/` and drag the app to Applications, or run the unpacked app directly:

```sh
open release/mac-arm64/*.app
```

---

## Useful Scripts

| Command                 | Description |
| ----------------------- | ----------- |
| `npm run dev`           | Launch Electron + Vite in development mode |
| `npm run build`         | Build renderer, compile Electron, and package macOS binaries |
| `npm run build:ui`      | Produce only the Vite production build |
| `npm run build:main`    | Compile Electron main & preload TypeScript once |
| `npm run lint`          | Run ESLint across the project |
| `npm run preview`       | Serve the static Vite build (browser preview) |

---

## Troubleshooting

- **Electron window stays blank in dev**  
  Ensure nothing else is running on port 8080, then retry `npm run dev`. If it persists, clear out `dist/` and `dist-electron/`.

- **Build fails with code signing errors**  
  For internal testing, pass `--mac --dir` to `electron-builder` to skip DMG signing, or configure your Apple Developer ID certificates. Refer to the [Electron Builder macOS guide](https://www.electron.build/configuration/mac).

- **Renderer assets missing in packaged app**  
  Confirm `base` is set to `"./"` for production in `vite.config.ts`, then rebuild.

- **TypeScript can't find `electronAPI`**  
  Make sure your editor has picked up `src/types/electron.d.ts`. If not, restart TypeScript language services.

---

## Additional Notes

- The preload script exposes a minimal `window.electronAPI` bridge (`ping()` demo) with `contextIsolation` enabled. Extend this file for additional renderer ↔ main communication.
- All generated directories (`dist/`, `dist-electron/`, `release/`) are git-ignored by default.
- To distribute outside your machine, you'll likely need to configure signing/notarization. Electron Builder supports automated notarization via Apple Developer credentials.

Happy building!
