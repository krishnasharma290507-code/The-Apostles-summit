/* StaggeredMenu — Vanilla JS port using GSAP */
(function(){
  function createStaggeredMenu(container, opts){
    var cfg = {
      position: 'right',
      colors: ['#B497CF', '#5227FF'],
      items: [],
      socialItems: [],
      displaySocials: true,
      displayItemNumbering: true,
      logoUrl: '',
      menuButtonColor: '#fff',
      openMenuButtonColor: '#fff',
      accentColor: '#5227FF',
      changeMenuColorOnOpen: true,
      closeOnClickAway: true,
      onMenuOpen: null,
      onMenuClose: null
    };
    for(var k in opts) cfg[k] = opts[k];

    var gsap = window.gsap;
    if(!gsap){ console.error('GSAP not loaded'); return; }

    var open = false;
    var busy = false;

    // Build HTML
    var wrapper = document.createElement('div');
    wrapper.className = 'staggered-menu-wrapper';
    wrapper.setAttribute('data-position', cfg.position);
    if(cfg.accentColor) wrapper.style.setProperty('--sm-accent', cfg.accentColor);

    // Pre-layers
    var preLayers = document.createElement('div');
    preLayers.className = 'sm-prelayers';
    preLayers.setAttribute('aria-hidden', 'true');

    var colors = cfg.colors && cfg.colors.length ? cfg.colors.slice(0,4) : ['#1e1e22','#35353c'];
    var arr = colors.slice();
    if(arr.length >= 3){ var mid = Math.floor(arr.length/2); arr.splice(mid,1); }
    for(var i=0;i<arr.length;i++){
      var layer = document.createElement('div');
      layer.className = 'sm-prelayer';
      layer.style.background = arr[i];
      preLayers.appendChild(layer);
    }

    // Header
    var header = document.createElement('header');
    header.className = 'staggered-menu-header';
    header.setAttribute('aria-label', 'Main navigation header');

    var logo = document.createElement('div');
    logo.className = 'sm-logo';
    logo.setAttribute('aria-label', 'Logo');
    if(cfg.logoUrl){
      var img = document.createElement('img');
      img.src = cfg.logoUrl;
      img.alt = 'Logo';
      img.className = 'sm-logo-img';
      img.draggable = false;
      img.width = 110;
      img.height = 24;
      logo.appendChild(img);
    }

    var toggle = document.createElement('button');
    toggle.className = 'sm-toggle';
    toggle.setAttribute('aria-label', 'Open menu');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('type', 'button');

    var textWrap = document.createElement('span');
    textWrap.className = 'sm-toggle-textWrap';
    var textInner = document.createElement('span');
    textInner.className = 'sm-toggle-textInner';
    ['Menu','Close'].forEach(function(l){
      var line = document.createElement('span');
      line.className = 'sm-toggle-line';
      line.textContent = l;
      textInner.appendChild(line);
    });
    textWrap.appendChild(textInner);

    var icon = document.createElement('span');
    icon.className = 'sm-icon';
    icon.setAttribute('aria-hidden', 'true');
    var plusH = document.createElement('span');
    plusH.className = 'sm-icon-line';
    var plusV = document.createElement('span');
    plusV.className = 'sm-icon-line sm-icon-line-v';
    icon.appendChild(plusH);
    icon.appendChild(plusV);

    toggle.appendChild(textWrap);
    toggle.appendChild(icon);

    header.appendChild(logo);
    header.appendChild(toggle);

    // Panel
    var panel = document.createElement('aside');
    panel.id = 'staggered-menu-panel';
    panel.className = 'staggered-menu-panel';
    panel.setAttribute('aria-hidden', 'true');

    var panelInner = document.createElement('div');
    panelInner.className = 'sm-panel-inner';

    var list = document.createElement('ul');
    list.className = 'sm-panel-list';
    if(cfg.displayItemNumbering) list.setAttribute('data-numbering', '');

    if(cfg.items && cfg.items.length){
      cfg.items.forEach(function(it, idx){
        var li = document.createElement('li');
        li.className = 'sm-panel-itemWrap';
        var a = document.createElement('a');
        a.className = 'sm-panel-item';
        a.href = it.link;
        a.setAttribute('aria-label', it.ariaLabel || it.label);
        a.setAttribute('data-index', idx+1);
        var label = document.createElement('span');
        label.className = 'sm-panel-itemLabel';
        label.textContent = it.label;
        a.appendChild(label);
        li.appendChild(a);
        list.appendChild(li);
      });
    } else {
      var li = document.createElement('li');
      li.className = 'sm-panel-itemWrap';
      li.setAttribute('aria-hidden','true');
      var span = document.createElement('span');
      span.className = 'sm-panel-item';
      var label = document.createElement('span');
      label.className = 'sm-panel-itemLabel';
      label.textContent = 'No items';
      span.appendChild(label);
      li.appendChild(span);
      list.appendChild(li);
    }

    panelInner.appendChild(list);

    if(cfg.displaySocials && cfg.socialItems && cfg.socialItems.length){
      var socials = document.createElement('div');
      socials.className = 'sm-socials';
      socials.setAttribute('aria-label', 'Social links');
      var socialTitle = document.createElement('h3');
      socialTitle.className = 'sm-socials-title';
      socialTitle.textContent = 'Socials';
      socials.appendChild(socialTitle);
      var socialList = document.createElement('ul');
      socialList.className = 'sm-socials-list';
      socialList.setAttribute('role', 'list');
      cfg.socialItems.forEach(function(s){
        var sli = document.createElement('li');
        sli.className = 'sm-socials-item';
        var sa = document.createElement('a');
        sa.href = s.link;
        sa.target = '_blank';
        sa.rel = 'noopener noreferrer';
        sa.className = 'sm-socials-link';
        sa.textContent = s.label;
        sli.appendChild(sa);
        socialList.appendChild(sli);
      });
      socials.appendChild(socialList);
      panelInner.appendChild(socials);
    }

    panel.appendChild(panelInner);

    wrapper.appendChild(preLayers);
    wrapper.appendChild(header);
    wrapper.appendChild(panel);
    container.appendChild(wrapper);

    // GSAP animations
    var preLayerEls = preLayers.querySelectorAll('.sm-prelayer');
    var offscreen = cfg.position === 'left' ? -100 : 100;

    gsap.set([panel, ...preLayerEls], { xPercent: offscreen, opacity: 1 });
    gsap.set(preLayers, { xPercent: 0, opacity: 1 });
    gsap.set(plusH, { transformOrigin: '50% 50%', rotate: 0 });
    gsap.set(plusV, { transformOrigin: '50% 50%', rotate: 90 });
    gsap.set(icon, { rotate: 0, transformOrigin: '50% 50%' });
    gsap.set(textInner, { yPercent: 0 });
    gsap.set(toggle, { color: cfg.menuButtonColor });

    var openTl = null;
    var closeTween = null;
    var spinTween = null;
    var textCycleAnim = null;
    var colorTween = null;

    function buildOpenTimeline(){
      if(openTl) openTl.kill();
      if(closeTween){ closeTween.kill(); closeTween = null; }

      var itemEls = panel.querySelectorAll('.sm-panel-itemLabel');
      var numberEls = panel.querySelectorAll('.sm-panel-list[data-numbering] .sm-panel-item');
      var socialTitle = panel.querySelector('.sm-socials-title');
      var socialLinks = panel.querySelectorAll('.sm-socials-link');

      var layerStates = Array.from(preLayerEls).map(function(el){
        return { el: el, start: offscreen };
      });

      if(itemEls.length) gsap.set(itemEls, { yPercent: 140, rotate: 10 });
      if(numberEls.length) gsap.set(numberEls, { '--sm-num-opacity': 0 });
      if(socialTitle) gsap.set(socialTitle, { opacity: 0 });
      if(socialLinks.length) gsap.set(socialLinks, { y: 25, opacity: 0 });

      var tl = gsap.timeline({ paused: true });

      layerStates.forEach(function(ls, i){
        tl.fromTo(ls.el, { xPercent: ls.start }, { xPercent: 0, duration: 0.5, ease: 'power4.out' }, i * 0.07);
      });

      var lastTime = layerStates.length ? (layerStates.length - 1) * 0.07 : 0;
      var panelInsertTime = lastTime + (layerStates.length ? 0.08 : 0);
      var panelDuration = 0.65;

      tl.fromTo(panel, { xPercent: offscreen }, { xPercent: 0, duration: panelDuration, ease: 'power4.out' }, panelInsertTime);

      if(itemEls.length){
        var itemsStart = panelInsertTime + panelDuration * 0.15;
        tl.to(itemEls, {
          yPercent: 0, rotate: 0, duration: 1, ease: 'power4.out',
          stagger: { each: 0.1, from: 'start' }
        }, itemsStart);
        if(numberEls.length){
          tl.to(numberEls, {
            duration: 0.6, ease: 'power2.out',
            '--sm-num-opacity': 1,
            stagger: { each: 0.08, from: 'start' }
          }, itemsStart + 0.1);
        }
      }

      if(socialTitle || socialLinks.length){
        var socialsStart = panelInsertTime + panelDuration * 0.4;
        if(socialTitle){
          tl.to(socialTitle, { opacity: 1, duration: 0.5, ease: 'power2.out' }, socialsStart);
        }
        if(socialLinks.length){
          tl.to(socialLinks, {
            y: 0, opacity: 1, duration: 0.55, ease: 'power3.out',
            stagger: { each: 0.08, from: 'start' },
            onComplete: function(){ gsap.set(socialLinks, { clearProps: 'opacity' }); }
          }, socialsStart + 0.04);
        }
      }

      openTl = tl;
      return tl;
    }

    function playOpen(){
      if(busy) return;
      busy = true;
      var tl = buildOpenTimeline();
      if(tl){
        tl.eventCallback('onComplete', function(){ busy = false; });
        tl.play(0);
      } else { busy = false; }
    }

    function playClose(){
      if(openTl){ openTl.kill(); openTl = null; }
      if(closeTween) closeTween.kill();
      var all = Array.from(preLayerEls).concat([panel]);
      closeTween = gsap.to(all, {
        xPercent: offscreen,
        duration: 0.32,
        ease: 'power3.in',
        overwrite: 'auto',
        onComplete: function(){
          var itemEls = panel.querySelectorAll('.sm-panel-itemLabel');
          if(itemEls.length) gsap.set(itemEls, { yPercent: 140, rotate: 10 });
          var numberEls = panel.querySelectorAll('.sm-panel-list[data-numbering] .sm-panel-item');
          if(numberEls.length) gsap.set(numberEls, { '--sm-num-opacity': 0 });
          var socialTitle = panel.querySelector('.sm-socials-title');
          var socialLinks = panel.querySelectorAll('.sm-socials-link');
          if(socialTitle) gsap.set(socialTitle, { opacity: 0 });
          if(socialLinks.length) gsap.set(socialLinks, { y: 25, opacity: 0 });
          busy = false;
        }
      });
    }

    function animateIcon(opening){
      if(spinTween) spinTween.kill();
      if(opening){
        spinTween = gsap.to(icon, { rotate: 225, duration: 0.8, ease: 'power4.out', overwrite: 'auto' });
      } else {
        spinTween = gsap.to(icon, { rotate: 0, duration: 0.35, ease: 'power3.inOut', overwrite: 'auto' });
      }
    }

    function animateColor(opening){
      if(colorTween) colorTween.kill();
      if(cfg.changeMenuColorOnOpen){
        var target = opening ? cfg.openMenuButtonColor : cfg.menuButtonColor;
        colorTween = gsap.to(toggle, { color: target, delay: 0.18, duration: 0.3, ease: 'power2.out' });
      } else {
        gsap.set(toggle, { color: cfg.menuButtonColor });
      }
    }

    function toggleMenu(){
      var target = !open;
      open = target;
      wrapper.setAttribute('data-open', open ? '' : null);
      toggle.setAttribute('aria-expanded', open);
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      panel.setAttribute('aria-hidden', !open);

      if(target){
        if(cfg.onMenuOpen) cfg.onMenuOpen();
        playOpen();
      } else {
        if(cfg.onMenuClose) cfg.onMenuClose();
        playClose();
      }
      animateIcon(target);
      animateColor(target);
    }

    function closeMenu(){
      if(open){
        open = false;
        wrapper.setAttribute('data-open', null);
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-label', 'Open menu');
        panel.setAttribute('aria-hidden', 'true');
        if(cfg.onMenuClose) cfg.onMenuClose();
        playClose();
        animateIcon(false);
        animateColor(false);
      }
    }

    toggle.addEventListener('click', toggleMenu);

    if(cfg.closeOnClickAway){
      document.addEventListener('mousedown', function(e){
        if(open && !panel.contains(e.target) && !toggle.contains(e.target)){
          closeMenu();
        }
      });
    }

    return {
      toggle: toggleMenu,
      close: closeMenu,
      isOpen: function(){ return open; },
      destroy: function(){
        container.removeChild(wrapper);
      }
    };
  }

  window.createStaggeredMenu = createStaggeredMenu;
})();
