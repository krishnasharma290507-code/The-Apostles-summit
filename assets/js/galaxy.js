/* Galaxy Effect — Simple, reliable Canvas 2D starfield with comets and black holes */
(function(){
  function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  const isMob = isMobile();
  
  function createGalaxy(container, opts){
    const cfg = Object.assign({
      hueShift: 40, saturation: 0.3, glowIntensity: 1.0,
      twinkleIntensity: 0.5, density: 1.0, rotationSpeed: 0.05,
      mouseRepulsion: true, repulsionStrength: 1.5,
      numStars: isMob ? 500 : 1500,
      numComets: isMob ? 2 : 5,
      numBlackHoles: isMobile ? 1 : 3
    }, opts || {});

    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.className = 'galaxy-canvas';
    container.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    if(!ctx) {
      console.warn('Canvas 2D not supported');
      return;
    }

    let time = 0;
    let stars = [];
    let comets = [];
    let blackHoles = [];

    // Generate stars with proper positioning
    function generateStars() {
      stars = [];
      const numStars = cfg.numStars;
      
      for(let i = 0; i < numStars; i++) {
        stars.push({
          x: Math.random(),
          y: Math.random(),
          z: Math.random(), // 0 to 1, simulates depth
          size: 0.3 + Math.random() * 1.5,
          twinkleOffset: Math.random() * Math.PI * 2,
          twinkleSpeed: 0.5 + Math.random() * 2,
          hue: 30 + Math.random() * 40,
          bright: 0.4 + Math.random() * 0.6,
          colorType: Math.random() > 0.7 ? 'blue' : Math.random() > 0.5 ? 'warm' : 'white'
        });
      }
    }

    // Generate comets
    function generateComets() {
      comets = [];
      const numComets = cfg.numComets;
      
      for(let i = 0; i < numComets; i++) {
        comets.push({
          active: false,
          x: 0,
          y: 0,
          vx: 0,
          vy: 0,
          trail: [],
          lastSpawn: 0,
          spawnInterval: 10 + Math.random() * 20
        });
      }
    }

    // Generate black holes
    function generateBlackHoles() {
      blackHoles = [];
      const numBlackHoles = cfg.numBlackHoles;
      
      for(let i = 0; i < numBlackHoles; i++) {
        let validPos = false;
        let x, y;
        
        // Find position not too close to center
        while(!validPos) {
          x = 0.15 + Math.random() * 0.7;
          y = 0.15 + Math.random() * 0.7;
          const distToCenter = Math.sqrt((x - 0.5) * (x - 0.5) + (y - 0.5) * (y - 0.5));
          if(distToCenter > 0.25) validPos = true;
        }
        
        blackHoles.push({
          x: x,
          y: y,
          size: 15 + Math.random() * 25,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.002
        });
      }
    }

    // Update comet positions
    function updateComets() {
      time += 0.016;
      
      comets.forEach((comet, i) => {
        if(!comet.active) {
          comet.lastSpawn += 0.016;
          if(comet.lastSpawn > comet.spawnInterval) {
            comet.active = true;
            const angle = Math.random() * Math.PI * 2;
            comet.x = 0.5 + Math.cos(angle) * 0.45;
            comet.y = 0.5 + Math.sin(angle) * 0.45;
            comet.vx = (Math.random() - 0.5) * 0.003;
            comet.vy = (Math.random() - 0.5) * 0.003;
            comet.trail = [];
            comet.lastSpawn = 0;
          }
        } else {
          comet.x += comet.vx;
          comet.y += comet.vy;
          comet.trail.push({x: comet.x, y: comet.y});
          if(comet.trail.length > 20) comet.trail.shift();
          
          const distToCenter = Math.sqrt((comet.x - 0.5) * (comet.x - 0.5) + (comet.y - 0.5) * (comet.y - 0.5));
          if(distToCenter > 0.5 || comet.trail.length > 20) {
            comet.active = false;
            comet.trail = [];
          }
        }
      });
    }

    // Render black hole with accretion disk
    function renderBlackHole(ctx, bh, w, h, maxDim) {
      const screenX = bh.x * w;
      const screenY = bh.y * h;
      const size = bh.size * (0.5 + 0.5 * Math.sin(time + bh.x * 10));
      
      // Accretion disk
      const gradient = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, size);
      gradient.addColorStop(0, 'rgba(255, 100, 0, 0.8)');
      gradient.addColorStop(0.5, 'rgba(255, 50, 0, 0.4)');
      gradient.addColorStop(1, 'rgba(100, 0, 100, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(screenX, screenY, size, 0, Math.PI * 2);
      ctx.fill();
      
      // Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
      ctx.beginPath();
      ctx.arc(screenX, screenY, size * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Render everything
    function render() {
      const w = canvas.width;
      const h = canvas.height;
      const maxDim = Math.max(w, h);

      ctx.clearRect(0, 0, w, h);

      // Rotate starfield
      const rotation = time * 0.02;

      // Draw stars
      stars.forEach(star => {
        // Apply rotation to star position
        const cos = Math.cos(rotation + star.z);
        const sin = Math.sin(rotation + star.z);
        const cx = 0.5;
        const cy = 0.5;
        const x = cx + (star.x - cx) * cos - (star.y - cy) * sin;
        const y = cy + (star.x - cx) * sin + (star.y - cy) * cos;

        // Apply mouse repulsion
        let mouseX = 0.5, mouseY = 0.5;
        let px = x, py = y;

        const dx = x - mouseX;
        const dy = y - mouseY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if(dist < 0.15 && cfg.mouseRepulsion && !isMob) {
          const repelForce = (1 - dist / 0.15) * 0.02;
          px += (dx / dist || 0) * repelForce;
          py += (dy / dist || 0) * repelForce;
        }

        // Convert to screen coordinates
        const screenX = px * w;
        const screenY = py * h;

        // Skip stars outside the view
        if(screenX < -10 || screenX > w + 10 || screenY < -10 || screenY > h + 10) return;

        // Twinkle effect
        const twinkle = Math.sin(time * star.twinkleSpeed + star.twinkleOffset) * 0.15 + 0.85;
        const finalTwinkle = star.bright * twinkle;

        // Size based on depth (closer stars are bigger)
        const size = star.size * (0.5 + star.z * 0.5) * (2 + finalTwinkle);

        // Color based on star type
        let hue = star.hue + cfg.hueShift;
        if(star.colorType === 'blue') {
          hue = 190 + Math.random() * 40;
        } else if(star.colorType === 'warm') {
          hue = 30 + Math.random() * 30;
        }
        hue = hue % 360;

        // Draw star
        ctx.fillStyle = `hsla(${hue}, 100%, 90%, ${finalTwinkle})`;
        ctx.beginPath();
        ctx.arc(screenX, screenY, Math.max(size, 0.5), 0, Math.PI * 2);
        ctx.fill();

        // Draw glow for brighter stars
        if(size > 1 && finalTwinkle > 0.5) {
          const gradient = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, size * 3);
          gradient.addColorStop(0, `hsla(${hue}, 100%, 90%, ${finalTwinkle * 0.4})`);
          gradient.addColorStop(1, `hsla(${hue}, 100%, 90%, 0)`);
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(screenX, screenY, size * 3, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Draw comets
      comets.forEach(comet => {
        if(!comet.active) return;
        
        const x = comet.x * w;
        const y = comet.y * h;
        
        // Draw trail
        if(comet.trail.length > 1) {
          ctx.strokeStyle = 'hsla(200, 100%, 90%, 0.5)';
          ctx.lineWidth = 1;
          ctx.lineJoin = 'round';
          ctx.lineCap = 'round';
          ctx.beginPath();
          for(let j = 0; j < comet.trail.length - 1; j++) {
            const tx1 = comet.trail[j].x * w;
            const ty1 = comet.trail[j].y * h;
            const tx2 = comet.trail[j + 1].x * w;
            const ty2 = comet.trail[j + 1].y * h;
            if(j === 0) ctx.moveTo(tx1, ty1);
            ctx.lineTo(tx2, ty2);
          }
          ctx.stroke();
        }
        
        // Draw comet head
        ctx.fillStyle = 'hsla(200, 100%, 95%, 0.9)';
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw black holes
      blackHoles.forEach(bh => {
        renderBlackHole(ctx, bh, w, h, maxDim);
      });
    }

    let frameId;
    let lastFrameTime = 0;
    const MIN_FRAME_TIME = isMob ? 33 : 16;

    function loop(timestamp) {
      frameId = requestAnimationFrame(loop);
      
      const elapsed = timestamp - lastFrameTime;
      if(elapsed < MIN_FRAME_TIME) return;
      lastFrameTime = timestamp;

      render();
    }

    // Initialize
    resize();
    generateStars();
    generateComets();
    generateBlackHoles();
    frameId = requestAnimationFrame(loop);

    function resize() {
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      if(w === 0 || h === 0) return;
      canvas.width = w;
      canvas.height = h;
    }
    window.addEventListener('resize', resize);

    console.log('Galaxy Canvas started:', { stars: cfg.numStars, comets: cfg.numComets, blackHoles: cfg.numBlackHoles, mobile: isMob });

    return { destroy: function(){
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', resize);
      if(canvas.parentNode) canvas.parentNode.removeChild(canvas);
    }};
  }

  window.createGalaxy = createGalaxy;
})();
