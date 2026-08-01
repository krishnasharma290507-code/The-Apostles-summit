/* Galaxy Effect — Immersive Canvas 2D starfield with rich twinkling */
(function(){
  function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  const isMob = isMobile();
  const NUM_STARS = isMob ? 300 : 1000;
  const STAR_LAYERS = isMob ? 3 : 6;

  function createGalaxy(container, opts){
    const cfg = {
      hueShift: 40, saturation: 0.3, glowIntensity: 0.6,
      twinkleIntensity: 0.5, density: 0.8, rotationSpeed: 0.05,
      mouseRepulsion: true, repulsionStrength: 1.5
    };
    for(const k in opts) if(opts[k] !== undefined) cfg[k] = opts[k];

    // Create canvas
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

    // Enhanced star generation with varied twinkle patterns
    function generateStars() {
      stars = [];
      for(let layer = 0; layer < STAR_LAYERS; layer++) {
        const layerDepth = layer / STAR_LAYERS;
        const layerCount = Math.floor(NUM_STARS / STAR_LAYERS);

        // Each layer has different twinkle characteristics
        const layerTwinkleSpeed = 0.5 + layer * 0.3;
        const layerTwinkleAmp = 0.3 + layer * 0.1;

        for(let i = 0; i < layerCount; i++) {
          const angle = Math.random() * Math.PI * 2;
          const radius = Math.random() * 0.6 + (layer * 0.1);
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;

          // More diverse star properties
          const twinkleOffset = Math.random() * Math.PI * 2;
          const twinkleFreq = 0.7 + Math.random() * 0.8;

          // Some stars twinkle faster, some slower
          const twinklePattern = Math.random();
          let twinkleType = 'sine';
          let twinkleSpeedMultiplier = 1;
          if(twinklePattern > 0.8) {
            // Pulsing stars (slow)
            twinkleType = 'pulse';
            twinkleSpeedMultiplier = 0.3;
          } else if(twinklePattern > 0.6) {
            // Fast twinkling stars
            twinkleType = 'fast';
            twinkleSpeedMultiplier = 2.5;
          }

          // Add some stars that flicker randomly
          const flickerChance = Math.random();

          stars.push({
            layer: layer,
            depth: layerDepth,
            angle: angle,
            radius: radius,
            x: x,
            y: y,
            size: 0.005 + Math.random() * 0.04,
            twinkleOffset: twinkleOffset,
            twinkleFreq: twinkleFreq,
            twinkleType: twinkleType,
            twinkleSpeedMult: twinkleSpeedMultiplier,
            baseTwinkle: Math.random() * 0.4 + 0.6,
            hue: 30 + Math.random() * 40,
            bright: 0.5 + Math.random() * 0.5,
            flickerChance: flickerChance,
            layerTwinkleSpeed: layerTwinkleSpeed,
            layerTwinkleAmp: layerTwinkleAmp,
            // Add some star color variation
            colorType: Math.random() > 0.7 ? 'blue' : Math.random() > 0.5 ? 'warm' : 'white'
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

    function getStarTwinkle(star, t) {
      const baseTime = t * 0.3;

      switch(star.twinkleType) {
        case 'pulse':
          // Slow pulsing for distant stars
          return Math.sin(baseTime * 0.5 + star.twinkleOffset) * 0.15 + 0.85;
        case 'fast':
          // Faster flickering for bright stars
          return Math.abs(Math.sin(baseTime * 2.0 + star.twinkleOffset)) * 0.2 + 0.8;
        default:
          // Subtle twinkling
          return Math.sin(baseTime + star.twinkleOffset) * 0.12 + 0.88;
      }
    }

    function render() {
      const w = canvas.width;
      const h = canvas.height;
      const maxDim = Math.max(w, h);

      ctx.clearRect(0, 0, w, h);

      time += 0.016;

      // Rotate the entire starfield slowly
      const rotation = time * 0.03;

      stars.forEach(star => {
        // Calculate star position with rotation
        const angle = star.angle + rotation;
        const depth = star.depth;
        const scale = (depth + 1) * maxDim * 0.15;

        // Apply mouse repulsion
        let mx = star.x;
        let my = star.y;
        if(cfg.mouseRepulsion && !isMob) {
          const dx = star.x - smoothX;
          const dy = star.y - smoothY;
          const dist = Math.sqrt(dx*dx + dy*dy);
          if(dist < 0.3) {
            const repelForce = (1 - dist / 0.3) * 0.03 * cfg.repulsionStrength * smoothActive;
            mx += (dx / dist || 0) * repelForce;
            my += (dy / dist || 0) * repelForce;
          }
        }

        // Convert to screen coordinates
        const screenX = (mx * Math.cos(rotation) - my * Math.sin(rotation)) * scale + w/2;
        const screenY = (mx * Math.sin(rotation) + my * Math.cos(rotation)) * scale + h/2;

        // Skip stars outside the view
        if(screenX < -10 || screenX > w + 10 || screenY < -10 || screenY > h + 10) return;

        // Get twinkle value for this star
        let twinkleVal = getStarTwinkle(star, time);

        // Add random flicker for special stars
        if(star.flickerChance > 0.9) {
          twinkleVal *= 0.8 + Math.random() * 0.2;
        }

        const finalTwinkle = star.baseTwinkle * twinkleVal;

        // Calculate size and brightness based on depth - smaller for distant stars
        const size = star.size * scale * 0.05;
        let opacity = star.bright * finalTwinkle * (0.3 + depth * 0.7) * cfg.glowIntensity;

        // Color based on star type
        let hue = star.hue + cfg.hueShift;
        if(star.colorType === 'blue') {
          hue = 200 + Math.random() * 40;
        } else if(star.colorType === 'warm') {
          hue = 20 + Math.random() * 30;
        }

        hue = hue % 360;

        // Draw glow ONLY for the brightest stars
        if(size > 1.5 && opacity > 0.6) {
          const gradient = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, size * 3);
          gradient.addColorStop(0, `hsla(${hue}, 100%, 95%, ${opacity * 0.6})`);
          gradient.addColorStop(1, `hsla(${hue}, 100%, 95%, 0)`);
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(screenX, screenY, size * 3, 0, Math.PI * 2);
          ctx.fill();
        }

        // Draw star core - small and sharp, not large
        ctx.fillStyle = `hsla(${hue}, 100%, 95%, ${opacity})`;
        ctx.beginPath();
        ctx.arc(screenX, screenY, Math.max(size * 0.5, 0.3), 0, Math.PI * 2);
        ctx.fill();
      });
    }

    let frameId;
    let lastTime = performance.now();
    let lastFrameTime = 0;
    const MIN_FRAME_TIME = isMob ? 33 : 16; // 30fps mobile, 60fps desktop

    function loop(timestamp) {
      frameId = requestAnimationFrame(loop);

      // Throttle frame rate for performance
      const elapsed = timestamp - lastFrameTime;
      if(elapsed < MIN_FRAME_TIME) return;
      lastFrameTime = timestamp;

      smoothX += (mouseX - smoothX) * 0.08;
      smoothY += (mouseY - smoothY) * 0.08;
      smoothActive += (mouseActive - smoothActive) * 0.08;

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
