/* ============================================================
   For You — a little forever
   Interaction, parallax, petals, infinite bouquet & ambient music
   ============================================================ */
(function () {
  "use strict";

  /* -----------------------------------------------------------
     CONFIG — personalise here (optional)
     Set herName to her name, e.g. "Anaya". Leave "" for "my love".
  ----------------------------------------------------------- */
  var CONFIG = { herName: "" };

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* Personalise gentle copy where a name reads nicely */
  if (CONFIG.herName) {
    document.title = "For " + CONFIG.herName + " \u00b7 A Little Forever";
  }

  /* ===========================================================
     REVEAL ON SCROLL
  =========================================================== */
  function initReveals() {
    var els = $$(".reveal");
    if (reduceMotion || !("IntersectionObserver" in window)) {
      els.forEach(function (el) { el.classList.add("is-in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.18, rootMargin: "0px 0px -8% 0px" });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ===========================================================
     PARALLAX + PROGRESS BAR
  =========================================================== */
  function initParallax() {
    var layers = $$(".parallax");
    var progress = $("#progress");
    var ticking = false;

    function frame() {
      var vh = window.innerHeight;
      layers.forEach(function (bg) {
        var section = bg.parentElement;
        var rect = section.getBoundingClientRect();
        if (rect.bottom < -vh || rect.top > vh * 2) return; // offscreen
        var speed = parseFloat(bg.dataset.speed) || 0.15;
        var dist = (rect.top + rect.height / 2) - vh / 2;
        var shift = dist * speed * -1;
        var cap = rect.height * 0.34;
        if (shift > cap) shift = cap; else if (shift < -cap) shift = -cap;
        bg.style.transform = "translate3d(0," + shift.toFixed(1) + "px,0)";
      });

      if (progress) {
        var h = document.documentElement;
        var max = h.scrollHeight - h.clientHeight;
        progress.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + "%";
      }
      ticking = false;
    }

    function onScroll() {
      if (!ticking) { ticking = true; requestAnimationFrame(frame); }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    frame();
  }

  /* ===========================================================
     AMBIENT PETALS (canvas)
  =========================================================== */
  function initPetals() {
    var canvas = $("#petals");
    if (!canvas) return { start: function () {} };
    var ctx = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W, H, petals = [], running = false;
    var COLORS = ["#f4b8c4", "#e79aa8", "#f6d9dd", "#e7c48d", "#f3d9cf", "#d98aa0"];

    function resize() {
      W = canvas.width = Math.floor(innerWidth * dpr);
      H = canvas.height = Math.floor(innerHeight * dpr);
      canvas.style.width = innerWidth + "px";
      canvas.style.height = innerHeight + "px";
    }

    function makePetal(atTop) {
      var s = (6 + Math.random() * 10) * dpr;
      return {
        x: Math.random() * W,
        y: atTop ? -s * 2 : Math.random() * H,
        s: s,
        vy: (0.25 + Math.random() * 0.6) * dpr,
        vx: (Math.random() - 0.5) * 0.5 * dpr,
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.02,
        sway: Math.random() * Math.PI * 2,
        swaySp: 0.008 + Math.random() * 0.014,
        color: COLORS[(Math.random() * COLORS.length) | 0],
        alpha: 0.35 + Math.random() * 0.4
      };
    }

    function seed() {
      petals = [];
      var count = reduceMotion ? 10 : Math.min(46, Math.floor(innerWidth / 26));
      for (var i = 0; i < count; i++) petals.push(makePetal(false));
    }

    function drawPetal(p) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      // soft petal: two mirrored quadratic curves
      ctx.moveTo(0, -p.s);
      ctx.quadraticCurveTo(p.s * 0.85, -p.s * 0.2, 0, p.s);
      ctx.quadraticCurveTo(-p.s * 0.85, -p.s * 0.2, 0, -p.s);
      ctx.fill();
      ctx.restore();
    }

    function tick() {
      if (!running) return;
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < petals.length; i++) {
        var p = petals[i];
        p.sway += p.swaySp;
        p.y += p.vy;
        p.x += p.vx + Math.sin(p.sway) * 0.4 * dpr;
        p.rot += p.vr;
        if (p.y - p.s > H) { petals[i] = makePetal(true); }
        else if (p.x < -20) p.x = W + 10;
        else if (p.x > W + 20) p.x = -10;
        drawPetal(p);
      }
      requestAnimationFrame(tick);
    }

    resize();
    seed();
    window.addEventListener("resize", function () { resize(); seed(); }, { passive: true });

    return {
      start: function () {
        if (running) return;
        running = true;
        canvas.classList.add("is-on");
        requestAnimationFrame(tick);
      },
      burst: function () {
        for (var i = 0; i < 30; i++) petals.push(makePetal(true));
      }
    };
  }

  /* ===========================================================
     INFINITE BOUQUET
  =========================================================== */
  function initBouquet() {
    var stage = $("#bouquetStage");
    var hint = $("#bouquetHint");
    var countEl = $("#bloomCount");
    if (!stage) return;

    var PALETTES = [
      ["#f7b6c6", "#ec7796", "#c74b73"], // pink rose
      ["#f8c9b2", "#ef9a86", "#d76c5a"], // coral peach
      ["#ecc0e6", "#cf95da", "#a86bc0"], // lavender
      ["#f7d692", "#ecbb6a", "#d89a3f"], // gold
      ["#f5dcd1", "#eab9a7", "#d38f78"], // blush
      ["#f5909f", "#dd5470", "#b23453"], // deep red
      ["#f6e2c0", "#ecd39a", "#d8b26a"]  // champagne
    ];
    var count = 0;
    var flowers = [];
    var MAX = 260; // recycle oldest beyond this for smoothness; counter keeps rising

    function rand(a, b) { return a + Math.random() * (b - a); }

    function makeFlowerSVG(bloomR, stemLen, pal) {
      var w = bloomR * 2 + 18;
      var h = bloomR * 2 + stemLen;
      var cx = w / 2, cy = bloomR + 9;
      var baseX = cx + rand(-6, 6);
      var uid = "g" + (Math.random() * 1e9 | 0);
      var petals = Math.round(rand(5, 8));
      var s = "";
      s += "<svg width='" + w + "' height='" + h + "' viewBox='0 0 " + w + " " + h + "'>";
      s += "<defs><radialGradient id='" + uid + "' cx='45%' cy='35%' r='70%'>";
      s += "<stop offset='0%' stop-color='" + pal[0] + "'/>";
      s += "<stop offset='60%' stop-color='" + pal[1] + "'/>";
      s += "<stop offset='100%' stop-color='" + pal[2] + "'/></radialGradient></defs>";
      // stem
      s += "<path d='M" + cx + " " + cy + " C" + (cx + rand(-4, 4)) + " " + (cy + stemLen * 0.4) +
           " " + baseX + " " + (cy + stemLen * 0.6) + " " + baseX + " " + h + "' " +
           "stroke='#5c8a5f' stroke-width='" + rand(2.4, 3.6).toFixed(1) + "' fill='none' stroke-linecap='round'/>";
      // a leaf
      var ly = cy + stemLen * rand(0.45, 0.7);
      var side = Math.random() < 0.5 ? -1 : 1;
      s += "<path d='M" + cx + " " + ly + " q" + (side * 22) + " -10 " + (side * 34) + " 6 q" +
           (-side * 14) + " 8 " + (-side * 34) + " -6 z' fill='#4f7d53' opacity='0.9'/>";
      // outer petals
      for (var i = 0; i < petals; i++) {
        var ang = (360 / petals) * i;
        s += "<ellipse cx='" + cx + "' cy='" + (cy - bloomR * 0.55) + "' rx='" +
             (bloomR * 0.42).toFixed(1) + "' ry='" + (bloomR * 0.72).toFixed(1) +
             "' fill='url(#" + uid + ")' opacity='0.95' transform='rotate(" + ang + " " + cx + " " + cy + ")'/>";
      }
      // inner petals
      for (var j = 0; j < petals; j++) {
        var ang2 = (360 / petals) * j + (360 / petals) / 2;
        s += "<ellipse cx='" + cx + "' cy='" + (cy - bloomR * 0.34) + "' rx='" +
             (bloomR * 0.3).toFixed(1) + "' ry='" + (bloomR * 0.5).toFixed(1) +
             "' fill='" + pal[1] + "' opacity='0.95' transform='rotate(" + ang2 + " " + cx + " " + cy + ")'/>";
      }
      // heart / centre
      s += "<circle cx='" + cx + "' cy='" + cy + "' r='" + (bloomR * 0.3).toFixed(1) + "' fill='" + pal[2] + "'/>";
      s += "<circle cx='" + cx + "' cy='" + cy + "' r='" + (bloomR * 0.13).toFixed(1) + "' fill='#f6e2c0'/>";
      s += "</svg>";
      return { markup: s, w: w, h: h, bloomR: bloomR };
    }

    function plant(px, py) {
      var rectH = stage.clientHeight;
      py = Math.max(38, Math.min(rectH - 8, py));
      var stemLen = Math.max(46, rectH - py);
      var bloomR = rand(20, 40);
      var pal = PALETTES[(Math.random() * PALETTES.length) | 0];
      var f = makeFlowerSVG(bloomR, stemLen, pal);

      var el = document.createElement("div");
      el.className = "flower";
      el.innerHTML = f.markup;
      el.style.left = (px - f.w / 2) + "px";
      el.style.top = (py - bloomR - 9) + "px";
      el.style.zIndex = String(Math.round(py));
      var rot = rand(-7, 7);
      el.style.setProperty("--rot", rot + "deg");
      var dur = reduceMotion ? 0 : rand(0.7, 1.1);
      if (reduceMotion) {
        el.style.opacity = "1";
      } else {
        el.style.animation = "bloomIn " + dur + "s cubic-bezier(.34,1.56,.64,1) forwards";
        // gentle sway after bloom
        setTimeout(function () {
          el.style.animation = "sway " + rand(4, 7).toFixed(1) + "s ease-in-out infinite";
        }, dur * 1000);
      }
      stage.appendChild(el);
      flowers.push(el);

      if (flowers.length > MAX) {
        var old = flowers.shift();
        old.style.transition = "opacity 1.2s ease, transform 1.2s ease";
        old.style.opacity = "0";
        setTimeout(function () { old.remove(); }, 1300);
      }

      count++;
      if (countEl) countEl.textContent = count;
      if (hint && !hint.classList.contains("is-gone")) hint.classList.add("is-gone");
    }

    function pointFrom(e) {
      var r = stage.getBoundingClientRect();
      var cx = (e.touches && e.touches[0] ? e.touches[0].clientX : e.clientX);
      var cy = (e.touches && e.touches[0] ? e.touches[0].clientY : e.clientY);
      return { x: cx - r.left, y: cy - r.top };
    }

    var pressing = false, holdTimer = null, lastX = -999, lastY = -999;

    function onDown(e) {
      e.preventDefault();
      var p = pointFrom(e);
      plant(p.x, p.y);
      lastX = p.x; lastY = p.y;
      pressing = true;
      // hold-to-plant a soft cluster
      holdTimer = setInterval(function () {
        if (!pressing) return;
        plant(lastX + rand(-26, 26), lastY + rand(-20, 20));
      }, 260);
    }
    function onMove(e) {
      if (!pressing) return;
      var p = pointFrom(e);
      var dx = p.x - lastX, dy = p.y - lastY;
      if (dx * dx + dy * dy > 900) { // plant along a drag
        plant(p.x, p.y);
        lastX = p.x; lastY = p.y;
      }
    }
    function onUp() { pressing = false; if (holdTimer) { clearInterval(holdTimer); holdTimer = null; } }

    stage.addEventListener("mousedown", onDown);
    stage.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    stage.addEventListener("touchstart", onDown, { passive: false });
    stage.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onUp);
    stage.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        plant(rand(40, stage.clientWidth - 40), rand(60, stage.clientHeight - 20));
      }
    });
  }

  /* ===========================================================
     AMBIENT MUSIC (Web Audio, generative & self-contained)
  =========================================================== */
  function initMusic() {
    var AC = window.AudioContext || window.webkitAudioContext;
    var ctx = null, master = null, reverb = null, delay = null, delayFb = null, filter = null;
    var playing = false, started = false, timer = null;
    var chordIndex = 0, nextTime = 0;

    // Warm progression: Cmaj7 - Am7 - Fmaj7 - G(add) (I - vi - IV - V feel)
    var CHORDS = [
      [48, 52, 55, 59],
      [45, 48, 52, 55],
      [41, 45, 48, 52],
      [43, 47, 50, 55]
    ];
    var CHORD_DUR = 7.2;

    function m2f(m) { return 440 * Math.pow(2, (m - 69) / 12); }

    function makeReverb() {
      var len = ctx.sampleRate * 3.2;
      var buf = ctx.createBuffer(2, len, ctx.sampleRate);
      for (var ch = 0; ch < 2; ch++) {
        var d = buf.getChannelData(ch);
        for (var i = 0; i < len; i++) {
          d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
        }
      }
      var c = ctx.createConvolver();
      c.buffer = buf;
      return c;
    }

    function build() {
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.0001;

      filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 1700;
      filter.Q.value = 0.4;

      reverb = makeReverb();
      var revGain = ctx.createGain(); revGain.gain.value = 0.5;

      delay = ctx.createDelay(1.0);
      delay.delayTime.value = 0.42;
      delayFb = ctx.createGain(); delayFb.gain.value = 0.32;
      var delWet = ctx.createGain(); delWet.gain.value = 0.28;

      // routing: filter -> master(dry) + reverb + delay
      filter.connect(master);
      filter.connect(reverb); reverb.connect(revGain); revGain.connect(master);
      filter.connect(delay); delay.connect(delayFb); delayFb.connect(delay); delay.connect(delWet); delWet.connect(master);

      master.connect(ctx.destination);
      started = true;
    }

    // soft pad chord
    function playChord(notes, t) {
      var g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.13, t + 2.4);       // slow swell
      g.gain.setValueAtTime(0.13, t + CHORD_DUR - 2.2);
      g.gain.exponentialRampToValueAtTime(0.0001, t + CHORD_DUR + 0.4);
      g.connect(filter);
      notes.forEach(function (n, idx) {
        var o = ctx.createOscillator();
        o.type = idx === 0 ? "sine" : "triangle";
        o.frequency.value = m2f(n - (idx === 0 ? 12 : 0)); // bass lower
        o.detune.value = (Math.random() * 8 - 4);
        var vg = ctx.createGain();
        vg.gain.value = idx === 0 ? 0.5 : 0.28;
        o.connect(vg); vg.connect(g);
        o.start(t);
        o.stop(t + CHORD_DUR + 0.6);
      });
    }

    // gentle bell melody note
    function playNote(midi, t, vel) {
      var o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = m2f(midi);
      var o2 = ctx.createOscillator();
      o2.type = "sine";
      o2.frequency.value = m2f(midi + 12);
      var g = ctx.createGain();
      var peak = 0.11 * (vel || 1);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(peak, t + 0.06);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 2.0);
      var g2 = ctx.createGain(); g2.gain.value = 0.3;
      o.connect(g); o2.connect(g2); g2.connect(g);
      g.connect(filter);
      o.start(t); o2.start(t);
      o.stop(t + 2.1); o2.stop(t + 2.1);
    }

    function scheduleMelody(notes, t) {
      var pool = notes.map(function (n) { return n + 12; }).concat([notes[0] + 24, notes[2] + 12]);
      var beats = 3 + (Math.random() * 2 | 0);
      for (var i = 0; i < beats; i++) {
        if (Math.random() < 0.62) {
          var when = t + (CHORD_DUR / beats) * i + Math.random() * 0.3;
          var note = pool[(Math.random() * pool.length) | 0];
          playNote(note, when, 0.7 + Math.random() * 0.5);
        }
      }
    }

    function scheduler() {
      if (!playing) return;
      while (nextTime < ctx.currentTime + 1.5) {
        var ch = CHORDS[chordIndex % CHORDS.length];
        playChord(ch, nextTime);
        scheduleMelody(ch, nextTime);
        nextTime += CHORD_DUR;
        chordIndex++;
      }
      timer = setTimeout(scheduler, 500);
    }

    function fadeTo(v, secs) {
      if (!master) return;
      var now = ctx.currentTime;
      master.gain.cancelScheduledValues(now);
      master.gain.setValueAtTime(Math.max(master.gain.value, 0.0001), now);
      master.gain.exponentialRampToValueAtTime(Math.max(v, 0.0001), now + secs);
    }

    return {
      play: function () {
        if (!started) build();
        if (ctx.state === "suspended") ctx.resume();
        if (playing) return;
        playing = true;
        nextTime = ctx.currentTime + 0.15;
        fadeTo(0.19, 3.2);
        scheduler();
      },
      pause: function () {
        if (!playing) return;
        playing = false;
        fadeTo(0.0001, 1.4);
        if (timer) { clearTimeout(timer); timer = null; }
      },
      get playing() { return playing; }
    };
  }

  /* ===========================================================
     WIRING
  =========================================================== */
  document.addEventListener("DOMContentLoaded", function () {
    initReveals();
    initParallax();
    var petals = initPetals();
    initBouquet();
    var music = initMusic();

    var gate = $("#gate");
    var beginBtn = $("#beginBtn");
    var hud = $("#hud");
    var musicBtn = $("#musicBtn");
    var musicLabel = $("#musicLabel");

    function setMusicUI() {
      if (music.playing) { hud.classList.add("is-playing"); if (musicLabel) musicLabel.textContent = "playing"; }
      else { hud.classList.remove("is-playing"); if (musicLabel) musicLabel.textContent = "muted"; }
    }

    function begin() {
      gate.classList.add("is-hidden");
      petals.start();
      hud.classList.add("is-ready");
      music.play();
      setMusicUI();
      setTimeout(function () { gate.style.display = "none"; }, 1200);
    }
    beginBtn.addEventListener("click", begin);

    musicBtn.addEventListener("click", function () {
      if (music.playing) music.pause(); else music.play();
      setMusicUI();
    });

    // Finale
    var finale = $("#finale");
    var yesBtn = $("#yesBtn");
    var finaleClose = $("#finaleClose");
    if (yesBtn) yesBtn.addEventListener("click", function () {
      finale.classList.add("is-open");
      finale.setAttribute("aria-hidden", "false");
      if (petals.burst) petals.burst();
    });
    if (finaleClose) finaleClose.addEventListener("click", function () {
      finale.classList.remove("is-open");
      finale.setAttribute("aria-hidden", "true");
      var b = $("#bouquet");
      if (b) b.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
    });
  });
})();
