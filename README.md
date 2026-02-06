# Galactic — macOS Desktop App

Galactic is a Vite + React application bundled as a native macOS desktop experience using Electron. The project ships with a streamlined development workflow, sensible production builds, and packaging via `electron-builder`.

---

## Prerequisites

- **macOS** Sonoma (or newer recommended)
- **Node.js** ≥ 18 and npm ≥ 9  
  Install via [nvm](https://github.com/nvm-sh/nvm#installing-and-updating) if you don't already have a compatible runtime.
- **Xcode Command Line Tools**
  ```sh
  xcode-select --install
  ```

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

## Useful Scripts

| Command                 | Description |
| ----------------------- | ----------- |
| `npm run dev`           | Launch Electron + Vite in development mode |
| `npm run build:ui`      | Produce only the Vite production build |
| `npm run build:main`    | Compile Electron main & preload TypeScript once |
| `npm run lint`          | Run ESLint across the project |

---

## Troubleshooting

- **Electron window stays blank in dev**
  Ensure nothing else is running on port 8080, then retry `npm run dev`. If it persists, clear out `dist/` and `dist-electron/`.

- **TypeScript can't find `electronAPI`**
  Make sure your editor has picked up `src/types/electron.d.ts`. If not, restart TypeScript language services.

---

## Downloads

Official signed releases are available from the [Galactic website](https://galactic.dev).

---

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

Happy building!
