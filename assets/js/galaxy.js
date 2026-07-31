/* Galaxy Effect — Raw WebGL, no dependencies */
(function(){
  if (!window.WebGLRenderingContext) {
    console.warn('WebGL not supported');
    return;
  }

  const vertexShader = [
    'attribute vec2 aPosition;',
    'varying vec2 vUv;',
    'void main(){',
    '  vUv = aPosition * 0.5 + 0.5;',
    '  gl_Position = vec4(aPosition, 0.0, 1.0);',
    '}'
  ].join('\n');

  const fragmentShader = [
    'precision highp float;',
    'uniform float uTime;',
    'uniform vec2 uResolution;',
    'uniform vec2 uMouse;',
    'uniform float uMouseActive;',
    'uniform float uHueShift;',
    'uniform float uDensity;',
    'uniform float uGlowIntensity;',
    'uniform float uSaturation;',
    'uniform float uRotationSpeed;',
    'uniform float uTwinkleIntensity;',
    'uniform float uRepulsionStrength;',
    'uniform float uMouseRepulsion;',
    'uniform float uNumLayers;',
    'varying vec2 vUv;',
    '',
    '#define PI 3.14159265',
    '',
    'float hash(vec2 p){',
    '  p = fract(p * vec2(123.34, 456.21));',
    '  p += dot(p, p + 45.32);',
    '  return fract(p.x * p.y);',
    '}',
    '',
    'float tri(float x){ return abs(fract(x)*2.0-1.0); }',
    '',
    'float tris(float x){',
    '  float t = fract(x);',
    '  return 1.0 - smoothstep(0.0, 1.0, abs(2.0*t - 1.0));',
    '}',
    '',
    'float trisn(float x){',
    '  float t = fract(x);',
    '  return 2.0 * (1.0 - smoothstep(0.0,1.0,abs(2.0*t-1.0))) - 1.0;',
    '}',
    '',
    'vec3 hsv2rgb(vec3 c){',
    '  vec4 K = vec4(0.0, -1.0/3.0, 2.0/3.0, -1.0);',
    '  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);',
    '  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);',
    '}',
    '',
    'mat2 rot2(float a){ float c=cos(a),s=sin(a); return mat2(c,-s,s,c); }',
    '',
    'float Star(vec2 uv, float flare){',
    '  float d = length(uv);',
    '  float m = (0.07 / d) * (uGlowIntensity * 0.5);',
    '  float rays = pow(1.0 - abs(uv.x), 2.0) * flare;',
    '  m += rays * uGlowIntensity * 0.3;',
    '  uv *= mat2(0.7071,-0.7071,0.7071,0.7071);',
    '  rays = pow(1.0 - abs(uv.x), 2.0) * flare;',
    '  m += rays * uGlowIntensity * 0.3;',
    '  m *= 1.0 - smoothstep(0.0, 0.4, d);',
    '  return m;',
    '}',
    '',
    'vec3 StarLayer(vec2 uv, float speed, float layerIdx){',
    '  vec3 col = vec3(0.0);',
    '  vec2 gv = fract(uv) - 0.5;',
    '  vec2 id = floor(uv);',
    '  for(int y=-1;y<=1;y++){',
    '    for(int x=-1;x<=1;x++){',
    '      vec2 off = vec2(float(x),float(y));',
    '      vec2 si = id + off;',
    '      float seed = hash(si);',
    '      float size = 0.3 + fract(seed * 345.32) * 0.7;',
    '      float gloss = tri(speed * (3.0 * seed + 1.0) * 0.1);',
    '      float flareSize = smoothstep(0.9,1.0,size) * (0.5 + 0.5 * gloss);',
    '      float r = 0.6 + 0.4 * hash(si + 1.0);',
    '      float b = 0.6 + 0.4 * hash(si + 3.0);',
    '      float g = (r + b) * 0.5 * seed;',
    '      vec3 base = vec3(r,g,b);',
    '      float hue = atan(base.g - base.r, base.b - base.r) / (2.0 * PI) + 0.5;',
    '      hue = fract(hue + uHueShift / 360.0);',
    '      float sat = length(base - vec3(dot(base,vec3(0.299,0.587,0.114)))) * uSaturation;',
    '      float val = max(max(base.r,base.g),base.b);',
    '      base = hsv2rgb(vec3(hue,sat,val));',
    '      vec2 pad = vec2(tris(seed * 34.0 + uTime * 0.01), tris(seed * 38.0 + uTime * 0.02)) - 0.5;',
    '      float star = Star(gv - off - pad, flareSize);',
    '      float twinkle = trisn(uTime + seed * 6.2831) * 0.5 + 1.0;',
    '      twinkle = mix(1.0, twinkle, uTwinkleIntensity);',
    '      star *= twinkle;',
    '      col += star * size * base * (1.0 + 0.5 * (layerIdx + 1.0));',
    '    }',
    '  }',
    '  return col;',
    '}',
    '',
    'void main(){',
    '  vec2 uv = vUv;',
    '  uv = (uv - 0.5);',
    '  uv.x *= uResolution.x / uResolution.y;',
    '  if(uMouseRepulsion > 0.5 && uMouseActive > 0.01){',
    '    vec2 mUV = (uMouse - 0.5);',
    '    mUV.x *= uResolution.x / uResolution.y;',
    '    float md = length(uv - mUV);',
    '    vec2 rep = normalize(uv - mUV) * (uRepulsionStrength / (md + 0.1));',
    '    uv += rep * 0.05 * uMouseActive;',
    '  }',
    '  uv = rot2(uTime * uRotationSpeed) * uv;',
    '  vec3 col = vec3(0.0);',
    '  float speed = uTime * 0.5;',
    '  for(float i = 0.0; i < 1.0; i += 1.0 / uNumLayers){',
    '    float depth = fract(i + speed * 0.1);',
    '    float layerIdx = i;',
    '    float scale = mix(4.0 * uDensity, 20.0 * uDensity, depth);',
    '    float fade = depth * smoothstep(1.0, 0.9, depth);',
    '    col += StarLayer(uv * scale + i * 453.32, speed, layerIdx) * fade;',
    '  }',
    '  float alpha = length(col);',
    '  alpha = smoothstep(0.0, 0.001, alpha);',
    '  alpha = min(alpha, 1.0);',
    '  gl_FragColor = vec4(col, alpha);',
    '}'
  ].join('\n');

  function createGalaxy(container, opts){
    const cfg = {
      hueShift: 40, saturation: 0.5, glowIntensity: 1.5,
      twinkleIntensity: 0.8, density: 1.2, rotationSpeed: 0.05,
      mouseRepulsion: true, repulsionStrength: 1.5
    };
    for(const k in opts) if(opts[k] !== undefined) cfg[k] = opts[k];

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'width:100%;height:100%;display:block;position:absolute;top:0;left:0;background:transparent;';
    container.appendChild(canvas);

    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if(!gl){
      console.warn('WebGL not supported, disabling Galaxy background');
      container.style.display = 'none';
      return;
    }

    if (isMobile) {
      cfg.density = 0.4;
      cfg.glowIntensity = 0.8;
      cfg.mouseRepulsion = false;
    }

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.clearColor(0, 0, 0, 0);

    function compile(type, src){
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if(!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.error('Shader compile error:', gl.getShaderInfoLog(s));
      }
      return s;
    }

    const vShader = compile(gl.VERTEX_SHADER, vertexShader);
    const fShader = compile(gl.FRAGMENT_SHADER, fragmentShader);

    const prog = gl.createProgram();
    gl.attachShader(prog, vShader);
    gl.attachShader(prog, fShader);
    gl.linkProgram(prog);
    if(!gl.getProgramParameter(prog, gl.LINK_STATUS)){
      console.error('Program link error:', gl.getProgramInfoLog(prog));
    }
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, 'aPosition');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(prog, 'uTime');
    const uRes = gl.getUniformLocation(prog, 'uResolution');
    const uMouse = gl.getUniformLocation(prog, 'uMouse');
    const uMouseActive = gl.getUniformLocation(prog, 'uMouseActive');
    const uHueShift = gl.getUniformLocation(prog, 'uHueShift');
    const uDensity = gl.getUniformLocation(prog, 'uDensity');
    const uGlow = gl.getUniformLocation(prog, 'uGlowIntensity');
    const uSat = gl.getUniformLocation(prog, 'uSaturation');
    const uRotSpeed = gl.getUniformLocation(prog, 'uRotationSpeed');
    const uTwinkle = gl.getUniformLocation(prog, 'uTwinkleIntensity');
    const uRepStr = gl.getUniformLocation(prog, 'uRepulsionStrength');
    const uMouseRep = gl.getUniformLocation(prog, 'uMouseRepulsion');
    const uNumLayers = gl.getUniformLocation(prog, 'uNumLayers');

    gl.uniform1f(uHueShift, cfg.hueShift);
    gl.uniform1f(uDensity, cfg.density);
    gl.uniform1f(uGlow, cfg.glowIntensity);
    gl.uniform1f(uSat, cfg.saturation);
    gl.uniform1f(uRotSpeed, cfg.rotationSpeed);
    gl.uniform1f(uTwinkle, cfg.twinkleIntensity);
    gl.uniform1f(uRepStr, cfg.repulsionStrength);
    gl.uniform1f(uMouseRep, cfg.mouseRepulsion ? 1.0 : 0.0);
    gl.uniform1f(uNumLayers, isMobile ? 3.0 : 5.0);

    let mouseX = 0.5, mouseY = 0.5;
    let smoothX = 0.5, smoothY = 0.5;
    let targetActive = 0;
    let smoothActive = 0;
    const start = performance.now();

    function resize(){
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      if(w === 0 || h === 0) return;
      const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1 : 2);
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uRes, canvas.width, canvas.height);
    }

    function frame(){
      requestAnimationFrame(frame);
      const t = (performance.now() - start) * 0.001;
      gl.uniform1f(uTime, t);
      if (!isMobile) {
        smoothX += (mouseX - smoothX) * 0.05;
        smoothY += (mouseY - smoothY) * 0.05;
        smoothActive += (targetActive - smoothActive) * 0.05;
      }
      gl.uniform2f(uMouse, smoothX, smoothY);
      gl.uniform1f(uMouseActive, smoothActive);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    function onMove(e){
      const r = container.getBoundingClientRect();
      mouseX = (e.clientX - r.left) / r.width;
      mouseY = 1.0 - (e.clientY - r.top) / r.height;
      targetActive = 1.0;
    }
    function onLeave(){ targetActive = 0; }

    container.addEventListener('mousemove', onMove);
    container.addEventListener('mouseleave', onLeave);
    window.addEventListener('resize', resize);

    console.log('Galaxy WebGL context created successfully');
    resize();
    requestAnimationFrame(frame);

    return { destroy: function(){
      container.removeEventListener('mousemove', onMove);
      container.removeEventListener('mouseleave', onLeave);
      window.removeEventListener('resize', resize);
      if(canvas.parentNode) canvas.parentNode.removeChild(canvas);
    }};
  }

  window.createGalaxy = createGalaxy;
})();
