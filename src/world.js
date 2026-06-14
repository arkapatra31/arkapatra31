// =============================================================================
//  world.js  —  a human figure walks a path through a dark "digital city",
//  stopping AT each structure (never through it). Each stop is a stage with its
//  own symbol/animation. At Experience the figure jumps across three towers
//  (TCS → Accenture → Deloitte) then parachutes down to continue. Camera follows
//  from a pulled-back, top-down angle. Pure procedural Three.js.
// =============================================================================
import * as THREE from "three";
import { FontLoader } from "three/addons/loaders/FontLoader.js";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import fontJson from "./font-bold.json";

// ---- dark digital theme ----
const BG = 0x0a0f1e;
const TILE = 0x16203a;
const MODEL = 0xd2dbec;
const MODEL2 = 0xaab6cf;
const SIGNAL = 0x3b74ff;
const GLOW = 0x37d2ff;
const SCREEN = 0x04130a;

const STOP_GROUND = [
  [0, 0, 0], [175, 0, -24], [350, 0, -6], [525, 0, -28], [700, 0, -8],
  [875, 0, -28], [1050, 0, -8], [1225, 0, -28], [1400, 0, -10], [1575, 0, -26],
];
const CAM_OFFSET = new THREE.Vector3(-90, 200, 160); // pulled back, top-down tilt

// every stop sits on an elevated platform the figure climbs onto. index = stop.
// experience (7) is special (tower jump + parachute) so it has no climb pedestal.
// The figure walks the centreline; each structure is pushed BACK (away from the
// camera) so the figure stands in front of it, clear, facing the camera.
const PLAT_H   = [10, 12, 14, 12, 12, 14, 14,  0, 14, 12]; // pedestal height
const PED_HALF = [26, 22, 42, 26, 36, 26, 26,  0, 30, 28]; // pedestal half-size (X/Z)
const BACK     = [10,  6, 24, 10, 18,  4, 16,  0, 18,  6]; // how far the structure sits behind the standing spot

const MAIN_URLS = ["https://cdn.simpleicons.org/github/ffffff", "https://cdn.simpleicons.org/docker"];
const CLOUD_URLS = [
  "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/amazonwebservices/amazonwebservices-original-wordmark.svg",
  "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/azure/azure-original.svg",
  "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/googlecloud/googlecloud-original.svg",
];

export class World {
  constructor(canvas) {
    this.canvas = canvas;
    this.clock = new THREE.Clock();
    this.p = 0; this._lastP = 0; this.speed = 0;
    this.stopCount = STOP_GROUND.length;
    this._ptr = new THREE.Vector2(); this._ptrT = new THREE.Vector2();
    this._camAim = new THREE.Vector3();
    this._look = new THREE.Vector3(0, 8, 0);
    this._tmp = new THREE.Vector3();
    this._prev = new THREE.Vector3();
    this.cloudLogos = []; this.shipLogos = []; this.shipAnchors = [];
    this._airborne = false;
    // unit direction (on the ground) from the walker toward the camera — structures
    // are pushed the opposite way so the figure stands in front of them, facing the camera.
    const fr = new THREE.Vector3(CAM_OFFSET.x, 0, CAM_OFFSET.z).normalize();
    this._frontX = fr.x; this._frontZ = fr.z;
    // surfaces the figure stands on (ground + plinths + ramps); a down-ray keeps
    // its feet on whatever is beneath, so it walks UP the ramps instead of through them.
    this._climbables = [];
    this._downRay = new THREE.Raycaster(); this._downOrigin = new THREE.Vector3();
    this._DOWN = new THREE.Vector3(0, -1, 0);

    this._init();
    this._buildPath();
    this._buildMatrix();
    this._buildWorld();
    this._buildHuman();
    this._loadLogos();

    addEventListener("resize", () => this._resize());
    addEventListener("pointermove", (e) => this._ptrT.set((e.clientX / innerWidth) * 2 - 1, (e.clientY / innerHeight) * 2 - 1));
    this.setProgress(0);
  }

  _init() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(BG);
    this.scene.fog = new THREE.Fog(BG, 160, 820);
    this.camera = new THREE.PerspectiveCamera(32, innerWidth / innerHeight, 0.5, 2400);

    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
    this.renderer.setSize(innerWidth, innerHeight);
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.scene.add(new THREE.AmbientLight(0x35406a, 0.7));
    this.scene.add(new THREE.HemisphereLight(0x9fb8ff, 0x0a0f1e, 0.7));
    this.sun = new THREE.DirectionalLight(0xffffff, 1.4);
    this.sun.position.set(60, 130, 60);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    Object.assign(this.sun.shadow.camera, { left: -90, right: 90, top: 90, bottom: -90, near: 1, far: 340 });
    this.sun.shadow.camera.updateProjectionMatrix();
    this.sun.shadow.bias = -0.0004;
    this.scene.add(this.sun, this.sun.target);

    const ground = new THREE.Mesh(new THREE.PlaneGeometry(3600, 3600), new THREE.MeshStandardMaterial({ color: BG, roughness: 1 }));
    ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true;
    this.scene.add(ground); this._climbables.push(ground);

    this.mat = new THREE.MeshStandardMaterial({ color: MODEL, roughness: 0.85, metalness: 0.04 });
    this.mat2 = new THREE.MeshStandardMaterial({ color: MODEL2, roughness: 0.9 });
    this.sparkMat = new THREE.MeshStandardMaterial({ color: SIGNAL, emissive: SIGNAL, emissiveIntensity: 0.85, roughness: 0.4 });
    this.screenMat = new THREE.MeshStandardMaterial({ color: SCREEN, roughness: 0.5, emissive: 0x062012, emissiveIntensity: 0.35 });
    this.codeMat = new THREE.MeshStandardMaterial({ color: 0x39ff7a, emissive: 0x22d65f, emissiveIntensity: 0.9, roughness: 0.5 });
    this.cloudMat = new THREE.MeshStandardMaterial({ color: 0xdfe7f5, roughness: 0.55, transparent: true, opacity: 0.28, depthWrite: false });
    this.tileMat = new THREE.MeshStandardMaterial({ color: 0x223158, roughness: 0.8 });
    // platform material — a soft self-lit glow instead of hard scribbly trim edges
    this.platMat = new THREE.MeshStandardMaterial({ color: 0x1b2748, roughness: 0.7, metalness: 0.1, emissive: new THREE.Color(GLOW), emissiveIntensity: 0.12 });
    this.rimMat = new THREE.MeshBasicMaterial({ color: GLOW });
    this.font = new FontLoader().parse(fontJson);

    this._ray = new THREE.Raycaster();
    this._groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    this._mouseGround = new THREE.Vector3(99999, 0, 99999);
    this._rayNdc = new THREE.Vector2();
  }

  _box(w, h, d, x, y, z, g, m) {
    const rr = Math.max(0.04, Math.min(Math.min(w, h, d) * 0.18, Math.min(w, h, d) / 2 - 0.02));
    const mesh = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 2, rr), m || this.mat);
    mesh.position.set(x, y + h / 2, z); mesh.castShadow = true; mesh.receiveShadow = true;
    g.add(mesh); return mesh;
  }
  _ico(r, x, y, z, g, m) { const n = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), m || this.mat); n.position.set(x, y, z); n.castShadow = true; g.add(n); return n; }
  _strut(a, b, g, m) {
    const d = b.clone().sub(a), len = d.length();
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, len, 6), m || this.mat2);
    c.position.copy(a).add(b).multiplyScalar(0.5);
    c.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
    c.castShadow = true; g.add(c);
  }

  _buildPath() { this.path = new THREE.CatmullRomCurve3(STOP_GROUND.map((p) => new THREE.Vector3(p[0], 0, p[2])), false, "catmullrom", 0.5); }

  _buildMatrix() {
    const xs = STOP_GROUND.map((p) => p[0]);
    const minX = Math.min(...xs) - 80, maxX = Math.max(...xs) + 80;
    const minZ = -180, maxZ = 110, pitch = 18;
    const cols = Math.ceil((maxX - minX) / pitch), rows = Math.ceil((maxZ - minZ) / pitch), count = cols * rows;

    const base = new THREE.InstancedMesh(new RoundedBoxGeometry(13, 1.6, 13, 2, 1.6), new THREE.MeshStandardMaterial({ color: TILE, roughness: 0.85 }), count);
    base.receiveShadow = true;

    const glowGeo = new THREE.PlaneGeometry(15.5, 15.5); glowGeo.rotateX(-Math.PI / 2);
    this.glowMat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uMouse: { value: this._mouseGround }, uColor: { value: new THREE.Color(GLOW) } },
      vertexShader: `
        uniform float uTime; uniform vec3 uMouse; varying float vG;
        void main(){
          vec3 c = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);
          float w1 = 0.5 + 0.5 * sin(c.x * 0.045 + c.z * 0.05 + uTime * 1.1);
          float w2 = 0.5 + 0.5 * sin(c.x * 0.02 - c.z * 0.035 + uTime * 0.6);
          float shimmer = pow(w1 * w2, 1.8);
          float hover = smoothstep(85.0, 0.0, distance(c.xz, uMouse.xz));
          vG = shimmer * 0.6 + hover;
          gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: `varying float vG; uniform vec3 uColor; void main(){ gl_FragColor = vec4(uColor * vG, vG * 0.85); }`,
    });
    const glow = new THREE.InstancedMesh(glowGeo, this.glowMat, count); glow.frustumCulled = false;

    const m = new THREE.Matrix4(); let i = 0;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const x = minX + c * pitch, z = minZ + r * pitch;
      m.makeTranslation(x, 0.8, z); base.setMatrixAt(i, m);
      m.makeTranslation(x, 1.78, z); glow.setMatrixAt(i, m); i++;
    }
    base.instanceMatrix.needsUpdate = true; glow.instanceMatrix.needsUpdate = true;
    this.scene.add(base, glow);
  }

  _buildWorld() {
    const builders = [this._intro, this._understand, this._architect, this._build, this._ship,
      this._capabilities, this._work, this._experience, this._faq, this._contact];
    const MODAL_Y = { 5: 30, 6: 30, 7: 70, 8: 40 };
    this.platformAnchors = {};
    const n = this.stopCount - 1;
    const back = new THREE.Vector3(-this._frontX, 0, -this._frontZ);
    STOP_GROUND.forEach((pos, i) => {
      const ph = PLAT_H[i] || 0;
      const gx = pos[0], gz = pos[2];
      const tan = this.path.getTangent(i / n);
      if (ph > 0) this._pedestal(gx, gz, ph, PED_HALF[i], tan); // raised plinth + ramps
      const g = new THREE.Group();
      g.position.set(gx, ph, gz);
      this.scene.add(g);
      // push the structure behind the standing spot so the figure never walks through it
      const bx = back.x * BACK[i], bz = back.z * BACK[i];
      const gp = new THREE.Group(); gp.position.set(bx, 0, bz); g.add(gp);
      (builders[i] || (() => {})).call(this, gp, [gx + bx, ph, gz + bz]);
      if (MODAL_Y[i] !== undefined) this.platformAnchors[i] = new THREE.Vector3(gx + bx, MODAL_Y[i], gz + bz);

      if (i === 7) // capture the experience tower roofs for the parachute jump
        this.expTowers = [[-16, 33], [0, 47], [17, 63]].map(([lx, h]) => new THREE.Vector3(gx + lx, h + 6, gz));
    });

    // experience tower-jump → parachute sequence (in scroll progress). The descent
    // lands the figure exactly where it stands on the FAQ platform (the centreline
    // top), so the hand-off to normal walking is seamless (no slide-back glitch).
    const faq = this.path.getPoint(8 / n);
    const exit = new THREE.Vector3(faq.x, PLAT_H[8], faq.z);
    const entry = this.path.getPoint(0.73); entry.y = 0;
    this._exp = { pa: 0.73, pb: 8 / n, entry, exit };
    this.scene.updateMatrixWorld(true); // so the very first down-ray hits valid surfaces
  }

  // an elevated plinth the figure walks up via ramps, lit by a soft glow rim (no z-fighting trim).
  _pedestal(cx, cz, ph, half, tan) {
    const yaw = Math.atan2(-tan.z, tan.x); // align local +X (ramp axis) with the path tangent
    const block = new THREE.Mesh(new RoundedBoxGeometry(half * 2, ph, half * 2, 3, 1.4), this.platMat);
    block.position.set(cx, ph / 2, cz); block.rotation.y = yaw;
    block.castShadow = block.receiveShadow = true;
    this.scene.add(block); this._climbables.push(block);
    // glowing rim sitting proud on the top edge — clean glow, nothing coplanar to flicker
    const rim = new THREE.Group(); rim.position.set(cx, ph + 0.4, cz); rim.rotation.y = yaw;
    [[0, half, half * 2, 1], [0, -half, half * 2, 1], [half, 0, 1, half * 2], [-half, 0, 1, half * 2]].forEach(([lx, lz, w, d]) => {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(w, 0.7, d), this.rimMat);
      bar.position.set(lx, 0, lz); rim.add(bar);
    });
    this.scene.add(rim);
    // ramps up the two path (tangent) sides, gentle enough to read as a climb
    [-1, 1].forEach((d) => {
      const run = ph * 2.4, len = Math.hypot(run, ph), ang = Math.atan2(ph, run);
      const rg = new THREE.Group(); rg.position.set(cx, 0, cz); rg.rotation.y = yaw;
      const ramp = new THREE.Mesh(new RoundedBoxGeometry(len, 1.4, half * 1.5, 2, 0.5), this.platMat);
      ramp.rotation.z = -d * ang;
      ramp.position.set(d * (half + run / 2 - 0.6), ph / 2, 0);
      ramp.castShadow = ramp.receiveShadow = true;
      rg.add(ramp); this.scene.add(rg); this._climbables.push(ramp);
    });
  }

  _intro(g) {
    this._box(20, 2, 12, 0, 0, 0, g, this.tileMat);
    this._box(2, 12, 2, 0, 2, -3, g, this.mat);
    const s = this._box(18, 11, 1, 0, 13, -3, g, this.mat);
    this._box(16, 9, 0.4, 0, 13, -2.4, g, this.screenMat); s.rotation.x = -0.06;
  }
  _understand(g) {
    this._box(16, 2, 16, 0, 0, 0, g, this.tileMat);
    const geo = new TextGeometry("?", { font: this.font, size: 26, height: 7, curveSegments: 8, bevelEnabled: true, bevelThickness: 0.8, bevelSize: 0.5, bevelSegments: 3 });
    geo.center(); this.qMark = new THREE.Mesh(geo, this.sparkMat); this.qMark.position.set(0, 26, 0); this.qMark.castShadow = true; g.add(this.qMark);
  }
  _architect(g) {
    const arch = new THREE.Group();
    [[28, 6], [22, 16], [16, 26]].forEach(([w, y], idx) => {
      this._box(w, 2.4, w, 0, y, 0, arch, idx === 1 ? this.mat2 : this.mat);
      for (let k = -1; k <= 1; k++) this._box(3, 3, 3, k * (w * 0.28), y + 2.4, 0, arch, k === 0 ? this.sparkMat : this.mat2);
    });
    [[-9, -9], [9, -9], [-9, 9], [9, 9]].forEach(([x, z]) => this._box(1, 26, 1, x * 0.7, 0, z * 0.7, arch, this.mat2));
    g.add(arch); this.archGroup = arch;
  }
  _build(g) {
    this._box(2, 14, 2, 0, 0, -2, g, this.mat);
    const frame = this._box(34, 22, 1.4, 0, 16, -2, g, this.mat); frame.rotation.x = -0.05;
    const face = new THREE.Group(); face.position.set(0, 27, -1.2); face.rotation.x = -0.05; g.add(face);
    this._box(30, 19, 0.3, 0, -11, 0, face, this.screenMat); // screen centre ends up at local y -1.5
    this.codeLines = [];
    for (let i = 0; i < 8; i++) {
      const w = 4 + Math.random() * 19;
      const ln = this._box(w, 0.9, 0.3, -13 + w / 2, -8 + i * 1.7, 0.3, face, this.codeMat); // inside screen
      ln.userData.w0 = w; this.codeLines.push(ln);
    }
    this.cursor = this._box(1.4, 1.4, 0.3, -12, -8, 0.35, face, this.codeMat);
  }
  _ship(g) {
    // Five raw logos on pillars, laid along the camera's screen-right axis so they
    // always read left→right: GitHub → Docker → AWS → Azure → GCP. No cloud shape.
    const fwd = CAM_OFFSET.clone().negate();
    const right = new THREE.Vector3(-fwd.z, 0, fwd.x).normalize();
    const y = 16, sp = 15;
    const spots = [-2, -1, 0, 1, 2].map((k) => right.clone().multiplyScalar(k * sp).setY(y));
    spots.forEach((s) => {
      const pil = new THREE.Mesh(new RoundedBoxGeometry(3, s.y, 3, 2, 0.5), this.mat);
      pil.position.set(s.x, s.y / 2, s.z); pil.castShadow = true; g.add(pil);
    });
    const planes = spots.map((s) => {
      const pl = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }));
      pl.position.copy(s); g.add(pl); return pl;
    });
    this.shipLogos = [planes[0], planes[1]];          // github, docker
    this.cloudLogos = [planes[2], planes[3], planes[4]]; // aws, azure, gcp (now raw)
    this.shipAnchors = [spots[0].clone(), spots[1].clone(), spots[3].clone()]; // github → docker → cloud
    this.packet = new THREE.Mesh(new RoundedBoxGeometry(2.6, 2.6, 2.6, 2, 0.5), this.sparkMat);
    g.add(this.packet); this.packetT = 0;
  }
  _capabilities(g) {
    this._box(32, 3.5, 32, 0, 0, 0, g, this.tileMat);
    const e = 1.0;
    this._box(32, 1, e, 0, 3.5, 16 - e / 2, g, this.sparkMat); this._box(32, 1, e, 0, 3.5, -16 + e / 2, g, this.sparkMat);
    this._box(e, 1, 32, 16 - e / 2, 3.5, 0, g, this.sparkMat); this._box(e, 1, 32, -16 + e / 2, 3.5, 0, g, this.sparkMat);
    this._box(20, 0.6, 20, 0, 3.5, 0, g, this.mat2);
  }
  _work(g) {
    // a platform + a small git commit graph on top (clickable → modal)
    this._box(32, 3.5, 32, 0, 0, 0, g, this.tileMat);
    const e = 1.0;
    this._box(32, 1, e, 0, 3.5, 16 - e / 2, g, this.sparkMat); this._box(32, 1, e, 0, 3.5, -16 + e / 2, g, this.sparkMat);
    this._box(e, 1, 32, 16 - e / 2, 3.5, 0, g, this.sparkMat); this._box(e, 1, 32, -16 + e / 2, 3.5, 0, g, this.sparkMat);
    const gr = new THREE.Group(); gr.position.y = 10;
    const main = [-12, -6, 0, 6, 12].map((x) => new THREE.Vector3(x, 0, 0));
    for (let i = 0; i < main.length - 1; i++) this._strut(main[i], main[i + 1], gr, this.mat);
    main.forEach((p, i) => this._ico(1.7, p.x, p.y, p.z, gr, i % 2 ? this.sparkMat : this.mat));
    const branch = [new THREE.Vector3(-6, 0, 0), new THREE.Vector3(0, 6, 0), new THREE.Vector3(6, 6, 0)];
    for (let i = 0; i < branch.length - 1; i++) this._strut(branch[i], branch[i + 1], gr, this.mat2);
    branch.slice(1).forEach((p) => this._ico(1.5, p.x, p.y, p.z, gr, this.sparkMat));
    this._strut(branch[2], new THREE.Vector3(6, 0, 0), gr, this.mat2);
    g.add(gr); this.workGroup = gr;
  }
  _experience(g) {
    this._box(50, 2, 24, 0, 0, 0, g, this.tileMat);
    [[-16, 33], [0, 47], [17, 63]].forEach(([x, h]) => {
      this._box(11, h, 11, x, 0, 0, g, this.mat);
      for (let wy = 7; wy < h - 5; wy += 7) for (let wx = -1; wx <= 1; wx++) this._box(1.6, 2.6, 0.5, x + wx * 3, wy, 5.6, g, this.sparkMat);
      this._box(11, 2, 11, x, h, 0, g, this.mat2); // rooftop (the figure lands here)
    });
  }
  _faq(g) {
    this._box(20, 2, 16, 0, 0, 0, g, this.tileMat);
    const bubble = (x, y, w, mat) => { this._box(w, w * 0.7, 4, x, y, 0, g, mat); this._box(3, 3, 3, x - w * 0.3, y - w * 0.32, 0, g, mat); };
    bubble(-6, 12, 16, this.mat); bubble(7, 22, 13, this.sparkMat);
    const q = new TextGeometry("?", { font: this.font, size: 9, height: 2, curveSegments: 6 }); q.center();
    const qm = new THREE.Mesh(q, this.mat2); qm.position.set(-6, 17, 2.2); g.add(qm);
  }
  _contact(g) {
    this._box(28, 2, 28, 0, 0, 0, g, this.tileMat);
    const env = new THREE.Group();
    this._box(22, 14, 3, 0, 0, 0, env, this.mat);
    const f1 = this._box(13.5, 1.4, 3.4, -5.5, 6.5, 0.4, env, this.sparkMat); f1.rotation.z = -0.55;
    const f2 = this._box(13.5, 1.4, 3.4, 5.5, 6.5, 0.4, env, this.sparkMat); f2.rotation.z = 0.55;
    this._box(2.6, 2.6, 2.6, 0, 1.5, 2.2, env, this.sparkMat);
    env.position.set(0, 22, 0); env.rotation.set(-0.12, 0.4, 0);
    g.add(env); this.contactEnv = env;
  }

  async _loadLogos() {
    const apply = async (url, plane) => {
      if (!plane) return;
      try {
        const res = await fetch(url); let svg = await res.text();
        if (!/\swidth=/.test(svg)) svg = svg.replace("<svg", '<svg width="256" height="256"');
        const blobUrl = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
        const img = await new Promise((ok, no) => { const im = new Image(); im.onload = () => ok(im); im.onerror = no; im.src = blobUrl; });
        const c = document.createElement("canvas"); c.width = c.height = 256;
        c.getContext("2d").drawImage(img, 0, 0, 256, 256); URL.revokeObjectURL(blobUrl);
        const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
        plane.material.map = tex; plane.material.opacity = 1; plane.material.needsUpdate = true;
      } catch { /* hidden if unreachable */ }
    };
    MAIN_URLS.forEach((u, i) => apply(u, this.shipLogos[i]));
    CLOUD_URLS.forEach((u, i) => apply(u, this.cloudLogos[i]));
  }

  _buildHuman() {
    const h = new THREE.Group();
    const skin = new THREE.MeshStandardMaterial({ color: 0xe8c4a0, roughness: 0.8 });
    const shirt = new THREE.MeshStandardMaterial({ color: SIGNAL, roughness: 0.55, metalness: 0.1 });
    const pants = new THREE.MeshStandardMaterial({ color: 0x1b2236, roughness: 0.85 });
    const shoe = new THREE.MeshStandardMaterial({ color: 0x0d1018, roughness: 0.7 });

    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(2.0, 4.2, 6, 14), shirt); torso.position.y = 11.4; torso.castShadow = true; h.add(torso);
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.8, 1.4, 10), skin); neck.position.y = 14.6; h.add(neck);
    const head = new THREE.Mesh(new THREE.SphereGeometry(1.9, 20, 20), skin); head.position.y = 16.5; head.castShadow = true; h.add(head);
    const pack = new THREE.Mesh(new RoundedBoxGeometry(3.2, 4, 1.6, 2, 0.4), this.sparkMat); pack.position.set(0, 11.6, -1.9); h.add(pack);

    const limb = (jx, jy, len, r, mat, footMat) => {
      const pivot = new THREE.Group(); pivot.position.set(jx, jy, 0);
      const c = new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 5, 10), mat); c.position.y = -(len / 2 + r); c.castShadow = true; pivot.add(c);
      if (footMat) { const f = new THREE.Mesh(new RoundedBoxGeometry(r * 2, 1.4, r * 3.2, 2, 0.3), footMat); f.position.set(0, -(len + 2 * r) + 0.5, r); f.castShadow = true; pivot.add(f); }
      h.add(pivot); return pivot;
    };
    this.legs = [limb(-1.5, 7.6, 5.2, 1.4, pants, shoe), limb(1.5, 7.6, 5.2, 1.4, pants, shoe)];
    this.arms = [limb(-2.8, 14, 5.0, 1.05, shirt), limb(2.8, 14, 5.0, 1.05, shirt)];

    // parachute (child of the walker, shown only during the experience descent)
    const para = new THREE.Group(); para.visible = false;
    const canopy = new THREE.Mesh(new THREE.SphereGeometry(9, 20, 10, 0, Math.PI * 2, 0, Math.PI * 0.5), new THREE.MeshStandardMaterial({ color: SIGNAL, roughness: 0.6, side: THREE.DoubleSide }));
    canopy.position.y = 25; para.add(canopy);
    [[-7, -7], [7, -7], [-7, 7], [7, 7]].forEach(([lx, lz]) => this._strut(new THREE.Vector3(lx, 24, lz), new THREE.Vector3(0, 15, 0), para, this.mat2));
    h.add(para); this.parachute = para;

    this.human = h; this.scene.add(h);
    this._prev.copy(h.position);
  }

  setProgress(p) { this.p = Math.max(0, Math.min(1, p)); }
  activeStop() { return Math.round(this.p * (this.stopCount - 1)); }
  project(v) { const p = v.clone().project(this.camera); return { x: (p.x * 0.5 + 0.5) * innerWidth, y: (-p.y * 0.5 + 0.5) * innerHeight, visible: p.z < 1 && Math.abs(p.x) < 1.1 && Math.abs(p.y) < 1.1 }; }
  _resize() { this.camera.aspect = innerWidth / innerHeight; this.camera.updateProjectionMatrix(); this.renderer.setSize(innerWidth, innerHeight); }

  // figure out where the walker should be for the current progress
  _walkerTarget(out) {
    const e = this._exp;
    if (this.expTowers && this.p >= e.pa && this.p <= e.pb) {
      const u = (this.p - e.pa) / (e.pb - e.pa);
      this._airborne = true; this._para = false;
      if (u < 0.62) {
        // hop entry → T1 → T2 → T3
        const pts = [e.entry, this.expTowers[0], this.expTowers[1], this.expTowers[2]];
        const seg = Math.min(2, Math.floor(u / 0.207)); const lu = (u - seg * 0.207) / 0.207;
        out.lerpVectors(pts[seg], pts[seg + 1], Math.min(1, lu));
        out.y += Math.sin(Math.min(1, lu) * Math.PI) * 9; // jump arc
      } else {
        // parachute straight down from T3 → the FAQ standing spot (e.exit)
        const lu = (u - 0.62) / 0.38, s = lu * lu * (3 - 2 * lu);
        out.lerpVectors(this.expTowers[2], e.exit, s);
        this._para = lu < 0.9;
      }
      return true;
    }
    // normal walking: follow the path centreline. A down-ray (in update) plants the
    // feet on whatever is beneath — ground, ramp or platform — so the figure walks
    // UP each ramp onto the plinth instead of clipping through it.
    this._airborne = false; this._para = false;
    out.copy(this.path.getPoint(this.p));
    out.y = 0;
    return false;
  }

  update() {
    const dt = Math.min(0.05, this.clock.getDelta());
    const t = this.clock.elapsedTime;
    this._ptr.lerp(this._ptrT, 0.05);

    const dp = this.p - this._lastP; this._lastP = this.p;
    this.speed += (Math.min(1, Math.abs(dp) * 280) - this.speed) * 0.15;

    const target = this._tmp; this._walkerTarget(target);
    this.human.position.copy(target);

    // plant the feet on whatever surface is below (ground / ramp / platform top)
    if (!this._airborne) {
      this._downOrigin.set(target.x, 400, target.z);
      this._downRay.set(this._downOrigin, this._DOWN);
      const hit = this._downRay.intersectObjects(this._climbables, false)[0];
      this.human.position.y = hit ? hit.point.y : 0;
    }

    // facing: toward travel when moving, toward the camera when paused at a stop
    const move = new THREE.Vector3(target.x - this._prev.x, 0, target.z - this._prev.z);
    let yaw;
    if (move.lengthSq() > 0.02) yaw = Math.atan2(move.x, move.z);
    else yaw = Math.atan2(this.camera.position.x - target.x, this.camera.position.z - target.z);
    let dy = yaw - this.human.rotation.y; dy = Math.atan2(Math.sin(dy), Math.cos(dy));
    this.human.rotation.y += dy * 0.15;
    this._prev.copy(target);

    // walk cycle (legs/arms), plus a small bob when on the ground/platform (not mid-air)
    const grounded = !this._airborne;
    const sw = Math.sin(t * 9) * (0.25 + this.speed * 0.95) * (grounded ? 1 : 0.4);
    if (this.legs) { this.legs[0].rotation.x = sw; this.legs[1].rotation.x = -sw; }
    if (this.arms) { this.arms[0].rotation.x = -sw * 0.8; this.arms[1].rotation.x = sw * 0.8; }
    if (grounded) this.human.position.y += Math.abs(Math.sin(t * 9)) * this.speed * 0.7;
    if (this.parachute) this.parachute.visible = !!this._para;

    // sun + camera follow
    this.sun.position.set(this.human.position.x + 60, 130, this.human.position.z + 60);
    this.sun.target.position.copy(this.human.position);
    this._camAim.copy(this.human.position).add(CAM_OFFSET);
    this._camAim.x += this._ptr.x * 6; this._camAim.y += -this._ptr.y * 4;
    this.camera.position.lerp(this._camAim, 0.07);
    const tan = this.path.getTangent(this.p);
    this._look.lerp(this._tmp.copy(this.human.position).add(new THREE.Vector3(tan.x * 16, 8, tan.z * 16)), 0.08);
    this.camera.lookAt(this._look);

    // matrix shimmer + hover glow
    if (this.glowMat) {
      this.glowMat.uniforms.uTime.value = t;
      this._rayNdc.set(this._ptr.x, -this._ptr.y);
      this._ray.setFromCamera(this._rayNdc, this.camera);
      if (this._ray.ray.intersectPlane(this._groundPlane, this._mouseGround)) this.glowMat.uniforms.uMouse.value.copy(this._mouseGround);
    }

    // per-stage animations
    this.sparkMat.emissiveIntensity = 0.7 + Math.sin(t * 3) * 0.3;
    if (this.qMark) { this.qMark.rotation.y = t * 0.8; this.qMark.position.y = 26 + Math.sin(t * 1.6) * 2; }
    if (this.archGroup) this.archGroup.rotation.y = t * 0.25;
    if (this.workGroup) this.workGroup.position.y = 10 + Math.sin(t * 1.2) * 1.2;
    if (this.contactEnv) { this.contactEnv.position.y = 22 + Math.sin(t * 1.3) * 1.5; this.contactEnv.rotation.y = 0.4 + Math.sin(t * 0.6) * 0.22; }
    if (this.codeLines) {
      for (const ln of this.codeLines) {
        ln.position.y += dt * 3;
        if (ln.position.y > 6.5) { const w = 4 + Math.random() * 19; ln.scale.x = w / ln.userData.w0; ln.position.x = -13 + w / 2; ln.position.y = -9; }
      }
      if (this.cursor) this.cursor.visible = Math.sin(t * 5) > 0;
    }
    if (this.packet && this.shipAnchors.length === 3) {
      this.packetT = (this.packetT + dt * 0.32) % 1;
      const seg = this.packetT * 2, i = Math.min(1, Math.floor(seg)), f = seg - i, ff = f * f * (3 - 2 * f);
      this.packet.position.lerpVectors(this.shipAnchors[i], this.shipAnchors[i + 1], ff);
      this.packet.position.y += Math.sin(ff * Math.PI) * 6;
      this.packet.rotation.x = this.packet.rotation.y += dt * 2;
      for (const pl of this.shipLogos) pl.quaternion.copy(this.camera.quaternion);
      for (const pl of this.cloudLogos) pl.quaternion.copy(this.camera.quaternion);
    }

    this.renderer.render(this.scene, this.camera);
  }
}
