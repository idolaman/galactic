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

### Testing (Required for New Features)

Every new feature must include automated tests.

- Add or update tests for the behavior you introduced
- Run the relevant test suite(s) locally before opening a PR
- For Electron sync/backend changes, run:

```sh
npm run test:electron
```

If a new feature cannot be covered by automated tests, explain why in the PR and describe the manual verification performed.

## Pull Request Process

1. Create a feature branch from `main`
2. Make your changes following the code style guidelines
3. Ensure `npm run lint` passes
4. Add/update automated tests for new features
5. Run the relevant tests locally (including `npm run test:electron` when applicable)
6. Submit a PR with a clear description of your changes

### PR Guidelines

- Keep PRs focused on a single feature or fix
- Write clear commit messages
- Include screenshots for UI changes
- Update documentation if needed
- Include test coverage details (what was tested and how)

## What Not to Commit

- `.env` files or any files containing secrets
- `node_modules/`
- `dist/`, `dist-electron/`, `release/` directories
- Large binary files
- Personal IDE configurations

## Questions?

Open an issue for questions or discussions about contributions.
