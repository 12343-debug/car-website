/**
 * NOCTIS — Main Scrollytelling Architecture
 * Vanilla JavaScript | 60fps rAF Loop | Responsive Canvas Scrubbing
 */

(function () {
  'use strict';

  // Check prefers-reduced-motion
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // --- Utility Functions ---
  const clamp = (val, min, max) => Math.min(Math.max(val, min), max);
  const lerp = (start, end, factor) => start + (end - start) * factor;

  // Pad numbers to 4 digits
  function pad4(n) {
    return String(n).padStart(4, '0');
  }

  // Determine if viewport is mobile (< 768px)
  function isMobileViewport() {
    return window.innerWidth < 768;
  }

  // ==========================================================================
  // 1. FILM GRAIN OVERLAY (8fps shifted noise canvas)
  // ==========================================================================
  function initFilmGrain() {
    const canvas = document.getElementById('grain-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const tileSize = 256;
    const offCanvas = document.createElement('canvas');
    offCanvas.width = tileSize;
    offCanvas.height = tileSize;
    const offCtx = offCanvas.getContext('2d');
    const imgData = offCtx.createImageData(tileSize, tileSize);
    const buf = new Uint32Array(imgData.data.buffer);

    // Generate static noise tile once
    for (let i = 0; i < buf.length; i++) {
      const val = Math.floor(Math.random() * 255);
      // RGBA: noise with moderate alpha
      buf[i] = (255 << 24) | (val << 16) | (val << 8) | val;
    }
    offCtx.putImageData(imgData, 0, 0);

    function resizeGrain() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resizeGrain);
    resizeGrain();

    let lastTime = 0;
    const interval = 1000 / 8; // 8 times per second

    function renderGrain(now) {
      if (now - lastTime >= interval) {
        lastTime = now;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const shiftX = Math.floor(Math.random() * tileSize);
        const shiftY = Math.floor(Math.random() * tileSize);

        // Pattern fill using repeated shifted tile
        const pattern = ctx.createPattern(offCanvas, 'repeat');
        ctx.save();
        ctx.translate(shiftX, shiftY);
        ctx.fillStyle = pattern;
        ctx.fillRect(-tileSize, -tileSize, canvas.width + tileSize * 2, canvas.height + tileSize * 2);
        ctx.restore();
      }
      requestAnimationFrame(renderGrain);
    }
    requestAnimationFrame(renderGrain);
  }

  // ==========================================================================
  // 2. CUSTOM CURSOR ("The Headlight")
  // ==========================================================================
  function initCustomCursor() {
    if (!window.matchMedia('(pointer: fine)').matches || prefersReducedMotion) {
      return;
    }

    const cursor = document.getElementById('custom-cursor');
    const label = document.getElementById('cursor-label');
    if (!cursor || !label) return;

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let cursorX = mouseX;
    let cursorY = mouseY;
    let isMouseDown = false;

    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    window.addEventListener('mousedown', () => {
      cursor.classList.add('cursor-down');
      setTimeout(() => {
        cursor.classList.remove('cursor-down');
      }, 120);
    });

    // Update cursor lerp loop
    function updateCursor() {
      cursorX = lerp(cursorX, mouseX, 0.18);
      cursorY = lerp(cursorY, mouseY, 0.18);
      cursor.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0) translate(-50%, -50%)`;
      requestAnimationFrame(updateCursor);
    }
    requestAnimationFrame(updateCursor);

    // Interactive element handlers for cursor morph
    function setCursorMode(mode, customText) {
      if (mode === 'morph') {
        cursor.classList.add('cursor-morph');
        label.textContent = customText || 'VIEW';
      } else {
        cursor.classList.remove('cursor-morph');
      }
    }

    document.addEventListener('mouseover', (e) => {
      const target = e.target.closest('a, button, [data-cursor], .lineup-slide');
      if (!target) {
        setCursorMode('default');
        return;
      }

      if (target.classList.contains('lineup-slide')) {
        const isOpen = target.classList.contains('active');
        setCursorMode('morph', isOpen ? 'CONFIGURE' : 'OPEN');
        return;
      }

      const customText = target.getAttribute('data-cursor') || 'VIEW';
      setCursorMode('morph', customText);
    });

    document.addEventListener('mouseout', (e) => {
      const target = e.target.closest('a, button, [data-cursor], .lineup-slide');
      if (target) {
        setCursorMode('default');
      }
    });
  }

  // ==========================================================================
  // 3. NAVIGATION HIDE/SHOW ON SCROLL
  // ==========================================================================
  function initNav() {
    const nav = document.getElementById('site-nav');
    if (!nav) return;
    let lastScrollY = window.scrollY;

    window.addEventListener('scroll', () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > 100 && currentScrollY > lastScrollY) {
        nav.classList.add('nav-hidden');
      } else {
        nav.classList.remove('nav-hidden');
      }
      lastScrollY = currentScrollY;
    }, { passive: true });
  }

  // ==========================================================================
  // 4. FRAME PRELOADER & ASYNC SEQUENCER
  // ==========================================================================
  class FrameSequence {
    constructor(cfg) {
      this.cfg = cfg;
      this.frameCount = cfg.frameCount;
      this.desktopPattern = cfg.desktopPattern;
      this.mobilePattern = cfg.mobilePattern;
      this.images = new Array(this.frameCount);
      this.loadedCount = 0;
      this.onProgress = null;
    }

    getFramePath(index, isMobile) {
      const numStr = pad4(index + 1);
      const pattern = isMobile ? this.mobilePattern : this.desktopPattern;
      return pattern.replace('%04d', numStr);
    }

    preloadRange(start, end, isMobile, onFinishRange) {
      let pending = end - start;
      if (pending <= 0) {
        if (onFinishRange) onFinishRange();
        return;
      }

      for (let i = start; i < end; i++) {
        const img = new Image();
        img.src = this.getFramePath(i, isMobile);
        this.images[i] = img;

        const handleLoad = () => {
          this.loadedCount++;
          if (this.onProgress) {
            this.onProgress(this.loadedCount);
          }
          pending--;
          if (pending === 0 && onFinishRange) {
            onFinishRange();
          }
        };

        if (img.decode) {
          img.decode().then(handleLoad).catch(handleLoad);
        } else {
          img.onload = handleLoad;
          img.onerror = handleLoad;
        }
      }
    }

    getNearestLoadedFrame(targetIndex) {
      const total = this.frameCount;
      const t = clamp(targetIndex, 0, total - 1);
      if (this.images[t] && this.images[t].complete && this.images[t].naturalWidth > 0) {
        return this.images[t];
      }
      let left = t - 1;
      let right = t + 1;
      while (left >= 0 || right < total) {
        if (left >= 0 && this.images[left] && this.images[left].complete && this.images[left].naturalWidth > 0) {
          return this.images[left];
        }
        if (right < total && this.images[right] && this.images[right].complete && this.images[right].naturalWidth > 0) {
          return this.images[right];
        }
        left--;
        right++;
      }
      return null;
    }
  }

  // ==========================================================================
  // 5. CANVAS RENDERER HELPER
  // ==========================================================================
  function drawFrame(ctx, canvas, img) {
    if (!img) return;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (w === 0 || h === 0) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.fillStyle = '#07080A';
    ctx.fillRect(0, 0, w, h);

    const isLandscape = w >= h;
    let dw, dh, dx, dy;

    if (isLandscape) {
      // Landscape: cover-fit
      const scale = Math.max(w / img.width, h / img.height);
      dw = img.width * scale;
      dh = img.height * scale;
      dx = (w - dw) / 2;
      dy = (h - dh) / 2;
    } else {
      // Portrait: contain-fit, vertically centered on --asphalt
      const scale = Math.min(w / img.width, h / img.height);
      dw = img.width * scale;
      dh = img.height * scale;
      dx = (w - dw) / 2;
      dy = (h - dh) / 2;
    }

    ctx.drawImage(img, dx, dy, dw, dh);
    ctx.restore();
  }

  // ==========================================================================
  // 6. STATEMENT SECTION WORD-BY-WORD REVEAL
  // ==========================================================================
  function initStatementSection() {
    const container = document.getElementById('statement-text');
    const section = document.getElementById('statement');
    if (!container || !section) return;

    const sentence = CONFIG.statement.text;
    const words = sentence.split(' ');
    container.innerHTML = words.map(word => `<span class="statement-word">${word}</span>`).join(' ');
    const wordElements = container.querySelectorAll('.statement-word');

    function updateStatement() {
      const rect = section.getBoundingClientRect();
      const winHeight = window.innerHeight;
      
      // Calculate progress through viewport center
      const start = winHeight;
      const end = -rect.height * 0.4;
      const progress = clamp((start - rect.top) / (start - end), 0, 1);

      const activeWordCount = Math.floor(progress * wordElements.length);
      wordElements.forEach((el, idx) => {
        if (idx <= activeWordCount) {
          el.style.opacity = '1';
        } else {
          el.style.opacity = '0.15';
        }
      });
    }

    window.addEventListener('scroll', updateStatement, { passive: true });
    updateStatement();
  }

  // ==========================================================================
  // 7. DISMANTLE CALLOUTS RENDERING
  // ==========================================================================
  function buildDismantleCallouts() {
    const container = document.getElementById('dismantle-callouts');
    if (!container) return;

    const callouts = CONFIG.dismantle.callouts;
    container.innerHTML = `
      <svg class="callout-svg" style="position:absolute; inset:0; width:100%; height:100%; pointer-events:none;" aria-hidden="true">
        ${callouts.map((c, i) => `
          <line id="callout-svg-line-${i}" x1="0" y1="0" x2="0" y2="0" stroke="rgba(237,234,228,0.22)" stroke-width="1" />
        `).join('')}
      </svg>
      ${callouts.map((c, i) => `
        <div class="callout-item" id="callout-item-${i}">
          <div class="callout-dot" id="callout-dot-${i}"></div>
          <div class="callout-content" id="callout-content-${i}">
            <div class="callout-tag">${c.name}</div>
            <div class="callout-desc">${c.desc}</div>
          </div>
        </div>
      `).join('')}
    `;
  }

  function updateDismantleCallouts(progress) {
    const callouts = CONFIG.dismantle.callouts;
    const stage = document.getElementById('dismantle-stage');
    if (!stage) return;
    const w = stage.clientWidth;
    const h = stage.clientHeight;

    callouts.forEach((c, i) => {
      const itemEl = document.getElementById(`callout-item-${i}`);
      const dotEl = document.getElementById(`callout-dot-${i}`);
      const contentEl = document.getElementById(`callout-content-${i}`);
      const lineEl = document.getElementById(`callout-svg-line-${i}`);

      if (!itemEl || !dotEl || !contentEl || !lineEl) return;

      const isRevealed = progress >= c.revealProgress;
      if (isRevealed) {
        itemEl.classList.add('active');
      } else {
        itemEl.classList.remove('active');
      }

      // Convert percentage coordinates
      const dotPxX = (c.dotX / 100) * w;
      const dotPxY = (c.dotY / 100) * h;
      const labelPxX = (c.labelX / 100) * w;
      const labelPxY = (c.labelY / 100) * h;

      dotEl.style.left = `${dotPxX}px`;
      dotEl.style.top = `${dotPxY}px`;

      contentEl.style.left = `${labelPxX}px`;
      contentEl.style.top = `${labelPxY}px`;

      lineEl.setAttribute('x1', dotPxX);
      lineEl.setAttribute('y1', dotPxY);
      lineEl.setAttribute('x2', labelPxX);
      lineEl.setAttribute('y2', labelPxY);
      lineEl.style.opacity = isRevealed ? '1' : '0';
      lineEl.style.transition = 'opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
    });
  }

  // ==========================================================================
  // 8. SECTION 4: LINEUP ACCORDION (Hover & Touch & Keyboard Accessible)
  // ==========================================================================
  function initLineupAccordion() {
    const accordion = document.getElementById('lineup-accordion');
    const lineupSection = document.getElementById('lineup');
    if (!accordion || !lineupSection) return;

    const models = CONFIG.lineup.models;

    accordion.innerHTML = models.map((m, index) => {
      const isOpen = index === 0;
      return `
        <div class="lineup-slide ${isOpen ? 'active' : ''}" 
             id="slide-${m.id}" 
             data-index="${index}"
             role="tab"
             tabindex="0"
             aria-selected="${isOpen ? 'true' : 'false'}"
             aria-expanded="${isOpen ? 'true' : 'false'}"
             aria-controls="panel-${m.id}">
          
          <div class="slide-num">${m.num}</div>
          <div class="slide-vertical-name">${m.name}</div>

          <!-- Car Background and Shared Floor Line -->
          <div class="slide-car-wrap">
            <img class="slide-car-img" src="${m.image}" alt="${m.alt}" loading="lazy">
            <div class="slide-floor-line"></div>
          </div>

          <!-- Top Details for Open Slide -->
          <div class="slide-details-top">
            <div class="slide-num">${m.num} / LINEUP</div>
            <h3 class="slide-model-name">${m.name}</h3>
          </div>

          <!-- Bottom Details for Open Slide -->
          <div class="slide-details-bottom" id="panel-${m.id}" role="tabpanel">
            <p class="slide-tagline">${m.tagline}</p>
            <div class="slide-specs-grid">
              <div class="spec-block">
                <span class="spec-label">RANGE</span>
                <span class="spec-val">${m.range}</span>
              </div>
              <div class="spec-block">
                <span class="spec-label">0–100 KM/H</span>
                <span class="spec-val">${m.accel}</span>
              </div>
              <div class="spec-block">
                <span class="spec-label">POWER</span>
                <span class="spec-val">${m.power}</span>
              </div>
            </div>

            <div class="slide-actions-row">
              <div class="color-swatches" aria-label="Color options">
                ${m.swatches.map((swatch, sIdx) => `
                  <button class="swatch-btn ${sIdx === m.activeSwatch ? 'active' : ''}" 
                          style="background-color: ${swatch};" 
                          data-slide-index="${index}" 
                          data-swatch-index="${sIdx}"
                          aria-label="Color option ${sIdx + 1}"></button>
                `).join('')}
              </div>
              <a href="#reserve" class="configure-link" data-cursor="RESERVE">CONFIGURE →</a>
            </div>
          </div>

        </div>
      `;
    }).join('');

    const slides = accordion.querySelectorAll('.lineup-slide');

    function setActiveSlide(activeIndex) {
      slides.forEach((slide, idx) => {
        const isCurrent = idx === activeIndex;
        if (isCurrent) {
          slide.classList.add('active');
          slide.setAttribute('aria-selected', 'true');
          slide.setAttribute('aria-expanded', 'true');
        } else {
          slide.classList.remove('active');
          slide.setAttribute('aria-selected', 'false');
          slide.setAttribute('aria-expanded', 'false');
        }
      });
    }

    // Debounced hover for desktop (80ms debounce)
    let hoverTimeout = null;
    slides.forEach((slide) => {
      const idx = parseInt(slide.getAttribute('data-index'), 10);

      slide.addEventListener('mouseenter', () => {
        clearTimeout(hoverTimeout);
        hoverTimeout = setTimeout(() => {
          setActiveSlide(idx);
        }, 80);
      });

      slide.addEventListener('click', (e) => {
        // If clicking a swatch button, don't re-trigger slide change
        if (e.target.closest('.swatch-btn')) return;
        setActiveSlide(idx);
      });

      // Keyboard navigation (ArrowLeft, ArrowRight, ArrowUp, ArrowDown)
      slide.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          e.preventDefault();
          const next = (idx + 1) % slides.length;
          setActiveSlide(next);
          slides[next].focus();
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault();
          const prev = (idx - 1 + slides.length) % slides.length;
          setActiveSlide(prev);
          slides[prev].focus();
        } else if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setActiveSlide(idx);
        }
      });
    });

    // Swatch click handlers
    accordion.addEventListener('click', (e) => {
      const swatchBtn = e.target.closest('.swatch-btn');
      if (!swatchBtn) return;
      const slideEl = swatchBtn.closest('.lineup-slide');
      if (!slideEl) return;
      slideEl.querySelectorAll('.swatch-btn').forEach(btn => btn.classList.remove('active'));
      swatchBtn.classList.add('active');
    });

    // IntersectionObserver for staggered entrance of slides
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          lineupSection.classList.add('in-view');
        }
      });
    }, { threshold: 0.15 });
    observer.observe(lineupSection);
  }

  // ==========================================================================
  // 9. MASTER SCROLLYTELLING RUNTIME (HERO & DISMANTLE)
  // ==========================================================================
  function initScrollytelling(heroSeq, dismantleSeq) {
    // 1. Elements
    const heroWrapper = document.getElementById('hero-wrapper');
    const heroStage = document.getElementById('hero-stage');
    const heroCanvas = document.getElementById('hero-canvas');
    const heroBlackout = document.getElementById('hero-blackout');
    const heroProgressLine = document.getElementById('hero-progress');
    const hudChapter = document.getElementById('hud-chapter');
    const hudSpeed = document.getElementById('hud-speed');
    const hudDistance = document.getElementById('hud-distance');

    const dismantleWrapper = document.getElementById('dismantle-wrapper');
    const dismantleStage = document.getElementById('dismantle-stage');
    const dismantleCanvas = document.getElementById('dismantle-canvas');
    const dismantleProgressLine = document.getElementById('dismantle-progress');

    if (!heroWrapper || !heroCanvas || !dismantleWrapper || !dismantleCanvas) return;

    const heroCtx = heroCanvas.getContext('2d');
    const dismantleCtx = dismantleCanvas.getContext('2d');

    // Dynamic section heights
    heroWrapper.style.height = CONFIG.hero.height;
    dismantleWrapper.style.height = CONFIG.dismantle.height;

    // Build Dismantle callouts
    buildDismantleCallouts();

    // Scrub state
    let heroTargetFrame = 0;
    let heroCurrentFrame = 0;
    let heroLastDrawn = -1;
    let heroProgress = 0;

    let dismantleTargetFrame = 0;
    let dismantleCurrentFrame = 0;
    let dismantleLastDrawn = -1;
    let dismantleProgress = 0;

    const heroChapters = [
      document.getElementById('hero-chapter-1'),
      document.getElementById('hero-chapter-2'),
      document.getElementById('hero-chapter-3'),
      document.getElementById('hero-chapter-4')
    ];

    function calculateScroll() {
      const innerH = window.innerHeight;

      // 1. Hero progress
      const hRect = heroWrapper.getBoundingClientRect();
      const hScrollDist = heroWrapper.offsetHeight - innerH;
      heroProgress = clamp(-hRect.top / (hScrollDist || 1), 0, 1);
      heroTargetFrame = Math.round(heroProgress * (CONFIG.hero.frameCount - 1));

      // 2. Dismantle progress
      const dRect = dismantleWrapper.getBoundingClientRect();
      const dScrollDist = dismantleWrapper.offsetHeight - innerH;
      dismantleProgress = clamp(-dRect.top / (dScrollDist || 1), 0, 1);
      dismantleTargetFrame = Math.round(dismantleProgress * (CONFIG.dismantle.frameCount - 1));
    }

    window.addEventListener('scroll', calculateScroll, { passive: true });
    window.addEventListener('resize', calculateScroll);
    calculateScroll();

    // Master 60fps rAF Loop
    function animationLoop() {
      // --- Hero Lerp & Redraw ---
      heroCurrentFrame += (heroTargetFrame - heroCurrentFrame) * 0.15;
      const roundedHero = Math.round(heroCurrentFrame);

      if (roundedHero !== heroLastDrawn) {
        heroLastDrawn = roundedHero;
        const img = heroSeq.getNearestLoadedFrame(roundedHero);
        if (img) {
          drawFrame(heroCtx, heroCanvas, img);
        }
      }

      // Hero Blackout over last 5% (0.95 -> 1.0)
      if (heroBlackout) {
        if (heroProgress >= CONFIG.hero.blackoutThreshold) {
          const fade = (heroProgress - CONFIG.hero.blackoutThreshold) / (1 - CONFIG.hero.blackoutThreshold);
          heroBlackout.style.opacity = String(fade);
        } else {
          heroBlackout.style.opacity = '0';
        }
      }

      // Hero 1px bottom progress line
      if (heroProgressLine) {
        heroProgressLine.style.width = `${(heroProgress * 100).toFixed(1)}%`;
      }

      // Hero HUD telemetry
      if (hudSpeed) {
        const speed = Math.round(heroProgress * CONFIG.hero.hud.maxSpeed);
        hudSpeed.textContent = pad4(speed).slice(-3);
      }
      if (hudDistance) {
        const dist = (heroProgress * CONFIG.hero.hud.maxDistance).toFixed(1);
        hudDistance.textContent = dist;
      }

      // Hero Chapter Active State
      CONFIG.hero.chapters.forEach((chap, idx) => {
        const [start, end] = chap.range;
        const isActive = heroProgress >= start && heroProgress <= end;
        const chapEl = heroChapters[idx];
        if (chapEl) {
          if (isActive) {
            chapEl.classList.add('active');
            if (hudChapter) hudChapter.textContent = chap.hudChapter;
          } else {
            chapEl.classList.remove('active');
          }
        }
      });

      // --- Dismantle Lerp & Redraw ---
      dismantleCurrentFrame += (dismantleTargetFrame - dismantleCurrentFrame) * 0.15;
      const roundedDismantle = Math.round(dismantleCurrentFrame);

      if (roundedDismantle !== dismantleLastDrawn) {
        dismantleLastDrawn = roundedDismantle;
        const img = dismantleSeq.getNearestLoadedFrame(roundedDismantle);
        if (img) {
          drawFrame(dismantleCtx, dismantleCanvas, img);
        }
      }

      // Dismantle Progress Line
      if (dismantleProgressLine) {
        dismantleProgressLine.style.width = `${(dismantleProgress * 100).toFixed(1)}%`;
      }

      // Dismantle Callouts after 70%
      updateDismantleCallouts(dismantleProgress);

      requestAnimationFrame(animationLoop);
    }

    requestAnimationFrame(animationLoop);
  }

  // ==========================================================================
  // 10. PRELOADER & INITIALIZATION SEQUENCE
  // ==========================================================================
  function initApp() {
    initFilmGrain();
    initCustomCursor();
    initNav();
    initStatementSection();
    initLineupAccordion();

    const isMobile = isMobileViewport();
    const heroSeq = new FrameSequence(CONFIG.hero);
    const dismantleSeq = new FrameSequence(CONFIG.dismantle);

    const preloader = document.getElementById('preloader');
    const preloaderBar = document.getElementById('preloader-bar');
    const preloaderCounter = document.getElementById('preloader-counter');

    const initialTarget = CONFIG.hero.initialPreloadCount; // 40 frames
    let loadedInitial = 0;

    // Preload hero frames 1 to 40
    heroSeq.preloadRange(0, initialTarget, isMobile, () => {
      // Complete initial 100% on preloader
      if (preloaderBar) {
        preloaderBar.style.width = '100%';
        preloaderBar.classList.add('preloader-flash');
      }
      if (preloaderCounter) {
        preloaderCounter.textContent = '100';
      }

      // Fade preloader and reveal scrollytelling
      setTimeout(() => {
        if (preloader) {
          preloader.classList.add('preloader-fade');
        }
        initScrollytelling(heroSeq, dismantleSeq);

        // Keep loading the rest of hero frames in the background
        heroSeq.preloadRange(initialTarget, CONFIG.hero.frameCount, isMobile, () => {
          // Then load dismantle frames in the background
          dismantleSeq.preloadRange(0, CONFIG.dismantle.frameCount, isMobile, () => {
            console.log('All scrollytelling assets cached successfully.');
          });
        });
      }, 350);
    });

    // Update counter during initial preload
    heroSeq.onProgress = (count) => {
      if (count <= initialTarget) {
        const pct = Math.min(Math.round((count / initialTarget) * 100), 99);
        if (preloaderBar) preloaderBar.style.width = `${pct}%`;
        if (preloaderCounter) preloaderCounter.textContent = pad4(pct).slice(-3);
      }
    };
  }

  // Launch when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }

})();

