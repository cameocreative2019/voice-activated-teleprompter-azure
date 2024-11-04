import fs from 'fs';
import path from 'path';

export function generateHtml(isDev = false) {
  const html = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');

  if (isDev) {
    // Development mode
    const devScripts = `
      <script type="module" src="http://localhost:5173/@vite/client"></script>
      <script type="module">
        import RefreshRuntime from 'http://localhost:5173/@react-refresh'
        RefreshRuntime.injectIntoGlobalHook(window)
        window.$RefreshReg$ = () => {}
        window.$RefreshSig$ = () => (type) => type
        window.__vite_plugin_react_preamble_installed__ = true
      </script>
    `;
    const appScript = `<script type="module" src="http://localhost:5173/src/main.tsx"></script>`;

    return html
      .replace('%VITE_DEV_SCRIPTS%', devScripts)
      .replace('%VITE_APP_SCRIPT%', appScript);
  } else {
    // Production mode
    try {
      const manifest = JSON.parse(
        fs.readFileSync(path.resolve(process.cwd(), 'dist/.vite/manifest.json'), 'utf-8')
      );

      const mainEntry = manifest['src/main.tsx'];
      if (!mainEntry) {
        throw new Error('Main entry point not found in manifest');
      }

      let cssLinks = '';
      if (mainEntry.css) {
        cssLinks = mainEntry.css
          .map(css => `<link rel="stylesheet" href="/${css}" />`)
          .join('\n');
      }

      const importedChunks = mainEntry.imports || [];
      const preloadLinks = importedChunks
        .map(chunk => `<link rel="modulepreload" href="/${manifest[chunk].file}" />`)
        .join('\n');

      return html
        .replace('%VITE_DEV_SCRIPTS%', cssLinks + preloadLinks)
        .replace('%VITE_APP_SCRIPT%', `<script type="module" src="/${mainEntry.file}"></script>`);
    } catch (error) {
      console.error('Error processing manifest:', error);
      return html
        .replace('%VITE_DEV_SCRIPTS%', '')
        .replace('%VITE_APP_SCRIPT%', '<script>console.error("Failed to load application");</script>');
    }
  }
}