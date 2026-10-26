#!/usr/bin/env python3
"""Genera le illustrazioni SVG di Accademia Draconica (logo, sfondo, scene delle lezioni)."""
import math
import os
import random

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "assets")
os.makedirs(OUT, exist_ok=True)

# --- Sagoma del drago (rivolto a destra) -----------------------------------
DRAGON = """
<g id="dragon" transform="translate(45,38) scale(.8)">
  <path d="M-45,-12 C-20,-20 20,-26 50,-24 C65,-30 72,-45 85,-50 L112,-46 L108,-38 L90,-34 C80,-28 70,-12 55,-2 C30,10 0,14 -30,12 C-70,14 -110,34 -150,26 C-190,20 -200,40 -218,32 C-195,52 -150,46 -105,38 C-70,32 -50,12 -45,-12 Z"/>
  <path d="M88,-50 L66,-76 L96,-52 Z M80,-47 L56,-62 L90,-45 Z"/>
  <path d="M5,-8 L-50,-128 L-56,-92 L-98,-98 L-82,-62 L-124,-56 L-92,-34 L-46,-12 Z"/>
  <path opacity=".75" d="M40,-24 L22,-96 L20,-72 L-8,-80 L4,-54 L-18,-46 L10,-32 Z"/>
  <path d="M-5,10 L-14,36 L2,31 L10,12 Z M25,8 L22,30 L36,26 L40,6 Z"/>
  <path d="M-40,-14 L-34,-24 L-28,-14 M-18,-18 L-12,-28 L-6,-18 M6,-22 L12,-32 L18,-22" />
</g>
"""


def dragon_use(x, y, scale=1.0, rot=0, flip=False, fill="#0a0705", opacity=1.0):
    sx = -scale if flip else scale
    return (
        f'<g transform="translate({x:.1f},{y:.1f}) rotate({rot}) scale({sx:.3f},{scale:.3f})" '
        f'fill="{fill}" stroke="rgba(255,210,140,.35)" stroke-width="{1.2/scale:.2f}" opacity="{opacity}">'
        f'<use href="#dragon"/></g>'
    )


def mountains(rng, w, base, amp, n, jag=0.55):
    pts = []
    step = w / n
    y_prev = base - amp * rng.random()
    pts.append((-10, y_prev))
    for i in range(1, n + 2):
        peak = base - amp * (0.25 + 0.75 * rng.random())
        y = y_prev * (1 - jag) + peak * jag
        pts.append((i * step - step * rng.random() * 0.4, y))
        y_prev = y
    d = "M-10,%d " % (base + 400)
    for x, y in pts:
        d += f"L{x:.1f},{y:.1f} "
    d += f"L{w+10},{base+400} Z"
    return d


def castle(x, y, s, fill):
    """Piccola sagoma di castello con torri."""
    parts = []
    def tower(tx, tw, th, spire=True):
        r = f'<rect x="{tx}" y="{-th}" width="{tw}" height="{th}"/>'
        if spire:
            r += f'<polygon points="{tx-2},{-th} {tx+tw/2},{-th-tw*1.6} {tx+tw+2},{-th}"/>'
        else:
            r += f'<rect x="{tx-2}" y="{-th-4}" width="{tw+4}" height="5"/>'
        return r
    parts.append(tower(-40, 14, 62))
    parts.append(tower(-20, 20, 96))
    parts.append(tower(6, 16, 74))
    parts.append(tower(26, 12, 48, spire=False))
    parts.append('<rect x="-55" y="-26" width="120" height="30"/>')
    return f'<g transform="translate({x},{y}) scale({s})" fill="{fill}">' + "".join(parts) + "</g>"


def columns(x, y, s, fill, count=4):
    out = []
    for i in range(count):
        h = 70 - (i % 2) * 22
        out.append(f'<rect x="{i*26}" y="{-h}" width="10" height="{h}"/>')
        out.append(f'<rect x="{i*26-3}" y="{-h-4}" width="16" height="5"/>')
    out.append(f'<rect x="-4" y="-{80+8}" width="{count*26+8}" height="0"/>')
    return f'<g transform="translate({x},{y}) scale({s})" fill="{fill}">' + "".join(out) + "</g>"


def effects(kind, rng, w, h, pal):
    o = []
    c = pal["spark"]
    if kind == "fiamma":
        for _ in range(70):
            x, y = rng.random() * w, h * (0.35 + 0.65 * rng.random())
            o.append(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{rng.uniform(1,3.6):.1f}" fill="{rng.choice(["#ffb347","#ff7a2a","#ffe08a"])}" opacity="{rng.uniform(.4,.95):.2f}"/>')
        for i in range(14):
            x = i * w / 13 + rng.uniform(-20, 20)
            hh = rng.uniform(40, 120)
            o.append(f'<path d="M{x-24:.0f},{h} Q{x-10:.0f},{h-hh*.6:.0f} {x:.0f},{h-hh:.0f} Q{x+12:.0f},{h-hh*.5:.0f} {x+26:.0f},{h} Z" fill="#ff6a1a" opacity=".55"/>')
    elif kind == "abisso":
        for k in range(5):
            y = h * (0.72 + k * 0.06)
            d = f"M0,{y:.0f} "
            for i in range(1, 13):
                d += f"Q{i*w/12-w/24:.0f},{y + (-14 if i % 2 else 14):.0f} {i*w/12:.0f},{y:.0f} "
            d += f"L{w},{h} L0,{h} Z"
            o.append(f'<path d="{d}" fill="#0d3a5a" opacity="{.22+k*.1:.2f}"/>')
        for _ in range(40):
            o.append(f'<circle cx="{rng.random()*w:.0f}" cy="{h*(.55+.45*rng.random()):.0f}" r="{rng.uniform(1,4):.1f}" fill="none" stroke="#bfeaff" stroke-opacity=".6"/>')
    elif kind == "radice":
        for i in range(10):
            x = rng.random() * w
            hh = rng.uniform(60, 150)
            o.append(f'<path d="M{x-16:.0f},{h} L{x:.0f},{h-hh:.0f} L{x+16:.0f},{h} Z" fill="#9fd45a" opacity=".28"/>')
        for i in range(8):
            x = rng.random() * w
            o.append(f'<path d="M{x:.0f},{h} C{x-30:.0f},{h-60:.0f} {x+40:.0f},{h-90:.0f} {x+rng.uniform(-60,60):.0f},{h-150:.0f}" stroke="#2a1a0c" stroke-width="5" fill="none" opacity=".8"/>')
        for _ in range(30):
            o.append(f'<circle cx="{rng.random()*w:.0f}" cy="{rng.random()*h:.0f}" r="{rng.uniform(1,2.6):.1f}" fill="#d9f79a" opacity=".55"/>')
    elif kind == "vento":
        for k in range(9):
            y = h * (0.15 + k * 0.09)
            x0 = rng.uniform(-40, w * .5)
            o.append(f'<path d="M{x0:.0f},{y:.0f} C{x0+120:.0f},{y-30:.0f} {x0+260:.0f},{y+30:.0f} {x0+420:.0f},{y-10:.0f} S{x0+620:.0f},{y+20:.0f} {x0+760:.0f},{y-14:.0f}" stroke="#efe6ff" stroke-width="{rng.choice([1.2,2,3])}" fill="none" stroke-linecap="round" opacity="{rng.uniform(.25,.6):.2f}"/>')
        for _ in range(26):
            o.append(f'<circle cx="{rng.random()*w:.0f}" cy="{rng.random()*h:.0f}" r="{rng.uniform(1,2.6):.1f}" fill="#fff" opacity=".6"/>')
    return "".join(o)


def scene(seed, pal, w, h, mode, effect=None):
    rng = random.Random(seed)
    sky, glow, m_far, m_mid, m_near, mist = (
        pal["sky"], pal["glow"], pal["far"], pal["mid"], pal["near"], pal["mist"],
    )
    sun_x = w * (0.28 + 0.44 * rng.random())
    sun_y = h * (0.28 + 0.12 * rng.random())
    svg = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" preserveAspectRatio="xMidYMid slice">']
    svg.append("<defs>")
    svg.append(f'<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">'
               f'<stop offset="0" stop-color="{sky[0]}"/><stop offset=".55" stop-color="{sky[1]}"/>'
               f'<stop offset="1" stop-color="{sky[2]}"/></linearGradient>')
    svg.append(f'<radialGradient id="glow" cx=".5" cy=".5" r=".5">'
               f'<stop offset="0" stop-color="{glow}" stop-opacity="1"/>'
               f'<stop offset=".25" stop-color="{glow}" stop-opacity=".55"/>'
               f'<stop offset="1" stop-color="{glow}" stop-opacity="0"/></radialGradient>')
    svg.append(f'<linearGradient id="mist" x1="0" y1="0" x2="0" y2="1">'
               f'<stop offset="0" stop-color="{mist}" stop-opacity="0"/>'
               f'<stop offset="1" stop-color="{mist}" stop-opacity=".85"/></linearGradient>')
    svg.append('<filter id="blur" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="14"/></filter>')
    svg.append('<radialGradient id="vig" cx=".5" cy=".5" r=".75"><stop offset=".6" stop-color="#000" stop-opacity="0"/>'
               '<stop offset="1" stop-color="#000" stop-opacity=".55"/></radialGradient>')
    svg.append(DRAGON)
    svg.append("</defs>")
    svg.append(f'<rect width="{w}" height="{h}" fill="url(#sky)"/>')

    if pal.get("stars"):
        for _ in range(90):
            x, y = rng.random() * w, rng.random() * h * 0.55
            r = rng.choice([0.6, 0.8, 1.1, 1.5])
            svg.append(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{r}" fill="#fff" opacity="{rng.uniform(.3,.9):.2f}"/>')

    # sole / luna con alone
    svg.append(f'<circle cx="{sun_x:.0f}" cy="{sun_y:.0f}" r="{h*0.62:.0f}" fill="url(#glow)"/>')
    if pal.get("moon"):
        svg.append(f'<circle cx="{sun_x:.0f}" cy="{sun_y:.0f}" r="{h*0.07:.0f}" fill="#f4f0e0"/>')
        svg.append(f'<circle cx="{sun_x+h*0.025:.0f}" cy="{sun_y-h*0.01:.0f}" r="{h*0.06:.0f}" fill="{sky[1]}" opacity=".35"/>')
    else:
        svg.append(f'<circle cx="{sun_x:.0f}" cy="{sun_y:.0f}" r="{h*0.05:.0f}" fill="#fff6dc"/>')

    # raggi
    if not pal.get("moon"):
        for i in range(9):
            a = math.radians(-160 + i * 17 + rng.uniform(-3, 3))
            x2, y2 = sun_x + math.cos(a) * w, sun_y + math.sin(a) * w
            svg.append(f'<path d="M{sun_x:.0f},{sun_y:.0f} L{x2:.0f},{y2:.0f}" stroke="{glow}" stroke-opacity=".10" stroke-width="{rng.randint(8,26)}"/>')

    # nuvole
    for _ in range(6):
        cx, cy = rng.random() * w, h * (0.15 + 0.35 * rng.random())
        svg.append(f'<ellipse cx="{cx:.0f}" cy="{cy:.0f}" rx="{rng.randint(90,220)}" ry="{rng.randint(10,24)}" '
                   f'fill="{pal["cloud"]}" opacity="{rng.uniform(.18,.38):.2f}" filter="url(#blur)"/>')

    # aurora opzionale
    if pal.get("aurora"):
        for i, col in enumerate(pal["aurora"]):
            d = f"M0,{h*0.25+i*18:.0f} "
            for k in range(1, 9):
                d += f"L{k*w/8:.0f},{h*0.22 + i*18 + math.sin(k*1.3+i)*28:.0f} "
            d += f"L{w},{h*0.5} L0,{h*0.5} Z"
            svg.append(f'<path d="{d}" fill="{col}" opacity=".16" filter="url(#blur)"/>')

    base = h * 0.62
    svg.append(f'<path d="{mountains(rng, w, base-18, h*0.30, 11)}" fill="{m_far}" opacity=".9"/>')

    # elementi in lontananza
    if mode == "a":
        if pal.get("castle"):
            svg.append(castle(w * 0.80, base + 6, 0.9, m_far))
        if pal.get("columns"):
            svg.append(columns(w * 0.04, base + 30, 1.0, m_mid))
        if pal.get("columns"):
            svg.append(columns(w * 0.80, base + 34, 1.2, m_mid, 3))
    else:
        if pal.get("castle"):
            svg.append(castle(w * 0.12, base + 2, 0.8, m_far))

    svg.append(f'<rect x="0" y="{base-60:.0f}" width="{w}" height="{h*0.30:.0f}" fill="url(#mist)"/>')
    svg.append(f'<path d="{mountains(rng, w, base+10, h*0.24, 9, 0.6)}" fill="{m_mid}"/>')

    # fiume
    if pal.get("river"):
        cx = w * 0.5
        svg.append(f'<path d="M{cx-20:.0f},{base+22:.0f} C{cx-60:.0f},{base+60:.0f} {cx+80:.0f},{base+80:.0f} {cx+10:.0f},{h*0.86:.0f} '
                   f'L{cx+230:.0f},{h} L{cx-250:.0f},{h} C{cx-120:.0f},{h*0.9:.0f} {cx-140:.0f},{base+60:.0f} {cx-20:.0f},{base+22:.0f} Z" '
                   f'fill="{glow}" opacity=".55"/>')

    svg.append(f'<rect x="0" y="{base+10:.0f}" width="{w}" height="{h*0.2:.0f}" fill="url(#mist)" opacity=".8"/>')
    svg.append(f'<path d="{mountains(rng, w, base+60, h*0.18, 7, 0.7)}" fill="{m_near}"/>')

    # drago
    if mode == "a":
        svg.append(dragon_use(w * 0.66, h * 0.36, 0.95, rot=-6, flip=False, fill="#080605"))
        svg.append(dragon_use(w * 0.22, h * 0.22, 0.28, rot=-4, fill="#0c0806", opacity=.8))
    elif mode == "c":
        svg.append(dragon_use(w * 0.50, h * 0.50, 1.9, rot=-5, flip=False, fill="#07050a"))
    else:
        # rupe in primo piano a destra con drago appollaiato
        rx = w * 0.70
        cliff = (f"M{rx:.0f},{h} L{rx+10:.0f},{h*0.62:.0f} L{rx+50:.0f},{h*0.58:.0f} L{rx+90:.0f},{h*0.52:.0f} "
                 f"L{rx+140:.0f},{h*0.56:.0f} L{rx+190:.0f},{h*0.46:.0f} L{w+10},{h*0.5:.0f} L{w+10},{h} Z")
        svg.append(f'<path d="{cliff}" fill="#0b0806"/>')
        svg.append(dragon_use(rx + 150, h * 0.46 - 4, 1.05, rot=-24, flip=True, fill="#0a0705"))

    svg.append(f'<path d="{mountains(rng, w, h*0.93, h*0.10, 6, 0.8)}" fill="#07050a" opacity=".95"/>')
    if effect:
        svg.append(effects(effect, rng, w, h, pal))
    svg.append(f'<rect width="{w}" height="{h}" fill="url(#vig)"/>')

    # scintille
    for _ in range(26):
        x, y = rng.random() * w, rng.random() * h
        svg.append(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{rng.uniform(.8,2.2):.1f}" fill="{pal["spark"]}" opacity="{rng.uniform(.25,.8):.2f}"/>')
    svg.append("</svg>")
    return "\n".join(svg)


PALETTES = {
    1: dict(sky=("#241a14", "#9b6a3a", "#f1b765"), glow="#ffc873", far="#4b3727", mid="#2c2018", near="#17100c",
            mist="#e9b872", cloud="#ffe2b0", spark="#ffd48a", castle=True, columns=True, river=True),
    2: dict(sky=("#150f26", "#4a2f6b", "#d98a6a"), glow="#f2a679", far="#3a2a54", mid="#241a38", near="#120c1d",
            mist="#c58aa0", cloud="#f6c7c0", spark="#ffc9a0", castle=True),
    3: dict(sky=("#1a0808", "#6b1f1a", "#e8683a"), glow="#ff8a4a", far="#47201a", mid="#2a1210", near="#150807",
            mist="#e0794a", cloud="#ffb084", spark="#ff9a5a", castle=True),
    4: dict(sky=("#050b1c", "#14284d", "#3f6a9a"), glow="#bcd8ff", far="#1c2e50", mid="#101d36", near="#080f1e",
            mist="#6f9ccb", cloud="#a9c6ec", spark="#cfe3ff", stars=True, moon=True),
    5: dict(sky=("#06101a", "#12403f", "#4aa38a"), glow="#9ef2cf", far="#16413d", mid="#0d2a2a", near="#071716",
            mist="#58b89f", cloud="#a6efd8", spark="#b6ffe6", stars=True, aurora=("#46e3a8", "#7a6bff", "#46c8ff")),
    6: dict(sky=("#1a0b05", "#7a2f12", "#ffb347"), glow="#ff7a2a", far="#4a2012", mid="#2b130a", near="#150906",
            mist="#ff9a45", cloud="#ffc78a", spark="#ffb05a", columns=True, river=True),
    7: dict(sky=("#1a1408", "#7a6224", "#f0d27a"), glow="#fff0b0", far="#4a3d1a", mid="#2c2410", near="#15110a",
            mist="#e8cf80", cloud="#fff0c0", spark="#fff2b0", castle=True, columns=True),
    8: dict(sky=("#0c1420", "#355a6c", "#f0b68a"), glow="#ffd0a0", far="#2a4350", mid="#18293a", near="#0b141c",
            mist="#cfa58a", cloud="#ffe0c4", spark="#ffe0b8", castle=True, river=True),
}


DRAGON_PAL = {
    "fiamma": dict(sky=("#240606", "#8a2410", "#ff9a3a"), glow="#ff7a2a", far="#4a1a10", mid="#2b0f0a", near="#150605",
                   mist="#ff8a3a", cloud="#ffb27a", spark="#ffb05a", castle=False),
    "abisso": dict(sky=("#040b1a", "#0d3556", "#3fb7d8"), glow="#9ae6ff", far="#0f2d4a", mid="#0a1d33", near="#050f1c",
                   mist="#4fb0d0", cloud="#9ed8ee", spark="#cdf3ff", stars=True, moon=True),
    "radice": dict(sky=("#070f06", "#27421a", "#a8c860"), glow="#d6f58a", far="#233b17", mid="#16260f", near="#0a1407",
                   mist="#8cbd50", cloud="#c9e79a", spark="#e0ffaa"),
    "vento": dict(sky=("#0e0b22", "#4a3c8c", "#c9b8ff"), glow="#efe6ff", far="#322a66", mid="#201a44", near="#0e0b22",
                  mist="#b4a2f0", cloud="#e6dcff", spark="#ffffff", stars=True),
}


def sigil(kind, color):
    sym = {
        "fiamma": '<path d="M150,70 L215,190 L85,190 Z" fill="none" stroke="C" stroke-width="7" stroke-linejoin="round"/>',
        "abisso": '<path d="M85,110 L215,110 L150,230 Z" fill="none" stroke="C" stroke-width="7" stroke-linejoin="round"/>',
        "radice": '<path d="M85,105 L215,105 L150,225 Z M105,145 L195,145" fill="none" stroke="C" stroke-width="7" stroke-linejoin="round"/>',
        "vento": '<path d="M150,70 L215,190 L85,190 Z M105,150 L195,150" fill="none" stroke="C" stroke-width="7" stroke-linejoin="round"/>',
    }[kind].replace("C", color)
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300"><circle cx="150" cy="150" r="138" fill="#0c0907" stroke="{color}" stroke-width="3"/>'
            f'<circle cx="150" cy="150" r="124" fill="none" stroke="{color}" stroke-opacity=".5"/>{sym}'
            f'<g stroke="{color}" stroke-opacity=".7" stroke-width="2">' +
            "".join(f'<path d="M150,16 L150,30" transform="rotate({a} 150 150)"/>' for a in range(0, 360, 30)) + '</g></svg>')


def write(name, content):
    with open(os.path.join(OUT, name), "w", encoding="utf-8") as f:
        f.write(content)


def logo():
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300">
<defs>
<linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f2d596"/><stop offset=".5" stop-color="#c9a15a"/><stop offset="1" stop-color="#8d6a32"/></linearGradient>
{DRAGON}
</defs>
<circle cx="150" cy="150" r="140" fill="none" stroke="url(#g)" stroke-width="3"/>
<circle cx="150" cy="150" r="128" fill="none" stroke="url(#g)" stroke-width="1" opacity=".7"/>
<g stroke="url(#g)" stroke-width="1.2" opacity=".8">
<path d="M150,6 L156,14 L150,22 L144,14 Z" fill="url(#g)"/>
<path d="M150,278 L156,286 L150,294 L144,286 Z" fill="url(#g)"/>
</g>
<g transform="translate(135,165) scale(.98)" fill="url(#g)"><use href="#dragon"/></g>
</svg>"""


def favicon():
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
<defs>{DRAGON}</defs>
<circle cx="32" cy="32" r="30" fill="#120c08" stroke="#c9a15a" stroke-width="2"/>
<g transform="translate(34,34) scale(.26)" fill="#c9a15a"><use href="#dragon"/></g>
</svg>"""


def background():
    rng = random.Random(77)
    w, h = 1600, 1000
    s = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" preserveAspectRatio="xMidYMid slice"><defs>',
         '<linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0a0a10"/><stop offset=".5" stop-color="#2a2420"/><stop offset="1" stop-color="#0b0807"/></linearGradient>',
         '<radialGradient id="l" cx=".28" cy=".12" r=".4"><stop offset="0" stop-color="#e6b676" stop-opacity=".75"/><stop offset="1" stop-color="#e6b676" stop-opacity="0"/></radialGradient>',
         '<filter id="b"><feGaussianBlur stdDeviation="18"/></filter>',
         DRAGON, '</defs>',
         f'<rect width="{w}" height="{h}" fill="url(#s)"/>',
         f'<rect width="{w}" height="{h}" fill="url(#l)"/>']
    for _ in range(9):
        s.append(f'<ellipse cx="{rng.randint(0,w)}" cy="{rng.randint(40,420)}" rx="{rng.randint(160,380)}" ry="{rng.randint(16,40)}" fill="#d7b88a" opacity="{rng.uniform(.08,.22):.2f}" filter="url(#b)"/>')
    s.append(f'<path d="{mountains(rng, w, 330, 200, 12)}" fill="#1a1613" opacity=".9"/>')
    s.append(castle(430, 330, 2.2, "#0d0a09"))
    s.append(f'<g transform="translate(1180,230) scale(5.2) scale(-1,1)" fill="#06050a" stroke="rgba(230,180,110,.28)" stroke-width=".5"><use href="#dragon"/></g>')
    s.append(f'<path d="{mountains(rng, w, 760, 260, 8, 0.7)}" fill="#0b0807"/>')
    s.append(f'<rect width="{w}" height="{h}" fill="#000" opacity=".25"/>')
    s.append("</svg>")
    return "\n".join(s)


if __name__ == "__main__":
    write("logo.svg", logo())
    write("favicon.svg", favicon())
    write("bg.svg", background())
    for n, pal in PALETTES.items():
        write(f"lezione-{n}-a.svg", scene(n * 11, pal, 920, 480, "a"))
        write(f"lezione-{n}-b.svg", scene(n * 23 + 5, pal, 880, 440, "b"))
    for i, (k, pal) in enumerate(DRAGON_PAL.items()):
        write(f"drago-{k}.svg", scene(900 + i * 7, pal, 900, 600, "c", effect=k))
        write(f"sigillo-{k}.svg", sigil(k, {"fiamma": "#ffb05a", "abisso": "#9ae6ff", "radice": "#c9e79a", "vento": "#d8ccff"}[k]))
    print("Generate", len(os.listdir(OUT)), "illustrazioni in", os.path.abspath(OUT))
