/* Galaxy Effect — Simplified Canvas 2D with optional WebGL fallback */
(function(){
  function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  const isMob = isMobile();
  const NUM_STARS = isMob ? 300 : 800;
  const STAR_LAYERS = isMob ? 3 : 5;

  function createGalaxy(container, opts){
    const cfg = {
      hueShift: 40, saturation: 0.3, glowIntensity: 0.5,
      twinkleIntensity: 0.4, density: 0.8, rotationSpeed: 0.05,
      mouseRepulsion: true, repulsionStrength: 1.5
    };
    for(const k in opts) if(opts[k] !== undefined) cfg[k] = opts[k];

    // Use Canvas 2D for reliability
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'width:100%;height:100%;display:block;position:absolute;top:0;left:0;background:transparent;z-index:0;';
    container.appendChild(canvas);

    const ctx = canvas.getContext('2d', { alpha: true });
    if(!ctx) {
      console.warn('Canvas 2D not supported, hiding galaxy');
      container.style.display = 'none';
      return;
    }

    let stars = [];
    let time = 0;
    
    // Generate star field
    function generateStars() {
      stars = [];
      for(let layer = 0; layer < STAR_LAYERS; layer++) {
        const layerDepth = layer / STAR_LAYERS;
        const layerCount = Math.floor(NUM_STARS / STAR_LAYERS);
        for(let i = 0; i < layerCount; i++) {
          const angle = Math.random() * Math.PI * 2;
          const radius = Math.random() * 0.5;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          stars.push({
            layer: layer,
            depth: layerDepth,
            angle: angle,
            radius: radius,
            x: x,
            y: y,
            size: 0.01 + Math.random() * 0.03,
            twinkle: Math.random() * Math.PI * 2,
            baseTwinkle: Math.random() * 0.5 + 0.5,
            hue: 40 + Math.random() * 20,
            bright: 0.5 + Math.random() * 0.5
          });
        }
      }
    }

    let mouseX = 0.5;
    let mouseY = 0.5;
    let mouseActive = 0;
    let smoothX = 0.5;
    let smoothY = 0.5;
    let smoothActive = 0;

    function resize() {
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      if(w === 0 || h === 0) return;
      canvas.width = w;
      canvas.height = h;
    }

    function render() {
      const w = canvas.width;
      const h = canvas.height;
      const maxDim = Math.max(w, h);
      
      ctx.clearRect(0, 0, w, h);

      time += 0.016;

      // Rotate the entire starfield slowly
      const rotation = time * 0.02;

      stars.forEach(star => {
        // Calculate star position with rotation
        const angle = star.angle + rotation;
        const sr = star.radius;
        const depth = star.depth;
        const scale = (depth + 1) * maxDim * 0.3;

        // Apply mouse repulsion
        let mx = star.x;
        let my = star.y;
        if(cfg.mouseRepulsion && !isMob) {
          const dx = star.x - smoothX;
          const dy = star.y - smoothY;
          const dist = Math.sqrt(dx*dx + dy*dy);
          if(dist < 0.2) {
            const repelForce = (1 - dist / 0.2) * 0.02 * cfg.repulsionStrength * smoothActive;
            mx += (dx / dist || 0) * repelForce;
            my += (dy / dist || 0) * repelForce;
          }
        }

        // Convert to screen coordinates
        const screenX = (mx * Math.cos(rotation) - my * Math.sin(rotation)) * scale + w/2;
        const screenY = (mx * Math.sin(rotation) + my * Math.cos(rotation)) * scale + h/2;

        // Skip stars outside the view
        if(screenX < -20 || screenX > w + 20 || screenY < -20 || screenY > h + 20) return;

        // Twinkle effect
        const twinkle = Math.sin(time * 2 + star.twinkle) * 0.3 + 0.7;
        const finalTwinkle = star.baseTwinkle * twinkle;

        // Calculate size and brightness based on depth
        const size = star.size * scale * 0.3 * (0.5 + finalTwinkle * 0.5);
        const opacity = star.bright * finalTwinkle * (0.3 + depth * 0.7) * cfg.glowIntensity;

        // Draw star with glow
        const hue = (star.hue + cfg.hueShift) % 360;
        ctx.fillStyle = `hsla(${hue}, ${cfg.saturation * 100}%, 80%, ${opacity})`;
        
        // Draw glow (larger, more transparent)
        const gradient = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, size * 4);
        gradient.addColorStop(0, `hsla(${hue}, ${cfg.saturation * 100}%, 80%, ${opacity * 0.6})`);
        gradient.addColorStop(1, `hsla(${hue}, ${cfg.saturation * 100}%, 80%, 0)`);
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(screenX, screenY, size * 4, 0, Math.PI * 2);
        ctx.fill();

        // Draw star core
        ctx.fillStyle = `hsla(${hue}, ${cfg.saturation * 100}%, 95%, ${opacity * 1.5})`;
        ctx.beginPath();
        ctx.arc(screenX, screenY, Math.max(size * 0.5, 1), 0, Math.PI * 2);
        ctx.fill();
      });
    }

    let frameId;
    let lastTime = performance.now();
    let frameCount = 0;

    function loop(timestamp) {
      frameId = requestAnimationFrame(loop);
      
      // Throttle frame rate on mobile for performance
      if(isMob) {
        const elapsed = timestamp - lastTime;
        if(elapsed < 33) return; // ~30fps cap on mobile
      }
      lastTime = timestamp;

      smoothX += (mouseX - smoothX) * 0.1;
      smoothY += (mouseY - smoothY) * 0.1;
      smoothActive += (mouseActive - smoothActive) * 0.1;

      render();
    }

    function onMove(e) {
      const r = container.getBoundingClientRect();
      mouseX = (e.clientX - r.left) / r.width;
      mouseY = 1.0 - (e.clientY - r.top) / r.height;
      mouseActive = 1.0;
    }
    function onLeave() { mouseActive = 0; }

    generateStars();
    resize();
    frameId = requestAnimationFrame(loop);

    if(cfg.mouseRepulsion && !isMob) {
      container.addEventListener('mousemove', onMove);
      container.addEventListener('mouseleave', onLeave);
    }
    window.addEventListener('resize', resize);

    console.log('Galaxy Canvas rendering started:', isMob ? 'mobile optimized' : 'desktop full');

    return { destroy: function(){
      cancelAnimationFrame(frameId);
      container.removeEventListener('mousemove', onMove);
      container.removeEventListener('mouseleave', onLeave);
      window.removeEventListener('resize', resize);
      if(canvas.parentNode) canvas.parentNode.removeChild(canvas);
    }};
  }

  window.createGalaxy = createGalaxy;
})();
