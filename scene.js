// Hero 3D world: a floating voxel island with a cherry tree and a voxel gamepad above it.
// Rendered at full resolution with antialiasing; the voxels themselves give the blocky look.
(() => {
  'use strict';
  const canvas = document.getElementById('world');
  if (!canvas || !window.THREE) return;
  const T = window.THREE;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const DPR = Math.min(window.devicePixelRatio || 1, 2);

  let renderer;
  try { renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: true }); }
  catch (e) { return; } // no WebGL: the CSS sky stays
  renderer.setPixelRatio(DPR);

  const scene = new T.Scene();
  scene.fog = new T.Fog(0x2a0d0c, 42, 95);
  const camera = new T.PerspectiveCamera(35, 1, 0.1, 200);
  scene.add(new T.HemisphereLight(0xffa27a, 0x3a0c0c, 0.95));
  const sun = new T.DirectionalLight(0xffc89a, 0.75); sun.position.set(10, 16, 12); scene.add(sun);
  const lava = new T.DirectionalLight(0xff6a1a, 0.55); lava.position.set(0, -14, 6); scene.add(lava); // glow from the lava ocean below
  const rim = new T.DirectionalLight(0x5ee5ea, 0.3); rim.position.set(-12, 4, -10); scene.add(rim); // soul fire

  // deterministic random so the island looks the same on every visit
  let seed = 11;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

  const box = new T.BoxGeometry(1, 1, 1);
  const mat = new T.MeshLambertMaterial({ color: 0xffffff });
  const voxels = (list) => {
    const mesh = new T.InstancedMesh(box, mat, list.length);
    const m = new T.Matrix4(); const c = new T.Color();
    list.forEach((v, i) => { m.makeTranslation(v[0], v[1], v[2]); mesh.setMatrixAt(i, m); mesh.setColorAt(i, c.setHex(v[3])); });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    return mesh;
  };

  // ---------- island
  const R = 7; const top = {}; const isl = [];
  for (let x = -R; x <= R; x++) for (let z = -R; z <= R; z++) {
    const d = Math.hypot(x, z);
    if (d > R - rnd() * 1.4) continue;
    const h = Math.round(Math.max(0, 1.4 - d * 0.22) + rnd() * 0.7);
    const depth = Math.round((R - d) * 0.75 + 1 + rnd() * 1.5);
    top[x + ',' + z] = h;
    const warped = x + z * 0.4 > -1 + rnd() * 1.5; // crimson forest on one side, warped on the other
    const RACK = [0x4f1e1e, 0x5a2222, 0x461a1a, 0x552020];
    for (let y = -depth; y <= h; y++) {
      let col = RACK[Math.floor(rnd() * RACK.length)];
      if (y === h) col = warped ? (rnd() < 0.2 ? 0x2bb3a5 : 0x1b8a80) : (rnd() < 0.2 ? 0xb52a2f : 0x8e1b24);
      else if (y < h - 1 && rnd() < 0.06) col = rnd() < 0.55 ? 0xe8ddd5 : 0xffcf4a; // quartz / nether gold
      isl.push([x, y, z, col]);
    }
    if (d < R - 2 && rnd() < 0.18) isl.push([x, -depth - 1, z, rnd() < 0.5 ? 0xffd36a : 0xf5b041]); // glowstone underneath
  }
  // roots and a soul fire
  for (let i = 0; i < 16; i++) {
    const x = Math.round((rnd() - 0.5) * 10), z = Math.round((rnd() - 0.5) * 10), h = top[x + ',' + z];
    if (h === undefined) continue;
    isl.push([x, h + 1, z, i === 3 ? 0x5ee5ea : x + z * 0.4 > -1 ? 0x2bb3a5 : 0xb5262e]);
  }
  // lavafall pouring off the edge
  for (let y = 1; y > -26; y--) isl.push([R - 1, y, 1, y % 3 ? 0xff7a1a : 0xffa53a]);
  // crimson fungus: stem, wart cap with shroomlights, weeping vines
  const trX = -3, trZ = -2, trH = (top[trX + ',' + trZ] ?? 1);
  for (let y = 1; y <= 5; y++) isl.push([trX, trH + y, trZ, y % 2 ? 0x5c1b2d : 0x7b2a3d]);
  for (let x = -3; x <= 3; x++) for (let y = 0; y <= 2; y++) for (let z = -3; z <= 3; z++) {
    const r = Math.hypot(x, z);
    if (r > 3.3 - y * 0.9 || (y === 0 && r < 2.2)) continue;
    isl.push([trX + x, trH + 6 + y, trZ + z, rnd() < 0.08 ? 0xffb347 : rnd() < 0.5 ? 0x8c1414 : 0xa31d1d]);
  }
  for (let i = 0; i < 5; i++) {
    const vx = trX + [-3, 3, 0, 2, -2][i], vz = trZ + [0, 1, -3, -2, 2][i], len = 1 + Math.floor(rnd() * 3);
    for (let k = 1; k <= len; k++) isl.push([vx, trH + 6 - k, vz, 0xb5262e]);
  }
  const island = voxels(isl);
  const world = new T.Group(); world.add(island); scene.add(world);

  // ---------- voxel gamepad (front view map, 2 voxels deep, features stick out)
  const MAP = [
    '..LLL.......RRR..',
    '.XXXXXXXXXXXXXXX.',
    'XXXXXXXXXXXXXyXXX',
    'XXdXXXXXXXXXxXbXX',
    'XdddXXXXXXXXXaXXX',
    'XXdXXsXXXsXXXXXXX',
    'XXXXXXXXXXXXXXXXX',
    'XXXXX.......XXXXX',
    '.XXX.........XXX.',
  ];
  const COL = { X: 0x4a3e43, L: 0x6a5c62, R: 0x6a5c62, d: 0x141012, s: 0x141012, y: 0xffd36a, x: 0x5ee5ea, b: 0xc4262e, a: 0x1b9a90 };
  const padV = [];
  MAP.forEach((row, r) => [...row].forEach((ch, c) => {
    if (ch === '.') return;
    const x = c - 8, y = 4 - r;
    const body = ch === 'L' || ch === 'R' ? COL.L : COL.X;
    padV.push([x, y, 0, body], [x, y, 1, body]);
    if ('dsyxba'.includes(ch)) padV.push([x, y, 2, COL[ch]]);
    if (ch === 's') padV.push([x, y, 3, 0xff7a1a]);
  }));
  const pad = new T.Group(); const padMesh = voxels(padV); padMesh.position.z = -1.5; pad.add(padMesh);
  pad.scale.setScalar(0.5); scene.add(pad);

  // ---------- floating particles
  const N = 46; const parts = new T.InstancedMesh(box, mat, N); const P = [];
  const pc = [0xff7a1a, 0xffa53a, 0x8f7f7a, 0xff5a1a, 0x6a5f5c, 0xffd36a, 0x5ee5ea]; // embers, ash, a little soul fire
  const tmpC = new T.Color();
  for (let i = 0; i < N; i++) {
    P.push({ x: (rnd() - 0.5) * 34, y: (rnd() - 0.5) * 24, z: (rnd() - 0.5) * 16, s: 0.18 + rnd() * 0.3, v: 0.4 + rnd() * 0.9, r: rnd() * 6 });
    parts.setColorAt(i, tmpC.setHex(pc[i % pc.length]));
  }
  if (parts.instanceColor) parts.instanceColor.needsUpdate = true;
  scene.add(parts);
  const M = new T.Matrix4(), Q = new T.Quaternion(), E = new T.Euler(), S = new T.Vector3(), V = new T.Vector3();

  // ---------- layout
  let baseX = 0, baseY = 0;
  const resize = () => {
    const w = canvas.clientWidth || innerWidth, h = canvas.clientHeight || innerHeight;
    renderer.setSize(w, h, false);
    const a = w / h; camera.aspect = a;
    const wide = a > 1.25;
    const dist = wide ? 50 : 84; camera.position.set(0, 8, dist); scene.fog.near = dist - 10; scene.fog.far = dist + 50;
    camera.lookAt(0, 2, 0);
    camera.updateProjectionMatrix();
    baseX = wide ? Math.min(15, 6 + a * 4) : 0;
    baseY = wide ? -1 : 10;
    world.position.set(baseX, baseY - 1, 0); world.scale.setScalar(0.9);
  };
  resize(); addEventListener('resize', resize);

  // ---------- loop
  let mx = 0, my = 0, tx = 0, ty = 0, raf = 0, visible = true;
  addEventListener('pointermove', (e) => { tx = e.clientX / innerWidth - 0.5; ty = e.clientY / innerHeight - 0.5; }, { passive: true });
  const start = performance.now();
  const frame = (now) => {
    raf = 0;
    const t = (now - start) / 1000;
    mx += (tx - mx) * 0.05; my += (ty - my) * 0.05;
    world.rotation.y = t * 0.12 + mx * 0.7;
    world.rotation.x = 0.08 + my * 0.12;
    pad.position.set(baseX + 2, baseY + 10 + Math.sin(t * 1.6) * 0.6, 3);
    pad.rotation.set(-0.15 + my * 0.3 + Math.sin(t * 1.1) * 0.05, Math.sin(t * 0.7) * 0.35 + mx * 0.8, Math.sin(t * 0.9) * 0.06);
    P.forEach((p, i) => {
      let y = p.y + t * p.v; y = ((y + 12) % 24 + 24) % 24 - 12;
      E.set(t * 0.6 + p.r, t * 0.8 + p.r, 0); Q.setFromEuler(E);
      M.compose(V.set(p.x + baseX * 0.5, y + baseY, p.z), Q, S.setScalar(p.s)); parts.setMatrixAt(i, M);
    });
    parts.instanceMatrix.needsUpdate = true;
    renderer.render(scene, camera);
    if (!reduce && visible && !document.hidden) raf = requestAnimationFrame(frame);
  };
  const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) kick(); }).observe(canvas);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) kick(); });
  if (reduce) addEventListener('resize', kick);
  kick();
})();
