/* Accademia Draconica — accesso riservato.
   Le lezioni, le meditazioni e il quiz non sono nel sito in chiaro: stanno in vault/vault.json, cifrati (AES-256-GCM).
   La chiave si ottiene solo con utente e password validi (PBKDF2 → sblocca la chiave principale). */
(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const enc = new TextEncoder(), dec = new TextDecoder();
  const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
  const b64 = u8 => btoa(String.fromCharCode(...u8));
  const KEY_S = "ad:mk", KEY_L = "ad:mkp";

  const norm = u => u.normalize("NFKC").trim().toLowerCase();
  async function tagOf(u) {
    const h = await crypto.subtle.digest("SHA-256", enc.encode("tag:" + norm(u)));
    return [...new Uint8Array(h).slice(0, 8)].map(b => b.toString(16).padStart(2, "0")).join("");
  }
  async function derive(user, pwd, salt, iter) {
    const base = await crypto.subtle.importKey("raw", enc.encode(norm(user) + ":" + pwd.normalize("NFKC")), "PBKDF2", false, ["deriveKey"]);
    return crypto.subtle.deriveKey({ name: "PBKDF2", hash: "SHA-256", salt, iterations: iter }, base,
      { name: "AES-GCM", length: 256 }, false, ["decrypt"]);
  }
  async function loadVault() {
    if (window.__VAULT) return window.__VAULT;
    const r = await fetch("vault/vault.json", { cache: "no-cache" });
    if (!r.ok) throw new Error("vault");
    return r.json();
  }
  async function openContent(vault, masterBytes) {
    const key = await crypto.subtle.importKey("raw", masterBytes, "AES-GCM", false, ["decrypt"]);
    const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(vault.content.iv), additionalData: enc.encode("content") }, key, unb64(vault.content.data));
    return dec.decode(plain);
  }
  async function unlockWith(vault, user, pwd) {
    const t = await tagOf(user), entry = vault.users.find(u => u.tag === t);
    const salt = entry ? unb64(entry.salt) : crypto.getRandomValues(new Uint8Array(16));
    const k = await derive(user, pwd, salt, vault.iter);   // si esegue sempre, così i tempi sono uguali
    if (!entry) throw new Error("bad");
    const master = await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(entry.iv), additionalData: enc.encode("key") }, k, unb64(entry.key));
    return new Uint8Array(master);
  }
  function runCode(code) {
    const s = document.createElement("script"); s.textContent = code; document.head.appendChild(s);
  }
  function loadScript(src) {
    return new Promise((res, rej) => { const s = document.createElement("script"); s.src = src; s.onload = res; s.onerror = rej; document.body.appendChild(s); });
  }
  async function start(vault, master, remember) {
    const code = await openContent(vault, master);
    try { (remember ? localStorage : sessionStorage).setItem(remember ? KEY_L : KEY_S, b64(master)); } catch { /* ignora */ }
    runCode(code);
    await loadScript("js/app.js");
    document.body.classList.remove("locked");
    const a = $("#auth"); a.classList.add("out"); setTimeout(() => a.remove(), 900);
  }
  function stored() {
    try { return sessionStorage.getItem(KEY_S) || localStorage.getItem(KEY_L); } catch { return null; }
  }
  function forget() { try { sessionStorage.removeItem(KEY_S); localStorage.removeItem(KEY_L); } catch { /* ignora */ } }

  /* ───── interfaccia ───── */
  function ui(vault) {
    const form = $("#loginForm"), err = $("#loginErr"), btn = $("#loginBtn");
    document.querySelectorAll("[data-scroll]").forEach(b => b.addEventListener("click", e => {
      e.preventDefault(); const t = $(b.dataset.scroll); t.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => $("#lgUser").focus({ preventScroll: true }), 500);
    }));
    $("#lgShow").addEventListener("click", () => {
      const p = $("#lgPass"), show = p.type === "password"; p.type = show ? "text" : "password";
      $("#lgShow").textContent = show ? "Nascondi" : "Mostra";
    });
    form.addEventListener("submit", async e => {
      e.preventDefault(); err.textContent = "";
      const u = $("#lgUser").value, p = $("#lgPass").value;
      if (!u.trim() || !p) { err.textContent = "Inserisci utente e password."; return; }
      btn.disabled = true; btn.classList.add("busy"); btn.textContent = "Apro la soglia…";
      try {
        const master = await unlockWith(vault, u, p);
        await start(vault, master, $("#lgKeep").checked);
      } catch {
        err.textContent = "Utente o password non corretti.";
        form.classList.remove("shake"); void form.offsetWidth; form.classList.add("shake");
        btn.disabled = false; btn.classList.remove("busy"); btn.textContent = "Entra";
      }
    });
  }

  async function init() {
    if (typeof FX !== "undefined") FX.init();
    $("#authYear") && ($("#authYear").textContent = new Date().getFullYear());
    document.addEventListener("click", e => {
      if (e.target.closest("#logoutBtn")) { forget(); try { sessionStorage.removeItem("ad:in"); } catch { /* ignora */ } location.hash = ""; location.reload(); }
    });
    if (!window.crypto || !crypto.subtle) { $("#loginErr").textContent = "Questo browser non supporta l’accesso protetto. Apri il sito con Chrome, Safari o Edge aggiornati, da un indirizzo https."; return; }
    let vault;
    try { vault = await loadVault(); }
    catch { $("#loginErr").textContent = "Impossibile caricare l’area riservata. Controlla la connessione e riprova."; return; }
    const saved = stored();
    if (saved) {
      try { await start(vault, unb64(saved), !!localStorage.getItem(KEY_L)); return; } catch { forget(); }
    }
    ui(vault);
  }
  init();
})();
