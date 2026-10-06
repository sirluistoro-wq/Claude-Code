// Renders the hero videos and the section stills from car-scene.js and encodes them with ffmpeg.
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
// sunset grade: a little extra saturation and a soft vignette
const GRADE = 'eq=contrast=1.06:brightness=-0.01:gamma=0.97:saturation=1.08,vignette=PI/6';

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
    // a keyframe every 6 frames and no B-frames keeps scrubbing seeks fast at a fraction of the size
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', '24', '-i', path.join(tmp, '%04d.png'),
      '-vf', `scale=${v.outW}:${v.outH}:flags=lanczos,${GRADE},hqdn3d=3:2:0:0`,
      '-c:v', 'libx264', '-preset', 'slow', '-crf', '28', '-pix_fmt', 'yuv420p', '-g', '6', '-keyint_min', '6', '-sc_threshold', '0', '-bf', '0',
      '-tune', 'film', '-movflags', '+faststart', '-an', mp4]);
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', mp4, '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '40', '-g', '6',
      '-row-mt', '1', '-deadline', 'good', '-cpu-used', '2', '-an', mp4.replace(/\.mp4$/, '.webm')]);
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', path.join(tmp, '0000.png'),
      '-vf', `scale=${v.outW}:${v.outH}:flags=lanczos,${GRADE}`, '-q:v', '4', path.join(OUT, `hero-${v.name}.jpg`)]);
    fs.rmSync(tmp, { recursive: true, force: true });
    console.log('wrote', mp4, (fs.statSync(mp4).size / 1e6).toFixed(1) + ' MB');
  }
  // section stills, same scene and grade
  const STILLS = ['front', 'side', 'rear', 'wheel', 'aerial', 'lights'];
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.route('**/three.min.js', r => r.fulfill({ body: fs.readFileSync(THREE_JS), contentType: 'application/javascript' }));
  await page.goto('file://' + path.join(__dirname, 'render.html') + '?w=1920&h=1080&portrait=0');
  await page.waitForFunction(() => typeof window.renderStill === 'function');
  for (const name of STILLS) {
    const data = await page.evaluate(n => { window.renderStill(n); return document.querySelector('canvas').toDataURL('image/png'); }, name);
    const png = path.join(require('os').tmpdir(), `still-${name}.png`);
    fs.writeFileSync(png, Buffer.from(data.split(',')[1], 'base64'));
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', png, '-vf', `scale=1600:-2:flags=lanczos,${GRADE}`, '-q:v', '3', path.join(OUT, `still-${name}.jpg`)]);
    fs.rmSync(png);
    console.log('wrote still', name);
  }
  await browser.close();
})();
