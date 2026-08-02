/* Sky Background — Simple twinkling stars for all pages */
(function(){
  function initSkybg() {
    const body = document.body;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    const container = document.createElement('div');
    container.className = 'skybg-container';
    container.style.cssText = 'position:fixed;inset:0;z-index:0;pointer-events:none;overflow:hidden;';
    body.insertBefore(container, body.firstChild);

    const canvas = document.createElement('canvas');
    canvas.className = 'skybg-canvas';
    canvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;display:block;';
    container.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    if(!ctx) return;

    const numStars = isMobile ? 300 : 800;
    let stars = [];
    let time = 0;

    function generateStars() {
      stars = [];
      for(let i = 0; i < numStars; i++) {
        stars.push({
          x: Math.random(),
          y: Math.random(),
          baseX: Math.random(),
          baseY: Math.random(),
          size: Math.random() * 1.5 + 0.3,
          twinkleOffset: Math.random() * Math.PI * 2,
          twinkleSpeed: 0.3 + Math.random() * 1.5,
          hue: 30 + Math.random() * 40,
          bright: 0.3 + Math.random() * 0.7,
          colorType: Math.random() > 0.7 ? 'blue' : Math.random() > 0.5 ? 'warm' : 'white',
          drift: Math.random() * 0.0005
        });
      }
    }

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1 : 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.scale(dpr, dpr);
    }

    function render() {
      const w = canvas.width;
      const h = canvas.height;
      
      ctx.clearRect(0, 0, w, h);

      time += 0.016;

      stars.forEach(star => {
        // Gentle drift
        star.baseX += (Math.random() - 0.5) * star.drift;
        star.baseY += (Math.random() - 0.5) * star.drift * 0.5;
        
        // Keep within bounds
        if(star.baseX < 0) star.baseX = 1;
        if(star.baseX > 1) star.baseX = 0;
        if(star.baseY < 0) star.baseY = 1;
        if(star.baseY > 1) star.baseY = 0;

        const screenX = star.baseX * w;
        const screenY = star.baseY * h;

        // Twinkle effect
        const twinkle = Math.sin(time * star.twinkleSpeed + star.twinkleOffset) * 0.3 + 0.7;
        const finalTwinkle = star.bright * twinkle;

        // Color based on star type
        let hue = star.hue + 40;
        if(star.colorType === 'blue') {
          hue = 190 + Math.random() * 40;
        } else if(star.colorType === 'warm') {
          hue = 30 + Math.random() * 30;
        }
        hue = hue % 360;

        // Draw star
        ctx.fillStyle = `hsla(${hue}, 100%, 85%, ${Math.min(finalTwinkle, 1)})`;
        ctx.beginPath();
        ctx.arc(screenX, screenY, Math.max(star.size, 0.5), 0, Math.PI * 2);
        ctx.fill();

        // Glow for brighter stars
        if(star.size > 1 && finalTwinkle > 0.4) {
          const gradient = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, star.size * 3);
          gradient.addColorStop(0, `hsla(${hue}, 100%, 90%, ${finalTwinkle * 0.3})`);
          gradient.addColorStop(1, `hsla(${hue}, 100%, 90%, 0)`);
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(screenX, screenY, star.size * 3, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Occasionally draw comets
      if(Math.random() < 0.01 && !isMobile) {
        drawComet(w, h);
      }
    }

    function drawComet(w, h) {
      const startX = Math.random() * w;
      const startY = Math.random() * h * 0.5;
      const endX = startX + (Math.random() - 0.5) * 200;
      const endY = startY + (Math.random() - 0.5) * 200;
      
      const gradient = ctx.createLinearGradient(startX, startY, endX, endY);
      gradient.addColorStop(0, 'hsla(200, 100%, 95%, 0.6)');
      gradient.addColorStop(1, 'hsla(200, 100%, 95%, 0)');
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 1 + Math.random() * 2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    }

    let frameId;
    let lastTime = 0;
    const MIN_FRAME = isMobile ? 50 : 33; // 20fps mobile, 30fps desktop

    function loop(timestamp) {
      frameId = requestAnimationFrame(loop);
      const elapsed = timestamp - lastTime;
      if(elapsed < MIN_FRAME) return;
      lastTime = timestamp;
      render();
    }

    generateStars();
    resize();
    window.addEventListener('resize', resize);
    frameId = requestAnimationFrame(loop);

    window.skybg = { destroy: function() {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', resize);
      if(container.parentNode) container.parentNode.removeChild(container);
    }};
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSkybg);
  } else {
    initSkybg();
  }
})();
