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
  renderer.toneMappingExposure = 1.0;
  renderer.physicallyCorrectLights = false;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFShadowMap;
  renderer.domElement.className = 'hero3d-canvas';
  renderer.domElement.setAttribute('aria-hidden', 'true');
  stage.insertBefore(renderer.domElement, stage.firstChild);

  // sunset: the sun sits low ahead-left of the car, so front shots are lit and chase shots look into the glow
  var SUN = new T.Vector3(-0.45, 0.16, -0.88).normalize();
  var HAZE = 0xc98f78;
  var scene = new T.Scene();
  scene.background = new T.Color(HAZE);
  scene.fog = new T.Fog(HAZE, 70, 330);
  var sky = new T.Mesh(new T.SphereGeometry(420, 48, 24), new T.ShaderMaterial({
    side: T.BackSide, depthWrite: false, fog: false,
    uniforms: { sun: { value: SUN } },
    vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: [
      'uniform vec3 sun; varying vec3 vD;',
      'void main(){',
      '  float h = clamp(vD.y, -1.0, 1.0);',
      '  vec3 zen = vec3(0.11,0.16,0.33); vec3 mid = vec3(0.45,0.31,0.52); vec3 hor = vec3(0.97,0.55,0.33); vec3 low = vec3(0.79,0.56,0.47);',
      '  vec3 c = h > 0.0 ? mix(hor, mix(mid, zen, smoothstep(0.18, 0.75, h)), smoothstep(0.0, 0.22, h)) : low;',
      '  float s = max(dot(vD, sun), 0.0);',
      '  c += vec3(1.0,0.62,0.3) * pow(s, 6.0) * 0.55 + vec3(1.0,0.85,0.6) * pow(s, 120.0) * 1.2;',
      '  gl_FragColor = vec4(c, 1.0);',
      '}'].join('\n')
  }));
  scene.add(sky);
  var sunDisc = new T.Mesh(new T.CircleGeometry(9, 40), new T.MeshBasicMaterial({ color: 0xfff0d2, fog: false }));
  sunDisc.position.copy(SUN).multiplyScalar(400);
  sunDisc.lookAt(0, 0, 0);
  scene.add(sunDisc);
  var camera = new T.PerspectiveCamera(34, 1, 0.1, 700);

  // ---------- reflections: the sunset sky painted as an equirectangular image ----------
  var envMap = (function () {
    var W = 1024, Hh = 512;
    var c = document.createElement('canvas');
    c.width = W; c.height = Hh;
    var g = c.getContext('2d');
    var grad = g.createLinearGradient(0, 0, 0, Hh);
    grad.addColorStop(0, '#1c2a55');
    grad.addColorStop(0.3, '#6b4d86');
    grad.addColorStop(0.46, '#f0905a');
    grad.addColorStop(0.5, '#ffd0a0');
    grad.addColorStop(0.53, '#9a6a52');
    grad.addColorStop(1, '#2a1d18');
    g.fillStyle = grad; g.fillRect(0, 0, W, Hh);
    // sun hot spot at the same direction as the sun in the scene
    var u = (Math.atan2(SUN.z, SUN.x) / (2 * Math.PI) + 0.5) * W, v = (0.5 - Math.asin(SUN.y) / Math.PI) * Hh;
    var sg = g.createRadialGradient(u, v, 0, u, v, 120);
    sg.addColorStop(0, 'rgba(255,240,210,1)'); sg.addColorStop(0.15, 'rgba(255,190,120,0.9)'); sg.addColorStop(1, 'rgba(255,140,80,0)');
    g.fillStyle = sg; g.fillRect(0, 0, W, Hh);
    var tex = new T.CanvasTexture(c);
    tex.mapping = T.EquirectangularReflectionMapping;
    tex.encoding = T.sRGBEncoding;
    return tex;
  })();

  function noiseTexture(size, base, spread, streak) {
    // grainy canvas texture used as a bump map for sand ripples and asphalt
    var c = document.createElement('canvas'); c.width = c.height = size;
    var g = c.getContext('2d'), img = g.createImageData(size, size);
    for (var y = 0; y < size; y++) for (var x = 0; x < size; x++) {
      var r = streak ? Math.sin((y + Math.sin(x * 0.05) * 6) * 0.45) * 0.5 + 0.5 : 0.5;
      var v = base + (Math.random() - 0.5) * spread + (r - 0.5) * (streak || 0);
      var k = (y * size + x) * 4;
      img.data[k] = img.data[k + 1] = img.data[k + 2] = Math.max(0, Math.min(255, v)); img.data[k + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    var t = new T.CanvasTexture(c);
    t.wrapS = t.wrapT = T.RepeatWrapping;
    return t;
  }

  // ---------- lights ----------
  scene.add(new T.HemisphereLight(0x8a96c8, 0x7a4a30, 0.5));
  var sunLight = new T.DirectionalLight(0xffb27a, 1.7);
  sunLight.position.copy(SUN).multiplyScalar(60);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.set(4096, 4096);
  sunLight.shadow.camera.left = -12; sunLight.shadow.camera.right = 12;
  sunLight.shadow.camera.top = 12; sunLight.shadow.camera.bottom = -12;
  sunLight.shadow.camera.near = 1; sunLight.shadow.camera.far = 140;
  sunLight.shadow.bias = -0.0004;
  sunLight.shadow.normalBias = 0.03;
  scene.add(sunLight);
  var fill = new T.DirectionalLight(0x7f8fd0, 0.45);   // cool sky fill from the opposite side
  fill.position.set(20, 12, 18);
  scene.add(fill);

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
  var sandBump = noiseTexture(256, 128, 50, 26);
  sandBump.repeat.set(70, 90);
  var sandMat = new T.MeshStandardMaterial({ color: 0xb87a4e, roughness: 1, metalness: 0, bumpMap: sandBump, bumpScale: 0.12 });
  var tiles = [new T.Mesh(tileGeo, sandMat), new T.Mesh(tileGeo, sandMat)];
  tiles.forEach(function (t) { t.receiveShadow = true; scene.add(t); });

  var asphalt = noiseTexture(256, 128, 70, 0);
  asphalt.repeat.set(4, 260);
  var road = new T.Mesh(new T.PlaneGeometry(7.2, LEN * 2), new T.MeshStandardMaterial({ color: 0x2a2627, roughness: 0.85, bumpMap: asphalt, bumpScale: 0.06 }));
  road.rotation.x = -Math.PI / 2;
  road.position.set(0, 0.03, (Z_NEAR + Z_FAR) / 2);
  road.receiveShadow = true;
  scene.add(road);
  [-3.35, 3.35].forEach(function (x) {
    var edge = new T.Mesh(new T.PlaneGeometry(0.12, LEN * 2), new T.MeshStandardMaterial({ color: 0xe9e4dc, roughness: 0.6 }));
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

  var dashGeo = new T.BoxGeometry(0.14, 0.02, 3);
  var dashMat = new T.MeshStandardMaterial({ color: 0xe8b23a, roughness: 0.55 });   // yellow centre line
  var DASHES = 40;
  for (i = 0; i < DASHES; i++) addMover(new T.Mesh(dashGeo, dashMat), 0, Z_FAR + i * (LEN / DASHES), -0.04);

  var seed = 7;
  function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
  function side() { return rnd() < 0.5 ? -1 : 1; }

  var rockMat = new T.MeshStandardMaterial({ color: 0x8a5a3c, roughness: 1, flatShading: true });
  for (i = 0; i < (small ? 30 : 50); i++) {
    var r = new T.Mesh(new T.DodecahedronGeometry(0.4 + rnd() * 1.1, 0), rockMat);
    r.scale.y = 0.55 + rnd() * 0.4;
    r.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3);
    addMover(r, side() * (5.2 + rnd() * 55), Z_FAR + rnd() * LEN, 0.15);
  }

  // Joshua trees: the Mojave's signature plant
  var trunkMat = new T.MeshStandardMaterial({ color: 0x6a5240, roughness: 1, flatShading: true });
  var tuftMat = new T.MeshStandardMaterial({ color: 0x5d7a3c, roughness: 1, flatShading: true });
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

  // desert scrub: creosote and brittlebush clumps
  var scrubMats = [0x6f7d3e, 0x8a8a4a, 0x55693a].map(function (c) { return new T.MeshStandardMaterial({ color: c, roughness: 1, flatShading: true }); });
  for (i = 0; i < (small ? 110 : 170); i++) {
    var clump = new T.Group(), parts = 2 + Math.floor(rnd() * 3), mat = scrubMats[Math.floor(rnd() * 3)];
    for (var q = 0; q < parts; q++) {
      var bsh = new T.Mesh(new T.IcosahedronGeometry(0.25 + rnd() * 0.35, 0), mat);
      bsh.position.set((rnd() - 0.5) * 0.7, 0.15, (rnd() - 0.5) * 0.7);
      bsh.scale.y = 0.6 + rnd() * 0.3;
      clump.add(bsh);
    }
    addMover(clump, side() * (4.4 + rnd() * 70), Z_FAR + rnd() * LEN, 0.05);
  }

  // layered mountain ranges, hazier with distance
  [[180, 16, 0x8c5363, 0xc98f78], [235, 26, 0x6b4c74, 0xb88a86], [300, 38, 0x4f4a7a, 0xa58694]].forEach(function (L, li) {
    var seg = 360, pos = [], col = [], idx = [];
    var top = new T.Color(L[2]), base = new T.Color(L[3]);
    for (var k = 0; k <= seg; k++) {
      var a = (k / seg) * Math.PI * 2;
      var hgt = L[1] * (0.55 + 0.3 * Math.sin(a * 3 + li) + 0.18 * Math.sin(a * 11 + li * 2) + 0.08 * Math.sin(a * 37 + li * 5));
      var x = Math.sin(a) * L[0], z = Math.cos(a) * L[0];
      pos.push(x, -6, z, x, hgt, z);
      col.push(base.r, base.g, base.b, top.r, top.g, top.b);
      if (k < seg) { var v = k * 2; idx.push(v, v + 2, v + 1, v + 1, v + 2, v + 3); }
    }
    var geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    geo.setAttribute('color', new T.Float32BufferAttribute(col, 3));
    geo.setIndex(idx);
    scene.add(new T.Mesh(geo, new T.MeshBasicMaterial({ vertexColors: true, fog: false, side: T.DoubleSide })));
  });


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
  // panel seams and flush handles that follow the curve of the body side
  function surfZ(x, y) {
    var yt = bodyTop(x) + fender(x, AX_F, 0.07) + fender(x, AX_R, 0.08);
    var yb = Math.max(bodyBot(x), arch(x, AX_F), arch(x, AX_R));
    var yn = Math.min(1, Math.max(0, (y - yb) / (yt - yb))), ey = 2 * yn - 1;
    var hw = bodyHW(x), hwy = hw + (hw * 0.9 - hw) * Math.max(0, yn - 0.5) * 2;
    return hwy * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(ey), 3.4)), 1 / 3.4);
  }
  var seamMat = new T.MeshBasicMaterial({ color: 0x1a0204 });
  function seam(pts2) {
    [1, -1].forEach(function (sd) {
      var pts = pts2.map(function (p) { return new T.Vector3(p[0], p[1], sd * (surfZ(p[0], p[1]) + 0.002)); });
      mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 40, 0.0035, 4, false), seamMat, body, false);
    });
  }
  var doorF = -0.74, doorR = 0.6;
  var ptsF = [], ptsR = [], ptsB = [];
  for (var sy = 0; sy <= 10; sy++) {
    var yy = 0.26 + (sy / 10) * 0.56;
    ptsF.push([doorF + (yy - 0.26) * 0.12, yy]);
    ptsR.push([doorR - (yy - 0.26) * 0.18, yy]);
  }
  for (var sx = 0; sx <= 12; sx++) ptsB.push([doorF + 0.02 + (sx / 12) * (doorR - doorF - 0.04), 0.255]);
  seam(ptsF); seam(ptsR); seam(ptsB);
  [1, -1].forEach(function (sd) {
    var hx = 0.32, hy = 0.66;
    var handle = box(0.16, 0.022, 0.02, chrome, hx, hy, sd * (surfZ(hx, hy) + 0.004), body, false);
    handle.rotation.y = 0;
  });

  // soft contact shadow so the car sits on the road
  (function () {
    var c = document.createElement('canvas'); c.width = 256; c.height = 128;
    var g = c.getContext('2d');
    var rg = g.createRadialGradient(128, 64, 10, 128, 64, 128);
    rg.addColorStop(0, 'rgba(0,0,0,0.75)'); rg.addColorStop(0.55, 'rgba(0,0,0,0.45)'); rg.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = rg; g.fillRect(0, 0, 256, 128);
    var sh = new T.Mesh(new T.PlaneGeometry(5.6, 2.6), new T.MeshBasicMaterial({ map: new T.CanvasTexture(c), transparent: true, depthWrite: false }));
    sh.rotation.x = -Math.PI / 2; sh.position.set(0, 0.035, 0);
    S.add(sh);
  })();

  // dark underbody so the arches read as openings
  box(3.9, 0.3, 1.5, trim, 0, 0.32, 0);

  // wheels: low-profile tires, ten-spoke rims, big brakes
  var wheels = [];
  var rubber = new T.MeshStandardMaterial({ color: 0x0f0f10, roughness: 0.92 });
  var rimMat = new T.MeshStandardMaterial({ color: 0x26282c, metalness: 0.7, roughness: 0.38, envMap: envMap, envMapIntensity: 0.45 });
  var caliperMat = new T.MeshStandardMaterial({ color: 0xf0b323, metalness: 0.3, roughness: 0.35, envMap: envMap });
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
  var beamMat = new T.MeshBasicMaterial({ color: 0xdfe5ea, transparent: true, opacity: 0.018, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide });
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
