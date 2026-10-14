import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';
import path from 'path';

async function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
};

function startStaticServer(distDir: string, port = 4173): Promise<http.Server> {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let reqPath = decodeURI(req.url?.split('?')[0] || '/');
      if (reqPath.endsWith('/')) reqPath += 'index.html';

      let filePath = path.join(distDir, reqPath);
      if (!fs.existsSync(filePath)) {
        filePath = path.join(distDir, 'index.html');
      }

      const ext = path.extname(filePath);
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

      fs.readFile(filePath, (err, data) => {
        if (err) {
          res.writeHead(404);
          res.end('Not Found');
          return;
        }
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
      });
    });

    server.listen(port, '127.0.0.1', () => {
      console.log(`[Screenshots] Static HTTP server listening at: http://127.0.0.1:${port}`);
      resolve(server);
    });
  });
}

async function main() {
  const rootDir = path.resolve(import.meta.dirname, '..');
  const distDir = path.resolve(rootDir, 'dist');
  const screenshotsDir = path.resolve(rootDir, 'screenshots');

  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  const server = await startStaticServer(distDir, 4173);

  console.log('[Screenshots] Launching Chromium browser...');
  const browser = await chromium.launch({ headless: true });

  try {
    // 1. Desktop Telemetry Overview (1440x1000)
    console.log('[Screenshots] Capturing desktop-home.png (1440x1000)...');
    const desktopPage = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
    });
    await desktopPage.goto('http://127.0.0.1:4173', { waitUntil: 'networkidle' });
    await wait(1200);
    await desktopPage.screenshot({
      path: path.join(screenshotsDir, 'desktop-home.png'),
    });

    // 2. Desktop Request & Waterfall Trace Inspector (1440x1000)
    console.log('[Screenshots] Capturing desktop-main-feature.png (Waterfall Spans Drawer)...');
    // Click on the first row of the trace table
    const traceRow = await desktopPage.$('tbody tr');
    if (traceRow) {
      await traceRow.click();
      await wait(1000);
      await desktopPage.screenshot({
        path: path.join(screenshotsDir, 'desktop-main-feature.png'),
      });
      // Close drawer with Escape key
      await desktopPage.keyboard.press('Escape');
      await wait(500);
    }

    // 3. Desktop Endpoint Registry Tab (1440x1000)
    console.log('[Screenshots] Capturing desktop-endpoints.png (Endpoint Registry)...');
    const endpointsTab = await desktopPage.$('button:has-text("Endpoint Registry")');
    if (endpointsTab) {
      await endpointsTab.click();
      await wait(800);
      await desktopPage.screenshot({
        path: path.join(screenshotsDir, 'desktop-endpoints.png'),
      });
    }

    // 4. Mobile Viewport (390x844)
    console.log('[Screenshots] Capturing mobile-home.png (390x844)...');
    const mobilePage = await browser.newPage({
      viewport: { width: 390, height: 844 },
    });
    await mobilePage.goto('http://127.0.0.1:4173', { waitUntil: 'networkidle' });
    await wait(1000);
    await mobilePage.screenshot({
      path: path.join(screenshotsDir, 'mobile-home.png'),
    });

    console.log('[Screenshots] Successfully captured all 4 screenshots!');
  } finally {
    await browser.close();
    server.close();
    console.log('[Screenshots] Server and browser closed cleanly.');
  }
}

main().catch((err) => {
  console.error('[Screenshots] Error:', err);
  process.exit(1);
});
