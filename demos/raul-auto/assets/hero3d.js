// Raul's Automotive — scroll-driven 3D hero.
// A lifted crew-cab pickup sits in the Mojave at night. It stays parked until the
// visitor scrolls: scrolling down drives it forward, scrolling up rolls it back,
// and the camera swings from a front three-quarter view to a chase view.
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
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small ? 1.5 : 1.6));
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
  moon.shadow.mapSize.set(small ? 1024 : 2048, small ? 1024 : 2048);
  moon.shadow.camera.left = -7; moon.shadow.camera.right = 7;
  moon.shadow.camera.top = 7; moon.shadow.camera.bottom = -7;
  moon.shadow.camera.near = 1; moon.shadow.camera.far = 70;
  moon.shadow.bias = -0.0006;
  moon.shadow.normalBias = 0.02;
  scene.add(moon);
  var rim = new T.DirectionalLight(0xbfc6cc, 0.7);   // back light to outline the truck
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
  var segX = small ? 64 : 96, segZ = small ? 84 : 120;
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

  // ---------- the truck ----------
  // Built in "side view" space: x runs along the truck (front is -x), y is up, z is across.
  // The group is turned so the truck faces -z in the world.
  var truck = new T.Group();
  scene.add(truck);
  var S = new T.Group();
  S.rotation.y = -Math.PI / 2;
  truck.add(S);
  var body = new T.Group();   // sprung mass: bounces on the suspension
  S.add(body);

  var paint = new T.MeshPhysicalMaterial({ color: 0x3d4247, metalness: 0.45, roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.08, envMap: envMap, envMapIntensity: 1.3 });
  var plastic = new T.MeshStandardMaterial({ color: 0x111214, metalness: 0.1, roughness: 0.65, envMap: envMap, envMapIntensity: 0.5 });
  var steel = new T.MeshStandardMaterial({ color: 0x1a1c1e, metalness: 0.7, roughness: 0.45, envMap: envMap, envMapIntensity: 0.8 });
  var chrome = new T.MeshStandardMaterial({ color: 0xc7ccd1, metalness: 1, roughness: 0.12, envMap: envMap, envMapIntensity: 1.3 });
  var glass = new T.MeshPhysicalMaterial({ color: 0x050607, metalness: 0.3, roughness: 0.03, clearcoat: 1, clearcoatRoughness: 0.02, envMap: envMap, envMapIntensity: 1.6 });
  var glassSide = glass.clone(); glassSide.side = T.DoubleSide;
  var lamp = new T.MeshBasicMaterial({ color: 0xffffff });
  var lens = new T.MeshStandardMaterial({ color: 0x9aa0a6, metalness: 0.9, roughness: 0.1, envMap: envMap, envMapIntensity: 1.5 });
  var tail = new T.MeshStandardMaterial({ color: 0x5a1010, emissive: 0x9b1a1a, emissiveIntensity: 0.9, roughness: 0.3 });
  var seamMat = new T.MeshBasicMaterial({ color: 0x050505 });

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
  function extrude(points, width, bevel, mat, parent) {
    var shape = new T.Shape();
    shape.moveTo(points[0][0], points[0][1]);
    for (var k = 1; k < points.length; k++) {
      var p = points[k];
      if (p.length === 4) shape.quadraticCurveTo(p[2], p[3], p[0], p[1]);
      else shape.lineTo(p[0], p[1]);
    }
    var geo = new T.ExtrudeGeometry(shape, { depth: width - bevel * 2, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel * 0.85, bevelSegments: 4, curveSegments: 16 });
    geo.translate(0, 0, -(width - bevel * 2) / 2);
    return mesh(geo, mat, parent);
  }

  var AX_F = -1.92, AX_R = 1.78, WR = 0.5, ARCH = 0.68, BOTTOM = 0.82;
  function archPts(cx, fromRight) {
    // wheel-arch cut-out along the bottom edge of the body
    var dy = BOTTOM - WR, a0 = Math.asin(dy / ARCH), pts = [];
    for (var k = 0; k <= 14; k++) {
      var a = a0 + (Math.PI - 2 * a0) * (k / 14);
      pts.push([cx + Math.cos(a) * ARCH, WR + Math.sin(a) * ARCH]);
    }
    return fromRight ? pts : pts.reverse();
  }

  // lower body: hood, fenders, doors and bed in one rounded piece
  var lower = [[-2.9, BOTTOM + 0.02], [-3.0, 1.3], [-2.96, 1.62, -3.0, 1.55], [-2.78, 1.74, -2.94, 1.72],
               [-1.3, 1.83, -2.0, 1.8], [2.84, 1.8], [2.92, 1.7, 2.92, 1.78], [2.92, 0.9], [2.82, BOTTOM, 2.92, BOTTOM]];
  lower = lower.concat(archPts(AX_R, true));
  lower = lower.concat(archPts(AX_F, true));
  lower.push([-2.85, BOTTOM]);
  extrude(lower, 2.02, 0.07, paint);

  // cab greenhouse: narrower than the body, raked windshield, rounded roof
  extrude([[-1.32, 1.8], [-0.42, 2.5, -0.9, 2.2], [-0.28, 2.6, -0.36, 2.58], [1.0, 2.62], [1.12, 2.54, 1.1, 2.62], [1.18, 1.8]], 1.86, 0.09, paint);

  // glass
  [1, -1].forEach(function (s) {
    var sideGlass = new T.Shape();
    sideGlass.moveTo(-1.1, 1.9); sideGlass.lineTo(-0.42, 2.45); sideGlass.lineTo(1.02, 2.5); sideGlass.lineTo(1.06, 1.9); sideGlass.lineTo(-1.1, 1.9);
    var g = new T.ShapeGeometry(sideGlass);
    var m = mesh(g, glassSide, body, false);
    m.position.z = s * 0.94;
    box(0.07, 0.62, 0.02, paint, 0.32, 2.2, s * 0.94, body, false);   // B pillar between doors
  });
  var ws = box(1.06, 0.02, 1.68, glass, -0.86, 2.18, 0, body, false);
  ws.rotation.z = Math.atan2(0.72, 0.92);
  ws.position.x -= 0.05; ws.position.y += 0.06;
  box(0.02, 0.5, 1.56, glass, 1.27, 2.22, 0, body, false);            // rear window

  // panel seams, handles, badges
  [1, -1].forEach(function (s) {
    var zz = s * 1.012;
    [[-1.28, 1.0], [0.3, 0.95], [1.16, 0.95]].forEach(function (seam) {
      box(0.012, seam[1] * 0.92, 0.004, seamMat, seam[0], BOTTOM + 0.08 + seam[1] * 0.46, zz, body, false);
    });
    box(1.5, 0.008, 0.004, seamMat, -0.48, 1.6, zz, body, false);     // body crease line
    box(0.16, 0.035, 0.03, chrome, -0.06, 1.68, zz, body, false);     // door handles
    box(0.16, 0.035, 0.03, chrome, 1.0, 1.68, zz, body, false);
    // tow mirrors
    box(0.05, 0.05, 0.22, plastic, -1.12, 1.95, s * 1.07);
    box(0.1, 0.34, 0.2, plastic, -1.1, 2.05, s * 1.24);
    box(0.012, 0.28, 0.16, chrome, -1.04, 2.05, s * 1.24, body, false);
    // running boards
    box(2.3, 0.06, 0.24, plastic, -0.42, BOTTOM - 0.08, s * 1.1);
    box(0.06, 0.12, 0.06, steel, -1.2, BOTTOM - 0.02, s * 0.98);
    box(0.06, 0.12, 0.06, steel, 0.4, BOTTOM - 0.02, s * 0.98);
    // fender flares that follow the arches
    [AX_F, AX_R].forEach(function (ax) {
      var a0 = Math.asin((BOTTOM - WR) / ARCH);
      var flare = mesh(new T.TorusGeometry(ARCH + 0.04, 0.07, 6, 28, Math.PI - 2 * a0), plastic);
      flare.position.set(ax, WR, s * 1.0);
      flare.rotation.z = a0;
      flare.scale.z = 1.9;
    });
    // bed rail cap
    box(1.66, 0.04, 0.1, plastic, 2.0, 1.82, s * 0.94);
  });
  // open bed
  box(1.62, 0.02, 1.74, plastic, 2.02, 1.805, 0, body, false);
  box(0.03, 0.03, 1.8, chrome, 2.9, 1.5, 0, body, false);              // tailgate handle line
  // hood power bulge
  extrude([[-2.6, 1.78], [-2.5, 1.86], [-1.55, 1.88], [-1.45, 1.8]], 1.0, 0.03, paint);

  // front end
  box(0.1, 0.5, 1.36, plastic, -3.01, 1.33, 0);                          // grille
  for (var gb = 0; gb < 4; gb++) box(0.03, 0.03, 1.3, steel, -3.065, 1.15 + gb * 0.12, 0, body, false);
  box(0.04, 0.09, 1.44, chrome, -3.07, 1.6, 0, body, false);            // grille top bar
  box(0.04, 0.06, 1.44, chrome, -3.07, 1.07, 0, body, false);
  box(0.04, 0.14, 0.26, chrome, -3.09, 1.33, 0, body, false);           // badge
  [1, -1].forEach(function (s) {
    box(0.1, 0.24, 0.42, lens, -2.98, 1.5, s * 0.78);                    // headlight housing
    box(0.03, 0.05, 0.36, lamp, -3.04, 1.58, s * 0.78, body, false);     // LED strip
    box(0.03, 0.1, 0.12, lamp, -3.04, 1.46, s * 0.86, body, false);      // projector
    box(0.03, 0.06, 0.18, lamp, -3.17, 0.9, s * 0.72, body, false);      // fog light
  });
  // steel off-road bumper, skid plate and tow hooks
  extrude([[-3.2, 0.68], [-3.24, 0.98], [-3.12, 1.08], [-2.86, 1.08], [-2.86, 0.68]], 2.16, 0.03, steel);
  var skid = box(0.6, 0.04, 1.2, steel, -2.9, 0.62, 0);
  skid.rotation.z = -0.35;
  box(0.12, 0.12, 0.06, chrome, -3.22, 0.75, 0.55);
  box(0.12, 0.12, 0.06, chrome, -3.22, 0.75, -0.55);
  // rear end
  [1, -1].forEach(function (s) { box(0.05, 0.5, 0.15, tail, 2.94, 1.43, s * 0.93, body, false); });
  box(0.24, 0.22, 2.06, chrome, 3.0, 0.9, 0);
  box(0.02, 0.18, 0.34, lens, 2.95, 1.18, 0, body, false);              // plate
  // roof light bar
  box(0.18, 0.12, 1.4, plastic, -0.36, 2.72, 0);
  box(0.03, 0.08, 1.32, lamp, -0.46, 2.72, 0, body, false);
  box(0.06, 0.12, 0.06, plastic, -0.3, 2.64, 0.6);
  box(0.06, 0.12, 0.06, plastic, -0.3, 2.64, -0.6);

  // chassis (unsprung / visible thanks to the lift)
  var chassis = S;
  box(5.4, 0.18, 0.12, steel, -0.1, 0.72, 0.46, chassis);
  box(5.4, 0.18, 0.12, steel, -0.1, 0.72, -0.46, chassis);
  [AX_F, AX_R].forEach(function (ax) {
    var axle = mesh(new T.CylinderGeometry(0.06, 0.06, 1.8, 10), steel, chassis);
    axle.rotation.x = Math.PI / 2; axle.position.set(ax, WR, 0);
    var diff = mesh(new T.SphereGeometry(0.17, 14, 10), steel, chassis);
    diff.position.set(ax + (ax < 0 ? 0.05 : -0.05), WR, 0.1);
    [1, -1].forEach(function (s) {
      var shock = mesh(new T.CylinderGeometry(0.055, 0.055, 0.5, 10), chrome, chassis);
      shock.position.set(ax + 0.22, WR + 0.24, s * 0.62); shock.rotation.z = -0.25;
      var coil = mesh(new T.TorusGeometry(0.09, 0.018, 6, 14), steel, chassis);
      coil.rotation.x = Math.PI / 2; coil.position.set(ax + 0.2, WR + 0.3, s * 0.62);
      box(0.4, 0.06, 0.08, steel, ax - 0.25, WR + 0.12, s * 0.55, chassis);     // control arm
    });
  });
  var exhaust = mesh(new T.CylinderGeometry(0.05, 0.05, 0.25, 10), chrome, chassis);
  exhaust.rotation.z = Math.PI / 2; exhaust.position.set(2.95, 0.68, 0.7);

  // wheels: 35-inch mud-terrain tires with tread blocks, machined multi-spoke rims
  var tireProfile = [];
  var hw = 0.19;
  [[0.31, -hw], [0.42, -hw], [0.468, -hw + 0.018], [0.492, -hw + 0.06], [0.5, -0.11], [0.5, 0.11], [0.492, hw - 0.06], [0.468, hw - 0.018], [0.42, hw], [0.31, hw]]
    .forEach(function (p) { tireProfile.push(new T.Vector2(p[0], p[1])); });
  var tireGeo = new T.LatheGeometry(tireProfile, 48);
  tireGeo.rotateX(Math.PI / 2);
  var rubber = new T.MeshStandardMaterial({ color: 0x151617, roughness: 0.93, metalness: 0 });
  var knobGeo = new T.BoxGeometry(0.1, 0.045, 0.12);
  var rimMat = new T.MeshStandardMaterial({ color: 0x2b2e31, metalness: 0.85, roughness: 0.32, envMap: envMap, envMapIntensity: 1.1 });
  var dummy = new T.Object3D();
  function makeWheel(sideSign) {
    var w = new T.Group();
    var tire = mesh(tireGeo, rubber, w);
    var KN = 28, knobs = new T.InstancedMesh(knobGeo, rubber, KN * 2);
    for (var k = 0; k < KN * 2; k++) {
      var row = k < KN ? 1 : -1, a = ((k % KN) + (row > 0 ? 0 : 0.5)) / KN * Math.PI * 2;
      dummy.position.set(Math.cos(a) * 0.505, Math.sin(a) * 0.505, row * 0.085);
      dummy.rotation.set(0, 0, a - Math.PI / 2);
      dummy.updateMatrix();
      knobs.setMatrixAt(k, dummy.matrix);
    }
    knobs.castShadow = true;
    w.add(knobs);
    var barrel = mesh(new T.CylinderGeometry(0.31, 0.31, 0.3, 32, 1, true), rimMat, w);
    barrel.rotation.x = Math.PI / 2;
    var face = sideSign * 0.13;
    var dish = mesh(new T.CylinderGeometry(0.3, 0.3, 0.02, 32), rimMat, w);
    dish.rotation.x = Math.PI / 2; dish.position.z = face - sideSign * 0.06;
    var rotor = mesh(new T.CylinderGeometry(0.22, 0.22, 0.03, 24), steel, w, false);
    rotor.rotation.x = Math.PI / 2; rotor.position.z = face - sideSign * 0.08;
    for (var sp = 0; sp < 6; sp++) {
      var spoke = box(0.26, 0.07, 0.04, chrome, 0, 0, face, w);
      var sa = (sp / 6) * Math.PI * 2;
      spoke.position.set(Math.cos(sa) * 0.15, Math.sin(sa) * 0.15, face);
      spoke.rotation.z = sa;
    }
    var lip = mesh(new T.TorusGeometry(0.305, 0.018, 8, 40), chrome, w);
    lip.position.z = face;
    var cap = mesh(new T.CylinderGeometry(0.07, 0.07, 0.05, 16), chrome, w);
    cap.rotation.x = Math.PI / 2; cap.position.z = face + sideSign * 0.01;
    for (var lg = 0; lg < 6; lg++) {
      var la = (lg / 6) * Math.PI * 2 + 0.52;
      var lug = mesh(new T.CylinderGeometry(0.014, 0.014, 0.03, 6), chrome, w, false);
      lug.rotation.x = Math.PI / 2; lug.position.set(Math.cos(la) * 0.1, Math.sin(la) * 0.1, face);
    }
    return w;
  }
  var wheels = [];
  [[AX_F, 1], [AX_F, -1], [AX_R, 1], [AX_R, -1]].forEach(function (p) {
    var w = makeWheel(p[1]);
    w.position.set(p[0], WR, p[1] * 0.97);
    S.add(w);
    wheels.push(w);
  });

  // headlight spots and soft beams (pointing toward -x in side-view space)
  var beamMat = new T.MeshBasicMaterial({ color: 0xdfe5ea, transparent: true, opacity: 0.045, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide });
  [0.78, -0.78].forEach(function (z) {
    var s = new T.SpotLight(0xf3f4f5, 3, 46, 0.42, 0.55, 1.2);
    s.position.set(-3.05, 1.5, z);
    s.target.position.set(-24, 0, z * 1.6);
    body.add(s); body.add(s.target);
    var beam = new T.Mesh(new T.ConeGeometry(2.4, 16, 24, 1, true), beamMat);
    beam.rotation.z = -Math.PI / 2;
    beam.rotation.y = 0.0;
    beam.position.set(-3.05 - 8, 1.1, z);
    body.add(beam);
  });

  // dust kicked up behind the rear tires (world space)
  var DUST = small ? 90 : 150;
  var dustPos = new Float32Array(DUST * 3), dustVel = new Float32Array(DUST * 3), dustLife = new Float32Array(DUST);
  for (i = 0; i < DUST; i++) dustPos[i * 3 + 1] = -50;
  var dustGeo = new T.BufferGeometry();
  dustGeo.setAttribute('position', new T.BufferAttribute(dustPos, 3));
  var dust = new T.Points(dustGeo, new T.PointsMaterial({ color: 0x8a9196, size: 0.26, transparent: true, opacity: 0.35, depthWrite: false }));
  dust.frustumCulled = false;
  scene.add(dust);
  var dustNext = 0, dustAcc = 0, dustAlive = 0;
  function updateDust(dt, speed) {
    var sp = Math.max(0, speed);
    dustAcc += dt * sp * 3;
    while (dustAcc > 1) {
      dustAcc -= 1;
      var k = dustNext; dustNext = (dustNext + 1) % DUST;
      var sx = rnd() < 0.5 ? -1 : 1;
      dustPos[k * 3] = sx + (rnd() - 0.5) * 0.3;
      dustPos[k * 3 + 1] = 0.15 + rnd() * 0.2;
      dustPos[k * 3 + 2] = 2.2;
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

  // ---------- camera path ----------
  function lerp(a, b, t) { return a + (b - a) * t; }
  function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  var look = new T.Vector3();
  function placeCamera(p, mx, my) {
    var e = ease(p);
    var theta = lerp(-2.5, small ? 0.12 : 0.32, e) + mx * 0.14;
    var radius = lerp(small ? 17 : 11.8, small ? 15 : 10.8, e);
    var height = lerp(small ? 2.4 : 1.9, 3.3, e) + my * 0.35;
    camera.position.set(Math.sin(theta) * radius, height, Math.cos(theta) * radius);
    look.set(0, lerp(1.45, 1.2, e), lerp(0, -4, e));
    camera.lookAt(look);
  }

  var stageW = 1, stageH = 1;
  function frameTruck(p) {
    // keep the truck clear of the text: beside it on desktop, below it on phones.
    // Mid-scroll the text is faded out, so the truck moves to the middle.
    var clearText = 1 - 0.9 * Math.pow(Math.sin(Math.PI * Math.min(1, p * 1.15)), 2);
    if (small) camera.setViewOffset(stageW, stageH, 0, -stageH * 0.27 * clearText, stageW, stageH);
    else camera.setViewOffset(stageW, stageH, -stageW * 0.25 * clearText, -stageH * 0.04, stageW, stageH);
    camera.updateProjectionMatrix();
  }
  function resize() {
    stageW = stage.clientWidth; stageH = stage.clientHeight;
    small = stageW < 760;
    renderer.setSize(stageW, stageH, false);
    camera.aspect = stageW / stageH;
    frameTruck(prog);
    dirty = true;
  }

  // ---------- scroll + pointer input ----------
  // The drive is tied to scroll position: no scrolling, no movement.
  var DRIVE_PER_PX = 0.085;
  var target = 0, prog = 0, travelTarget = 0, travel = 0;
  var mx = 0, my = 0, tmx = 0, tmy = 0, dirty = true;
  function readScroll() {
    var rect = wrap.getBoundingClientRect();
    var range = wrap.offsetHeight - stage.offsetHeight;
    target = range > 0 ? Math.min(1, Math.max(0, -rect.top / range)) : 0;
    travelTarget = Math.max(0, -rect.top) * DRIVE_PER_PX;
  }
  window.addEventListener('scroll', readScroll, { passive: true });
  window.addEventListener('resize', resize);
  if (!small) {
    window.addEventListener('pointermove', function (e) {
      tmx = (e.clientX / window.innerWidth - 0.5) * 2;
      tmy = (e.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });
  }

  // ---------- HUD on the welcome screen ----------
  var hudState = document.querySelector('[data-hud-state]');
  var hudOdo = document.querySelector('[data-hud-odo]');
  var lastState = '', lastOdo = '';
  function updateHud(speed) {
    var driving = Math.abs(speed) > 0.6;
    var state = driving ? (speed > 0 ? 'Driving' : 'Reversing') : (prog > 0.98 ? 'Parked' : (travel < 0.5 ? 'Scroll to drive' : 'Paused'));
    if (state !== lastState) {
      lastState = state;
      if (hudState) hudState.textContent = state;
      wrap.classList.toggle('is-driving', driving);
    }
    var odo = (travel * 0.0124).toFixed(1);
    while (odo.length < 6) odo = '0' + odo;
    if (odo !== lastOdo && hudOdo) { lastOdo = odo; hudOdo.textContent = odo; }
  }

  // ---------- loop: only renders while something is actually changing ----------
  var clock = new T.Clock(), running = false, visible = true, idleTime = 0;

  function frame(dt) {
    var prevTravel = travel;
    travel += (travelTarget - travel) * Math.min(1, dt * 7);
    if (Math.abs(travelTarget - travel) < 0.002) travel = travelTarget;
    var dTravel = travel - prevTravel;
    var speed = dt > 0 ? dTravel / dt : 0;
    prog += (target - prog) * Math.min(1, dt * 7);
    if (Math.abs(target - prog) < 0.0004) prog = target;
    mx += (tmx - mx) * Math.min(1, dt * 4);
    my += (tmy - my) * Math.min(1, dt * 4);

    var moving = dTravel !== 0;
    var changed = dirty || moving || Math.abs(target - prog) > 0 || Math.abs(tmx - mx) > 0.001 || Math.abs(tmy - my) > 0.001 || dustAlive > 0;
    updateHud(speed);
    if (!changed) return;
    dirty = false;

    placeWorld(travel);
    updateDust(dt, speed);
    for (var i = 0; i < wheels.length; i++) wheels[i].rotation.z += dTravel / WR;
    // suspension: settle when parked, small road texture while driving
    var amp = Math.min(1, Math.abs(speed) / 12);
    body.position.y = amp * (0.02 * Math.sin(travel * 1.9) + 0.012 * Math.sin(travel * 3.7 + 1));
    body.rotation.x = amp * 0.004 * Math.sin(travel * 1.3);
    body.rotation.z = -Math.max(-0.012, Math.min(0.012, (speed - (frame.lastSpeed || 0)) * 0.002)); // squat under acceleration
    frame.lastSpeed = speed;

    placeCamera(prog, mx, my);
    frameTruck(prog);
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

  resize();
  readScroll();
  travel = travelTarget; prog = target;

  if (reduceMotion) {
    frame(0.016);
    window.addEventListener('resize', function () { dirty = true; frame(0); });
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
