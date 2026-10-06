// Renders the hero video frames from truck-scene.js and encodes them with ffmpeg.
// Usage: node render.js <path/to/three.min.js r128> <out assets dir>
// Needs Playwright (Chromium) and ffmpeg on PATH.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const THREE_JS = process.argv[2];
const OUT = path.resolve(process.argv[3]);
const FRAMES = 144;          // 6 s at 24 fps
const DT = 6 / FRAMES;
const WARMUP = 36;           // frames simulated before the clip so dust is already flying
// night grade: a touch more contrast and less glare from the sand
const GRADE = 'eq=contrast=1.14:brightness=-0.035:gamma=0.9:saturation=0.7,vignette=PI/5';

const VARIANTS = [
  { name: 'landscape', w: 1920, h: 1080, outW: 1280, outH: 720, portrait: 0 },
  { name: 'portrait', w: 1080, h: 1920, outW: 720, outH: 1280, portrait: 1 },
];

(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  for (const v of VARIANTS) {
    const tmp = fs.mkdtempSync(path.join(require('os').tmpdir(), 'hero-' + v.name + '-'));
    const page = await browser.newPage({ viewport: { width: v.w, height: v.h } });
    await page.route('**/three.min.js', r => r.fulfill({ body: fs.readFileSync(THREE_JS), contentType: 'application/javascript' }));
    page.on('pageerror', e => { console.error(e); process.exit(1); });
    const url = 'file://' + path.join(__dirname, 'render.html') + `?w=${v.w}&h=${v.h}&portrait=${v.portrait}`;
    await page.goto(url);
    await page.waitForFunction(() => typeof window.renderHeroFrame === 'function');
    for (let i = -WARMUP; i < FRAMES; i++) {
      const t = i / (FRAMES - 1);
      const data = await page.evaluate(([t, dt, capture]) => {
        window.renderHeroFrame(t, dt);
        return capture ? document.querySelector('canvas').toDataURL('image/png') : null;
      }, [t, DT, i >= 0]);
      if (data) fs.writeFileSync(path.join(tmp, String(i).padStart(4, '0') + '.png'), Buffer.from(data.split(',')[1], 'base64'));
      if (i % 24 === 0) console.log(v.name, i);
    }
    await page.close();
    const mp4 = path.join(OUT, `hero-${v.name}.mp4`);
    // every frame is a keyframe so the browser can jump to any frame instantly while scrubbing
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', '24', '-i', path.join(tmp, '%04d.png'),
      '-vf', `scale=${v.outW}:${v.outH}:flags=lanczos,${GRADE}`,
      '-c:v', 'libx264', '-preset', 'slow', '-crf', '24', '-pix_fmt', 'yuv420p', '-g', '1', '-keyint_min', '1',
      '-tune', 'film', '-movflags', '+faststart', '-an', mp4]);
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', path.join(tmp, '0000.png'),
      '-vf', `scale=${v.outW}:${v.outH}:flags=lanczos,${GRADE}`, '-q:v', '4', path.join(OUT, `hero-${v.name}.jpg`)]);
    fs.rmSync(tmp, { recursive: true, force: true });
    console.log('wrote', mp4, (fs.statSync(mp4).size / 1e6).toFixed(1) + ' MB');
  }
  await browser.close();
})();
