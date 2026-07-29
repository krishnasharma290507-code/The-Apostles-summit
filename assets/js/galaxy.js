/* Galaxy Effect — Raw WebGL, no dependencies */
(function(){
  const vertexShader = `
attribute vec2 aPosition;
varying vec2 vUv;
void main(){
  vUv = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

  const fragmentShader = `
precision highp float;
uniform float uTime;
uniform vec2 uResolution;
uniform vec2 uMouse;
uniform float uMouseActive;
uniform float uHueShift;
uniform float uDensity;
uniform float uGlowIntensity;
uniform float uSaturation;
uniform float uRotationSpeed;
uniform float uTwinkleIntensity;
uniform float uRepulsionStrength;
uniform bool uMouseRepulsion;

varying vec2 vUv;

#define NUM_LAYER 4.0
#define STAR_CUTOFF 0.2
#define PI 3.14159265

float hash(vec2 p){
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float tri(float x){ return abs(fract(x)*2.0-1.0); }

float tris(float x){
  float t = fract(x);
  return 1.0 - smoothstep(0.0, 1.0, abs(2.0*t - 1.0));
}

float trisn(float x){
  float t = fract(x);
  return 2.0*(1.0 - smoothstep(0.0,1.0,abs(2.0*t-1.0))) - 1.0;
}

vec3 hsv2rgb(vec3 c){
  vec4 K = vec4(1.0, 2.0/3.0, 1.0/3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz)*6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p-K.xxx,0.0,1.0), c.y);
}

mat2 rot2(float a){ float c=cos(a),s=sin(a); return mat2(c,-s,s,c); }

float Star(vec2 uv, float flare){
  float d = length(uv);
  float m = (0.05*uGlowIntensity)/d;
  float rays = smoothstep(0.0,1.0,1.0-abs(uv.x*uv.y*1000.0));
  m += rays*flare*uGlowIntensity;
  uv *= mat2(0.7071,-0.7071,0.7071,0.7071);
  rays = smoothstep(0.0,1.0,1.0-abs(uv.x*uv.y*1000.0));
  m += rays*0.3*flare*uGlowIntensity;
  m *= smoothstep(1.0,0.2,d);
  return m;
}

vec3 StarLayer(vec2 uv, float speed){
  vec3 col = vec3(0.0);
  vec2 gv = fract(uv)-0.5;
  vec2 id = floor(uv);
  for(int y=-1;y<=1;y++){
    for(int x=-1;x<=1;x++){
      vec2 off = vec2(float(x),float(y));
      vec2 si = id+off;
      float seed = hash(si);
      float size = fract(seed*345.32);
      float gloss = tri(speed/(3.0*seed+1.0));
      float flareSize = smoothstep(0.9,1.0,size)*gloss;
      float r = smoothstep(STAR_CUTOFF,1.0,hash(si+1.0))+STAR_CUTOFF;
      float b = smoothstep(STAR_CUTOFF,1.0,hash(si+3.0))+STAR_CUTOFF;
      float g = min(r,b)*seed;
      vec3 base = vec3(r,g,b);
      float hue = atan(base.g-base.r, base.b-base.r)/(2.0*PI)+0.5;
      hue = fract(hue + uHueShift/360.0);
      float sat = length(base - vec3(dot(base,vec3(0.299,0.587,0.114))))*uSaturation;
      float val = max(max(base.r,base.g),base.b);
      base = hsv2rgb(vec3(hue,sat,val));
      vec2 pad = vec2(tris(seed*34.0+uTime*speed/10.0), tris(seed*38.0+uTime*speed/30.0))-0.5;
      float star = Star(gv-off-pad, flareSize);
      float twinkle = trisn(uTime+seed*6.2831)*0.5+1.0;
      twinkle = mix(1.0, twinkle, uTwinkleIntensity);
      star *= twinkle;
      col += star*size*base;
    }
  }
  return col;
}

void main(){
  vec2 res = uResolution;
  vec2 uv = (vUv * res - res*0.5) / res.y;

  if(uMouseRepulsion && uMouseActive > 0.01){
    vec2 mUV = (uMouse * res - res*0.5) / res.y;
    float md = length(uv - mUV);
    vec2 rep = normalize(uv - mUV) * (uRepulsionStrength / (md+0.1));
    uv += rep * 0.05 * uMouseActive;
  }

  uv = rot2(uTime * uRotationSpeed) * uv;

  vec3 col = vec3(0.0);
  float speed = uTime * 0.5;
  for(float i=0.0;i<1.0;i+=1.0/NUM_LAYER){
    float depth = fract(i + speed*0.2);
    float scale = mix(20.0*uDensity, 0.5*uDensity, depth);
    float fade = depth * smoothstep(1.0,0.9,depth);
    col += StarLayer(uv*scale + i*453.32, speed) * fade;
  }

  float alpha = length(col);
  alpha = smoothstep(0.0, 0.3, alpha);
  alpha = min(alpha, 1.0);
  gl_FragColor = vec4(col, alpha);
}`;

  function createGalaxy(container, opts){
    const cfg = Object.assign({
      hueShift: 40, saturation: 0.3, glowIntensity: 0.5,
      twinkleIntensity: 0.4, density: 0.8, rotationSpeed: 0.05,
      mouseRepulsion: true, repulsionStrength: 1.5
    }, opts||{});

    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'width:100%;height:100%;display:block';
    container.appendChild(canvas);

    const gl = canvas.getContext('webgl',{alpha:true,premultipliedAlpha:false});
    if(!gl){console.error('No WebGL');return;}

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0,0,0,0);

    function compile(type, src){
      const s = gl.createShader(type);
      gl.shaderSource(s,src);
      gl.compileShader(s);
      if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(s));
      return s;
    }

    const prog = gl.createProgram();
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, vertexShader));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, fragmentShader));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog,'aPosition');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos,2,gl.FLOAT,false,0,0);

    const uTime = gl.getUniformLocation(prog,'uTime');
    const uRes = gl.getUniformLocation(prog,'uResolution');
    const uMouse = gl.getUniformLocation(prog,'uMouse');
    const uMouseActive = gl.getUniformLocation(prog,'uMouseActive');
    const uHueShift = gl.getUniformLocation(prog,'uHueShift');
    const uDensity = gl.getUniformLocation(prog,'uDensity');
    const uGlow = gl.getUniformLocation(prog,'uGlowIntensity');
    const uSat = gl.getUniformLocation(prog,'uSaturation');
    const uRotSpeed = gl.getUniformLocation(prog,'uRotationSpeed');
    const uTwinkle = gl.getUniformLocation(prog,'uTwinkleIntensity');
    const uRepStr = gl.getUniformLocation(prog,'uRepulsionStrength');
    const uMouseRep = gl.getUniformLocation(prog,'uMouseRepulsion');

    gl.uniform1f(uHueShift, cfg.hueShift);
    gl.uniform1f(uDensity, cfg.density);
    gl.uniform1f(uGlow, cfg.glowIntensity);
    gl.uniform1f(uSat, cfg.saturation);
    gl.uniform1f(uRotSpeed, cfg.rotationSpeed);
    gl.uniform1f(uTwinkle, cfg.twinkleIntensity);
    gl.uniform1f(uRepStr, cfg.repulsionStrength);
    gl.uniform1i(uMouseRep, cfg.mouseRepulsion?1:0);

    let mouseX=0.5, mouseY=0.5, smoothX=0.5, smoothY=0.5, targetActive=0, smoothActive=0;
    const start = performance.now();

    function resize(){
      const dpr = Math.min(window.devicePixelRatio||1, 2);
      canvas.width = container.clientWidth * dpr;
      canvas.height = container.clientHeight * dpr;
      gl.viewport(0,0,canvas.width,canvas.height);
      gl.uniform3f(uRes, canvas.width, canvas.height, canvas.width/canvas.height);
    }

    function frame(){
      requestAnimationFrame(frame);
      const t = (performance.now()-start)*0.001;
      gl.uniform1f(uTime, t);
      smoothX += (mouseX-smoothX)*0.05;
      smoothY += (mouseY-smoothY)*0.05;
      smoothActive += (targetActive-smoothActive)*0.05;
      gl.uniform2f(uMouse, smoothX, smoothY);
      gl.uniform1f(uMouseActive, smoothActive);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
    }

    function onMove(e){
      const r = container.getBoundingClientRect();
      mouseX = (e.clientX-r.left)/r.width;
      mouseY = 1.0-(e.clientY-r.top)/r.height;
      targetActive = 1.0;
    }
    function onLeave(){ targetActive = 0; }

    container.addEventListener('mousemove',onMove);
    container.addEventListener('mouseleave',onLeave);
    window.addEventListener('resize',resize);
    resize();
    frame();

    return { destroy(){
      container.removeEventListener('mousemove',onMove);
      container.removeEventListener('mouseleave',onLeave);
      window.removeEventListener('resize',resize);
      canvas.remove();
    }};
  }

  window.createGalaxy = createGalaxy;
})();
