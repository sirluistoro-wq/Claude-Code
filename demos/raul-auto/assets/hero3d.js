// Raul's Automotive — scroll-driven 3D hero.
// A lifted pickup drives through the Mojave at night. Scrolling swings the camera
// from a front three-quarter view to a chase view and raises the speed.
(function () {
  var stage = document.querySelector('.hero3d-stage');
  var wrap = document.querySelector('.hero3d');
  if (!stage || !wrap) return;

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!window.THREE) { wrap.classList.add('no-webgl'); return; }
  var T = window.THREE;

  var renderer;
  try {
    renderer = new T.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  } catch (e) {
    wrap.classList.add('no-webgl');
    return;
  }

  var small = window.innerWidth < 760;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small ? 1.5 : 1.75));
  renderer.outputEncoding = T.sRGBEncoding;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFSoftShadowMap;
  renderer.domElement.className = 'hero3d-canvas';
  renderer.domElement.setAttribute('aria-hidden', 'true');
  stage.insertBefore(renderer.domElement, stage.firstChild);

  var BG = 0x0e1012;
  var scene = new T.Scene();
  scene.background = new T.Color(BG);
  scene.fog = new T.Fog(BG, 26, 150);

  var camera = new T.PerspectiveCamera(36, 1, 0.1, 700);

  // ---------- lights ----------
  scene.add(new T.HemisphereLight(0x9aa3ab, 0x16181a, 0.55));
  var moon = new T.DirectionalLight(0xdfe5ea, 1.25);
  moon.position.set(-18, 26, 14);
  moon.castShadow = true;
  moon.shadow.mapSize.set(1024, 1024);
  moon.shadow.camera.left = -9; moon.shadow.camera.right = 9;
  moon.shadow.camera.top = 9; moon.shadow.camera.bottom = -9;
  moon.shadow.camera.near = 1; moon.shadow.camera.far = 80;
  moon.shadow.bias = -0.0008;
  scene.add(moon);

  // ---------- terrain ----------
  var Z_NEAR = 120, Z_FAR = -220, LEN = Z_NEAR - Z_FAR;
  function smooth(a, b, x) { var t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); }
  function H(x, w) {
    var ax = Math.abs(x);
    var mask = smooth(4.6, 17, ax);
    if (mask === 0) return 0;
    var n = 1.8 * Math.sin(x * 0.07 + w * 0.045) +
            1.2 * Math.sin(x * 0.15 - w * 0.09 + 1.7) +
            0.6 * Math.sin(x * 0.31 + w * 0.23 + 0.4) +
            0.3 * Math.sin(x * 0.7 - w * 0.5);
    return (n + 1.6) * mask * (0.55 + ax * 0.028);
  }

  var segX = small ? 64 : 96, segZ = small ? 84 : 128;
  var groundGeo = new T.PlaneGeometry(260, LEN, segX, segZ);
  groundGeo.rotateX(-Math.PI / 2);
  groundGeo.translate(0, 0, (Z_NEAR + Z_FAR) / 2);
  var gPos = groundGeo.attributes.position;
  var ground = new T.Mesh(groundGeo, new T.MeshStandardMaterial({ color: 0x5b5f62, roughness: 1, metalness: 0, flatShading: true }));
  ground.receiveShadow = true;
  scene.add(ground);

  function updateGround(travel) {
    for (var i = 0; i < gPos.count; i++) {
      gPos.setY(i, H(gPos.getX(i), gPos.getZ(i) - travel));
    }
    gPos.needsUpdate = true;
  }

  var road = new T.Mesh(new T.PlaneGeometry(7.2, LEN), new T.MeshStandardMaterial({ color: 0x1b1d1f, roughness: 0.92 }));
  road.rotation.x = -Math.PI / 2;
  road.position.set(0, 0.03, (Z_NEAR + Z_FAR) / 2);
  road.receiveShadow = true;
  scene.add(road);

  [-3.35, 3.35].forEach(function (x) {
    var edge = new T.Mesh(new T.PlaneGeometry(0.12, LEN), new T.MeshBasicMaterial({ color: 0x8a9196 }));
    edge.rotation.x = -Math.PI / 2;
    edge.position.set(x, 0.04, (Z_NEAR + Z_FAR) / 2);
    scene.add(edge);
  });

  // wrapping objects: they live at a fixed world z and slide past as the truck "drives"
  var movers = [];
  function addMover(obj, x, w, sink) { obj.userData = { x: x, w: w, sink: sink || 0 }; scene.add(obj); movers.push(obj); }
  function placeMovers(travel) {
    for (var i = 0; i < movers.length; i++) {
      var m = movers[i], d = m.userData;
      var z = ((d.w + travel - Z_FAR) % LEN + LEN) % LEN + Z_FAR;
      m.position.set(d.x, H(d.x, z - travel) - d.sink, z);
    }
  }

  var dashGeo = new T.BoxGeometry(0.16, 0.02, 2.4);
  var dashMat = new T.MeshBasicMaterial({ color: 0xc9cdd0 });
  var DASHES = 40;
  for (var i = 0; i < DASHES; i++) addMover(new T.Mesh(dashGeo, dashMat), 0, Z_FAR + i * (LEN / DASHES), -0.04);

  // seeded random so the desert looks the same on every load
  var seed = 7;
  function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
  function side() { return rnd() < 0.5 ? -1 : 1; }

  var rockMat = new T.MeshStandardMaterial({ color: 0x45494c, roughness: 1, flatShading: true });
  for (i = 0; i < (small ? 34 : 56); i++) {
    var r = new T.Mesh(new T.DodecahedronGeometry(0.4 + rnd() * 1.1, 0), rockMat);
    r.scale.y = 0.55 + rnd() * 0.4;
    r.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3);
    r.castShadow = true;
    addMover(r, side() * (5.2 + rnd() * 55), Z_FAR + rnd() * LEN, 0.15);
  }

  // Joshua trees: the Mojave's signature plant
  var trunkMat = new T.MeshStandardMaterial({ color: 0x3a3d40, roughness: 1, flatShading: true });
  var tuftMat = new T.MeshStandardMaterial({ color: 0x24272a, roughness: 1, flatShading: true });
  function joshuaTree(scale) {
    var g = new T.Group();
    var trunkH = 2.2 + rnd() * 1.4;
    var trunk = new T.Mesh(new T.CylinderGeometry(0.16, 0.26, trunkH, 6), trunkMat);
    trunk.position.y = trunkH / 2; trunk.castShadow = true; g.add(trunk);
    var arms = 2 + Math.floor(rnd() * 3);
    for (var a = 0; a < arms; a++) {
      var len = 0.9 + rnd() * 1.1;
      var arm = new T.Group();
      arm.position.y = trunkH * (0.62 + rnd() * 0.33);
      arm.rotation.y = rnd() * Math.PI * 2;
      var limb = new T.Mesh(new T.CylinderGeometry(0.1, 0.14, len, 5), trunkMat);
      limb.rotation.z = 0.7 + rnd() * 0.4;
      limb.position.set(Math.sin(limb.rotation.z) * len / 2, Math.cos(limb.rotation.z) * len / 2, 0);
      limb.castShadow = true;
      arm.add(limb);
      var tuft = new T.Mesh(new T.IcosahedronGeometry(0.42, 0), tuftMat);
      tuft.scale.set(1, 1.25, 1);
      tuft.position.set(Math.sin(limb.rotation.z) * len, Math.cos(limb.rotation.z) * len + 0.25, 0);
      tuft.castShadow = true;
      arm.add(tuft);
      g.add(arm);
    }
    var top = new T.Mesh(new T.IcosahedronGeometry(0.45, 0), tuftMat);
    top.scale.set(1, 1.3, 1);
    top.position.y = trunkH + 0.25;
    g.add(top);
    g.scale.setScalar(scale);
    g.rotation.y = rnd() * Math.PI * 2;
    return g;
  }
  for (i = 0; i < (small ? 22 : 34); i++) addMover(joshuaTree(0.8 + rnd() * 0.7), side() * (7 + rnd() * 60), Z_FAR + rnd() * LEN, 0.1);

  // far mountains and sky (ignore fog so they read as silhouettes)
  var mtnMat = new T.MeshBasicMaterial({ color: 0x17191c, fog: false });
  for (i = 0; i < 26; i++) {
    var ang = (i / 26) * Math.PI * 2 + rnd() * 0.2;
    var h = 22 + rnd() * 38;
    var m = new T.Mesh(new T.ConeGeometry(30 + rnd() * 40, h, 5), mtnMat);
    m.position.set(Math.sin(ang) * 270, h / 2 - 4, Math.cos(ang) * 270);
    m.rotation.y = rnd() * 3;
    scene.add(m);
  }
  var moonDisc = new T.Mesh(new T.SphereGeometry(7, 24, 16), new T.MeshBasicMaterial({ color: 0xe4e7ea, fog: false }));
  moonDisc.position.set(70, 70, 230);
  scene.add(moonDisc);
  var starGeo = new T.BufferGeometry();
  var starArr = [];
  for (i = 0; i < 900; i++) {
    var th = rnd() * Math.PI * 2, ph = rnd() * Math.PI * 0.45;
    starArr.push(Math.cos(th) * Math.sin(ph) * 420, Math.cos(ph) * 420 * 0.6 + 20, Math.sin(th) * Math.sin(ph) * 420);
  }
  starGeo.setAttribute('position', new T.Float32BufferAttribute(starArr, 3));
  scene.add(new T.Points(starGeo, new T.PointsMaterial({ color: 0xc9cdd0, size: 1.3, sizeAttenuation: false, fog: false })));

  // ---------- the truck (lifted crew-cab pickup, faces -z) ----------
  var truck = new T.Group();
  var body = new T.Group();
  truck.add(body);
  scene.add(truck);

  var paint = new T.MeshStandardMaterial({ color: 0x3b3f43, metalness: 0.65, roughness: 0.32 });
  var trim = new T.MeshStandardMaterial({ color: 0x0f1011, metalness: 0.2, roughness: 0.7 });
  var glass = new T.MeshStandardMaterial({ color: 0x07080a, metalness: 0.9, roughness: 0.08 });
  var chrome = new T.MeshStandardMaterial({ color: 0xaab0b5, metalness: 1, roughness: 0.25 });
  var lamp = new T.MeshBasicMaterial({ color: 0xffffff });
  var tail = new T.MeshBasicMaterial({ color: 0x8c1d1d });

  function box(w, h, d, mat, x, y, z) {
    var b = new T.Mesh(new T.BoxGeometry(w, h, d), mat);
    b.position.set(x, y, z); b.castShadow = true; b.receiveShadow = true;
    body.add(b);
    return b;
  }
  var RIDE = 1.25; // bottom of the body: lifted
  // frame and lower body
  box(1.5, 0.22, 5.2, trim, 0, RIDE - 0.12, 0);
  box(2.04, 0.72, 5.5, paint, 0, RIDE + 0.36, 0);
  // hood bulge
  box(1.7, 0.08, 1.7, paint, 0, RIDE + 0.76, -1.85);
  // cab
  box(1.94, 0.78, 2.1, paint, 0, RIDE + 1.11, -0.05);
  box(1.96, 0.46, 1.8, glass, 0, RIDE + 1.12, -0.05);         // side windows band
  var shield = box(1.84, 0.62, 0.06, glass, 0, RIDE + 1.06, -1.13); // windshield
  shield.rotation.x = -0.42;
  box(1.84, 0.4, 0.05, glass, 0, RIDE + 1.12, 1.03);            // rear window
  box(0.04, 0.5, 0.06, paint, 0.97, RIDE + 1.12, -0.05);        // B pillars
  box(0.04, 0.5, 0.06, paint, -0.97, RIDE + 1.12, -0.05);
  // roof light bar
  box(1.5, 0.1, 0.16, trim, 0, RIDE + 1.55, -0.95);
  box(1.4, 0.06, 0.04, lamp, 0, RIDE + 1.55, -1.04);
  // bed
  box(1.84, 0.05, 1.98, trim, 0, RIDE + 0.73, 1.65);
  // grille and bumpers
  box(1.6, 0.5, 0.06, trim, 0, RIDE + 0.42, -2.76);
  for (var gb = 0; gb < 3; gb++) box(1.5, 0.04, 0.02, chrome, 0, RIDE + 0.27 + gb * 0.15, -2.8);
  box(2.2, 0.26, 0.3, trim, 0, RIDE - 0.02, -2.82);
  box(2.1, 0.24, 0.28, trim, 0, RIDE - 0.02, 2.82);
  // headlights and taillights
  box(0.36, 0.16, 0.04, lamp, 0.74, RIDE + 0.5, -2.77);
  box(0.36, 0.16, 0.04, lamp, -0.74, RIDE + 0.5, -2.77);
  box(0.14, 0.4, 0.04, tail, 0.94, RIDE + 0.45, 2.77);
  box(0.14, 0.4, 0.04, tail, -0.94, RIDE + 0.45, 2.77);
  // mirrors and fender flares
  box(0.24, 0.2, 0.1, trim, 1.14, RIDE + 0.95, -0.95);
  box(0.24, 0.2, 0.1, trim, -1.14, RIDE + 0.95, -0.95);
  [[-1.75], [1.75]].forEach(function (zz) {
    box(0.18, 0.14, 1.5, trim, 1.06, RIDE + 0.06, zz[0]);
    box(0.18, 0.14, 1.5, trim, -1.06, RIDE + 0.06, zz[0]);
  });
  // step bars
  box(0.14, 0.08, 2.0, chrome, 1.12, RIDE - 0.18, -0.15);
  box(0.14, 0.08, 2.0, chrome, -1.12, RIDE - 0.18, -0.15);

  // wheels: big off-road tires for the lift
  var WR = 0.62;
  var tireGeo = new T.CylinderGeometry(WR, WR, 0.46, 22);
  tireGeo.rotateZ(Math.PI / 2);
  var tireMat = new T.MeshStandardMaterial({ color: 0x111213, roughness: 0.95, flatShading: true });
  var rimGeo = new T.CylinderGeometry(0.36, 0.36, 0.48, 6);
  rimGeo.rotateZ(Math.PI / 2);
  var hubGeo = new T.BoxGeometry(0.5, 0.1, 0.62);
  var wheels = [];
  [[1.06, -1.75], [-1.06, -1.75], [1.06, 1.75], [-1.06, 1.75]].forEach(function (p) {
    var w = new T.Group();
    var tire = new T.Mesh(tireGeo, tireMat); tire.castShadow = true; w.add(tire);
    var rim = new T.Mesh(rimGeo, chrome); w.add(rim);
    var spoke = new T.Mesh(hubGeo, trim); w.add(spoke);
    var spoke2 = spoke.clone(); spoke2.rotation.x = Math.PI / 2; w.add(spoke2);
    w.position.set(p[0], WR, p[1]);
    truck.add(w);
    wheels.push(w);
    // lift-kit shock, visible in the gap
    var shock = new T.Mesh(new T.CylinderGeometry(0.06, 0.06, 0.7, 6), chrome);
    shock.position.set(p[0] * 0.8, WR + 0.35, p[1] + 0.25);
    shock.rotation.x = 0.25;
    truck.add(shock);
  });

  // headlight spots and soft beams
  var beamMat = new T.MeshBasicMaterial({ color: 0xdfe5ea, transparent: true, opacity: 0.055, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide });
  [0.74, -0.74].forEach(function (x) {
    var s = new T.SpotLight(0xf3f4f5, 3.2, 46, 0.42, 0.55, 1.2);
    s.position.set(x, RIDE + 0.5, -2.8);
    s.target.position.set(x * 1.6, 0, -22);
    body.add(s); body.add(s.target);
    var beam = new T.Mesh(new T.ConeGeometry(2.4, 16, 20, 1, true), beamMat);
    beam.rotation.x = Math.PI / 2 + 0.06;
    beam.position.set(x, RIDE + 0.1, -2.8 - 8);
    body.add(beam);
  });

  // dust behind the rear tires
  var DUST = small ? 90 : 160;
  var dustPos = new Float32Array(DUST * 3);
  var dustVel = new Float32Array(DUST * 3);
  var dustLife = new Float32Array(DUST);
  for (i = 0; i < DUST; i++) { dustPos[i * 3 + 1] = -50; dustLife[i] = 0; }
  var dustGeo = new T.BufferGeometry();
  dustGeo.setAttribute('position', new T.BufferAttribute(dustPos, 3));
  var dust = new T.Points(dustGeo, new T.PointsMaterial({ color: 0x8a9196, size: 0.28, transparent: true, opacity: 0.38, depthWrite: false }));
  dust.frustumCulled = false;
  scene.add(dust);
  var dustNext = 0, dustAcc = 0;
  function updateDust(dt, speed) {
    dustAcc += dt * (18 + speed * 2.2);
    while (dustAcc > 1) {
      dustAcc -= 1;
      var k = dustNext; dustNext = (dustNext + 1) % DUST;
      var sx = rnd() < 0.5 ? -1.06 : 1.06;
      dustPos[k * 3] = sx + (rnd() - 0.5) * 0.3;
      dustPos[k * 3 + 1] = 0.15 + rnd() * 0.2;
      dustPos[k * 3 + 2] = 2.2;
      dustVel[k * 3] = sx * (0.4 + rnd() * 0.8);
      dustVel[k * 3 + 1] = 0.4 + rnd() * 0.9;
      dustVel[k * 3 + 2] = speed * (0.55 + rnd() * 0.3);
      dustLife[k] = 1.1 + rnd() * 0.6;
    }
    for (var j = 0; j < DUST; j++) {
      if (dustLife[j] <= 0) { dustPos[j * 3 + 1] = -50; continue; }
      dustLife[j] -= dt;
      dustPos[j * 3] += dustVel[j * 3] * dt;
      dustPos[j * 3 + 1] += dustVel[j * 3 + 1] * dt;
      dustPos[j * 3 + 2] += dustVel[j * 3 + 2] * dt;
      dustVel[j * 3 + 1] *= 0.97;
    }
    dustGeo.attributes.position.needsUpdate = true;
  }

  // ---------- camera path ----------
  // p = 0: front three-quarter view, low. p = 1: chase view, behind and above.
  function lerp(a, b, t) { return a + (b - a) * t; }
  function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  var look = new T.Vector3();
  function placeCamera(p, mx, my) {
    var e = ease(p);
    var theta = lerp(-2.5, small ? 0.12 : 0.32, e) + mx * 0.14;
    var radius = lerp(small ? 17 : 11.5, small ? 15 : 10.5, e);
    var height = lerp(small ? 2.4 : 1.9, 3.3, e) + my * 0.35;
    camera.position.set(Math.sin(theta) * radius, height, Math.cos(theta) * radius);
    look.set(0, lerp(1.45, 1.2, e), lerp(0, -4, e));
    camera.lookAt(look);
  }

  // ---------- sizing ----------
  function resize() {
    var w = stage.clientWidth, h = stage.clientHeight;
    small = w < 760;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // shift the frame so the truck sits beside (desktop) or below (phone) the headline
    if (small) camera.setViewOffset(w, h, 0, -h * 0.27, w, h);
    else camera.setViewOffset(w, h, -w * 0.25, -h * 0.04, w, h);
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  resize();

  // ---------- input ----------
  var target = 0, prog = 0, lastY = window.scrollY, boost = 0;
  var mx = 0, my = 0, tmx = 0, tmy = 0;
  function readScroll() {
    var rect = wrap.getBoundingClientRect();
    var range = wrap.offsetHeight - stage.offsetHeight;
    target = range > 0 ? Math.min(1, Math.max(0, -rect.top / range)) : 0;
    var y = window.scrollY;
    boost = Math.min(26, boost + Math.abs(y - lastY) * 0.06);
    lastY = y;
  }
  window.addEventListener('scroll', readScroll, { passive: true });
  readScroll();
  if (!small) {
    window.addEventListener('pointermove', function (e) {
      tmx = (e.clientX / window.innerWidth - 0.5) * 2;
      tmy = (e.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });
  }

  // ---------- loop ----------
  var travel = 0, clock = new T.Clock(), t = 0, running = false, visible = true;

  function frame(dt) {
    t += dt;
    prog += (target - prog) * Math.min(1, dt * 6);
    mx += (tmx - mx) * Math.min(1, dt * 3);
    my += (tmy - my) * Math.min(1, dt * 3);
    boost *= Math.pow(0.12, dt);
    var speed = 12 + prog * 22 + boost;
    travel += speed * dt;

    updateGround(travel);
    placeMovers(travel);
    updateDust(dt, speed);
    for (var i = 0; i < wheels.length; i++) wheels[i].rotation.x -= (speed * dt) / WR;
    body.position.y = 0.025 * Math.sin(t * 9.3) + 0.018 * Math.sin(t * 14.1 + 1);
    body.rotation.z = 0.006 * Math.sin(t * 5.1);
    body.rotation.x = -0.004 * Math.sin(t * 6.7) - prog * 0.01;

    placeCamera(prog, mx, my);
    stage.style.setProperty('--p', prog.toFixed(4));
    wrap.classList.toggle('is-late', prog > 0.45);
    renderer.render(scene, camera);
  }

  function loop() {
    if (!running) return;
    frame(Math.min(clock.getDelta(), 0.05));
    requestAnimationFrame(loop);
  }
  function setRunning(on) {
    if (on === running) return;
    running = on;
    if (on) { clock.getDelta(); requestAnimationFrame(loop); }
  }

  if (reduceMotion) {
    // one still frame, no scroll animation
    frame(0.016);
    window.addEventListener('resize', function () { frame(0); });
    return;
  }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      setRunning(visible && !document.hidden);
    }).observe(wrap);
  }
  document.addEventListener('visibilitychange', function () { setRunning(visible && !document.hidden); });
  frame(0.016);
  setRunning(true);
})();
