const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

app.disableHardwareAcceleration(); // Often needed in headless envs

app.on('ready', async () => {
  try {
    console.log('Launching browser window...');
    const win = new BrowserWindow({
      width: 1024,
      height: 1024,
      show: false,
      frame: false,
      transparent: true,
      webPreferences: {
        offscreen: true,
        nodeIntegration: true,
        contextIsolation: false
      }
    });

    const htmlPath = path.join(__dirname, 'public', 'logo-render.html');
    console.log(`Loading ${htmlPath}`);
    await win.loadFile(htmlPath);
    
    console.log('Waiting for render...');
    // Wait for rendering
    setTimeout(async () => {
      try {
        console.log('Capturing page...');
        const image = await win.capturePage();
        const buffer = image.toPNG();
        
        const outputPath = path.join(__dirname, 'src', 'assets', 'icon.png');
        console.log(`Writing to ${outputPath} (${buffer.length} bytes)`);
        fs.writeFileSync(outputPath, buffer);
        
        console.log('Done.');
        app.quit();
      } catch (err) {
        console.error('Capture failed:', err);
        app.exit(1);
      }
    }, 2000);
  } catch (err) {
    console.error('Setup failed:', err);
    app.exit(1);
  }
});



