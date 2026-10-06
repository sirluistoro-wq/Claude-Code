// Raul's Automotive — 3D scene used to render the hero video and site stills offline.
// render.js loads this in a headless browser and steps it with window.renderHeroFrame(t, dt)
// (hero video) or window.renderStill(name) (section images). A red sports car drives
// through the Mojave at night.
(function () {
  var stage = document.querySelector('.hero3d-stage');
  var wrap = document.querySelector('.hero3d');
  if (!stage || !wrap) return;

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!window.THREE) { wrap.classList.add('no-webgl'); return; }
  var T = window.THREE;

  var renderer;
  try {
    renderer = new T.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
  } catch (e) {
    wrap.classList.add('no-webgl');
    return;
  }

  var small = !!window.HERO_PORTRAIT;
  renderer.setPixelRatio(1);
  renderer.outputEncoding = T.sRGBEncoding;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.physicallyCorrectLights = false;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFShadowMap;
  renderer.domElement.className = 'hero3d-canvas';
  renderer.domElement.setAttribute('aria-hidden', 'true');
  stage.insertBefore(renderer.domElement, stage.firstChild);

  var BG = 0x0e1012;
  var scene = new T.Scene();
  scene.background = new T.Color(BG);
  scene.fog = new T.Fog(BG, 28, 150);
  var camera = new T.PerspectiveCamera(34, 1, 0.1, 700);

  // ---------- reflections: a small studio-at-night environment for the paint and glass ----------
  var envMap = (function () {
    // painted on a 2D canvas as an equirectangular image: works on every device without float render targets
    var c = document.createElement('canvas');
    c.width = 512; c.height = 256;
    var g = c.getContext('2d');
    var grad = g.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, '#101214');
    grad.addColorStop(0.42, '#3b3f43');
    grad.addColorStop(0.5, '#7d8389');
    grad.addColorStop(0.56, '#2a2d30');
    grad.addColorStop(1, '#08090a');
    g.fillStyle = grad; g.fillRect(0, 0, 512, 256);
    // soft boxes: give the panels a clean highlight line
    g.fillStyle = 'rgba(255,255,255,0.95)';
    g.fillRect(40, 70, 170, 12);
    g.fillRect(300, 92, 150, 8);
    g.fillStyle = 'rgba(230,235,240,0.9)';
    g.beginPath(); g.arc(120, 40, 14, 0, Math.PI * 2); g.fill();
    var tex = new T.CanvasTexture(c);
    tex.mapping = T.EquirectangularReflectionMapping;
    tex.encoding = T.sRGBEncoding;
    return tex;
  })();

  // ---------- lights ----------
  scene.add(new T.HemisphereLight(0x9aa3ab, 0x15171a, 0.5));
  var moon = new T.DirectionalLight(0xe2e8ee, 1.2);
  moon.position.set(-16, 24, 12);
  moon.castShadow = true;
  moon.shadow.mapSize.set(4096, 4096);
  moon.shadow.camera.left = -7; moon.shadow.camera.right = 7;
  moon.shadow.camera.top = 7; moon.shadow.camera.bottom = -7;
  moon.shadow.camera.near = 1; moon.shadow.camera.far = 70;
  moon.shadow.bias = -0.0006;
  moon.shadow.normalBias = 0.02;
  scene.add(moon);
  var rim = new T.DirectionalLight(0xbfc6cc, 0.7);   // back light to outline the car
  rim.position.set(14, 8, 22);
  scene.add(rim);

  // ---------- terrain: two pre-built tiles that slide, so nothing is rebuilt per frame ----------
  var Z_NEAR = 120, Z_FAR = -220, LEN = Z_NEAR - Z_FAR;
  var K = (Math.PI * 2) / LEN; // dune frequencies along the road repeat every LEN
  function smooth(a, b, x) { var t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); }
  function H(x, w) {
    var ax = Math.abs(x);
    var mask = smooth(4.6, 17, ax);
    if (mask === 0) return 0;
    var n = 1.8 * Math.sin(x * 0.07 + w * K * 2) +
            1.2 * Math.sin(x * 0.15 - w * K * 5 + 1.7) +
            0.6 * Math.sin(x * 0.31 + w * K * 12 + 0.4) +
            0.3 * Math.sin(x * 0.7 - w * K * 27);
    return (n + 1.6) * mask * (0.55 + ax * 0.028);
  }
  var segX = 140, segZ = 180;
  var tileGeo = new T.PlaneGeometry(260, LEN, segX, segZ);
  tileGeo.rotateX(-Math.PI / 2);
  tileGeo.translate(0, 0, (Z_NEAR + Z_FAR) / 2);
  var tp = tileGeo.attributes.position;
  for (var i = 0; i < tp.count; i++) tp.setY(i, H(tp.getX(i), tp.getZ(i)));
  tileGeo.computeVertexNormals();
  var sandMat = new T.MeshStandardMaterial({ color: 0x5b5f62, roughness: 1, metalness: 0, flatShading: true });
  var tiles = [new T.Mesh(tileGeo, sandMat), new T.Mesh(tileGeo, sandMat)];
  tiles.forEach(function (t) { t.receiveShadow = true; scene.add(t); });

  var road = new T.Mesh(new T.PlaneGeometry(7.2, LEN * 2), new T.MeshStandardMaterial({ color: 0x1b1d1f, roughness: 0.9 }));
  road.rotation.x = -Math.PI / 2;
  road.position.set(0, 0.03, (Z_NEAR + Z_FAR) / 2);
  road.receiveShadow = true;
  scene.add(road);
  [-3.35, 3.35].forEach(function (x) {
    var edge = new T.Mesh(new T.PlaneGeometry(0.12, LEN * 2), new T.MeshBasicMaterial({ color: 0x8a9196 }));
    edge.rotation.x = -Math.PI / 2;
    edge.position.set(x, 0.04, (Z_NEAR + Z_FAR) / 2);
    scene.add(edge);
  });

  var movers = [];
  function addMover(obj, x, w, sink) { obj.userData = { x: x, w: w, sink: sink || 0 }; scene.add(obj); movers.push(obj); }
  function placeWorld(travel) {
    var o = ((travel % LEN) + LEN) % LEN;
    tiles[0].position.z = o;
    tiles[1].position.z = o - LEN;
    for (var i = 0; i < movers.length; i++) {
      var m = movers[i], d = m.userData;
      var z = ((d.w + travel - Z_FAR) % LEN + LEN) % LEN + Z_FAR;
      m.position.set(d.x, H(d.x, z - travel) - d.sink, z);
    }
  }

  var dashGeo = new T.BoxGeometry(0.16, 0.02, 2.4);
  var dashMat = new T.MeshBasicMaterial({ color: 0xc9cdd0 });
  var DASHES = 40;
  for (i = 0; i < DASHES; i++) addMover(new T.Mesh(dashGeo, dashMat), 0, Z_FAR + i * (LEN / DASHES), -0.04);

  var seed = 7;
  function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
  function side() { return rnd() < 0.5 ? -1 : 1; }

  var rockMat = new T.MeshStandardMaterial({ color: 0x45494c, roughness: 1, flatShading: true });
  for (i = 0; i < (small ? 30 : 50); i++) {
    var r = new T.Mesh(new T.DodecahedronGeometry(0.4 + rnd() * 1.1, 0), rockMat);
    r.scale.y = 0.55 + rnd() * 0.4;
    r.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3);
    addMover(r, side() * (5.2 + rnd() * 55), Z_FAR + rnd() * LEN, 0.15);
  }

  // Joshua trees: the Mojave's signature plant
  var trunkMat = new T.MeshStandardMaterial({ color: 0x3a3d40, roughness: 1, flatShading: true });
  var tuftMat = new T.MeshStandardMaterial({ color: 0x24272a, roughness: 1, flatShading: true });
  function joshuaTree(scale) {
    var g = new T.Group();
    var trunkH = 2.2 + rnd() * 1.4;
    var trunk = new T.Mesh(new T.CylinderGeometry(0.16, 0.26, trunkH, 6), trunkMat);
    trunk.position.y = trunkH / 2; g.add(trunk);
    var arms = 2 + Math.floor(rnd() * 3);
    for (var a = 0; a < arms; a++) {
      var len = 0.9 + rnd() * 1.1;
      var arm = new T.Group();
      arm.position.y = trunkH * (0.62 + rnd() * 0.33);
      arm.rotation.y = rnd() * Math.PI * 2;
      var limb = new T.Mesh(new T.CylinderGeometry(0.1, 0.14, len, 5), trunkMat);
      limb.rotation.z = 0.7 + rnd() * 0.4;
      limb.position.set(Math.sin(limb.rotation.z) * len / 2, Math.cos(limb.rotation.z) * len / 2, 0);
      arm.add(limb);
      var tuft = new T.Mesh(new T.IcosahedronGeometry(0.42, 0), tuftMat);
      tuft.scale.set(1, 1.25, 1);
      tuft.position.set(Math.sin(limb.rotation.z) * len, Math.cos(limb.rotation.z) * len + 0.25, 0);
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
  for (i = 0; i < (small ? 20 : 30); i++) addMover(joshuaTree(0.8 + rnd() * 0.7), side() * (7 + rnd() * 60), Z_FAR + rnd() * LEN, 0.1);

  var mtnMat = new T.MeshBasicMaterial({ color: 0x17191c, fog: false });
  for (i = 0; i < 26; i++) {
    var ang = (i / 26) * Math.PI * 2 + rnd() * 0.2;
    var mh = 22 + rnd() * 38;
    var mtn = new T.Mesh(new T.ConeGeometry(30 + rnd() * 40, mh, 5), mtnMat);
    mtn.position.set(Math.sin(ang) * 270, mh / 2 - 4, Math.cos(ang) * 270);
    mtn.rotation.y = rnd() * 3;
    scene.add(mtn);
  }
  var moonDisc = new T.Mesh(new T.SphereGeometry(7, 24, 16), new T.MeshBasicMaterial({ color: 0xe4e7ea, fog: false }));
  moonDisc.position.set(70, 70, 230);
  scene.add(moonDisc);
  var starArr = [];
  for (i = 0; i < 900; i++) {
    var th = rnd() * Math.PI * 2, ph = rnd() * Math.PI * 0.45;
    starArr.push(Math.cos(th) * Math.sin(ph) * 420, Math.cos(ph) * 420 * 0.6 + 20, Math.sin(th) * Math.sin(ph) * 420);
  }
  var starGeo = new T.BufferGeometry();
  starGeo.setAttribute('position', new T.Float32BufferAttribute(starArr, 3));
  scene.add(new T.Points(starGeo, new T.PointsMaterial({ color: 0xc9cdd0, size: 1.3, sizeAttenuation: false, fog: false })));


  // ---------- the car ----------
  // Built in "side view" space: x runs along the car (front is -x), y is up, z is across.
  // The group is turned so the car faces -z in the world.
  var car = new T.Group();
  scene.add(car);
  var S = new T.Group();
  S.rotation.y = -Math.PI / 2;
  car.add(S);
  var body = new T.Group();   // sprung mass
  S.add(body);

  var PAINT = 0x9e0f1a;       // candy red; change this one value to repaint the car
  var paint = new T.MeshPhysicalMaterial({ color: PAINT, metalness: 0.55, roughness: 0.26, clearcoat: 1, clearcoatRoughness: 0.05, envMap: envMap, envMapIntensity: 1.5 });
  var gloss = new T.MeshPhysicalMaterial({ color: 0x050506, metalness: 0.4, roughness: 0.04, clearcoat: 1, clearcoatRoughness: 0.02, envMap: envMap, envMapIntensity: 1.8 });
  var plastic = new T.MeshStandardMaterial({ color: 0x0d0d0f, metalness: 0.2, roughness: 0.55, envMap: envMap, envMapIntensity: 0.6 });
  var chrome = new T.MeshStandardMaterial({ color: 0xc7ccd1, metalness: 1, roughness: 0.14, envMap: envMap, envMapIntensity: 1.3 });
  var steel = new T.MeshStandardMaterial({ color: 0x2a2c2f, metalness: 0.8, roughness: 0.4, envMap: envMap, envMapIntensity: 0.8 });
  var trim = new T.MeshStandardMaterial({ color: 0x0b0b0c, roughness: 0.9, metalness: 0 });
  var lamp = new T.MeshBasicMaterial({ color: 0xffffff });
  var tail = new T.MeshStandardMaterial({ color: 0x4a0606, emissive: 0xff1a1a, emissiveIntensity: 1.4, roughness: 0.3 });

  function mesh(geo, mat, parent, shadow) {
    var m = new T.Mesh(geo, mat);
    if (shadow !== false) { m.castShadow = true; m.receiveShadow = true; }
    (parent || body).add(m);
    return m;
  }
  function box(lx, ly, lz, mat, x, y, z, parent, shadow) {
    var m = mesh(new T.BoxGeometry(lx, ly, lz), mat, parent, shadow);
    m.position.set(x, y, z);
    return m;
  }

  // smooth curve through control points (Catmull-Rom on x)
  function curve(pts) {
    return function (x) {
      if (x <= pts[0][0]) return pts[0][1];
      for (var i = 0; i < pts.length - 1; i++) {
        if (x <= pts[i + 1][0]) {
          var p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
          var t = (x - p1[0]) / (p2[0] - p1[0]), t2 = t * t, t3 = t2 * t;
          return 0.5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3);
        }
      }
      return pts[pts.length - 1][1];
    };
  }
  // loft: blend rounded cross-sections (superellipses) along the length
  function loft(x0, x1, steps, fn, ringN, mat) {
    var pos = [], idx = [];
    for (var i = 0; i <= steps; i++) {
      var x = x0 + (x1 - x0) * (i / steps), s = fn(x);
      for (var j = 0; j < ringN; j++) {
        var th = (j / ringN) * Math.PI * 2, c = Math.cos(th), sn = Math.sin(th);
        var ez = Math.sign(c) * Math.pow(Math.abs(c), 2 / s.n);
        var ey = Math.sign(sn) * Math.pow(Math.abs(sn), 2 / s.n);
        var yn = (ey + 1) / 2;
        var hw = s.hw + (s.hwt - s.hw) * Math.max(0, yn - 0.5) * 2;
        pos.push(x, s.yb + (s.yt - s.yb) * yn, ez * hw);
      }
    }
    for (i = 0; i < steps; i++) {
      for (j = 0; j < ringN; j++) {
        var a = i * ringN + j, b = i * ringN + (j + 1) % ringN, c2 = a + ringN, d = b + ringN;
        idx.push(a, c2, b, b, c2, d);
      }
    }
    // end caps: their own vertices (so the side normals stay smooth), facing outward
    [0, steps].forEach(function (k, e) {
      var cx = 0, cy = 0, base = k * ringN, start = pos.length / 3;
      for (var j2 = 0; j2 < ringN; j2++) {
        var vx = pos[(base + j2) * 3], vy = pos[(base + j2) * 3 + 1], vz = pos[(base + j2) * 3 + 2];
        pos.push(vx, vy, vz); cx += vx; cy += vy;
      }
      var ci = pos.length / 3;
      pos.push(pos[base * 3], cy / ringN, 0);
      for (j2 = 0; j2 < ringN; j2++) {
        var p = start + j2, q = start + (j2 + 1) % ringN;
        if (e === 0) idx.push(ci, p, q); else idx.push(ci, q, p);
      }
    });
    var g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    return mesh(g, mat);
  }

  var AX_F = -1.36, AX_R = 1.38, WR = 0.335, ARCH = 0.40;
  var bodyTop = curve([[-2.3, 0.5], [-2.18, 0.6], [-1.85, 0.68], [-1.3, 0.74], [-0.65, 0.82], [0.2, 0.86], [1.0, 0.9], [1.75, 0.95], [2.12, 0.96], [2.3, 0.84]]);
  var bodyBot = curve([[-2.3, 0.36], [-2.15, 0.2], [-1.8, 0.15], [1.9, 0.16], [2.2, 0.26], [2.3, 0.4]]);
  var bodyHW = curve([[-2.3, 0.6], [-2.12, 0.84], [-1.6, 0.93], [-1.3, 0.96], [-0.5, 0.92], [0.6, 0.94], [1.35, 1.0], [1.95, 0.97], [2.22, 0.88], [2.3, 0.7]]);
  function arch(x, ax) { var d = x - ax; return Math.abs(d) < ARCH ? WR + Math.sqrt(ARCH * ARCH - d * d) : 0; }
  function fender(x, ax, h) { var d = (x - ax) / 0.55; return h * Math.exp(-d * d); }
  loft(-2.3, 2.3, 140, function (x) {
    var yt = bodyTop(x) + fender(x, AX_F, 0.07) + fender(x, AX_R, 0.08);
    var yb = Math.max(bodyBot(x), arch(x, AX_F), arch(x, AX_R));
    var hw = bodyHW(x);
    return { yb: yb, yt: yt, hw: hw, hwt: hw * 0.9, n: 3.4 };
  }, 56, paint);

  // greenhouse: low roof, fast rear glass, tumblehome
  var ghTop = curve([[-0.78, 0.0], [-0.45, 0.2], [-0.05, 0.36], [0.35, 0.4], [0.75, 0.37], [1.15, 0.24], [1.5, 0.08], [1.65, 0.0]]);
  loft(-0.78, 1.65, 80, function (x) {
    var base = bodyTop(x) - 0.04;
    return { yb: base, yt: base + 0.04 + Math.max(0, ghTop(x)), hw: 0.8, hwt: 0.6, n: 2.8 };
  }, 40, gloss);

  // height of the body surface at (x, z), so details sit on the paint instead of floating
  function surfY(x, z) {
    var yt = bodyTop(x) + fender(x, AX_F, 0.07) + fender(x, AX_R, 0.08);
    var yb = Math.max(bodyBot(x), arch(x, AX_F), arch(x, AX_R));
    var hw = bodyHW(x) * 0.93, u = Math.min(0.999, Math.abs(z) / hw);
    var ey = Math.pow(1 - Math.pow(u, 3.4), 1 / 3.4);
    return yb + (yt - yb) * (ey + 1) / 2;
  }
  // LED headlight sweeps: short segments laid along the nose
  [1, -1].forEach(function (s) {
    for (var k = 0; k < 18; k++) {
      var t = k / 17, z = s * (0.42 + t * 0.36), x = -2.1 + t * 0.2;
      var seg = box(0.05, 0.02, 0.045, lamp, x, surfY(x, z) + 0.006, z, body, false);
      seg.rotation.z = -0.35;
    }
    // smooth mirror caps on short stalks
    var cap = mesh(new T.SphereGeometry(1, 20, 12), paint);
    cap.scale.set(0.09, 0.04, 0.06); cap.position.set(-0.58, 0.9, s * 0.95);
    box(0.05, 0.02, 0.08, trim, -0.6, 0.88, s * 0.89);
    // side skirts
    box(1.9, 0.05, 0.04, trim, 0.02, 0.19, s * 0.9);
  });
  // nose and tail faces (the body ends in flat caps at x = -2.3 and 2.3)
  box(0.012, 0.07, 0.8, plastic, -2.302, 0.43, 0, body, false);             // grille slot
  box(0.05, 0.012, 0.5, chrome, -2.305, 0.47, 0, body, false);
  box(0.16, 0.02, 1.2, trim, -2.16, 0.15, 0);                             // splitter
  box(0.012, 0.03, 1.15, tail, 2.302, 0.74, 0, body, false);                 // full-width light bar
  [1, -1].forEach(function (s) { box(0.012, 0.07, 0.16, tail, 2.302, 0.72, s * 0.5, body, false); });
  box(0.22, 0.1, 1.2, trim, 2.2, 0.2, 0);                                 // diffuser
  for (var fin = -2; fin <= 2; fin++) box(0.24, 0.08, 0.015, trim, 2.22, 0.18, fin * 0.2);
  [-0.4, -0.28, 0.28, 0.4].forEach(function (z) {
    var ex = mesh(new T.CylinderGeometry(0.04, 0.04, 0.12, 16), chrome);
    ex.rotation.z = Math.PI / 2; ex.position.set(2.3, 0.24, z);
  });
  // dark underbody so the arches read as openings
  box(3.9, 0.3, 1.5, trim, 0, 0.32, 0);

  // wheels: low-profile tires, ten-spoke rims, big brakes
  var wheels = [];
  var rubber = new T.MeshStandardMaterial({ color: 0x141516, roughness: 0.9 });
  var rimMat = new T.MeshStandardMaterial({ color: 0x1c1d20, metalness: 0.9, roughness: 0.28, envMap: envMap, envMapIntensity: 1.2 });
  var caliperMat = new T.MeshStandardMaterial({ color: 0xc9cdd0, metalness: 0.6, roughness: 0.35, envMap: envMap });
  function makeWheel(sideSign, width) {
    var w = new T.Group();
    var hw = width / 2, prof = [];
    [[0.25, -hw], [0.3, -hw], [0.325, -hw + 0.02], [WR, -hw + 0.05], [WR, hw - 0.05], [0.325, hw - 0.02], [0.3, hw], [0.25, hw]]
      .forEach(function (p) { prof.push(new T.Vector2(p[0], p[1])); });
    var tg = new T.LatheGeometry(prof, 56); tg.rotateX(Math.PI / 2);
    mesh(tg, rubber, w);
    var face = sideSign * (hw - 0.03);
    var barrel = mesh(new T.CylinderGeometry(0.25, 0.25, width - 0.04, 40, 1, true), rimMat, w);
    barrel.rotation.x = Math.PI / 2;
    var lipRing = mesh(new T.TorusGeometry(0.25, 0.012, 8, 48), chrome, w, false);
    lipRing.position.z = face;
    var disc = mesh(new T.CylinderGeometry(0.2, 0.2, 0.025, 36), steel, w, false);
    disc.rotation.x = Math.PI / 2; disc.position.z = face - sideSign * 0.07;
    for (var sp = 0; sp < 10; sp++) {
      var a = (sp / 10) * Math.PI * 2;
      var spoke = box(0.2, 0.026, 0.03, rimMat, Math.cos(a) * 0.135, Math.sin(a) * 0.135, face, w, false);
      spoke.rotation.z = a;
    }
    var hub = mesh(new T.CylinderGeometry(0.055, 0.055, 0.04, 20), chrome, w, false);
    hub.rotation.x = Math.PI / 2; hub.position.z = face + sideSign * 0.005;
    return w;
  }
  [[AX_F, 1, 0.26], [AX_F, -1, 0.26], [AX_R, 1, 0.3], [AX_R, -1, 0.3]].forEach(function (p) {
    var w = makeWheel(p[1], p[2]);
    w.position.set(p[0], WR, p[1] * (p[0] < 0 ? 0.8 : 0.82));
    S.add(w);
    wheels.push(w);
    // caliper stays put while the wheel spins
    var cal = box(0.14, 0.1, 0.06, caliperMat, p[0] + 0.13, WR + 0.12, p[1] * (p[0] < 0 ? 0.8 : 0.82) + p[1] * (p[2] / 2 - 0.12), S, false);
    cal.rotation.z = -0.7;
  });

  // headlight spots and soft beams (pointing toward -x in side-view space)
  var beamMat = new T.MeshBasicMaterial({ color: 0xdfe5ea, transparent: true, opacity: 0.04, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide });
  [0.62, -0.62].forEach(function (z) {
    var s = new T.SpotLight(0xf3f4f5, 3, 40, 0.4, 0.55, 1.2);
    s.position.set(-2.1, 0.64, z);
    s.target.position.set(-22, 0, z * 1.6);
    body.add(s); body.add(s.target);
    var beam = new T.Mesh(new T.ConeGeometry(2.0, 14, 24, 1, true), beamMat);
    beam.rotation.z = -Math.PI / 2;
    beam.position.set(-2.1 - 7, 0.45, z);
    body.add(beam);
  });

  // dust kicked up behind the rear tires (world space)
  var DUST = small ? 90 : 150;
  var dustPos = new Float32Array(DUST * 3), dustVel = new Float32Array(DUST * 3), dustLife = new Float32Array(DUST);
  for (i = 0; i < DUST; i++) dustPos[i * 3 + 1] = -50;
  var dustGeo = new T.BufferGeometry();
  dustGeo.setAttribute('position', new T.BufferAttribute(dustPos, 3));
  var dust = new T.Points(dustGeo, new T.PointsMaterial({ color: 0x8a9196, size: 0.16, transparent: true, opacity: 0.22, depthWrite: false }));
  dust.frustumCulled = false;
  scene.add(dust);
  var dustNext = 0, dustAcc = 0, dustAlive = 0;
  function updateDust(dt, speed) {
    var sp = Math.max(0, speed);
    dustAcc += dt * sp * 1.2;
    while (dustAcc > 1) {
      dustAcc -= 1;
      var k = dustNext; dustNext = (dustNext + 1) % DUST;
      var sx = rnd() < 0.5 ? -1 : 1;
      dustPos[k * 3] = sx * 0.85 + (rnd() - 0.5) * 0.2;
      dustPos[k * 3 + 1] = 0.06 + rnd() * 0.1;
      dustPos[k * 3 + 2] = 1.7;
      dustVel[k * 3] = sx * (0.4 + rnd() * 0.8);
      dustVel[k * 3 + 1] = 0.4 + rnd() * 0.9;
      dustVel[k * 3 + 2] = Math.min(sp, 40) * (0.55 + rnd() * 0.3);
      dustLife[k] = 0.9 + rnd() * 0.6;
    }
    dustAlive = 0;
    for (var j = 0; j < DUST; j++) {
      if (dustLife[j] <= 0) { dustPos[j * 3 + 1] = -50; continue; }
      dustAlive++;
      dustLife[j] -= dt;
      dustPos[j * 3] += dustVel[j * 3] * dt;
      dustPos[j * 3 + 1] += dustVel[j * 3 + 1] * dt;
      dustPos[j * 3 + 2] += dustVel[j * 3 + 2] * dt;
      dustVel[j * 3 + 1] *= 0.97;
    }
    dustGeo.attributes.position.needsUpdate = true;
  }


  // ---------- camera ----------
  function lerp(a, b, t) { return a + (b - a) * t; }
  function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  var look = new T.Vector3();
  // hero path: front three-quarter, low -> side -> chase, behind and above
  function placeCamera(p) {
    var e = ease(p);
    var theta = lerp(-2.45, small ? 0.12 : 0.3, e);
    var radius = lerp(small ? 11.5 : 7.6, small ? 10.5 : 7.4, e);
    var height = lerp(small ? 1.3 : 0.95, 2.1, e);
    camera.position.set(Math.sin(theta) * radius, height, Math.cos(theta) * radius);
    look.set(0, lerp(0.62, 0.5, e), lerp(0, -3, e));
    camera.lookAt(look);
  }
  var stageW = 1, stageH = 1;
  function frameCar(p) {
    // keep the car clear of the text: beside it on desktop, below it on phones.
    // Mid-scroll the text is faded out, so the car moves to the middle.
    var clearText = 1 - 0.9 * Math.pow(Math.sin(Math.PI * Math.min(1, p * 1.15)), 2);
    if (small) camera.setViewOffset(stageW, stageH, 0, -stageH * 0.27 * clearText, stageW, stageH);
    else camera.setViewOffset(stageW, stageH, -stageW * 0.25 * clearText, -stageH * 0.04, stageW, stageH);
    camera.updateProjectionMatrix();
  }
  function resize() {
    stageW = stage.clientWidth; stageH = stage.clientHeight;
    renderer.setSize(stageW, stageH, false);
    camera.aspect = stageW / stageH;
    camera.updateProjectionMatrix();
  }
  resize();

  function pose(travel, dTravel, dt) {
    placeWorld(travel);
    updateDust(dt, dt > 0 ? dTravel / dt : 0);
    for (var i = 0; i < wheels.length; i++) wheels[i].rotation.z += dTravel / WR;
    body.position.y = 0.006 * Math.sin(travel * 2.3) + 0.004 * Math.sin(travel * 4.1 + 1);
    body.rotation.z = 0.002 * Math.sin(travel * 0.9);
  }

  // ---------- offline render hooks ----------
  var TRAVEL_TOTAL = 160, travel = 0;
  window.renderHeroFrame = function (t, dt) {
    var next = t * TRAVEL_TOTAL, d = next - travel;
    travel = next;
    pose(travel, d, dt);
    var p = Math.max(0, Math.min(1, t));
    camera.fov = 34;
    placeCamera(p);
    frameCar(p);
    renderer.render(scene, camera);
    return true;
  };

  // stills for the rest of the site: [camera position, look-at, fov] in world space
  // (the car faces -z; its front-left wheel sits near (-0.8, 0.33, -1.36))
  var STILLS = {
    front: [[-4.3, 0.7, -5.4], [0.1, 0.5, -0.3], 30],
    side:  [[-7.4, 0.8, 0.1], [0, 0.55, 0.1], 30],
    rear:  [[2.4, 1.5, 7.2], [0, 0.45, -1.2], 32],
    wheel: [[-2.5, 0.45, -2.5], [-0.8, 0.36, -1.3], 26],
    aerial:[[4.5, 15, 7], [0, 0, -4], 34],
    lights:[[-1.7, 0.75, -4.3], [-0.45, 0.6, -2.0], 26],
  };
  window.renderStill = function (name) {
    var s = STILLS[name];
    // settle the dust and park the wheels in a consistent spot
    for (var k = 0; k < 40; k++) pose(80 + k * 0.4, 0.4, 0.04);
    camera.clearViewOffset();
    camera.fov = s[2];
    camera.position.set(s[0][0], s[0][1], s[0][2]);
    camera.lookAt(s[1][0], s[1][1], s[1][2]);
    camera.updateProjectionMatrix();
    renderer.render(scene, camera);
    return true;
  };
})();
