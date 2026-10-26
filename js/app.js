/* Accademia Draconica — logica del sito */
(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const mq = window.matchMedia("(max-width: 860px)");
  const isMobile = () => mq.matches;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const ph = (n, v) => ((n - 1 + (v === "b" ? 4 : 0)) % 8) + 1;
  const img = (n, v, alt) => `<img src="assets/foto/drago-${ph(n, v)}.jpg" alt="${esc(alt)}" loading="lazy">`;
  const DPHOTO = { fiamma: 1, abisso: 3, radice: 6, vento: 5 };
  const icon = n => `<svg><use href="#i-${n}"/></svg>`;

  const store = {
    get(k, d) { try { const v = localStorage.getItem("ad:" + k); return v === null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem("ad:" + k, JSON.stringify(v)); } catch { /* ignora */ } }
  };

  let read = store.get("read", {});      // lezioni completate
  let result = store.get("result", null); // risultato del quiz
  const state = { lesson: 1, page: 0 };

  /* ───────── Rango ───────── */
  const RANKS = [[0, "Viandante"], [1, "Novizio"], [3, "Apprendista"], [5, "Custode"], [7, "Cavaliere"], [8, "Cavaliere del Drago"]];
  const readCount = () => Object.keys(read).length;
  const rankOf = n => RANKS.filter(r => n >= r[0]).pop()[1];
  function renderRank() {
    const n = readCount(), pct = Math.round(n / LESSONS.length * 100);
    const html = `
      <div class="rank-top"><span class="rank-gem">${icon("gem")}</span>
        <div><small>Il tuo rango</small><b>${rankOf(n)}</b></div></div>
      <div class="bar"><i style="width:${pct}%"></i></div>
      <small class="rank-n">${n} / ${LESSONS.length} lezioni</small>`;
    $("#rank").innerHTML = html; $("#rankMobile").innerHTML = html;
  }

  /* ───────── Indici ───────── */
  const nav = $("#lessonNav");
  function renderNav() {
    nav.innerHTML = LESSONS.map((l, i) =>
      `<a href="#lezione/${i + 1}" data-n="${i + 1}" class="${read[i + 1] ? "ok" : ""}"><b>${l.num}</b><span>${esc(l.short)}</span></a>`).join("");
    markNav(state.lesson);
    $("#quizLinkTxt").textContent = result ? DRAGONS[result.main].name : "Scopri il tuo drago";
  }
  function markNav(n) {
    $$("#lessonNav a").forEach(a => a.classList.toggle("on", +a.dataset.n === n && ["book", "reader"].includes(document.body.dataset.view)));
    const on = $("#lessonNav a.on"); if (on && !isMobile()) on.scrollIntoView({ block: "nearest" });
  }
  function renderCards() {
    $("#lessonCards").innerHTML = LESSONS.map((l, i) => `
      <a class="card tilt${read[i + 1] ? " done" : ""}" href="#lezione/${i + 1}">
        ${img(i + 1, "a", l.short)}
        <span class="c-n">${l.num}</span>
        <span class="c-t">${esc(l.short)}<small>${esc(l.sub)}</small></span>
        <svg class="chev"><use href="#i-next"/></svg>
      </a>`).join("") + `
      <a class="card final tilt" href="#drago">
        <span class="c-n">${icon("egg")}</span>
        <span class="c-t">Prova finale<small>${result ? "Il tuo drago: " + esc(DRAGONS[result.main].name) : "Scopri il tuo drago"}</small></span>
        <svg class="chev"><use href="#i-next"/></svg>
      </a>`;
  }

  /* ───────── Viste ───────── */
  const views = ["home", "list", "book", "reader", "med", "quiz"];
  let lastView = null;
  function show(name) {
    if (lastView && lastView !== name) veil();
    views.forEach(v => $("#view-" + v).classList.toggle("show", v === name));
    document.body.dataset.view = name; lastView = name;
    const tab = { list: "list", book: "list", reader: "list", med: "med", quiz: "quiz" }[name];
    $$("#tabbar a").forEach(a => a.classList.toggle("on", a.dataset.tab === tab));
    $$(".side-link").forEach(a => a.classList.toggle("on", a.dataset.go === name));
    const v = $("#view-" + name); if (v) v.scrollTop = 0;
    BG.set({ home: 1, list: 7, med: 6, quiz: 2, book: ph(state.lesson, "a"), reader: ph(state.lesson, state.page % 2 ? "b" : "a") }[name] || 1);
    markNav(state.lesson); closeDrawer();
  }
  function veil() { const v = $("#veil"); v.classList.remove("go"); void v.offsetWidth; v.classList.add("go"); }
  function toast(msg) {
    const t = $("#toast"); t.textContent = msg; t.classList.add("on");
    clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove("on"), 3600);
  }

  /* ───────── Libro (desktop) ───────── */
  function renderBook(n) {
    const l = LESSONS[n - 1]; state.lesson = n;
    $("#pageL").innerHTML = `
      <div class="kicker">Lezione ${l.num}</div>
      <h2>${esc(l.heading)}</h2>
      <svg class="orn"><use href="#orn"/></svg>
      <h3 class="sub">${esc(l.sub)}</h3>
      <p class="lead dropcap">${esc(l.hook)}</p>
      <div class="pic">${img(n, "a", "Illustrazione: " + l.heading)}</div>`;
    $("#pageR").innerHTML = `
      <div class="pic">${img(n, "b", "Illustrazione: " + l.sub)}</div>
      <h4>${esc(l.q)}</h4>
      <p>${esc(l.qtext)}</p>
      <div class="quote">${esc(l.quote)}</div>
      <a class="read-more" href="#lezione/${n}/1">Leggi la lezione completa</a>`;
    $$(".page").forEach(p => { p.classList.remove("turn"); void p.offsetWidth; p.classList.add("turn"); p.scrollTop = 0; });
    $("#bookNow").textContent = n; $("#bookTot").textContent = LESSONS.length;
    $("#bookPrev").disabled = n === 1; $("#bookNext").disabled = n === LESSONS.length;
  }

  /* ───────── Lettore ───────── */
  const pagesOf = l => l.chapters.length + 1; // capitoli + pratica
  function renderReader(n, p) {
    const l = LESSONS[n - 1], total = pagesOf(l);
    p = Math.max(0, Math.min(total - 1, p));
    state.lesson = n; state.page = p;
    { const v = p % 2 ? "b" : "a"; $("#rdHero").style.backgroundImage = `url("assets/foto/drago-${ph(n, v)}.jpg")`; BG.set(ph(n, v)); }
    $("#rdKicker").textContent = "Lezione " + l.num;
    $("#rdTitle").textContent = l.heading;
    let h;
    if (p < l.chapters.length) {
      const c = l.chapters[p];
      h = `<h3>${p + 1}. ${esc(c.t)}</h3>${c.s ? `<h4>${esc(c.s)}</h4>` : ""}`;
      h += c.p.map((t, i) => `<p class="${p === 0 && i === 0 ? "dropcap " : ""}rv" style="--d:${i * .12}s">${esc(t)}</p>`).join("");
      if (c.k) h += `<div class="note rv" style="--d:.3s"><strong>${icon("gem")}Significato simbolico</strong><p>${esc(c.k)}</p></div>`;
      if (p === 0) h += `<div class="pic rv">${img(n, "b", "Illustrazione: " + l.sub)}</div>`;
    } else {
      const pr = l.practice;
      h = `<h3>${p + 1}. Pratica</h3><h4>${esc(pr.t)}</h4><p class="rv">${esc(pr.p)}</p>
        <div class="note practice rv" style="--d:.15s"><strong>${icon("lotus")}Passi</strong>
        <ol>${pr.steps.map(s => `<li>${esc(s)}</li>`).join("")}</ol></div>
        <div class="seal rv" style="--d:.3s"><small>Sigillo della lezione</small><p>${esc(l.seal)}</p></div>`;
      h += n === LESSONS.length
        ? `<a class="btn-gold wide" href="#drago">Scopri il tuo drago</a>`
        : `<a class="btn-gold wide" href="#lezione/${n + 1}/1">Prossima lezione</a>`;
      if (!read[n]) completeLesson(n);
    }
    $("#rdSheet").innerHTML = h;
    $("#rdNow").textContent = p + 1; $("#rdTot").textContent = total;
    $("#rdPrev").disabled = p === 0 && n === 1;
    $("#rdNext").disabled = p === total - 1 && n === LESSONS.length;
    $("#view-reader").scrollTop = 0; markNav(n);
  }
  function completeLesson(n) {
    const before = rankOf(readCount());
    read[n] = true; store.set("read", read);
    renderRank(); renderNav(); renderCards();
    const after = rankOf(readCount());
    FX.chime(784);
    toast(after !== before ? `Nuovo rango: ${after}` : `Lezione ${LESSONS[n - 1].num} completata`);
  }
  function readerStep(d) {
    let { lesson: n, page: p } = state; p += d;
    if (p < 0) { if (n === 1) return; n--; p = pagesOf(LESSONS[n - 1]) - 1; }
    else if (p >= pagesOf(LESSONS[n - 1])) { if (n === LESSONS.length) return; n++; p = 0; }
    location.hash = `#lezione/${n}/${p + 1}`;
  }

  /* ───────── Meditazioni ───────── */
  let med = null, tick = null, cyc = null, lineT = null, left = 0;
  const fmt = s => String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");
  function renderMeds() {
    $("#medCards").innerHTML = MEDITATIONS.map((m, i) => `
      <button class="card tilt med-${m.id}" data-i="${i}">
        <span class="c-n">${icon(m.icon)}</span>
        <span class="c-t">${esc(m.title)}<small>${m.minutes} min · ${esc(m.desc)}</small></span>
        <svg class="chev"><use href="#i-next"/></svg>
      </button>`).join("");
    $$("#medCards .card").forEach(b => b.addEventListener("click", () => openPlayer(+b.dataset.i)));
  }
  function openPlayer(i) {
    stopMed(); med = MEDITATIONS[i]; left = med.minutes * 60;
    $("#plTitle").textContent = med.title;
    $("#plTimer").textContent = fmt(left);
    $("#orbTxt").textContent = "Pronto";
    $("#plLine").textContent = "Premi «Inizia» quando sei pronto.";
    $("#plGo").textContent = "Inizia";
    $("#player").hidden = false;
    $("#player").scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function stopMed() {
    clearInterval(tick); clearTimeout(cyc); clearTimeout(lineT); tick = cyc = lineT = null;
    const o = $("#orb"); o.style.transition = "transform .6s"; o.style.transform = "scale(.8)";
  }
  function setLine(t) { const el = $("#plLine"); el.classList.remove("in"); void el.offsetWidth; el.textContent = t; el.classList.add("in"); }
  function startMed() {
    if (tick) { stopMed(); $("#plGo").textContent = "Riprendi"; $("#orbTxt").textContent = "In pausa"; return; }
    if (left <= 0) left = med.minutes * 60;
    const total = med.minutes * 60;
    $("#plGo").textContent = "Pausa";
    const lineAt = () => Math.min(med.script.length - 1, Math.floor((total - left) / total * med.script.length));
    let shown = -1;
    tick = setInterval(() => {
      left--; $("#plTimer").textContent = fmt(Math.max(left, 0));
      const li = lineAt(); if (li !== shown) { shown = li; setLine(med.script[li]); }
      if (left <= 0) {
        stopMed(); left = 0; $("#orbTxt").textContent = "Namasté";
        setLine("Il viaggio è concluso. Porta con te ciò che hai trovato."); FX.chime(528);
        $("#plGo").textContent = "Ricomincia"; $("#plTimer").textContent = fmt(total);
      }
    }, 1000);
    shown = lineAt(); setLine(med.script[shown]);
    let k = 0;
    const step = () => {
      const [label, sec] = med.cycle[k % med.cycle.length];
      const o = $("#orb"); $("#orbTxt").textContent = label;
      o.style.transition = `transform ${sec}s ease-in-out`;
      if (label === "Inspira") o.style.transform = "scale(1.7)";
      else if (label === "Espira") o.style.transform = "scale(.8)";
      k++; cyc = setTimeout(step, sec * 1000);
    };
    step();
  }

  /* ───────── Quiz ───────── */
  const qs = { i: 0, ans: [] };
  const quiz = $("#quizBox");
  function setAccent(id) {
    const d = id ? DRAGONS[id] : null;
    document.documentElement.style.setProperty("--acc", d ? d.accent : "#c9a15a");
    document.documentElement.style.setProperty("--acc-hi", d ? d.accentHi : "#f0d596");
    FX.setColor(d ? d.accent : "#c8ba9c");
  }
  function quizIntro() {
    const n = readCount();
    quiz.innerHTML = `
      <div class="q-intro rv">
        <div class="q-eggs">${["fiamma", "abisso", "radice", "vento"].map(k => `<img src="assets/sigillo-${k}.svg" alt="" width="64" height="64">`).join("")}</div>
        <small class="q-kick">Prova finale</small>
        <h2>Scopri il tuo drago</h2>
        <svg class="orn"><use href="#orn"/></svg>
        <p>Dieci domande, nessuna risposta giusta. Rispondi d’istinto: scoprirai qual è il tuo drago guida, con il suo carattere, i suoi doni e le sue ombre.</p>
        ${n < LESSONS.length ? `<p class="q-soft">Hai letto ${n} lezioni su ${LESSONS.length}. Il quiz funziona meglio dopo aver completato il percorso, ma puoi cominciare quando vuoi.</p>` : ""}
        <button class="btn-gold" id="qStart">Inizia la prova</button>
        ${result ? `<button class="btn-ghost" id="qSaved">Rivedi il tuo drago: ${esc(DRAGONS[result.main].name)}</button>` : ""}
      </div>`;
    $("#qStart").onclick = () => { qs.i = 0; qs.ans = []; quizQuestion(); };
    if (result) $("#qSaved").onclick = () => quizResult(result, false);
  }
  function quizQuestion() {
    const q = QUIZ[qs.i], pct = Math.round(qs.i / QUIZ.length * 100);
    quiz.innerHTML = `
      <div class="q-card rv">
        <div class="q-top"><button class="btn-ghost sm" id="qBack" ${qs.i === 0 ? "disabled" : ""}>${icon("prev")}</button>
          <span class="q-count">Domanda <b>${qs.i + 1}</b> / ${QUIZ.length}</span></div>
        <div class="bar"><i style="width:${pct}%"></i></div>
        <h2>${esc(q.q)}</h2>
        <div class="q-opts">${q.o.map(([k, t], i) => `<button class="q-opt" data-k="${k}" style="--d:${i * .08}s"><span class="q-rune">${"ABCD"[i]}</span><span>${esc(t)}</span></button>`).join("")}</div>
      </div>`;
    $$(".q-opt", quiz).forEach(b => b.addEventListener("click", () => {
      $$(".q-opt", quiz).forEach(x => x.disabled = true); b.classList.add("pick");
      qs.ans[qs.i] = b.dataset.k; FX.chime(520 + qs.i * 40);
      setTimeout(() => { qs.i++; qs.i < QUIZ.length ? quizQuestion() : finishQuiz(); }, 520);
    }));
    $("#qBack").onclick = () => { if (qs.i > 0) { qs.i--; quizQuestion(); } };
    $("#view-quiz").scrollTop = 0;
  }
  const KEY = { f: "fiamma", a: "abisso", r: "radice", v: "vento" };
  function scoreQuiz(ans) {
    const sc = { fiamma: 0, abisso: 0, radice: 0, vento: 0 };
    ans.forEach(k => sc[KEY[k]]++);
    // parità: vince il drago scelto più di recente
    const recent = id => { for (let i = ans.length - 1; i >= 0; i--) if (KEY[ans[i]] === id) return i; return -1; };
    const order = Object.keys(sc).sort((a, b) => sc[b] - sc[a] || recent(b) - recent(a));
    return { scores: sc, main: order[0], sec: order[1] };
  }
  function finishQuiz() {
    result = scoreQuiz(qs.ans); store.set("result", result);
    setAccent(result.main); renderNav(); renderCards();
    veil(); FX.chime(392); setTimeout(() => FX.chime(587), 260);
    quizResult(result, true);
  }
  function quizResult(r, fresh) {
    const d = DRAGONS[r.main], s = DRAGONS[r.sec];
    setAccent(r.main);
    const bars = Object.keys(DRAGONS).map(id => {
      const p = Math.round(r.scores[id] / QUIZ.length * 100);
      return `<div class="rbar"><span><img src="assets/sigillo-${id}.svg" alt="" width="22" height="22"> ${esc(DRAGONS[id].name.replace("Il Drago ", ""))}</span><div class="bar"><i style="width:${p}%;background:${DRAGONS[id].accent}"></i></div><b>${p}%</b></div>`;
    }).join("");
    quiz.innerHTML = `
      <div class="q-result">
        <div class="r-hero rv"><img src="assets/foto/drago-${DPHOTO[d.id]}.jpg" alt="Il tuo drago guida: ${esc(d.name)}">
          <div class="r-title"><small>Il tuo drago guida è</small><h2>${esc(d.name)}</h2><p>${esc(d.title)} · ${esc(d.motto)}</p></div></div>
        <div class="chips rv">
          <span>${icon("fire")}${esc(d.element)}</span><span>${esc(d.direction)}</span><span>${esc(d.season)}</span><span>${esc(d.colors)}</span><span>${esc(d.stone)}</span>
        </div>
        <div class="paper rv"><h3>La tua essenza</h3>${d.essence.map(t => `<p>${esc(t)}</p>`).join("")}
          <ul class="gifts">${d.gifts.map(g => `<li>${esc(g)}</li>`).join("")}</ul></div>
        <div class="paper rv"><h3>La tua ombra</h3><p>${esc(d.shadow)}</p></div>
        <div class="grid2">
          <div class="paper rv"><h3>In amore e nelle relazioni</h3><p>${esc(d.love)}</p></div>
          <div class="paper rv"><h3>Nel lavoro e nella creatività</h3><p>${esc(d.work)}</p></div>
        </div>
        <div class="paper rv"><h3>Come crescere con lui</h3><ul class="gifts">${d.grow.map(g => `<li>${esc(g)}</li>`).join("")}</ul>
          <p class="mantra">«${esc(d.mantra)}»</p></div>
        <div class="paper rv"><h3>La tua ala secondaria</h3>
          <p>Accanto a ${esc(d.name)} vola ${esc(s.name)}, ${esc(s.title.toLowerCase().replace("il ", "il "))}. È il drago che emerge quando la vita ti chiede ${esc(s.element === "Fuoco" ? "coraggio" : s.element === "Acqua" ? "ascolto" : s.element === "Terra" ? "stabilità" : "chiarezza")}: coltivarlo ti rende più completo.</p>
          <div class="rbars">${bars}</div></div>
        <div class="r-actions">
          <button class="btn-gold" id="rMed">Medita con il tuo drago</button>
          <button class="btn-ghost" id="rShare">Condividi il risultato</button>
          <button class="btn-ghost" id="rAgain">Rifai il quiz</button>
        </div>
        <p class="q-soft center">Questo quiz è uno strumento di riflessione, non una diagnosi. Il tuo drago può cambiare con te.</p>
      </div>`;
    $("#rMed").onclick = () => { location.hash = "#meditazioni"; setTimeout(() => openPlayer(MEDITATIONS.findIndex(m => m.id === d.med)), 80); };
    $("#rAgain").onclick = () => { qs.i = 0; qs.ans = []; quizQuestion(); };
    $("#rShare").onclick = async () => {
      const text = `Il mio drago è ${d.name} — ${d.title}. «${d.motto}» Scopri il tuo: ${location.href.split("#")[0]}`;
      try { if (navigator.share) await navigator.share({ title: "Accademia Draconica", text }); else { await navigator.clipboard.writeText(text); toast("Testo copiato negli appunti"); } }
      catch { /* annullato */ }
    };
    $("#view-quiz").scrollTop = 0;
  }

  /* ───────── Menu / drawer ───────── */
  function closeDrawer() { document.body.classList.remove("drawer"); }
  $("#menuBtn").addEventListener("click", () => {
    if (isMobile()) document.body.classList.toggle("drawer"); else document.body.classList.toggle("collapsed");
  });
  $("#rdMenu").addEventListener("click", () => document.body.classList.add("drawer"));
  $("#scrim").addEventListener("click", closeDrawer);
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") closeDrawer();
    const v = document.body.dataset.view;
    if (e.target.matches("input,textarea")) return;
    if (v === "book") { if (e.key === "ArrowRight") go(1); if (e.key === "ArrowLeft") go(-1); }
    if (v === "reader") { if (e.key === "ArrowRight") readerStep(1); if (e.key === "ArrowLeft") readerStep(-1); }
  });
  const go = d => { const n = state.lesson + d; if (n >= 1 && n <= LESSONS.length) location.hash = "#lezione/" + n; };
  $("#bookPrev").onclick = () => go(-1); $("#bookNext").onclick = () => go(1);
  $("#rdPrev").onclick = () => readerStep(-1); $("#rdNext").onclick = () => readerStep(1);
  $("#rdBack").onclick = () => { location.hash = isMobile() ? "#lezioni" : "#lezione/" + state.lesson; };
  $("#playerClose").onclick = () => { stopMed(); $("#player").hidden = true; };
  $("#plGo").onclick = startMed;

  /* Suono e soglia */
  function setSound(v) {
    const on = FX.sound(v); store.set("sound", !!on);
    $("#soundBtn").setAttribute("aria-pressed", on); $("#soundBtn svg use").setAttribute("href", on ? "#i-sound" : "#i-mute");
  }
  $("#soundBtn").addEventListener("click", () => setSound(!FX.isOn()));
  function enter() {
    document.body.classList.remove("gated");
    try { sessionStorage.setItem("ad:in", "1"); } catch { /* ignora */ }
    if ($("#gateSound").checked) setSound(true);
    setTimeout(() => { $("#gate").style.display = "none"; }, 1200);
    FX.chime(440);
  }
  $("#enterBtn").addEventListener("click", enter);
  let passed = false; try { passed = sessionStorage.getItem("ad:in") === "1"; } catch { /* ignora */ }
  if (passed) { document.body.classList.remove("gated"); $("#gate").style.display = "none"; }

  /* Inclinazione 3D delle schede */
  document.addEventListener("pointermove", e => {
    const c = e.target.closest && e.target.closest(".tilt"); if (!c || e.pointerType === "touch") return;
    const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
    c.style.transform = `perspective(700px) rotateY(${x * 5}deg) rotateX(${-y * 5}deg) translateY(-2px)`;
  });
  document.addEventListener("pointerout", e => { const c = e.target.closest && e.target.closest(".tilt"); if (c) c.style.transform = ""; });

  /* Swipe */
  let sx = null;
  const swipe = (el, fn) => {
    el.addEventListener("touchstart", e => { sx = e.touches[0].clientX; }, { passive: true });
    el.addEventListener("touchend", e => {
      if (sx === null) return; const dx = e.changedTouches[0].clientX - sx; sx = null;
      if (Math.abs(dx) > 80) fn(dx < 0 ? 1 : -1);
    }, { passive: true });
  };
  swipe($("#view-reader"), readerStep); swipe($("#view-book"), go);

  /* ───────── Router ───────── */
  function route() {
    const h = decodeURIComponent(location.hash.replace(/^#\/?/, ""));
    const [a, b, c] = h.split("/");
    const clamp = x => Math.max(1, Math.min(LESSONS.length, parseInt(x, 10) || 1));
    if (a !== "meditazioni") stopMed();
    if (a === "meditazioni") return show("med");
    if (a === "drago") { if (!quiz.innerHTML.trim() || !$(".q-card,.q-result", quiz)) quizIntro(); return show("quiz"); }
    if (a === "lezioni") return isMobile() ? show("list") : (renderBook(state.lesson), show("book"));
    if (a === "lezione") {
      const n = clamp(b);
      if (c) { renderReader(n, (parseInt(c, 10) || 1) - 1); return show("reader"); }
      if (isMobile()) { renderReader(n, 0); return show("reader"); }
      renderBook(n); return show("book");
    }
    if (isMobile()) return show("home");
    renderBook(1); show("book");
  }
  window.addEventListener("hashchange", route);
  mq.addEventListener("change", route);

  FX.init();
  setAccent(result ? result.main : null);
  renderRank(); renderNav(); renderCards(); renderMeds();
  route();

  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) navigator.serviceWorker.register("sw.js").catch(() => {});
})();
