/**
 * Kaleidoscope - 3D 視訊互動萬花筒核心引擎
 * 結合 Three.js + 自訂 GLSL 3D 頂點位移與萬花筒光學著色器 + 視訊體感與音訊律動
 */

(() => {
  'use strict';

  // ============================================================================
  // 全域狀態與參數設定
  // ============================================================================
  const state = {
    sourceMode: 'webcam', // 'webcam' | 'cyber' | 'neonGrid' | 'aurora' | 'customImage'
    webcamActive: false,
    flipHorizontal: true,
    freezeFrame: false,

    // 3D 與幾何設定
    geoMode: 'dome', // 'dome' | 'tunnel' | 'crystal' | 'relief' | 'torus' | 'prismCluster'
    extrusion: 0.75,
    zoom: 1.0,
    tilt: 0.35,
    wireframe: false,
    particles: true,
    autoRotate3D: true,

    // 萬花筒對稱與鏡頭彈性取景設定 (預設 1.0x 完整廣角，不強制裁切放大)
    camAspectMode: 'full', // 'full'(完整廣角) | 'cover'(等比滿版) | 'focus'(特寫聚焦)
    facingMode: 'user', // 'user'(前鏡頭) | 'environment'(後鏡頭)
    faceMode: 0, // 0:花瓣人像環, 1:中央魔鏡臉, 2:複眼人像陣
    faceZoom: 1.0, // 預設 1.0x 完整視野，可自由調整 0.5x ~ 3.0x
    camPanX: 0, // 鏡頭水平偏移 (-100 ~ +100)
    camPanY: 0, // 鏡頭垂直偏移 (-100 ~ +100)
    segments: 8,
    repeat: 1.1,
    twist: 0.0,
    fold: 1,
    speed: 0.35,
    pulse: 0.08,

    // 色彩與濾鏡設定
    filterMode: 0, // 0:原始, 1:霓虹賽博, 2:迷幻光譜, 3:琉璃黑金, 4:熱成像儀, 5:螢光邊緣
    hue: 0,
    saturation: 1.18,
    glow: 1.08,
    aberration: 0.06,
    autoHue: false,
    invert: false,

    // 感應與互動設定
    motionReact: true,
    audioReact: false,
    sensitivity: 1.5,
    autoMorph: false,

    // 執行期動態數值
    time: 0,
    kaleidoAngle: 0,
    motionEnergy: 0,
    audioEnergy: 0,
    audioBass: 0,
    audioTreble: 0,

    // 滑鼠/觸控 3D 互動與波紋
    pointerX: 0,
    pointerY: 0,
    targetRotX: 0,
    targetRotY: 0,
    isDraggingCanvas: false,
    dragStartX: 0,
    dragStartY: 0,
    rippleCenter: new THREE.Vector2(0.5, 0.5),
    rippleStrength: 0.0
  };

  // 主題預設組態庫
  const PRESETS = {
    crystalPalace: {
      name: '鑽石星宮',
      geoMode: 'crystal',
      faceMode: 0,
      extrusion: 0.85,
      zoom: 1.0,
      tilt: 0.4,
      segments: 8,
      repeat: 1.1,
      twist: 0.0,
      fold: 1,
      speed: 0.35,
      pulse: 0.08,
      filterMode: 0,
      hue: 0,
      saturation: 1.2,
      glow: 1.1,
      aberration: 0.08,
      wireframe: true
    },
    cyberTunnel: {
      name: '賽博深淵',
      geoMode: 'tunnel',
      faceMode: 0,
      extrusion: 1.0,
      zoom: 1.1,
      tilt: 0.35,
      segments: 10,
      repeat: 1.25,
      twist: 0.25,
      fold: 1,
      speed: 0.55,
      pulse: 0.15,
      filterMode: 1,
      hue: 195,
      saturation: 1.35,
      glow: 1.2,
      aberration: 0.18,
      wireframe: false
    },
    reliefSculpture: {
      name: '3D立體浮雕',
      geoMode: 'relief',
      faceMode: 1,
      extrusion: 1.6,
      zoom: 1.05,
      tilt: 0.5,
      segments: 6,
      repeat: 1.0,
      twist: 0.0,
      fold: 1,
      speed: 0.25,
      pulse: 0.05,
      filterMode: 0,
      hue: 0,
      saturation: 1.15,
      glow: 1.1,
      aberration: 0.05,
      wireframe: true
    },
    sacredMandala: {
      name: '黃金曼陀羅',
      geoMode: 'dome',
      faceMode: 0,
      extrusion: 0.75,
      zoom: 1.0,
      tilt: 0.3,
      segments: 12,
      repeat: 1.15,
      twist: 0.1,
      fold: 2,
      speed: 0.3,
      pulse: 0.12,
      filterMode: 3,
      hue: 15,
      saturation: 1.3,
      glow: 1.22,
      aberration: 0.1,
      wireframe: false
    },
    quantumVortex: {
      name: '量子星系渦流',
      geoMode: 'torus',
      faceMode: 0,
      extrusion: 0.9,
      zoom: 1.05,
      tilt: 0.55,
      segments: 10,
      repeat: 1.2,
      twist: -0.45,
      fold: 1,
      speed: 0.5,
      pulse: 0.2,
      filterMode: 2,
      hue: 280,
      saturation: 1.4,
      glow: 1.18,
      aberration: 0.15,
      wireframe: false
    },
    prismMatrix: {
      name: '稜鏡魔方陣',
      geoMode: 'prismCluster',
      faceMode: 2,
      extrusion: 0.8,
      zoom: 1.0,
      tilt: 0.6,
      segments: 8,
      repeat: 1.1,
      twist: 0.0,
      fold: 1,
      speed: 0.4,
      pulse: 0.1,
      filterMode: 0,
      hue: 0,
      saturation: 1.25,
      glow: 1.15,
      aberration: 0.1,
      wireframe: true
    },
    thermalDream: {
      name: '熱感烈焰',
      geoMode: 'dome',
      faceMode: 1,
      extrusion: 1.1,
      zoom: 1.0,
      tilt: 0.4,
      segments: 8,
      repeat: 1.1,
      twist: -0.15,
      fold: 1,
      speed: 0.4,
      pulse: 0.15,
      filterMode: 4,
      hue: 0,
      saturation: 1.35,
      glow: 1.2,
      aberration: 0.1,
      wireframe: false
    },
    hyperGlass: {
      name: '極地冰晶',
      geoMode: 'crystal',
      faceMode: 2,
      extrusion: 1.0,
      zoom: 0.95,
      tilt: 0.45,
      segments: 12,
      repeat: 1.3,
      twist: 0.1,
      fold: 1,
      speed: 0.3,
      pulse: 0.08,
      filterMode: 1,
      hue: 160,
      saturation: 1.15,
      glow: 1.2,
      aberration: 0.15,
      wireframe: true
    }
  };

  // ============================================================================
  // DOM 元素參照
  // ============================================================================
  const container = document.getElementById('canvas-container');
  const videoEl = document.getElementById('webcam-video');
  const sourceCanvas = document.getElementById('source-canvas');
  const sourceCtx = sourceCanvas.getContext('2d', { willReadFrequently: true });
  const pipCanvas = document.getElementById('pip-canvas');
  const pipCtx = pipCanvas.getContext('2d');
  const motionCanvas = document.getElementById('motion-canvas');
  const motionCtx = motionCanvas.getContext('2d', { willReadFrequently: true });

  let prevMotionData = null;
  let customLoadedImage = null;

  // ============================================================================
  // 通知訊息 (Toast)
  // ============================================================================
  let toastTimer = null;
  function showToast(message) {
    const toast = document.getElementById('toast-msg');
    const text = document.getElementById('toast-text');
    if (!toast || !text) return;
    text.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 2600);
  }

  // ============================================================================
  // GLSL 3D 萬花筒頂點與片段著色器 (專為視訊人像清晰對稱映射與 3D 稜鏡折射最佳化)
  // ============================================================================
  const vertexShader = `
    uniform sampler2D uTexture;
    uniform float uTime;
    uniform float uExtrusion;
    uniform float uSegments;
    uniform float uRepeat;
    uniform float uTwist;
    uniform float uFold;
    uniform float uAngle;
    uniform float uPulse;
    uniform int uFaceMode;
    uniform vec2 uRippleCenter;
    uniform float uRippleStrength;

    varying vec2 vUv;
    varying vec2 vKaleidoP;
    varying vec3 vNormal;
    varying vec3 vWorldPos;
    varying float vDisplacement;

    const float PI = 3.14159265359;

    // 頂點高度取樣專用之對稱人像 UV 計算
    vec2 computeFaceKaleidoUV(vec2 p) {
      float r = length(p);
      float a = atan(p.y, p.x) + uAngle;

      a += uTwist * r + sin(r * 6.0 - uTime * 2.2) * uPulse * 0.25;
      r += sin(r * 8.0 - uTime * 2.8) * uPulse * 0.04;

      float pairAngle = 2.0 * PI / max(1.0, uSegments * 0.5);
      float aInPair = mod(a + pairAngle * 20.0, pairAngle);
      float mirroredA = abs(aInPair - pairAngle * 0.5) - pairAngle * 0.25;

      float faceX = mirroredA * (1.6 / pairAngle) * uRepeat;
      float faceY = (r - 0.42) * 1.25 * uRepeat;
      vec2 mUv = mod(vec2(0.5 + faceX, 0.5 - faceY) + 2.0, 2.0);
      return 1.0 - abs(mUv - 1.0);
    }

    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);

      // 以 3D 物件中心座標結合表面法線折射，確保正中心永遠為 (0,0) 且全畫面完整呈現萬花筒
      vec2 objP = (position.xy / 5.4) + normal.xy * 0.14;
      vKaleidoP = objP;

      vec2 kUv = computeFaceKaleidoUV(objP);
      vec4 texColor = texture2D(uTexture, kUv);
      float luma = dot(texColor.rgb, vec3(0.299, 0.587, 0.114));

      // 點擊波紋重力場
      vec2 screenUv = clamp(objP * 0.5 + 0.5, 0.0, 1.0);
      float distToRipple = distance(screenUv, uRippleCenter);
      float rippleWave = sin(distToRipple * 26.0 - uTime * 10.0) * exp(-distToRipple * 4.2) * uRippleStrength;

      // 計算 3D 頂點沿法線或 Z 軸方向之立體浮雕位移
      float disp = (luma - 0.4) * uExtrusion * 0.55 + rippleWave * 0.65;
      vDisplacement = disp;

      vec3 newPosition = position + normal * disp;
      vec4 worldPosition = modelMatrix * vec4(newPosition, 1.0);
      vWorldPos = worldPosition.xyz;

      gl_Position = projectionMatrix * viewMatrix * worldPosition;
    }
  `;

  const fragmentShader = `
    uniform sampler2D uTexture;
    uniform float uTime;
    uniform float uSegments;
    uniform float uRepeat;
    uniform float uTwist;
    uniform float uFold;
    uniform float uAngle;
    uniform float uPulse;
    uniform int uFaceMode;
    uniform int uFilterMode;
    uniform float uHue;
    uniform float uSaturation;
    uniform float uGlow;
    uniform float uAberration;
    uniform bool uInvert;
    uniform vec2 uRippleCenter;
    uniform float uRippleStrength;

    varying vec2 vUv;
    varying vec2 vKaleidoP;
    varying vec3 vNormal;
    varying vec3 vWorldPos;
    varying float vDisplacement;

    const float PI = 3.14159265359;

    // 色相旋轉輔助函式
    vec3 hueShift(vec3 color, float hueRad) {
      const vec3 k = vec3(0.57735, 0.57735, 0.57735);
      float cosAngle = cos(hueRad);
      return vec3(color * cosAngle + cross(k, color) * sin(hueRad) + k * dot(k, color) * (1.0 - cosAngle));
    }

    // 鏡像無縫平鋪 (Mirrored repeat in [0,1])
    vec2 mirrorTile(vec2 uv) {
      vec2 m = mod(uv + 4.0, 2.0);
      return 1.0 - abs(m - 1.0);
    }

    // 萬花筒核心座標轉換：確保視訊鏡頭中央的人臉 (0.5, 0.5) 清晰映射於每片花瓣或正中央
    vec2 kaleidoTransform(vec2 pIn, float chOffset) {
      vec2 p = pIn * (1.0 + chOffset);

      // 加上點擊波紋擾動
      vec2 normScreen = clamp(p * 0.5 + 0.5, 0.0, 1.0);
      float dRipple = distance(normScreen, uRippleCenter);
      p += normalize(p + 0.0001) * sin(dRipple * 28.0 - uTime * 11.0) * exp(-dRipple * 4.5) * uRippleStrength * 0.1;

      // 模式 2：3D 複眼人像陣 (Compound Eye Portraits)
      if (uFaceMode == 2) {
        float rotC = cos(uAngle * 0.25);
        float rotS = sin(uAngle * 0.25);
        vec2 rp = mat2(rotC, -rotS, rotS, rotC) * p;
        float gridCount = max(2.0, floor(uSegments * 0.35)) * uRepeat;
        vec2 cell = fract(rp * gridCount * 0.5 + 0.5) - 0.5;
        // 每個複眼晶格內部再做輕微對稱與人臉居中
        float cellR = length(cell);
        float cellA = atan(cell.y, cell.x) + uTwist * cellR;
        if (uFold > 1.0) {
          float sA = 2.0 * PI / max(2.0, uSegments * 0.5);
          cellA = abs(mod(cellA, sA) - sA * 0.5);
          cell = vec2(cos(cellA), sin(cellA)) * cellR;
        }
        vec2 faceUv = vec2(0.5 + cell.x * 1.15, 0.5 - cell.y * 1.15);
        return mirrorTile(faceUv);
      }

      float r = length(p);
      float a = atan(p.y, p.x) + uAngle;

      // 螺旋扭曲與波紋律動
      a += uTwist * r + sin(r * 7.0 - uTime * 2.2) * uPulse * 0.3;
      r += sin(r * 10.0 - uTime * 3.0) * uPulse * 0.04;

      // 模式 1：中央魔鏡臉 (Center Mirror Face - 臉部五官直接位於畫面中心做多軸對稱)
      if (uFaceMode == 1) {
        float segAngle = 2.0 * PI / max(2.0, uSegments);
        float aMod = mod(a + segAngle * 20.0, segAngle);
        float symA = abs(aMod - segAngle * 0.5);

        for (int i = 1; i < 5; i++) {
          if (float(i) >= uFold) break;
          symA = abs(symA - segAngle * (0.25 / float(i)));
        }

        // 將扇形角度轉為正立對稱座標，讓 (0.5, 0.5) 臉部正中心對應 r=0 附近
        float mappedAngle = (symA / (segAngle * 0.5)) * (PI * 0.5);
        vec2 dir = vec2(sin(mappedAngle), -cos(mappedAngle));
        vec2 centerUv = vec2(0.5, 0.48) + dir * (r * 0.58 * uRepeat);
        return mirrorTile(centerUv);
      }

      // 模式 0 (預設)：花瓣人像環 (Petal Face Ring - 每片萬花筒花瓣的中心都完整呈現一張清晰的臉！)
      float pairAngle = 2.0 * PI / max(1.0, uSegments * 0.5);
      float aInPair = mod(a + pairAngle * 20.0, pairAngle);
      // 對稱折疊使相鄰花瓣邊界完全無縫鏡像接合
      float mirroredA = abs(aInPair - pairAngle * 0.5) - pairAngle * 0.25;

      // 多重內圈折疊 (當使用者調高 Recursive Fold 時產生更繁複的萬花筒幾何)
      float foldedR = r;
      for (int i = 1; i < 5; i++) {
        if (float(i) >= uFold) break;
        mirroredA = abs(mirroredA) - (pairAngle * 0.12 / float(i));
        foldedR = abs(foldedR - 0.32 / float(i)) + 0.25;
      }

      // 將每片花瓣的中心點 (r = 0.44, mirroredA = 0.0) 直接對準視訊鏡頭的人臉中心 (0.5, 0.5)
      float faceWidth = mirroredA * (1.75 / pairAngle) * uRepeat;
      float faceHeight = (foldedR - 0.44) * 1.35 * uRepeat;

      vec2 finalUv = vec2(0.5 + faceWidth, 0.5 - faceHeight);
      return mirrorTile(finalUv);
    }

    // 熱成像色盤映射
    vec3 thermalPalette(float t) {
      vec3 c1 = vec3(0.05, 0.0, 0.25);
      vec3 c2 = vec3(0.6, 0.0, 0.55);
      vec3 c3 = vec3(1.0, 0.25, 0.0);
      vec3 c4 = vec3(1.0, 0.95, 0.3);
      if (t < 0.33) return mix(c1, c2, t * 3.0);
      if (t < 0.66) return mix(c2, c3, (t - 0.33) * 3.0);
      return mix(c3, c4, (t - 0.66) * 3.0);
    }

    void main() {
      // 稜鏡色散 (Chromatic Aberration)
      float aber = uAberration * 0.03;
      vec2 uvR = kaleidoTransform(vKaleidoP, aber);
      vec2 uvG = kaleidoTransform(vKaleidoP, 0.0);
      vec2 uvB = kaleidoTransform(vKaleidoP, -aber);

      float r = texture2D(uTexture, uvR).r;
      float g = texture2D(uTexture, uvG).g;
      float b = texture2D(uTexture, uvB).b;
      vec3 col = vec3(r, g, b);

      // 光學濾鏡模式處理
      if (uFilterMode == 1) {
        // 1: 霓虹賽博 (Neon Cyberpunk)
        float lum = dot(col, vec3(0.299, 0.587, 0.114));
        vec3 neonA = vec3(0.0, 0.95, 1.0);
        vec3 neonB = vec3(1.0, 0.05, 0.55);
        col = mix(col, mix(neonB, neonA, sin(lum * PI * 2.0 + uTime) * 0.5 + 0.5), 0.45);
        col = pow(col, vec3(0.88)) * 1.18;
      } else if (uFilterMode == 2) {
        // 2: 迷幻光譜 (Psychedelic Rainbow)
        float lum = dot(col, vec3(0.333));
        vec3 rainbow = 0.5 + 0.5 * cos(uTime * 1.5 + lum * 6.2831 + vec3(0.0, 2.094, 4.188));
        col = mix(col, rainbow, 0.55);
      } else if (uFilterMode == 3) {
        // 3: 琉璃黑金 (Golden Stained Glass)
        float lum = dot(col, vec3(0.299, 0.587, 0.114));
        vec3 gold = vec3(1.0, 0.8, 0.25) * pow(lum, 1.1) * 1.45;
        vec3 deep = vec3(0.05, 0.07, 0.16);
        col = mix(deep, gold, smoothstep(0.08, 0.9, lum));
      } else if (uFilterMode == 4) {
        // 4: 熱成像儀 (Thermal Vision)
        float lum = dot(col, vec3(0.299, 0.587, 0.114));
        col = thermalPalette(clamp(lum * 1.15, 0.0, 1.0));
      } else if (uFilterMode == 5) {
        // 5: 螢光邊緣 (Neon Edge Detection)
        float stepSize = 0.012;
        vec3 cLeft = texture2D(uTexture, kaleidoTransform(vKaleidoP - vec2(stepSize, 0.0), 0.0)).rgb;
        vec3 cUp   = texture2D(uTexture, kaleidoTransform(vKaleidoP - vec2(0.0, stepSize), 0.0)).rgb;
        float edge = length(col - cLeft) + length(col - cUp);
        vec3 edgeGlow = vec3(0.1, 1.0, 0.75) * edge * 3.8;
        col = col * 0.55 + edgeGlow;
      }

      // 3D 立體高光與邊緣菲涅爾光暈 (Fresnel Rim Light)
      vec3 viewDir = normalize(cameraPosition - vWorldPos);
      float fresnel = pow(1.0 - abs(dot(normalize(vNormal), viewDir)), 2.8);
      col += vec3(0.0, 0.85, 1.0) * fresnel * 0.22;
      col += vec3(0.85, 0.2, 1.0) * max(0.0, vDisplacement) * 0.15;

      // 色相偏移
      if (uHue > 0.0) {
        col = hueShift(col, uHue * PI / 180.0);
      }

      // 飽和度調整
      float gray = dot(col, vec3(0.299, 0.587, 0.114));
      col = mix(vec3(gray), col, uSaturation);

      // 輝光與對比強化
      col = pow(max(col, vec3(0.0)), vec3(1.0 / max(0.5, uGlow))) * uGlow;

      // 負片反轉
      if (uInvert) {
        col = 1.0 - clamp(col, 0.0, 1.0);
      }

      // 柔和暗角與中心聚焦
      float distCenter = length(vKaleidoP);
      float vignette = smoothstep(1.85, 0.4, distCenter);
      col *= mix(0.72, 1.05, vignette);

      gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
    }
  `;

  // ============================================================================
  // 初始化 Three.js 3D 場景、相機、著色器材質與粒子系統
  // ============================================================================
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x050510, 0.018);

  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
  camera.position.set(0, 0, 10.5);

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    preserveDrawingBuffer: true, // 支援高品質截圖與錄影
    powerPreference: 'high-performance'
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  // 建立動態來源材質紋理
  const dynamicTexture = new THREE.CanvasTexture(sourceCanvas);
  dynamicTexture.minFilter = THREE.LinearFilter;
  dynamicTexture.magFilter = THREE.LinearFilter;
  dynamicTexture.wrapS = THREE.MirroredRepeatWrapping;
  dynamicTexture.wrapT = THREE.MirroredRepeatWrapping;

  // 萬花筒核心 ShaderMaterial
  const uniforms = {
    uTexture: { value: dynamicTexture },
    uTime: { value: 0 },
    uExtrusion: { value: state.extrusion },
    uSegments: { value: state.segments },
    uRepeat: { value: state.repeat },
    uTwist: { value: state.twist },
    uFold: { value: state.fold },
    uAngle: { value: 0 },
    uPulse: { value: state.pulse },
    uFaceMode: { value: state.faceMode },
    uFilterMode: { value: state.filterMode },
    uHue: { value: state.hue },
    uSaturation: { value: state.saturation },
    uGlow: { value: state.glow },
    uAberration: { value: state.aberration },
    uInvert: { value: state.invert },
    uRippleCenter: { value: state.rippleCenter },
    uRippleStrength: { value: 0.0 }
  };

  const kaleidoMaterial = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms,
    side: THREE.DoubleSide
  });

  // 霓虹線框疊加材質
  const wireframeMaterial = new THREE.MeshBasicMaterial({
    color: 0x00f2fe,
    wireframe: true,
    transparent: true,
    opacity: 0.22,
    blending: THREE.AdditiveBlending
  });

  // 主 3D 幾何群組
  const mainGroup = new THREE.Group();
  scene.add(mainGroup);

  // 背景全幅立體萬花筒幕布 (置於 z = -7.5，確保無論任何 3D 幾何模式，背景都能清楚呈現完整對稱萬花筒)
  const bgDomeGeo = new THREE.PlaneGeometry(26, 26, 64, 64);
  const bgDomeMesh = new THREE.Mesh(bgDomeGeo, kaleidoMaterial);
  bgDomeMesh.position.z = -7.5;
  scene.add(bgDomeMesh);

  // 3D 懸浮星塵粒子系統
  const particleCount = 900;
  const particleGeo = new THREE.BufferGeometry();
  const particlePositions = new Float32Array(particleCount * 3);
  const particleColors = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount; i++) {
    const i3 = i * 3;
    const radius = 3.5 + Math.random() * 22;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    particlePositions[i3] = radius * Math.sin(phi) * Math.cos(theta);
    particlePositions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    particlePositions[i3 + 2] = radius * Math.cos(phi);

    const c = new THREE.Color().setHSL(Math.random(), 0.9, 0.65);
    particleColors[i3] = c.r;
    particleColors[i3 + 1] = c.g;
    particleColors[i3 + 2] = c.b;
  }

  particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
  particleGeo.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

  const particleMat = new THREE.PointsMaterial({
    size: 0.14,
    vertexColors: true,
    transparent: true,
    opacity: 0.78,
    blending: THREE.AdditiveBlending
  });

  const particleSystem = new THREE.Points(particleGeo, particleMat);
  scene.add(particleSystem);

  // ============================================================================
  // 建立與切換 6 種 3D 幾何載體模式
  // ============================================================================
  let activeMeshes = [];
  let wireMeshes = [];

  function clearMainGroup() {
    while (mainGroup.children.length > 0) {
      const child = mainGroup.children[0];
      if (child.geometry) child.geometry.dispose();
      mainGroup.remove(child);
    }
    activeMeshes = [];
    wireMeshes = [];
  }

  function buildGeometryMode(mode) {
    clearMainGroup();
    state.geoMode = mode;

    if (mode === 'dome') {
      // 全境穹頂：面對鏡頭的立體弧面萬花筒水晶盤 + 立體外環
      const dishGeo = new THREE.PlaneGeometry(11.2, 11.2, 96, 96);
      const posAttr = dishGeo.attributes.position;
      for (let i = 0; i < posAttr.count; i++) {
        const vx = posAttr.getX(i);
        const vy = posAttr.getY(i);
        const r2 = (vx * vx + vy * vy) / 36.0;
        // 凹面穹頂弧度，讓中心深邃、邊緣立體包覆
        posAttr.setZ(i, -1.4 * (1.0 - Math.min(1.2, r2)));
      }
      dishGeo.computeVertexNormals();

      const dishMesh = new THREE.Mesh(dishGeo, kaleidoMaterial);
      mainGroup.add(dishMesh);
      activeMeshes.push(dishMesh);

      const ringGeo = new THREE.TorusGeometry(4.4, 0.55, 40, 120);
      ringGeo.translate(0, 0, 0.5);
      const ringMesh = new THREE.Mesh(ringGeo, kaleidoMaterial);
      mainGroup.add(ringMesh);
      activeMeshes.push(ringMesh);

      if (state.wireframe) {
        const wMesh = new THREE.Mesh(ringGeo.clone(), wireframeMaterial);
        mainGroup.add(wMesh);
        wireMeshes.push(wMesh);
      }
    } else if (mode === 'tunnel') {
      // 無限鏡像隧道 (圓柱深淵 + 多層推進環)
      const cylGeo = new THREE.CylinderGeometry(4.6, 4.6, 36, 96, 96, true);
      cylGeo.rotateX(Math.PI / 2);
      const cylMesh = new THREE.Mesh(cylGeo, kaleidoMaterial);
      mainGroup.add(cylMesh);
      activeMeshes.push(cylMesh);

      for (let i = -2; i <= 2; i++) {
        const torusGeo = new THREE.TorusGeometry(3.2, 0.35, 32, 80);
        const tMesh = new THREE.Mesh(torusGeo, kaleidoMaterial);
        tMesh.position.z = i * 4.2;
        mainGroup.add(tMesh);
        activeMeshes.push(tMesh);
      }

      if (state.wireframe) {
        const wMesh = new THREE.Mesh(cylGeo.clone(), wireframeMaterial);
        mainGroup.add(wMesh);
        wireMeshes.push(wMesh);
      }
    } else if (mode === 'crystal') {
      // 多面鑽石水晶核心 + 環繞衛星稜鏡
      const coreGeo = new THREE.IcosahedronGeometry(3.4, 5);
      const coreMesh = new THREE.Mesh(coreGeo, kaleidoMaterial);
      mainGroup.add(coreMesh);
      activeMeshes.push(coreMesh);

      if (state.wireframe) {
        const wCore = new THREE.Mesh(new THREE.IcosahedronGeometry(3.48, 2), wireframeMaterial);
        mainGroup.add(wCore);
        wireMeshes.push(wCore);
      }

      const satCount = 8;
      for (let i = 0; i < satCount; i++) {
        const angle = (i / satCount) * Math.PI * 2;
        const satGeo = new THREE.OctahedronGeometry(1.05, 3);
        const satMesh = new THREE.Mesh(satGeo, kaleidoMaterial);
        satMesh.position.set(Math.cos(angle) * 5.8, Math.sin(angle) * 5.8, Math.sin(angle * 2) * 1.2);
        satMesh.userData = { orbitAngle: angle, orbitRadius: 5.8, speed: 0.6 + (i % 3) * 0.2 };
        mainGroup.add(satMesh);
        activeMeshes.push(satMesh);
      }
    } else if (mode === 'relief') {
      // 3D 視訊立體浮雕畫布 (高密度網格直接將視訊亮度轉為 3D 山脈與波浪)
      const planeGeo = new THREE.PlaneGeometry(11.5, 11.5, 160, 160);
      const planeMesh = new THREE.Mesh(planeGeo, kaleidoMaterial);
      mainGroup.add(planeMesh);
      activeMeshes.push(planeMesh);

      if (state.wireframe) {
        const wPlane = new THREE.Mesh(new THREE.PlaneGeometry(11.5, 11.5, 48, 48), wireframeMaterial);
        wPlane.position.z = 0.05;
        mainGroup.add(wPlane);
        wireMeshes.push(wPlane);
      }
    } else if (mode === 'torus') {
      // 莫比烏斯環形結 (Torus Knot)
      const knotGeo = new THREE.TorusKnotGeometry(3.0, 1.05, 220, 48, 2, 3);
      const knotMesh = new THREE.Mesh(knotGeo, kaleidoMaterial);
      mainGroup.add(knotMesh);
      activeMeshes.push(knotMesh);

      if (state.wireframe) {
        const wKnot = new THREE.Mesh(new THREE.TorusKnotGeometry(3.05, 1.08, 110, 20, 2, 3), wireframeMaterial);
        mainGroup.add(wKnot);
        wireMeshes.push(wKnot);
      }
    } else if (mode === 'prismCluster') {
      // 魔方星群 (多層懸浮旋轉幾何矩陣)
      const shapes = [
        () => new THREE.BoxGeometry(1.5, 1.5, 1.5, 16, 16, 16),
        () => new THREE.OctahedronGeometry(1.2, 3),
        () => new THREE.ConeGeometry(1.1, 2.0, 6, 16)
      ];

      for (let x = -1; x <= 1; x++) {
        for (let y = -1; y <= 1; y++) {
          for (let z = -1; z <= 1; z++) {
            if (x === 0 && y === 0 && z === 0) {
              const centerGeo = new THREE.DodecahedronGeometry(1.9, 4);
              const cMesh = new THREE.Mesh(centerGeo, kaleidoMaterial);
              mainGroup.add(cMesh);
              activeMeshes.push(cMesh);
              continue;
            }
            const idx = Math.abs(x + y * 2 + z * 3) % shapes.length;
            const geo = shapes[idx]();
            const mesh = new THREE.Mesh(geo, kaleidoMaterial);
            mesh.position.set(x * 3.1, y * 3.1, z * 2.6);
            mesh.userData = {
              rotSpeedX: (x + 0.5) * 0.5,
              rotSpeedY: (y - 0.5) * 0.5
            };
            mainGroup.add(mesh);
            activeMeshes.push(mesh);

            if (state.wireframe && (x + y + z) % 2 === 0) {
              const w = new THREE.Mesh(geo.clone(), wireframeMaterial);
              w.position.copy(mesh.position);
              mainGroup.add(w);
              wireMeshes.push(w);
            }
          }
        }
      }
    }
  }

  // ============================================================================
  // 視訊鏡頭串流與動態模擬視覺源
  // ============================================================================
  async function startWebcam() {
    const camPill = document.getElementById('cam-status-pill');
    const srcLabel = document.getElementById('source-label');
    const btnStartCam = document.getElementById('btn-start-cam');

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      state.webcamActive = false;
      state.sourceMode = 'cyber';
      updateSourceButtonsUI();
      showToast('瀏覽器不支援視訊鏡頭，已切換至賽博星雲模擬源');
      return;
    }

    try {
      // 若已有舊串流先停止軌道以利切換前後鏡頭
      if (videoEl.srcObject) {
        videoEl.srcObject.getTracks().forEach((t) => t.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: state.facingMode
        },
        audio: false
      });

      videoEl.srcObject = stream;
      await videoEl.play();

      state.webcamActive = true;
      state.sourceMode = 'webcam';
      updateSourceButtonsUI();

      if (camPill) {
        camPill.className = 'status-pill status-ok';
        camPill.innerHTML = '<i class="fa-solid fa-video"></i> <span class="pill-text">鏡頭即時連線</span>';
      }
      if (srcLabel) {
        srcLabel.innerHTML = '<i class="fa-solid fa-camera"></i> 視訊鏡頭即時串流';
      }
      if (btnStartCam) {
        btnStartCam.innerHTML = '<i class="fa-solid fa-camera-rotate"></i> <span>重連鏡頭</span>';
      }
      showToast('視訊鏡頭已成功開啟！揮動雙手或移動身體體驗 3D 互動');
    } catch (err) {
      state.webcamActive = false;
      if (state.sourceMode === 'webcam') {
        state.sourceMode = 'cyber';
      }
      updateSourceButtonsUI();
      if (camPill) {
        camPill.className = 'status-pill status-warn';
        camPill.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> <span class="pill-text">動態模擬源</span>';
      }
      showToast('未偵測到鏡頭或權限未開啟，已啟用高彩度動態模擬視覺源');
    }
  }

  // 繪製內建程序化高彩度訊號源（當無鏡頭或使用者選擇星雲/矩陣/流體時）
  function drawProceduralSource(ctx, w, h, t, mode) {
    ctx.save();
    if (mode === 'neonGrid') {
      ctx.fillStyle = '#070418';
      ctx.fillRect(0, 0, w, h);
      const cols = 8;
      const cellW = w / cols;
      for (let i = 0; i <= cols; i++) {
        for (let j = 0; j <= cols; j++) {
          const hue = (i * 35 + j * 35 + t * 80) % 360;
          ctx.strokeStyle = `hsl(${hue}, 95%, 60%)`;
          ctx.lineWidth = 4;
          const x = i * cellW + Math.sin(t * 2 + j) * 14;
          const y = j * cellW + Math.cos(t * 2 + i) * 14;
          ctx.strokeRect(x - cellW * 0.35, y - cellW * 0.35, cellW * 0.7, cellW * 0.7);

          ctx.fillStyle = `hsla(${(hue + 120) % 360}, 100%, 65%, 0.75)`;
          ctx.beginPath();
          ctx.arc(x, y, 10 + Math.sin(t * 4 + i + j) * 6, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else if (mode === 'aurora') {
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, `hsl(${(t * 40) % 360}, 90%, 25%)`);
      grad.addColorStop(0.5, `hsl(${(t * 40 + 110) % 360}, 95%, 45%)`);
      grad.addColorStop(1, `hsl(${(t * 40 + 220) % 360}, 90%, 30%)`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      for (let k = 0; k < 7; k++) {
        ctx.beginPath();
        ctx.strokeStyle = `hsla(${(k * 55 + t * 90) % 360}, 100%, 70%, 0.7)`;
        ctx.lineWidth = 18;
        for (let x = 0; x <= w; x += 24) {
          const y = h * 0.5 + Math.sin(x * 0.018 + t * (1.5 + k * 0.3) + k) * (h * 0.36);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    } else {
      // 'cyber' 星雲流體粒子
      ctx.fillStyle = 'rgba(8, 6, 24, 0.24)';
      ctx.fillRect(0, 0, w, h);
      const cx = w * 0.5;
      const cy = h * 0.5;
      for (let i = 0; i < 16; i++) {
        const angle = (i / 16) * Math.PI * 2 + t * (0.6 + (i % 4) * 0.25);
        const rad = 40 + ((i * 23 + t * 65) % (w * 0.44));
        const px = cx + Math.cos(angle) * rad;
        const py = cy + Math.sin(angle * 1.3) * rad;
        const size = 22 + Math.sin(t * 3 + i) * 14;
        const hue = (i * 28 + t * 75) % 360;

        const g = ctx.createRadialGradient(px, py, 2, px, py, size * 1.8);
        g.addColorStop(0, '#ffffff');
        g.addColorStop(0.35, `hsla(${hue}, 100%, 62%, 0.95)`);
        g.addColorStop(1, `hsla(${hue}, 100%, 50%, 0)`);

        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(px, py, size * 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  // 計算視訊體感動作能量 (Optical Flow Difference)
  function computeWebcamMotion() {
    if (!state.webcamActive || videoEl.readyState < 2) {
      state.motionEnergy *= 0.9;
      return;
    }

    const mw = motionCanvas.width;
    const mh = motionCanvas.height;
    motionCtx.drawImage(videoEl, 0, 0, mw, mh);
    const frameData = motionCtx.getImageData(0, 0, mw, mh).data;

    if (prevMotionData) {
      let diffSum = 0;
      const len = frameData.length;
      for (let i = 0; i < len; i += 16) {
        const dr = Math.abs(frameData[i] - prevMotionData[i]);
        const dg = Math.abs(frameData[i + 1] - prevMotionData[i + 1]);
        const db = Math.abs(frameData[i + 2] - prevMotionData[i + 2]);
        if (dr + dg + db > 75) {
          diffSum += (dr + dg + db);
        }
      }
      const norm = Math.min(1.0, (diffSum / (mw * mh * 18)) * state.sensitivity);
      state.motionEnergy = state.motionEnergy * 0.78 + norm * 0.22;
    }
    prevMotionData = new Uint8ClampedArray(frameData);

    // 更新 UI 體感能量條
    const pct = Math.round(state.motionEnergy * 100);
    const bar = document.getElementById('motion-bar-fill');
    const txt = document.getElementById('motion-meter-text');
    if (bar) bar.style.width = `${pct}%`;
    if (txt) txt.textContent = `${pct}%`;
  }

  // ============================================================================
  // 麥克風音訊律動分析器 (Web Audio API)
  // ============================================================================
  let audioCtx = null;
  let analyser = null;
  let audioDataArray = null;

  async function toggleAudioReactive() {
    const btn = document.getElementById('btn-toggle-audio');
    const pillTxt = document.getElementById('audio-meter-text');

    if (state.audioReact) {
      state.audioReact = false;
      state.audioEnergy = 0;
      if (btn) {
        btn.classList.remove('active');
        btn.innerHTML = '<i class="fa-solid fa-microphone"></i> 啟用音訊';
      }
      if (pillTxt) pillTxt.textContent = '關閉';
      showToast('已關閉麥克風音訊律動');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioCtx.createMediaStreamSource(stream);
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 128;
      source.connect(analyser);
      audioDataArray = new Uint8Array(analyser.frequencyBinCount);

      state.audioReact = true;
      if (btn) {
        btn.classList.add('active');
        btn.innerHTML = '<i class="fa-solid fa-microphone-slash"></i> 停止音訊';
      }
      showToast('麥克風音訊律動已啟動！對著麥克風發聲或播放音樂試試看');
    } catch (err) {
      showToast('無法取得麥克風權限，請確認瀏覽器設定');
    }
  }

  function updateAudioEnergy() {
    if (!state.audioReact || !analyser || !audioDataArray) {
      state.audioEnergy *= 0.85;
      return;
    }

    analyser.getByteFrequencyData(audioDataArray);
    let sum = 0;
    let bassSum = 0;
    const len = audioDataArray.length;

    for (let i = 0; i < len; i++) {
      sum += audioDataArray[i];
      if (i < 10) bassSum += audioDataArray[i];
    }

    const avg = (sum / (len * 255)) * state.sensitivity;
    state.audioEnergy = Math.min(1.0, state.audioEnergy * 0.7 + avg * 0.3);
    state.audioBass = Math.min(1.0, (bassSum / (10 * 255)) * state.sensitivity);

    const pct = Math.round(state.audioEnergy * 100);
    const bar = document.getElementById('audio-bar-fill');
    const txt = document.getElementById('audio-meter-text');
    if (bar) bar.style.width = `${pct}%`;
    if (txt) txt.textContent = `${pct}%`;
  }

  // ============================================================================
  // 更新來源紋理與子母畫面預覽 (支援完整廣角、等比滿版、自由平移與任意縮放倍率)
  // ============================================================================
  function updateCamFrameBadge() {
    const badge = document.getElementById('cam-frame-badge');
    if (!badge) return;
    const modeMap = { full: '全廣角', cover: '等比滿版', focus: '特寫' };
    const mName = modeMap[state.camAspectMode] || '全廣角';
    const panStr = (state.camPanX !== 0 || state.camPanY !== 0)
      ? ` (${state.camPanX > 0 ? '+' : ''}${Math.round(state.camPanX)}%,${state.camPanY > 0 ? '+' : ''}${Math.round(state.camPanY)}%)`
      : '';
    badge.textContent = `${state.faceZoom.toFixed(1)}x ${mName}${panStr}`;
  }

  function drawMediaWithFlexibleFraming(mediaEl, mediaW, mediaH, sw, sh) {
    sourceCtx.save();
    sourceCtx.fillStyle = '#050611';
    sourceCtx.fillRect(0, 0, sw, sh);

    if (state.flipHorizontal) {
      sourceCtx.translate(sw, 0);
      sourceCtx.scale(-1, 1);
    }

    const zoom = Math.max(0.5, state.faceZoom);
    // 依據取景模式決定基礎取樣寬高：
    // 'full' 保留原始完整寬高不裁切；'cover' 與 'focus' 以正方形等比例取樣
    let baseW = mediaW;
    let baseH = mediaH;
    if (state.camAspectMode === 'cover' || state.camAspectMode === 'focus') {
      const minSide = Math.min(mediaW, mediaH);
      baseW = minSide;
      baseH = minSide;
    }

    const cropW = Math.min(mediaW, baseW / zoom);
    const cropH = Math.min(mediaH, baseH / zoom);

    // 可移動的最大範圍，讓使用者能自由平移到畫面任何角落
    const maxShiftX = Math.max(mediaW * 0.35, (mediaW - cropW) * 0.5);
    const maxShiftY = Math.max(mediaH * 0.35, (mediaH - cropH) * 0.5);
    const panFactorX = (state.flipHorizontal ? -state.camPanX : state.camPanX) / 100;
    const panFactorY = state.camPanY / 100;

    const sx = (mediaW - cropW) * 0.5 + panFactorX * maxShiftX;
    const sy = (mediaH - cropH) * 0.5 + panFactorY * maxShiftY;

    // 若縮放小於 1.0，提供縮小居中並以柔和鏡像邊緣填滿
    if (zoom < 1.0) {
      const destScale = zoom;
      const dw = sw * destScale;
      const dh = sh * destScale;
      const dx = (sw - dw) * 0.5 - panFactorX * (sw - dw) * 0.6;
      const dy = (sh - dh) * 0.5 - panFactorY * (sh - dh) * 0.6;
      sourceCtx.drawImage(mediaEl, 0, 0, mediaW, mediaH, 0, 0, sw, sh);
      sourceCtx.fillStyle = 'rgba(5, 6, 18, 0.45)';
      sourceCtx.fillRect(0, 0, sw, sh);
      sourceCtx.drawImage(mediaEl, 0, 0, mediaW, mediaH, dx, dy, dw, dh);
    } else {
      const clampedSx = Math.max(0, Math.min(mediaW - cropW, sx));
      const clampedSy = Math.max(0, Math.min(mediaH - cropH, sy));
      sourceCtx.drawImage(mediaEl, clampedSx, clampedSy, cropW, cropH, 0, 0, sw, sh);
    }

    sourceCtx.restore();
  }

  function updateSourceTexture() {
    if (state.freezeFrame) return;

    const sw = sourceCanvas.width;
    const sh = sourceCanvas.height;

    if (state.sourceMode === 'webcam' && state.webcamActive && videoEl.readyState >= 2) {
      const vw = videoEl.videoWidth || 640;
      const vh = videoEl.videoHeight || 480;
      drawMediaWithFlexibleFraming(videoEl, vw, vh, sw, sh);
      computeWebcamMotion();
    } else if (state.sourceMode === 'customImage' && customLoadedImage) {
      const iw = customLoadedImage.naturalWidth || customLoadedImage.width || 512;
      const ih = customLoadedImage.naturalHeight || customLoadedImage.height || 512;
      drawMediaWithFlexibleFraming(customLoadedImage, iw, ih, sw, sh);
    } else {
      const procMode = state.sourceMode === 'webcam' ? 'cyber' : state.sourceMode;
      drawProceduralSource(sourceCtx, sw, sh, state.time, procMode);
    }

    // 同步繪製左上方訊號預覽視窗 (PiP) 並加上彈性取景準星參考線
    const pw = pipCanvas.width;
    const ph = pipCanvas.height;
    pipCtx.drawImage(sourceCanvas, 0, 0, pw, ph);

    if (state.camPanX !== 0 || state.camPanY !== 0 || state.faceZoom !== 1.0) {
      pipCtx.save();
      pipCtx.strokeStyle = 'rgba(0, 242, 254, 0.45)';
      pipCtx.lineWidth = 1;
      pipCtx.setLineDash([4, 4]);
      pipCtx.beginPath();
      pipCtx.moveTo(pw * 0.5, 0);
      pipCtx.lineTo(pw * 0.5, ph);
      pipCtx.moveTo(0, ph * 0.5);
      pipCtx.lineTo(pw, ph * 0.5);
      pipCtx.stroke();
      pipCtx.restore();
    }

    dynamicTexture.needsUpdate = true;
  }

  // ============================================================================
  // 主動畫渲染迴圈
  // ============================================================================
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);

    const delta = Math.min(clock.getDelta(), 0.1);
    state.time += delta;

    updateSourceTexture();
    updateAudioEnergy();

    // 感應互動加成計算
    const motionBoost = state.motionReact ? state.motionEnergy * 2.2 : 0;
    const audioBoost = state.audioReact ? state.audioEnergy * 2.0 : 0;
    const totalReactiveBoost = motionBoost + audioBoost;

    // 自動演化模式 (Auto-Morph)
    if (state.autoMorph) {
      state.twist = Math.sin(state.time * 0.45) * 1.4;
      state.pulse = 0.25 + (Math.cos(state.time * 0.6) * 0.5 + 0.5) * 0.65;
      syncSlidersFromState();
    }

    // 自動彩虹色相流轉
    if (state.autoHue) {
      state.hue = (state.hue + delta * 45) % 360;
      const hueInput = document.getElementById('ctrl-hue');
      const hueVal = document.getElementById('val-hue');
      if (hueInput) {
        hueInput.value = Math.round(state.hue);
        updateSliderFill(hueInput);
      }
      if (hueVal) hueVal.textContent = `${Math.round(state.hue)}°`;
    }

    // 萬花筒旋轉角度推進
    state.kaleidoAngle += delta * (state.speed + totalReactiveBoost * 1.8) * 0.65;

    // 點擊重力波紋衰減
    if (state.rippleStrength > 0.001) {
      state.rippleStrength *= 0.94;
    } else {
      state.rippleStrength = 0.0;
    }

    // 更新 Shader Uniforms
    uniforms.uTime.value = state.time;
    uniforms.uAngle.value = state.kaleidoAngle;
    uniforms.uExtrusion.value = state.extrusion + totalReactiveBoost * 1.1;
    uniforms.uSegments.value = state.segments;
    uniforms.uRepeat.value = state.repeat;
    uniforms.uTwist.value = state.twist + (state.audioReact ? Math.sin(state.time * 6) * state.audioBass * 0.3 : 0);
    uniforms.uFold.value = state.fold;
    uniforms.uPulse.value = state.pulse + totalReactiveBoost * 0.25;
    uniforms.uFaceMode.value = state.faceMode;
    uniforms.uFilterMode.value = state.filterMode;
    uniforms.uHue.value = state.hue;
    uniforms.uSaturation.value = state.saturation;
    uniforms.uGlow.value = state.glow + (state.audioReact ? state.audioBass * 0.4 : 0);
    uniforms.uAberration.value = state.aberration + totalReactiveBoost * 0.2;
    uniforms.uInvert.value = state.invert;
    uniforms.uRippleStrength.value = state.rippleStrength;

    // 3D 空間視角立體擺動 (避免側轉 90 度導致畫面消失，採用 3D 環形立體傾角巡航)
    const autoWobbleX = state.autoRotate3D ? Math.sin(state.time * 0.65) * state.tilt * 0.55 : 0;
    const autoWobbleY = state.autoRotate3D ? Math.cos(state.time * 0.5) * state.tilt * 0.55 : 0;
    const targetX = state.targetRotX + autoWobbleX;
    const targetY = state.targetRotY + autoWobbleY;

    mainGroup.rotation.x += (targetX - mainGroup.rotation.x) * 0.08;
    mainGroup.rotation.y += (targetY - mainGroup.rotation.y) * 0.08;

    // 個別幾何載體的專屬 3D 動畫
    if (state.geoMode === 'crystal') {
      activeMeshes.forEach((m, idx) => {
        if (idx === 0) {
          m.rotation.z += delta * 0.25;
        } else if (m.userData.orbitRadius) {
          m.userData.orbitAngle += delta * m.userData.speed * (1 + totalReactiveBoost);
          const a = m.userData.orbitAngle;
          const r = m.userData.orbitRadius;
          m.position.set(Math.cos(a) * r, Math.sin(a) * r, Math.sin(a * 2) * 1.5);
          m.rotation.x += delta * 0.9;
          m.rotation.y += delta * 1.1;
        }
      });
    } else if (state.geoMode === 'tunnel') {
      activeMeshes.forEach((m, idx) => {
        if (idx > 0) {
          m.position.z += delta * (3.2 + totalReactiveBoost * 3.5);
          if (m.position.z > 8) m.position.z = -8;
          m.rotation.z += delta * 0.5 * (idx % 2 === 0 ? 1 : -1);
        }
      });
    } else if (state.geoMode === 'prismCluster') {
      activeMeshes.forEach((m) => {
        if (m.userData.rotSpeedX) {
          m.rotation.z += delta * m.userData.rotSpeedX * (1 + totalReactiveBoost);
        }
      });
    }

    // 背景萬花筒幕布緩慢旋轉營造深邃雙層視差
    bgDomeMesh.rotation.z = -state.time * 0.04;

    // 3D 懸浮粒子星塵動畫
    particleSystem.visible = state.particles;
    if (state.particles) {
      particleSystem.rotation.y = state.time * 0.08;
      particleSystem.rotation.z = Math.sin(state.time * 0.12) * 0.15;
      const scalePulse = 1 + totalReactiveBoost * 0.25;
      particleSystem.scale.set(scalePulse, scalePulse, scalePulse);
    }

    // 相機景深縮放平滑過渡
    const targetZ = 9.5 / Math.max(0.3, state.zoom);
    camera.position.z += (targetZ - camera.position.z) * 0.1;

    renderer.render(scene, camera);

    // 若正在錄影且需要合成浮水印至錄影畫布
    if (isRecording && recordCompositeCtx && recordCompositeCanvas) {
      recordCompositeCtx.drawImage(
        renderer.domElement,
        0,
        0,
        recordCompositeCanvas.width,
        recordCompositeCanvas.height
      );
      if (studioState.watermark) {
        drawWatermarkOnCanvas(
          recordCompositeCtx,
          recordCompositeCanvas.width,
          recordCompositeCanvas.height
        );
      }
    }
  }

  // ============================================================================
  // 畫布滑鼠與觸控 3D 互動 (旋轉、縮放、點擊釋放重力波)
  // ============================================================================
  container.addEventListener('pointerdown', (e) => {
    state.isDraggingCanvas = true;
    state.dragStartX = e.clientX;
    state.dragStartY = e.clientY;

    // 觸發 3D 波紋震盪
    const rect = container.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width;
    const ny = 1.0 - (e.clientY - rect.top) / rect.height;
    state.rippleCenter.set(nx, ny);
    state.rippleStrength = 1.0;
  });

  window.addEventListener('pointermove', (e) => {
    if (!state.isDraggingCanvas) return;
    const dx = (e.clientX - state.dragStartX) / window.innerWidth;
    const dy = (e.clientY - state.dragStartY) / window.innerHeight;
    state.targetRotY += dx * 3.2;
    state.targetRotX = Math.max(-1.4, Math.min(1.4, state.targetRotX + dy * 3.2));
    state.dragStartX = e.clientX;
    state.dragStartY = e.clientY;
  });

  window.addEventListener('pointerup', () => {
    state.isDraggingCanvas = false;
  });

  container.addEventListener('wheel', (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.08 : 0.08;
    state.zoom = Math.max(0.3, Math.min(2.5, Number((state.zoom + delta).toFixed(2))));
    const zoomSlider = document.getElementById('ctrl-zoom');
    const zoomBadge = document.getElementById('val-zoom');
    if (zoomSlider) {
      zoomSlider.value = state.zoom;
      updateSliderFill(zoomSlider);
    }
    if (zoomBadge) zoomBadge.textContent = state.zoom.toFixed(2);
  }, { passive: false });

  // ============================================================================
  // 左下角吉祥物自由拖曳系統 (支援滑鼠與觸控拖曳至任何位置)
  // ============================================================================
  function initDraggableMascot() {
    const mascot = document.getElementById('mascot-widget');
    if (!mascot) return;

    let draggingMascot = false;
    let offsetX = 0;
    let offsetY = 0;

    mascot.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      draggingMascot = true;
      const rect = mascot.getBoundingClientRect();
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;

      // 切換為 left / top 絕對座標定位，方便自由移動到畫面任何角落
      mascot.style.left = `${rect.left}px`;
      mascot.style.top = `${rect.top}px`;
      mascot.style.bottom = 'auto';
      mascot.style.right = 'auto';
      mascot.setPointerCapture(e.pointerId);
    });

    mascot.addEventListener('pointermove', (e) => {
      if (!draggingMascot) return;
      e.stopPropagation();
      const maxX = window.innerWidth - mascot.offsetWidth;
      const maxY = window.innerHeight - mascot.offsetHeight;
      const nextX = Math.max(0, Math.min(maxX, e.clientX - offsetX));
      const nextY = Math.max(0, Math.min(maxY, e.clientY - offsetY));

      mascot.style.left = `${nextX}px`;
      mascot.style.top = `${nextY}px`;
    });

    const stopMascotDrag = (e) => {
      if (!draggingMascot) return;
      draggingMascot = false;
      try {
        mascot.releasePointerCapture(e.pointerId);
      } catch (_) {
        // 忽略釋放例外
      }
    };

    mascot.addEventListener('pointerup', stopMascotDrag);
    mascot.addEventListener('pointercancel', stopMascotDrag);
  }

  // ============================================================================
  // UI 控制面板事件綁定、程度桿漸層填色與狀態同步
  // ============================================================================
  function updateSliderFill(slider) {
    if (!slider) return;
    const min = parseFloat(slider.min || 0);
    const max = parseFloat(slider.max || 100);
    const val = parseFloat(slider.value || 0);
    const pct = Math.max(0, Math.min(100, ((val - min) / (max - min)) * 100));
    slider.style.setProperty('--fill-pct', `${pct.toFixed(1)}%`);
  }

  function updateAllSliderFills() {
    document.querySelectorAll('input[type="range"]').forEach(updateSliderFill);
  }

  function bindSlider(sliderId, badgeId, stateKey, formatter = (v) => v) {
    const slider = document.getElementById(sliderId);
    const badge = document.getElementById(badgeId);
    if (!slider) return;

    updateSliderFill(slider);
    slider.addEventListener('input', () => {
      const val = parseFloat(slider.value);
      state[stateKey] = val;
      if (badge) badge.textContent = formatter(val);
      updateSliderFill(slider);
    });
  }

  function syncSlidersFromState() {
    const map = [
      ['ctrl-extrusion', 'val-extrusion', state.extrusion, (v) => v.toFixed(2)],
      ['ctrl-zoom', 'val-zoom', state.zoom, (v) => v.toFixed(2)],
      ['ctrl-tilt', 'val-tilt', state.tilt, (v) => v.toFixed(2)],
      ['ctrl-facezoom', 'val-facezoom', state.faceZoom, (v) => `${v.toFixed(1)}x`],
      ['ctrl-campanx', 'val-campanx', state.camPanX, (v) => `${Math.round(v)}%`],
      ['ctrl-campany', 'val-campany', state.camPanY, (v) => `${Math.round(v)}%`],
      ['ctrl-segments', 'val-segments', state.segments, (v) => Math.round(v)],
      ['ctrl-repeat', 'val-repeat', state.repeat, (v) => v.toFixed(2)],
      ['ctrl-twist', 'val-twist', state.twist, (v) => v.toFixed(2)],
      ['ctrl-fold', 'val-fold', state.fold, (v) => Math.round(v)],
      ['ctrl-speed', 'val-speed', state.speed, (v) => v.toFixed(2)],
      ['ctrl-pulse', 'val-pulse', state.pulse, (v) => v.toFixed(2)],
      ['ctrl-hue', 'val-hue', state.hue, (v) => `${Math.round(v)}°`],
      ['ctrl-saturation', 'val-saturation', state.saturation, (v) => v.toFixed(2)],
      ['ctrl-glow', 'val-glow', state.glow, (v) => v.toFixed(2)],
      ['ctrl-aberration', 'val-aberration', state.aberration, (v) => v.toFixed(2)],
      ['ctrl-sensitivity', 'val-sensitivity', state.sensitivity, (v) => v.toFixed(1)]
    ];

    map.forEach(([sId, bId, val, fmt]) => {
      const s = document.getElementById(sId);
      const b = document.getElementById(bId);
      if (s) {
        s.value = val;
        updateSliderFill(s);
      }
      if (b) b.textContent = fmt(val);
    });

    const chkWire = document.getElementById('chk-wireframe');
    if (chkWire) chkWire.checked = state.wireframe;

    // 同步幾何按鈕選取狀態
    document.querySelectorAll('#geometry-selector .geo-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.geo === state.geoMode);
    });

    // 同步人像對稱排列模式按鈕
    document.querySelectorAll('[data-facemode]').forEach((btn) => {
      btn.classList.toggle('active', parseInt(btn.dataset.facemode, 10) === state.faceMode);
    });

    // 同步濾鏡按鈕選取狀態
    document.querySelectorAll('.filter-btn').forEach((btn) => {
      btn.classList.toggle('active', parseInt(btn.dataset.filter, 10) === state.filterMode);
    });

    // 同步鏡頭取景模式按鈕與徽章
    document.querySelectorAll('.aspect-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.camaspect === state.camAspectMode);
    });
    updateCamFrameBadge();
  }

  function updateSourceButtonsUI() {
    document.querySelectorAll('.src-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.source === state.sourceMode);
    });
  }

  function applyPreset(presetKey) {
    const p = PRESETS[presetKey];
    if (!p) return;

    Object.assign(state, {
      geoMode: p.geoMode,
      faceMode: p.faceMode ?? 0,
      extrusion: p.extrusion,
      zoom: p.zoom,
      tilt: p.tilt,
      segments: p.segments,
      repeat: p.repeat,
      twist: p.twist,
      fold: p.fold,
      speed: p.speed,
      pulse: p.pulse,
      filterMode: p.filterMode,
      hue: p.hue,
      saturation: p.saturation,
      glow: p.glow,
      aberration: p.aberration,
      wireframe: p.wireframe
    });

    buildGeometryMode(state.geoMode);
    syncSlidersFromState();

    document.querySelectorAll('.preset-chip').forEach((chip) => {
      chip.classList.toggle('active', chip.dataset.preset === presetKey);
    });

    showToast(`已套用主題預設：${p.name}`);
  }

  function randomizeAll() {
    const geos = ['dome', 'tunnel', 'crystal', 'relief', 'torus', 'prismCluster'];
    state.geoMode = geos[Math.floor(Math.random() * geos.length)];
    state.faceMode = Math.floor(Math.random() * 3);
    state.extrusion = Number((0.4 + Math.random() * 1.4).toFixed(2));
    state.zoom = Number((0.85 + Math.random() * 0.5).toFixed(2));
    state.tilt = Number((0.2 + Math.random() * 0.5).toFixed(2));
    state.segments = Math.floor(3 + Math.random() * 7) * 2;
    state.repeat = Number((0.85 + Math.random() * 0.9).toFixed(2));
    state.twist = Number((-0.45 + Math.random() * 0.9).toFixed(2));
    state.fold = Math.random() > 0.65 ? 2 : 1;
    state.speed = Number((-0.8 + Math.random() * 1.6).toFixed(2));
    state.pulse = Number((Math.random() * 0.25).toFixed(2));
    state.filterMode = Math.floor(Math.random() * 6);
    state.hue = Math.floor(Math.random() * 360);
    state.saturation = Number((1.05 + Math.random() * 0.5).toFixed(2));
    state.glow = Number((1.0 + Math.random() * 0.35).toFixed(2));
    state.aberration = Number((Math.random() * 0.2).toFixed(2));
    state.wireframe = Math.random() > 0.6;

    buildGeometryMode(state.geoMode);
    syncSlidersFromState();
    const faceModeNames = ['花瓣人像環', '中央魔鏡臉', '複眼人像陣'];
    showToast(`驚喜隨機：${faceModeNames[state.faceMode]} (${state.segments} 瓣鏡像)`);
  }

  // ============================================================================
  // 專業拍照與錄影工作坊系統 (支援 MP4/WebM、超高畫質、精緻縮小版權浮水印、相簿)
  // ============================================================================
  const studioState = {
    timerSeconds: 0, // 0 | 3 | 5
    watermark: true,
    recordLimitSeconds: 0, // 0(不限時) | 5 | 10 | 15
    format: 'mp4', // 'mp4' | 'webm'
    quality: 'ultra', // 'ultra' (20Mbps / 2x) | 'high' (12Mbps) | 'std' (6Mbps)
    isCountingDown: false,
    gallery: []
  };

  // 於畫布右下角繪製精緻小字浮水印：Copyright © Liyuchiutiger Gongminshen
  function drawWatermarkOnCanvas(ctx, width, height) {
    const fontSize = Math.max(10, Math.round(width * 0.009));
    ctx.save();
    ctx.font = `500 ${fontSize}px "Noto Sans TC", sans-serif`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 4;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText('Copyright © Liyuchiutiger Gongminshen', width - 14, height - 10);
    ctx.restore();
  }

  // 合成快門與倒數音效 (不需外部音訊檔)
  function playStudioSound(type) {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      if (type === 'beep') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === 'shutter') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.exponentialRampToValueAtTime(180, now + 0.09);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
        osc.start(now);
        osc.stop(now + 0.09);
      } else if (type === 'recStart') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.setValueAtTime(780, now + 0.08);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
      } else if (type === 'recStop') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(780, now);
        osc.frequency.setValueAtTime(440, now + 0.09);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        osc.start(now);
        osc.stop(now + 0.22);
      }
    } catch (_) {
      // 忽略瀏覽器未解鎖音效之情況
    }
  }

  function triggerShutterFlash() {
    const flash = document.getElementById('shutter-flash');
    if (!flash) return;
    flash.classList.add('flash-active');
    setTimeout(() => {
      flash.classList.remove('flash-active');
    }, 90);
  }

  function addGalleryItem(item) {
    studioState.gallery.unshift(item);
    updateGalleryUI();
  }

  function updateGalleryUI() {
    const count = studioState.gallery.length;
    const badge = document.getElementById('gallery-count-badge');
    const dockCount = document.getElementById('dock-gallery-count');
    if (badge) badge.textContent = count;
    if (dockCount) dockCount.textContent = `${count} 件作品`;

    const grid = document.getElementById('gallery-grid');
    if (!grid) return;

    if (count === 0) {
      grid.innerHTML = `
        <div class="gallery-empty">
          <i class="fa-solid fa-camera-retro"></i>
          <p>尚無拍攝作品，點擊下方「拍照」或「錄影」捕捉奇幻瞬間！</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = '';
    studioState.gallery.forEach((item) => {
      const card = document.createElement('div');
      card.className = 'gallery-item';

      const mediaHtml = item.type === 'photo'
        ? `<img src="${item.url}" alt="${item.filename}" />
           <span class="media-type-tag"><i class="fa-solid fa-camera"></i> 照片</span>`
        : `<video src="${item.url}" controls loop muted playsinline></video>
           <span class="media-type-tag"><i class="fa-solid fa-video"></i> ${item.formatLabel || 'MP4'} (${item.durationStr})</span>`;

      const mp4Name = item.filename.replace(/\.(webm|mp4)$/i, '.mp4');
      const extraMp4Btn = item.type === 'video'
        ? `<a href="${item.url}" download="${mp4Name}" class="mini-action-btn" title="下載為 MP4 影片檔">
             <i class="fa-solid fa-file-video"></i> MP4
           </a>`
        : '';

      card.innerHTML = `
        <div class="gallery-thumb-wrap">
          ${mediaHtml}
        </div>
        <div class="gallery-item-bar">
          <span><i class="fa-regular fa-clock"></i> ${item.timeLabel}</span>
          <div class="gallery-item-btns">
            ${extraMp4Btn}
            <a href="${item.url}" download="${item.filename}" class="icon-mini-btn" title="下載儲存 (${item.filename})">
              <i class="fa-solid fa-download"></i>
            </a>
            <button class="icon-mini-btn btn-del-item" data-id="${item.id}" title="刪除此作品">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </div>
      `;

      card.querySelector('.btn-del-item')?.addEventListener('click', () => {
        const idx = studioState.gallery.findIndex((g) => g.id === item.id);
        if (idx !== -1) {
          if (studioState.gallery[idx].isObjectUrl) {
            URL.revokeObjectURL(studioState.gallery[idx].url);
          }
          studioState.gallery.splice(idx, 1);
          updateGalleryUI();
        }
      });

      grid.appendChild(card);
    });
  }

  function executePhotoCapture() {
    // 若選用超高畫質，暫時以 2 倍超取樣解析度渲染拍照
    const prevPixelRatio = renderer.getPixelRatio();
    if (studioState.quality === 'ultra') {
      renderer.setPixelRatio(2);
    }
    renderer.render(scene, camera);

    playStudioSound('shutter');
    triggerShutterFlash();

    const glCanvas = renderer.domElement;
    const outCanvas = document.createElement('canvas');
    outCanvas.width = glCanvas.width;
    outCanvas.height = glCanvas.height;
    const ctx = outCanvas.getContext('2d');
    ctx.drawImage(glCanvas, 0, 0);

    if (studioState.quality === 'ultra' && prevPixelRatio !== 2) {
      renderer.setPixelRatio(prevPixelRatio);
    }

    // 若啟用浮水印，於右下角繪製精緻小字：Copyright © Liyuchiutiger Gongminshen
    if (studioState.watermark) {
      drawWatermarkOnCanvas(ctx, outCanvas.width, outCanvas.height);
    }

    const dataUrl = outCanvas.toDataURL('image/png', 1.0);
    const now = new Date();
    const stamp = now.toISOString().slice(0, 19).replace(/[:T]/g, '-');
    const filename = `Kaleidoscope-Photo-${stamp}.png`;

    // 自動觸發下載
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    link.click();

    // 存入作品相簿
    addGalleryItem({
      id: `photo-${Date.now()}`,
      type: 'photo',
      url: dataUrl,
      filename,
      timeLabel: now.toTimeString().slice(0, 8),
      isObjectUrl: false
    });

    showToast('已拍攝高畫質 3D 萬花筒照片並存入相簿！');
  }

  function takeSnapshot() {
    if (studioState.isCountingDown) return;

    if (studioState.timerSeconds <= 0) {
      executePhotoCapture();
      return;
    }

    // 執行倒數自拍
    studioState.isCountingDown = true;
    let remaining = studioState.timerSeconds;
    const overlay = document.getElementById('countdown-overlay');
    const numEl = document.getElementById('countdown-number');

    if (overlay && numEl) {
      overlay.classList.remove('hidden');
      numEl.textContent = remaining;
    }
    playStudioSound('beep');

    const countInterval = setInterval(() => {
      remaining -= 1;
      if (remaining > 0) {
        if (numEl) numEl.textContent = remaining;
        playStudioSound('beep');
      } else {
        clearInterval(countInterval);
        if (overlay) overlay.classList.add('hidden');
        studioState.isCountingDown = false;
        executePhotoCapture();
      }
    }, 1000);
  }

  // 動態短片錄影功能 (支援 MP4 / WebM、超高畫質位元率選擇、浮水印合成、暫停/繼續、即時錄影秒數)
  let mediaRecorder = null;
  let recordedChunks = [];
  let isRecording = false;
  let isRecordPaused = false;
  let recordElapsedSec = 0;
  let recordTimerInterval = null;
  let recordCompositeCanvas = null;
  let recordCompositeCtx = null;

  function formatDuration(sec) {
    const m = String(Math.floor(sec / 60)).padStart(2, '0');
    const s = String(sec % 60).padStart(2, '0');
    return `${m}:${s}`;
  }

  function getSupportedMimeType(preferFormat = 'mp4') {
    const mp4Types = [
      'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
      'video/mp4;codecs=avc1',
      'video/mp4;codecs=h264',
      'video/mp4',
      'video/webm;codecs=h264'
    ];
    const webmTypes = [
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm'
    ];
    const candidates = preferFormat === 'mp4'
      ? [...mp4Types, ...webmTypes]
      : [...webmTypes, ...mp4Types];

    for (const t of candidates) {
      if (window.MediaRecorder && MediaRecorder.isTypeSupported(t)) {
        return t;
      }
    }
    return '';
  }

  function getTargetBitrate() {
    if (studioState.quality === 'ultra') return 20000000; // 20 Mbps 超高畫質
    if (studioState.quality === 'high') return 12000000;  // 12 Mbps 高畫質
    return 6000000;                                       // 6 Mbps 標準畫質
  }

  function updateRecordUIState(active, paused = false) {
    const topBtn = document.getElementById('btn-record');
    const hud = document.getElementById('recording-hud');
    const pauseBtn = document.getElementById('btn-pause-record');
    const recDot = document.querySelector('.rec-dot');

    if (active) {
      topBtn?.classList.add('recording');
      if (topBtn) topBtn.innerHTML = '<i class="fa-solid fa-stop"></i> <span>停止</span>';
      hud?.classList.remove('hidden');
      if (recDot) recDot.classList.toggle('paused', paused);
      if (pauseBtn) {
        pauseBtn.innerHTML = paused
          ? '<i class="fa-solid fa-play"></i>'
          : '<i class="fa-solid fa-pause"></i>';
      }
    } else {
      topBtn?.classList.remove('recording');
      if (topBtn) topBtn.innerHTML = '<i class="fa-solid fa-video"></i> <span>錄影</span>';
      hud?.classList.add('hidden');
    }
  }

  function toggleVideoRecord() {
    if (!isRecording) {
      try {
        // 根據所選畫質設定渲染解析度倍率
        if (studioState.quality === 'ultra') {
          renderer.setPixelRatio(2);
        } else if (studioState.quality === 'high') {
          renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        } else {
          renderer.setPixelRatio(1);
        }
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.render(scene, camera);

        // 建立錄影合成畫布 (可同步寫入精緻浮水印)
        recordCompositeCanvas = document.createElement('canvas');
        recordCompositeCanvas.width = renderer.domElement.width;
        recordCompositeCanvas.height = renderer.domElement.height;
        recordCompositeCtx = recordCompositeCanvas.getContext('2d');
        recordCompositeCtx.drawImage(renderer.domElement, 0, 0);
        if (studioState.watermark) {
          drawWatermarkOnCanvas(recordCompositeCtx, recordCompositeCanvas.width, recordCompositeCanvas.height);
        }

        const stream = recordCompositeCanvas.captureStream(60);
        const mimeType = getSupportedMimeType(studioState.format);
        const bitrate = getTargetBitrate();
        const options = mimeType
          ? { mimeType, videoBitsPerSecond: bitrate }
          : { videoBitsPerSecond: bitrate };

        mediaRecorder = new MediaRecorder(stream, options);
        recordedChunks = [];
        recordElapsedSec = 0;
        isRecordPaused = false;

        const timerEl = document.getElementById('rec-timer');
        if (timerEl) timerEl.textContent = '00:00';

        mediaRecorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) recordedChunks.push(e.data);
        };

        mediaRecorder.onstop = () => {
          clearInterval(recordTimerInterval);
          const wantMp4 = studioState.format === 'mp4';
          const ext = wantMp4 ? 'mp4' : 'webm';
          const outMime = wantMp4 ? 'video/mp4' : (mimeType || 'video/webm');
          const blob = new Blob(recordedChunks, { type: outMime });
          const url = URL.createObjectURL(blob);
          const now = new Date();
          const stamp = now.toISOString().slice(0, 19).replace(/[:T]/g, '-');
          const filename = `Kaleidoscope-Video-${stamp}.${ext}`;
          const durationStr = formatDuration(Math.max(1, recordElapsedSec));
          const qualityNames = { ultra: '超高畫質', high: '高畫質', std: '標準' };
          const formatLabel = `${ext.toUpperCase()} ${qualityNames[studioState.quality] || ''}`;

          // 自動觸發下載
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          a.click();

          // 加入作品相簿供即時預覽播放与下載
          addGalleryItem({
            id: `video-${Date.now()}`,
            type: 'video',
            url,
            filename,
            formatLabel,
            durationStr,
            timeLabel: now.toTimeString().slice(0, 8),
            isObjectUrl: true
          });

          playStudioSound('recStop');
          updateRecordUIState(false);
          showToast(`${formatLabel} 影片 (${durationStr}) 錄製完成，已儲存為 .${ext} 並收入相簿！`);
        };

        mediaRecorder.start(200);
        isRecording = true;
        playStudioSound('recStart');
        updateRecordUIState(true, false);

        recordTimerInterval = setInterval(() => {
          if (!isRecordPaused) {
            recordElapsedSec += 1;
            if (timerEl) timerEl.textContent = formatDuration(recordElapsedSec);

            if (studioState.recordLimitSeconds > 0 && recordElapsedSec >= studioState.recordLimitSeconds) {
              stopActiveRecording();
            }
          }
        }, 1000);

        const qLabel = studioState.quality === 'ultra' ? '超高畫質 (20Mbps)' : (studioState.quality === 'high' ? '高畫質 (12Mbps)' : '標準畫質');
        const limitMsg = studioState.recordLimitSeconds > 0
          ? `，將於 ${studioState.recordLimitSeconds} 秒後自動儲存`
          : '';
        showToast(`開始錄製 ${studioState.format.toUpperCase()} ${qLabel} 影片${limitMsg}...`);
      } catch (err) {
        showToast('目前瀏覽器環境不支援畫布影片錄製');
      }
    } else {
      stopActiveRecording();
    }
  }

  function stopActiveRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
    isRecording = false;
    isRecordPaused = false;
    clearInterval(recordTimerInterval);
  }

  function togglePauseRecording() {
    if (!isRecording || !mediaRecorder) return;
    if (mediaRecorder.state === 'recording' && mediaRecorder.pause) {
      mediaRecorder.pause();
      isRecordPaused = true;
      updateRecordUIState(true, true);
      showToast('錄影已暫停');
    } else if (mediaRecorder.state === 'paused' && mediaRecorder.resume) {
      mediaRecorder.resume();
      isRecordPaused = false;
      updateRecordUIState(true, false);
      showToast('繼續錄影');
    }
  }

  // 初始化所有 UI 控制項監聽
  function initUIEvents() {
    // 綁定滑桿
    bindSlider('ctrl-extrusion', 'val-extrusion', 'extrusion', (v) => v.toFixed(2));
    bindSlider('ctrl-zoom', 'val-zoom', 'zoom', (v) => v.toFixed(2));
    bindSlider('ctrl-tilt', 'val-tilt', 'tilt', (v) => v.toFixed(2));
    bindSlider('ctrl-facezoom', 'val-facezoom', 'faceZoom', (v) => {
      updateCamFrameBadge();
      return `${v.toFixed(1)}x`;
    });
    bindSlider('ctrl-campanx', 'val-campanx', 'camPanX', (v) => {
      updateCamFrameBadge();
      return `${Math.round(v)}%`;
    });
    bindSlider('ctrl-campany', 'val-campany', 'camPanY', (v) => {
      updateCamFrameBadge();
      return `${Math.round(v)}%`;
    });
    bindSlider('ctrl-segments', 'val-segments', 'segments', (v) => Math.round(v));
    bindSlider('ctrl-repeat', 'val-repeat', 'repeat', (v) => v.toFixed(2));
    bindSlider('ctrl-twist', 'val-twist', 'twist', (v) => v.toFixed(2));
    bindSlider('ctrl-fold', 'val-fold', 'fold', (v) => Math.round(v));
    bindSlider('ctrl-speed', 'val-speed', 'speed', (v) => v.toFixed(2));
    bindSlider('ctrl-pulse', 'val-pulse', 'pulse', (v) => v.toFixed(2));
    bindSlider('ctrl-hue', 'val-hue', 'hue', (v) => `${Math.round(v)}°`);
    bindSlider('ctrl-saturation', 'val-saturation', 'saturation', (v) => v.toFixed(2));
    bindSlider('ctrl-glow', 'val-glow', 'glow', (v) => v.toFixed(2));
    bindSlider('ctrl-aberration', 'val-aberration', 'aberration', (v) => v.toFixed(2));
    bindSlider('ctrl-sensitivity', 'val-sensitivity', 'sensitivity', (v) => v.toFixed(1));

    // 右側分頁切換
    document.querySelectorAll('.tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach((c) => c.classList.remove('active'));
        btn.classList.add('active');
        const target = document.getElementById(btn.dataset.tab);
        if (target) target.classList.add('active');
      });
    });

    // 3D 幾何模式按鈕
    document.querySelectorAll('#geometry-selector .geo-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#geometry-selector .geo-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        buildGeometryMode(btn.dataset.geo);
      });
    });

    // 人像對稱排列模式切換按鈕 (左側快速切換列 + 右側鏡像結構分頁同步)
    document.querySelectorAll('[data-facemode]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const mode = parseInt(btn.dataset.facemode, 10);
        state.faceMode = mode;
        document.querySelectorAll('[data-facemode]').forEach((b) => {
          b.classList.toggle('active', parseInt(b.dataset.facemode, 10) === mode);
        });
        const modeNames = [
          '花瓣人像環：每片萬花筒花瓣都清晰映射你的臉孔',
          '中央魔鏡臉：畫面正中央直接對稱映射你的五官',
          '複眼人像陣：多格水晶複眼同時映出清晰人像'
        ];
        showToast(modeNames[mode] || '已切換人像對稱模式');
      });
    });

    // 光學濾鏡按鈕
    document.querySelectorAll('.filter-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        state.filterMode = parseInt(btn.dataset.filter, 10);
      });
    });

    // 訊號源切換按鈕
    document.querySelectorAll('.src-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const src = btn.dataset.source;
        state.sourceMode = src;
        updateSourceButtonsUI();
        const srcLabel = document.getElementById('source-label');
        if (src === 'webcam') {
          startWebcam();
        } else {
          const names = {
            cyber: '賽博星雲生成',
            neonGrid: '霓虹幾何矩陣',
            aurora: '極光流體波紋'
          };
          if (srcLabel) {
            srcLabel.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles"></i> ${names[src] || '動態模擬源'}`;
          }
          showToast(`已切換訊號源：${names[src]}`);
        }
      });
    });

    // 主題預設按鈕
    document.querySelectorAll('.preset-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        applyPreset(chip.dataset.preset);
      });
    });

    // 勾選框切換
    document.getElementById('chk-wireframe')?.addEventListener('change', (e) => {
      state.wireframe = e.target.checked;
      buildGeometryMode(state.geoMode);
    });
    document.getElementById('chk-particles')?.addEventListener('change', (e) => {
      state.particles = e.target.checked;
    });
    document.getElementById('chk-autorotate3d')?.addEventListener('change', (e) => {
      state.autoRotate3D = e.target.checked;
    });
    document.getElementById('chk-autohue')?.addEventListener('change', (e) => {
      state.autoHue = e.target.checked;
    });
    document.getElementById('chk-invert')?.addEventListener('change', (e) => {
      state.invert = e.target.checked;
    });
    document.getElementById('chk-motion-react')?.addEventListener('change', (e) => {
      state.motionReact = e.target.checked;
    });
    document.getElementById('chk-automorph')?.addEventListener('change', (e) => {
      state.autoMorph = e.target.checked;
    });
    document.getElementById('chk-watermark')?.addEventListener('change', (e) => {
      studioState.watermark = e.target.checked;
      showToast(studioState.watermark ? '已開啟版權浮水印' : '已關閉版權浮水印');
    });

    // 錄影與拍照格式及畫質選擇器 (MP4 / WebM + 超高畫質 / 高畫質 / 標準)
    document.getElementById('select-studio-preset')?.addEventListener('change', (e) => {
      const val = e.target.value; // e.g., 'mp4-ultra', 'mp4-high', 'webm-ultra'
      const [fmt, qual] = val.split('-');
      studioState.format = fmt || 'mp4';
      studioState.quality = qual || 'ultra';
      const qNames = { ultra: '超高畫質 (20Mbps)', high: '高畫質 (12Mbps)', std: '標準 (6Mbps)' };
      showToast(`已切換儲存設定：${studioState.format.toUpperCase()} ${qNames[studioState.quality] || ''}`);
    });

    // 頂部快門工作坊按鈕綁定
    document.getElementById('btn-start-cam')?.addEventListener('click', startWebcam);
    document.getElementById('btn-random')?.addEventListener('click', randomizeAll);
    document.getElementById('btn-snapshot')?.addEventListener('click', takeSnapshot);
    document.getElementById('btn-record')?.addEventListener('click', toggleVideoRecord);
    document.getElementById('btn-stop-record-hud')?.addEventListener('click', stopActiveRecording);
    document.getElementById('btn-pause-record')?.addEventListener('click', togglePauseRecording);
    document.getElementById('btn-toggle-audio')?.addEventListener('click', toggleAudioReactive);

    // 倒數自拍秒數切換 (立即 -> 3秒 -> 5秒)
    const timerOptions = [0, 3, 5];
    document.getElementById('btn-timer-cycle')?.addEventListener('click', (e) => {
      const nextIdx = (timerOptions.indexOf(studioState.timerSeconds) + 1) % timerOptions.length;
      studioState.timerSeconds = timerOptions[nextIdx];
      const lbl = document.getElementById('timer-label');
      if (lbl) lbl.textContent = studioState.timerSeconds === 0 ? '快門：立即' : `快門：${studioState.timerSeconds}秒`;
      e.currentTarget.classList.toggle('active', studioState.timerSeconds > 0);
      showToast(studioState.timerSeconds === 0 ? '拍照模式：立即快門' : `拍照模式：${studioState.timerSeconds} 秒倒數自拍`);
    });

    // 錄影自動限時切換 (不限時 -> 5秒 -> 10秒 -> 15秒)
    const recLimits = [0, 5, 10, 15];
    document.getElementById('btn-rec-limit-cycle')?.addEventListener('click', (e) => {
      const nextIdx = (recLimits.indexOf(studioState.recordLimitSeconds) + 1) % recLimits.length;
      studioState.recordLimitSeconds = recLimits[nextIdx];
      const lbl = document.getElementById('rec-limit-label');
      if (lbl) {
        lbl.textContent = studioState.recordLimitSeconds === 0
          ? '錄影：不限時'
          : `錄影：${studioState.recordLimitSeconds}秒`;
      }
      e.currentTarget.classList.toggle('active', studioState.recordLimitSeconds > 0);
      showToast(
        studioState.recordLimitSeconds === 0
          ? '錄影長度：不限時手動停止'
          : `錄影長度：自動錄製 ${studioState.recordLimitSeconds} 秒短片`
      );
    });

    // 相簿彈窗開關與清空
    const galleryModal = document.getElementById('gallery-modal');
    const openGallery = () => galleryModal?.classList.remove('hidden');
    const closeGallery = () => galleryModal?.classList.add('hidden');

    document.getElementById('btn-open-gallery')?.addEventListener('click', openGallery);
    document.getElementById('btn-gallery-dock')?.addEventListener('click', openGallery);
    document.getElementById('btn-close-gallery')?.addEventListener('click', closeGallery);
    galleryModal?.addEventListener('click', (e) => {
      if (e.target === galleryModal) closeGallery();
    });

    document.getElementById('btn-clear-gallery')?.addEventListener('click', () => {
      studioState.gallery.forEach((item) => {
        if (item.isObjectUrl) URL.revokeObjectURL(item.url);
      });
      studioState.gallery = [];
      updateGalleryUI();
      showToast('已清空相簿所有作品');
    });

    document.getElementById('btn-flip-cam')?.addEventListener('click', (e) => {
      state.flipHorizontal = !state.flipHorizontal;
      e.currentTarget.classList.toggle('active', state.flipHorizontal);
      showToast(state.flipHorizontal ? '已開啟水平鏡像翻轉' : '已關閉水平鏡像翻轉');
    });

    document.getElementById('btn-freeze-cam')?.addEventListener('click', (e) => {
      state.freezeFrame = !state.freezeFrame;
      e.currentTarget.classList.toggle('active', state.freezeFrame);
      showToast(state.freezeFrame ? '畫面已凍結定格' : '畫面已恢復即時動態');
    });

    // 切換前後鏡頭
    document.getElementById('btn-switch-facing')?.addEventListener('click', () => {
      state.facingMode = state.facingMode === 'user' ? 'environment' : 'user';
      startWebcam();
    });

    // 重置鏡頭取景 (回到 1.0x 完整廣角、0% 偏移)
    document.getElementById('btn-reset-cam-frame')?.addEventListener('click', () => {
      state.camAspectMode = 'full';
      state.faceZoom = 1.0;
      state.camPanX = 0;
      state.camPanY = 0;
      syncSlidersFromState();
      showToast('已重置鏡頭為 1.0x 完整廣角視野');
    });

    // 鏡頭取景比例模式切換 (完整廣角 / 等比滿版 / 特寫聚焦)
    document.querySelectorAll('.aspect-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.camaspect;
        state.camAspectMode = mode;
        if (mode === 'full') {
          state.faceZoom = 1.0;
          state.camPanX = 0;
          state.camPanY = 0;
        } else if (mode === 'cover') {
          state.faceZoom = 1.0;
        } else if (mode === 'focus') {
          state.faceZoom = 1.5;
        }
        syncSlidersFromState();
        const names = {
          full: '完整廣角 (1.0x 不裁切)',
          cover: '等比滿版 (正方形取樣)',
          focus: '特寫聚焦 (1.5x 放大)'
        };
        showToast(`鏡頭取景模式：${names[mode] || ''}`);
      });
    });

    // 預覽小視窗直接拖曳移動取景中心 + 滾輪縮放取景大小
    const pipArea = document.getElementById('pip-drag-area');
    if (pipArea) {
      let isPipDragging = false;
      let pStartX = 0;
      let pStartY = 0;

      pipArea.addEventListener('pointerdown', (e) => {
        isPipDragging = true;
        pStartX = e.clientX;
        pStartY = e.clientY;
        pipArea.setPointerCapture(e.pointerId);
      });

      pipArea.addEventListener('pointermove', (e) => {
        if (!isPipDragging) return;
        const rect = pipArea.getBoundingClientRect();
        const dx = ((e.clientX - pStartX) / rect.width) * 160;
        const dy = ((e.clientY - pStartY) / rect.height) * 160;
        state.camPanX = Math.max(-100, Math.min(100, Math.round(state.camPanX - dx)));
        state.camPanY = Math.max(-100, Math.min(100, Math.round(state.camPanY - dy)));
        pStartX = e.clientX;
        pStartY = e.clientY;
        syncSlidersFromState();
      });

      const stopPipDrag = (e) => {
        if (!isPipDragging) return;
        isPipDragging = false;
        try {
          pipArea.releasePointerCapture(e.pointerId);
        } catch (_) {}
      };
      pipArea.addEventListener('pointerup', stopPipDrag);
      pipArea.addEventListener('pointercancel', stopPipDrag);

      pipArea.addEventListener('wheel', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const step = e.deltaY > 0 ? -0.1 : 0.1;
        state.faceZoom = Math.max(0.5, Math.min(3.0, Number((state.faceZoom + step).toFixed(2))));
        syncSlidersFromState();
      }, { passive: false });
    }

    // 自訂圖片上傳作為萬花筒材質
    document.getElementById('upload-media-input')?.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
          customLoadedImage = img;
          state.sourceMode = 'customImage';
          updateSourceButtonsUI();
          const srcLabel = document.getElementById('source-label');
          if (srcLabel) srcLabel.innerHTML = '<i class="fa-solid fa-image"></i> 自訂上傳圖片';
          showToast('已載入自訂圖片作為 3D 萬花筒鏡像材質！');
        };
        img.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    });

    // 純享模式 (Zen Mode)
    const toggleZen = () => {
      document.body.classList.toggle('zen-mode');
      const exitBtn = document.getElementById('btn-exit-zen');
      if (exitBtn) {
        exitBtn.classList.toggle('hidden', !document.body.classList.contains('zen-mode'));
      }
    };
    document.getElementById('btn-zen')?.addEventListener('click', toggleZen);
    document.getElementById('btn-exit-zen')?.addEventListener('click', toggleZen);

    // 全螢幕切換
    document.getElementById('btn-fullscreen')?.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen?.();
      } else {
        document.exitFullscreen?.();
      }
    });

    // 平板與行動裝置展開/收合左右抽屜面板 (互斥開啟避免重疊)
    const leftDock = document.getElementById('left-dock');
    const rightPanel = document.getElementById('right-panel');

    document.getElementById('btn-toggle-left')?.addEventListener('click', () => {
      const willOpen = !leftDock?.classList.contains('mobile-open');
      leftDock?.classList.toggle('mobile-open', willOpen);
      if (willOpen) rightPanel?.classList.remove('mobile-open');
    });

    document.getElementById('btn-toggle-panel')?.addEventListener('click', () => {
      const willOpen = !rightPanel?.classList.contains('mobile-open');
      rightPanel?.classList.toggle('mobile-open', willOpen);
      if (willOpen) leftDock?.classList.remove('mobile-open');
    });

    // 點擊 3D 畫布時於行動裝置自動收合抽屜，享受全畫面互動
    container.addEventListener('pointerdown', () => {
      if (window.innerWidth <= 960) {
        leftDock?.classList.remove('mobile-open');
        rightPanel?.classList.remove('mobile-open');
      }
    });

    // 動態監測頂部導覽列高度，自動更新 CSS 變數 --dock-top 防止任何螢幕寬度下重疊
    const topHeader = document.querySelector('.top-header');
    if (topHeader && window.ResizeObserver) {
      const ro = new ResizeObserver(() => {
        const rect = topHeader.getBoundingClientRect();
        document.documentElement.style.setProperty('--dock-top', `${Math.round(rect.bottom + 10)}px`);
      });
      ro.observe(topHeader);
    }

    // 重置所有參數
    document.getElementById('btn-reset-all')?.addEventListener('click', () => {
      applyPreset('crystalPalace');
      state.camAspectMode = 'full';
      state.faceZoom = 1.0;
      state.camPanX = 0;
      state.camPanY = 0;
      state.targetRotX = 0;
      state.targetRotY = 0;
      state.invert = false;
      state.autoHue = false;
      state.autoMorph = false;
      document.getElementById('chk-invert').checked = false;
      document.getElementById('chk-autohue').checked = false;
      document.getElementById('chk-automorph').checked = false;
      syncSlidersFromState();
      showToast('已重置所有參數與鏡頭取景回初始狀態');
    });

    // 鍵盤快捷鍵支援
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT') return;
      if (e.code === 'Space') {
        e.preventDefault();
        randomizeAll();
      } else if (e.key === 'p' || e.key === 'P') {
        takeSnapshot();
      } else if (e.key === 'r' || e.key === 'R') {
        toggleVideoRecord();
      } else if (e.key === 'g' || e.key === 'G') {
        document.getElementById('gallery-modal')?.classList.toggle('hidden');
      } else if (e.key === 'h' || e.key === 'H') {
        toggleZen();
      } else if (e.key === 'f' || e.key === 'F') {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen?.();
        } else {
          document.exitFullscreen?.();
        }
      }
    });

    // 視窗尺寸響應式調整
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  // ============================================================================
  // 啟動應用程式
  // ============================================================================
  buildGeometryMode(state.geoMode);
  initUIEvents();
  syncSlidersFromState();
  updateAllSliderFills();
  initDraggableMascot();
  startWebcam();
  animate();
})();
