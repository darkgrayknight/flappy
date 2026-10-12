# Flyer

A small Flappy Bird-style game built with React and TypeScript.

## Requirements

- Node.js 22.12+, 24+, or 26+
- npm

## Getting started

Install dependencies and start the Vite development server:

```sh
npm install
npm start
```

## Available scripts

- `npm start` starts the development server.
- `npm test` runs the test suite once.
- `npm run test:watch` runs tests in watch mode.
- `npm run build` type-checks the app and creates a production build in `dist/`.
- `npm run preview` serves the production build locally.

## Project structure

- `src/App.tsx` contains the game.
- `src/Settings.tsx` contains the settings panel shown while the game is paused.
- `src/main.tsx` is the React entry point.
- `src/App.test.tsx` contains the game render test.
- `vite.config.ts` configures Vite and the React plugin.
