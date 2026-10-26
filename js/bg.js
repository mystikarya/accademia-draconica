/* Accademia Draconica — sfondi fotografici con dissolvenza fluida (tono nero e oro). */
const BG = (() => {
  "use strict";
  const N = 8;
  const FOC = [[50, 24], [50, 42], [50, 38], [42, 42], [62, 40], [50, 58], [42, 40], [44, 40]]; // punto focale di ogni foto
  const A = document.getElementById("bgA"), B = document.getElementById("bgB");
  let front = B, idx = 0, tok = 0;
  function set(k) {
    k = ((k - 1) % N + N) % N + 1;
    if (k === idx) return; idx = k;
    const t = ++tok, im = new Image();
    im.alt = ""; im.decoding = "async";
    im.onload = () => {
      if (t !== tok) return;
      const back = front === A ? B : A;
      im.style.objectPosition = FOC[k - 1][0] + "% " + FOC[k - 1][1] + "%";
      back.replaceChildren(im);
      requestAnimationFrame(() => { back.classList.add("on"); front.classList.remove("on"); front = back; });
    };
    im.src = "assets/foto/drago-" + k + ".jpg";
  }
  const next = () => set(idx + 1);
  set(2);
  return { set, next };
})();
