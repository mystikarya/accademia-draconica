/* Accademia Draconica — effetti immersivi: braci, parallasse, bagliore del cursore, suono ambientale. */
const FX = (() => {
  "use strict";
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canvas = document.getElementById("embers");
  const ctx = canvas.getContext("2d");
  let W = 0, H = 0, dpr = 1, parts = [], color = [200, 186, 156], running = true;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.width = innerWidth * dpr; H = canvas.height = innerHeight * dpr;
    canvas.style.width = innerWidth + "px"; canvas.style.height = innerHeight + "px";
    const n = Math.round(Math.min(70, innerWidth / 18));
    parts = Array.from({ length: n }, () => spawn(true));
  }
  function spawn(init) {
    return {
      x: Math.random() * W, y: init ? Math.random() * H : H + 10,
      r: (Math.random() * 1.8 + .5) * dpr, vy: -(Math.random() * .5 + .15) * dpr,
      vx: (Math.random() - .5) * .25 * dpr, a: Math.random() * .6 + .2,
      ph: Math.random() * 6.28, sp: Math.random() * .02 + .005
    };
  }
  function loop() {
    if (!running) return;
    ctx.clearRect(0, 0, W, H);
    for (const p of parts) {
      p.ph += p.sp; p.x += p.vx + Math.sin(p.ph) * .25 * dpr; p.y += p.vy;
      if (p.y < -10) Object.assign(p, spawn(false));
      const tw = .55 + .45 * Math.sin(p.ph * 2);
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 5);
      g.addColorStop(0, `rgba(${color[0]},${color[1]},${color[2]},${p.a * tw})`);
      g.addColorStop(1, `rgba(${color[0]},${color[1]},${color[2]},0)`);
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 5, 0, 6.283); ctx.fill();
    }
    requestAnimationFrame(loop);
  }
  function setColor(hex) {
    const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
    if (m) color = [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
  }

  /* parallasse + bagliore */
  const bg = document.getElementById("bgfx"), glow = document.getElementById("glow");
  let tx = 0, ty = 0, cx = 0, cy = 0;
  function pointer(e) {
    const x = (e.clientX / innerWidth - .5), y = (e.clientY / innerHeight - .5);
    tx = x; ty = y;
    glow.style.transform = `translate(${e.clientX}px,${e.clientY}px)`;
    glow.style.opacity = 1;
  }
  function par() {
    cx += (tx - cx) * .05; cy += (ty - cy) * .05;
    bg.style.setProperty("--px", cx * -22 + "px"); bg.style.setProperty("--py", cy * -14 + "px");
    requestAnimationFrame(par);
  }

  /* suono ambientale generato (nessun file audio) */
  let ac = null, master = null, on = false;
  function build() {
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
    ac = new AC(); master = ac.createGain(); master.gain.value = 0; master.connect(ac.destination);
    const lp = ac.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 320; lp.connect(master);
    [[55, "sawtooth", .12], [82.4, "sine", .18], [110.3, "triangle", .08], [164.8, "sine", .05]].forEach(([f, t, g]) => {
      const o = ac.createOscillator(), gn = ac.createGain(); o.type = t; o.frequency.value = f; gn.gain.value = g;
      const lfo = ac.createOscillator(), lg = ac.createGain(); lfo.frequency.value = .05 + Math.random() * .08; lg.gain.value = f * .004;
      lfo.connect(lg); lg.connect(o.detune); lfo.start(); o.connect(gn); gn.connect(lp); o.start();
    });
    const len = ac.sampleRate * 2, buf = ac.createBuffer(1, len, ac.sampleRate), d = buf.getChannelData(0);
    let b = 0; for (let i = 0; i < len; i++) { b = (b + (Math.random() * 2 - 1) * .02) * .985; d[i] = b * 6; }
    const n = ac.createBufferSource(); n.buffer = buf; n.loop = true;
    const bp = ac.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 500; bp.Q.value = .6;
    const ng = ac.createGain(); ng.gain.value = .35;
    const l2 = ac.createOscillator(), lg2 = ac.createGain(); l2.frequency.value = .07; lg2.gain.value = 260;
    l2.connect(lg2); lg2.connect(bp.frequency); l2.start();
    n.connect(bp); bp.connect(ng); ng.connect(master); n.start();
    return true;
  }
  function sound(v) {
    on = v;
    if (v) {
      if (!ac && !build()) return;
      ac.resume && ac.resume();
      master.gain.cancelScheduledValues(ac.currentTime);
      master.gain.linearRampToValueAtTime(.22, ac.currentTime + 2.5);
    } else if (ac) {
      master.gain.cancelScheduledValues(ac.currentTime);
      master.gain.linearRampToValueAtTime(0, ac.currentTime + .8);
    }
    return on;
  }
  /* campanella morbida per i momenti importanti */
  function chime(freq = 660) {
    if (!on || !ac) return;
    const o = ac.createOscillator(), g = ac.createGain(); o.type = "sine"; o.frequency.value = freq;
    g.gain.setValueAtTime(0, ac.currentTime); g.gain.linearRampToValueAtTime(.18, ac.currentTime + .02);
    g.gain.exponentialRampToValueAtTime(.0001, ac.currentTime + 2.4);
    o.connect(g); g.connect(master); o.start(); o.stop(ac.currentTime + 2.5);
  }

  let started = false;
  function init() {
    if (started) return; started = true;
    resize(); addEventListener("resize", resize);
    if (!reduce) {
      loop();
      if (matchMedia("(hover:hover)").matches) { addEventListener("pointermove", pointer, { passive: true }); par(); }
      document.addEventListener("visibilitychange", () => {
        running = !document.hidden; if (running) loop();
        if (ac) document.hidden ? ac.suspend() : (on && ac.resume());
      });
    }
  }
  return { init, setColor, sound, chime, isOn: () => on };
})();
