# Contributing to Galactic

Thank you for your interest in contributing to Galactic! This document provides guidelines and information for contributors.

## Getting Started

1. Fork the repository
2. Clone your fork locally
3. Install dependencies: `npm install`
4. Start development: `npm run dev`

## Development Workflow

### Running in Development

```sh
npm run dev
```

This launches Vite dev server, Electron, and file watchers concurrently.

### Linting

```sh
npm run lint
```

Please ensure your code passes linting before submitting a PR.

## Code Style

Please refer to `CLAUDE.md` for detailed coding conventions, including:

- File structure and size limits (~140 lines max)
- Styling rules (Tailwind, shadcn)
- TypeScript conventions
- Import ordering
- Naming conventions

## Pull Request Process

1. Create a feature branch from `main`
2. Make your changes following the code style guidelines
3. Ensure `npm run lint` passes
4. Test your changes with `npm run dev`
5. Submit a PR with a clear description of your changes

### PR Guidelines

- Keep PRs focused on a single feature or fix
- Write clear commit messages
- Include screenshots for UI changes
- Update documentation if needed

## What Not to Commit

- `.env` files or any files containing secrets
- `node_modules/`
- `dist/`, `dist-electron/`, `release/` directories
- Large binary files
- Personal IDE configurations

## Questions?

Open an issue for questions or discussions about contributions.
