(function(){
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

/* ---------- подсветка кода + копирование (работает без GSAP) ---------- */
const KW = /\b(const|let|var|function|return|import|from|export|default|new|if|else|true|false|null|for|of|this|await|async|forEach)\b/;
function esc(s){ return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }
function highlight(src, lang){
  const re = lang === "bash"
    ? /(#.*$)|("(?:\\.|[^"\\])*")/gm
    : /(\/\/.*$|<!--[\s\S]*?-->)|("(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'|`(?:\\.|[^`\\])*`)|\b(const|let|var|function|return|import|from|export|default|new|if|else|true|false|null|for|of|this|await|async)\b|\b(\d+(?:\.\d+)?)\b/gm;
  let out = "", last = 0, m;
  while ((m = re.exec(src))){
    out += esc(src.slice(last, m.index));
    const cls = m[1] ? "t-com" : m[2] ? "t-str" : m[3] ? "t-kw" : "t-num";
    out += '<span class="' + cls + '">' + esc(m[0]) + "</span>";
    last = re.lastIndex;
  }
  return out + esc(src.slice(last));
}
function paint(codeEl, lang){ codeEl.innerHTML = highlight(codeEl.textContent, lang || "js"); }
$$(".code").forEach((box) => {
  const lang = box.dataset.lang || "js";
  const code = $("code", box);
  paint(code, lang);
  const head = document.createElement("div");
  head.className = "code-head";
  head.innerHTML = '<span>' + lang + '</span><button class="copy" type="button">Копировать</button>';
  box.prepend(head);
  const btn = $(".copy", head);
  btn.addEventListener("click", () => {
    const text = code.textContent;
    const done = () => { btn.textContent = "Скопировано"; setTimeout(() => (btn.textContent = "Копировать"), 1400); };
    const fallback = () => { const r = document.createRange(); r.selectNodeContents(code); const s = getSelection(); s.removeAllRanges(); s.addRange(r); btn.textContent = "Выделено, Ctrl+C"; };
    try { navigator.clipboard.writeText(text).then(done, fallback); } catch (e) { fallback(); }
  });
});

$$(".prompt").forEach((box) => {
  const text = $("p", box);
  const head = document.createElement("div");
  head.className = "prompt-head";
  head.innerHTML = '<span>Промпт для нейронки</span><button class="copy" type="button">Копировать</button>';
  box.prepend(head);
  const btn = $(".copy", head);
  btn.addEventListener("click", () => {
    const done = () => { btn.textContent = "Скопировано"; setTimeout(() => (btn.textContent = "Копировать"), 1400); };
    const fallback = () => { const r = document.createRange(); r.selectNodeContents(text); const s = getSelection(); s.removeAllRanges(); s.addRange(r); btn.textContent = "Выделено, Ctrl+C"; };
    try { navigator.clipboard.writeText(text.textContent.trim()).then(done, fallback); } catch (e) { fallback(); }
  });
});

/* ---------- статичная разметка демо ---------- */
const cardHTML = '<div class="mini-card"><i></i><i></i></div>';
$("#ba1-b").innerHTML = cardHTML.repeat(6);
$("#ba1-a").innerHTML = cardHTML.repeat(6);
$("#st-grid").innerHTML = Array.from({length: 12}, (_, i) => "<div>.card " + String(i + 1).padStart(2, "0") + "</div>").join("");
$("#dots").innerHTML = "<span></span>".repeat(40);
const mqText = '<span>GSAP <i>·</i> ScrollTrigger <i>·</i> Lenis <i>·</i> SplitText <i>·</i> Flip <i>·</i></span>';
$("#marquee-track").innerHTML = mqText + mqText;

if (!window.gsap){ document.documentElement.classList.add("no-gsap"); document.body.classList.add("no-gsap"); return; }

gsap.registerPlugin(ScrollTrigger, SplitText, Flip, Draggable, InertiaPlugin, MotionPathPlugin, DrawSVGPlugin, MorphSVGPlugin, ScrambleTextPlugin);
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- Lenis ---------- */
let lenis = null, lerpValue = 0.1;
const raf = (time) => { if (lenis) lenis.raf(time * 1000); };
gsap.ticker.add(raf);
gsap.ticker.lagSmoothing(0);
function enableLenis(){
  if (lenis || !window.Lenis) return;
  lenis = new Lenis({ lerp: lerpValue });
  lenis.on("scroll", ScrollTrigger.update);
}
function disableLenis(){ if (!lenis) return; lenis.destroy(); lenis = null; }
const switches = [$("#lenis-switch"), $("#lenis-switch-2")];
function setSmooth(on){
  on ? enableLenis() : disableLenis();
  switches.forEach((s) => s.setAttribute("aria-checked", String(!!lenis)));
  const tag = $("#smooth-tag");
  tag.textContent = lenis ? "После: Lenis включён" : "До: нативный скролл";
  tag.classList.toggle("after", !!lenis);
}
switches.forEach((s) => s.addEventListener("click", () => setSmooth(!lenis)));
setSmooth(!reduce);
$("#lerp").addEventListener("input", (e) => {
  lerpValue = e.target.value / 100;
  $("#lerp-val").textContent = lerpValue.toFixed(2);
  if (lenis){ lenis.options.lerp = lerpValue; }
});
function scrollToTarget(target, opts = {}){
  if (lenis) lenis.scrollTo(target, Object.assign({ offset: -64 }, opts));
  else {
    const y = typeof target === "number" ? target : target.getBoundingClientRect().top + scrollY - 64;
    scrollTo({ top: y, behavior: reduce ? "auto" : "smooth" });
  }
}
$$("[data-nav]").forEach((a) => a.addEventListener("click", (e) => {
  const id = a.getAttribute("href");
  const el = id === "#top" ? 0 : $(id);
  if (el === null) return;
  e.preventDefault();
  scrollToTarget(el);
}));
$("#to-top").addEventListener("click", () => scrollToTarget(0, { duration: 2 }));
$("#to-tricks").addEventListener("click", () => scrollToTarget($("#tricks"), { duration: 1.6 }));

/* ---------- прогресс и оглавление ---------- */
gsap.to("#progress", { scaleX: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: 0.3 } });
const tocLinks = $$(".toc a");
$$("section.chapter").forEach((sec) => {
  ScrollTrigger.create({
    trigger: sec, start: "top 40%", end: "bottom 40%",
    onToggle: (self) => { if (self.isActive) tocLinks.forEach((l) => l.classList.toggle("active", l.getAttribute("href") === "#" + sec.id)); },
  });
});

/* ---------- hero ---------- */
document.fonts.ready.then(() => {
  if (reduce) return;
  const split = SplitText.create("#hero-title", { type: "lines, chars", mask: "lines" });
  gsap.from(split.chars, { yPercent: 110, duration: 1.1, ease: "expo.out", stagger: 0.025, delay: 0.1 });
  gsap.from(".hero .meta, .hero .lead, .hero .btns", { y: 16, autoAlpha: 0, duration: 0.8, ease: "power3.out", stagger: 0.08, delay: 0.5 });
});

/* ---------- 03 песочница ---------- */
const pgBox = $("#pg-box"), pgCode = $("#pg-code");
const recipes = [
  ["Сдвиг", "Сдвинь квадрат вправо на 200 px за 1 с.", 'gsap.to(".box", { x: 200, duration: 1 })', () => gsap.to(pgBox, { x: 200, duration: 1 })],
  ["Поворот", "Поверни квадрат на 360° за 1 с.", 'gsap.to(".box", { rotation: 360, duration: 1 })', () => gsap.to(pgBox, { rotation: 360, duration: 1 })],
  ["Появление сверху", "Пусть квадрат появится: упадёт сверху с 60 px и проявится из прозрачного за 0.9 с, с отскоком (ease bounce.out).", 'gsap.from(".box", { y: -60, autoAlpha: 0, duration: 0.9, ease: "bounce.out" })', () => gsap.from(pgBox, { y: -60, autoAlpha: 0, duration: 0.9, ease: "bounce.out" })],
  ["Из точки в точку", "Квадрат едет из начала в точку 200 px и вырастает с 40% до 100%, за 1 с, ease power2.inOut.", 'gsap.fromTo(".box", { x: 0, scale: 0.4 }, { x: 200, scale: 1, duration: 1, ease: "power2.inOut" })', () => gsap.fromTo(pgBox, { x: 0, scale: 0.4 }, { x: 200, scale: 1, duration: 1, ease: "power2.inOut" })],
  ["Пульс", "Квадрат пульсирует: увеличивается до 130% и обратно, 2 раза, по 0.3 с (repeat + yoyo).", 'gsap.to(".box", { scale: 1.3, repeat: 3, yoyo: true, duration: 0.3 })', () => gsap.to(pgBox, { scale: 1.3, repeat: 3, yoyo: true, duration: 0.3 })],
  ["Цвет и форма", "За 0.8 с квадрат становится кругом акцентного цвета и сдвигается на 120 px.", 'gsap.to(".box", { borderRadius: "50%", backgroundColor: "#3552F2", x: 120, duration: 0.8 })', () => gsap.to(pgBox, { borderRadius: "50%", backgroundColor: getComputedStyle(document.documentElement).getPropertyValue("--accent").trim(), x: 120, duration: 0.8 })],
  ["Мгновенно", "Поставь квадрат на 200 px мгновенно, без анимации (gsap.set).", 'gsap.set(".box", { x: 200 })', () => gsap.set(pgBox, { x: 200 })],
];
const pgBtns = $("#pg-btns");
recipes.forEach(([label, prompt, code, run]) => {
  const b = document.createElement("button");
  b.className = "btn"; b.textContent = label;
  b.addEventListener("click", () => {
    $$(".btn", pgBtns).forEach((x) => x.classList.remove("on")); b.classList.add("on");
    gsap.killTweensOf(pgBox); gsap.set(pgBox, { clearProps: "all" });
    run(); $("#pg-prompt").textContent = prompt; pgCode.textContent = code; paint(pgCode, "js");
  });
  pgBtns.appendChild(b);
});

/* ---------- 04 ease ---------- */
const eases = ["none", "power1.out", "power2.out", "power3.out", "power4.out", "power2.in", "power2.inOut", "expo.out", "circ.inOut", "sine.inOut", "back.out(1.7)", "elastic.out(1, 0.3)", "bounce.out", "steps(6)"];
const easeDesc = {
  "none": "Равномерно, без ускорений. Для бегущих строк и всего, что привязано к скроллу.",
  "power1.out": "Лёгкое торможение. Почти незаметно, спокойно.",
  "power2.out": "Мягкое торможение. Универсальный вариант для интерфейса.",
  "power3.out": "Выразительное торможение. Лучший выбор для появлений блоков.",
  "power4.out": "Резкий старт, долгое торможение. Для акцентов.",
  "power2.in": "Разгон к концу. Для исчезновения, «улёта» элемента.",
  "power2.inOut": "Плавно с обеих сторон. Для перемещений и слайдеров.",
  "expo.out": "Очень резкий старт и долгий «доезд». Дорогие заголовки первого экрана.",
  "circ.inOut": "Плотный разгон и торможение. Для смены экранов.",
  "sine.inOut": "Самый мягкий. Для «дыхания», плавающих элементов.",
  "back.out(1.7)": "Перелёт за цель и возврат. Игриво, для иконок и попапов.",
  "elastic.out(1, 0.3)": "Пружина. Эффектно, но быстро надоедает.",
  "bounce.out": "Отскок, как мячик. Для игровых сценариев.",
  "steps(6)": "Ступеньками, без плавности. Для покадровой анимации и «пиксельного» стиля.",
};
const VMIN = -0.35, VMAX = 1.35, X0 = 20, X1 = 300, Y0 = 20, Y1 = 300;
const ex = (t) => X0 + t * (X1 - X0);
const ey = (v) => Y1 - ((v - VMIN) / (VMAX - VMIN)) * (Y1 - Y0);
[["#ease-l1", 1], ["#ease-l0", 0]].forEach(([s, v]) => { $(s).setAttribute("y1", ey(v)); $(s).setAttribute("y2", ey(v)); });
$("#ease-t1").setAttribute("y", ey(1) - 6); $("#ease-t0").setAttribute("y", ey(0) - 6);
let easeTween;
function showEase(name, play){
  const fn = gsap.parseEase(name);
  let d = "";
  for (let i = 0; i <= 160; i++){ const t = i / 160; d += (i ? "L" : "M") + ex(t).toFixed(1) + "," + ey(fn(t)).toFixed(1); }
  $("#ease-path").setAttribute("d", d);
  $("#ease-code").textContent = 'ease: "' + name + '"';
  $("#ease-desc").textContent = easeDesc[name] || "";
  const track = $("#ease-track"), dot = $("#ease-dot"), pt = $("#ease-pt");
  const proxy = { t: 0 };
  const render = () => {
    const v = fn(proxy.t);
    pt.setAttribute("cx", ex(proxy.t)); pt.setAttribute("cy", ey(v));
    gsap.set(dot, { x: v * (track.clientWidth - 44) });
  };
  if (easeTween) easeTween.kill();
  render();
  if (play) easeTween = gsap.to(proxy, { t: 1, duration: 1.4, ease: "none", onUpdate: render, delay: 0.1 });
}
const easeBtns = $("#ease-btns");
eases.forEach((name) => {
  const b = document.createElement("button");
  b.className = "btn"; b.textContent = name;
  b.addEventListener("click", () => { $$(".btn", easeBtns).forEach((x) => x.classList.remove("on")); b.classList.add("on"); showEase(name, true); });
  easeBtns.appendChild(b);
  if (name === "power2.out") b.classList.add("on");
});
showEase("power2.out", false);
ScrollTrigger.create({ trigger: "#ease-svg", start: "top 70%", once: true, onEnter: () => showEase("power2.out", true) });

/* ---------- 05 stagger ---------- */
const dots = $$("#dots span");
const stgs = [
  ["each: 0.04", { each: 0.04 }, "stagger: 0.04"],
  ["from: center", { each: 0.03, from: "center" }, 'stagger: { each: 0.03, from: "center" }'],
  ["from: edges", { each: 0.03, from: "edges" }, 'stagger: { each: 0.03, from: "edges" }'],
  ["from: random", { each: 0.02, from: "random" }, 'stagger: { each: 0.02, from: "random" }'],
  ["grid + center", { each: 0.07, from: "center", grid: [4, 10] }, 'stagger: { each: 0.07, from: "center", grid: [4, 10] }'],
  ["amount: 1", { amount: 1, from: "end" }, 'stagger: { amount: 1, from: "end" }'],
];
const stgBtns = $("#stg-btns");
function runStagger(cfg, code, b){
  $$(".btn", stgBtns).forEach((x) => x.classList.remove("on")); b && b.classList.add("on");
  gsap.killTweensOf(dots); gsap.set(dots, { clearProps: "all" });
  gsap.to(dots, { scale: 0.25, backgroundColor: getComputedStyle(document.documentElement).getPropertyValue("--accent").trim(), yoyo: true, repeat: 1, duration: 0.4, ease: "power2.inOut", stagger: cfg });
  $("#stg-code").textContent = code; paint($("#stg-code"), "js");
}
stgs.forEach(([label, cfg, code], i) => {
  const b = document.createElement("button");
  b.className = "btn" + (i === 4 ? " on" : ""); b.textContent = label;
  b.addEventListener("click", () => runStagger(cfg, code, b));
  stgBtns.appendChild(b);
});
$("#stg-code").textContent = stgs[4][2]; paint($("#stg-code"), "js");
ScrollTrigger.create({ trigger: "#dots", start: "top 75%", once: true, onEnter: () => runStagger(stgs[4][1], stgs[4][2], $$(".btn", stgBtns)[4]) });

/* ---------- BA1 ---------- */
const baB = $$("#ba1-b .mini-card"), baA = $$("#ba1-a .mini-card");
function ba1Before(){ baB.forEach((c) => (c.style.visibility = "hidden")); setTimeout(() => baB.forEach((c) => (c.style.visibility = "")), 350); }
function ba1After(){ gsap.fromTo(baA, { y: 30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.8, ease: "power3.out", stagger: 0.07, delay: 0.2 }); }
$("#ba1-before").addEventListener("click", ba1Before);
$("#ba1-after").addEventListener("click", ba1After);
ScrollTrigger.create({ trigger: "#ba1-a", start: "top 80%", once: true, onEnter: () => { ba1Before(); ba1After(); } });

/* ---------- 06 timeline ---------- */
const tA = $("#tl-a"), tB = $("#tl-b"), tC = $("#tl-c");
const dist = (el) => () => el.parentElement.clientWidth - el.offsetWidth - 16;
const tl = gsap.timeline({ paused: true, defaults: { duration: 0.6, ease: "power3.inOut" }, onUpdate: tlUI });
tl.to(tA, { x: dist(tA) })
  .to(tB, { x: dist(tB) }, "<0.15")
  .to(tC, { x: dist(tC), rotation: 360 }, "-=0.2")
  .to([tA, tB], { scale: 0.6 }, "+=0.3")
  .addLabel("final")
  .to(tC, { scale: 1.4 }, "final")
  .to(tA, { rotation: 90 }, "final");
const names = ['.a  x', '.b  x  "<0.15"', '.c  x  "-=0.2"', '.a .b  "+=0.3"', '.c  "final"', '.a  "final"'];
const total = tl.duration();
const rows = $("#g-rows");
rows.innerHTML = tl.getChildren(false, true, false).map((tw, i) =>
  '<div class="g-row"><span>' + esc(names[i] || "") + '</span><div class="g-bar"><i style="left:' + (tw.startTime() / total * 100) + '%;width:' + (tw.duration() / total * 100) + '%"></i></div></div>'
).join("") + '<div class="g-head" id="g-head"></div>';
function tlUI(){
  const p = tl.progress();
  const bar = $(".g-bar", rows);
  const left = bar.offsetLeft + p * bar.clientWidth;
  gsap.set("#g-head", { left: left });
  $("#tl-range").value = Math.round(p * 1000);
  $("#tl-time").textContent = tl.time().toFixed(2) + " / " + total.toFixed(2) + " с";
}
tlUI();
$("#tl-play").onclick = () => { if (tl.progress() === 1) tl.restart(); else tl.play(); };
$("#tl-pause").onclick = () => tl.pause();
$("#tl-reverse").onclick = () => tl.reverse();
$("#tl-restart").onclick = () => tl.restart();
$("#tl-slow").onclick = (e) => { const slow = tl.timeScale() === 1; tl.timeScale(slow ? 0.5 : 1); e.target.classList.toggle("on", slow); };
$("#tl-range").addEventListener("input", (e) => { tl.pause(); tl.progress(e.target.value / 1000); });
ScrollTrigger.create({ trigger: "#tl-stage", start: "top 70%", once: true, onEnter: () => tl.play() });
addEventListener("resize", () => { const p = tl.progress(); tl.invalidate(); tl.progress(p); tlUI(); });

/* ---------- BA2 меню ---------- */
$("#bg-b").addEventListener("click", () => { const o = $("#menu-b").classList.toggle("open"); $("#ph-b").classList.toggle("is-open", o); });
const bgA = $$("#bg-a b");
const menuTl = gsap.timeline({ paused: true })
  .to("#menu-a", { clipPath: "inset(0 0 0% 0)", duration: 0.5, ease: "power3.inOut" })
  .to(bgA[0], { y: 3.5, rotation: 45, duration: 0.3 }, 0)
  .to(bgA[1], { y: -3.5, rotation: -45, duration: 0.3 }, 0)
  .to("#ph-a .phone-bar", { color: getComputedStyle(document.documentElement).getPropertyValue("--bg").trim(), duration: 0.2 }, 0.15)
  .from("#menu-a a", { y: 24, autoAlpha: 0, stagger: 0.06, duration: 0.4, ease: "power3.out" }, "-=0.2");
let menuOpen = false;
$("#bg-a").addEventListener("click", () => { menuOpen = !menuOpen; menuOpen ? menuTl.play() : menuTl.reverse(); });
$$(".menu a").forEach((a) => a.addEventListener("click", (e) => e.preventDefault()));

/* ---------- 07 ScrollTrigger ---------- */
const stCards = $$("#st-grid div");
gsap.set(stCards, { y: 40, autoAlpha: 0 });
ScrollTrigger.batch(stCards, {
  start: "top 90%",
  onEnter: (els) => gsap.to(els, { y: 0, autoAlpha: 1, stagger: 0.08, duration: 0.7, ease: "power3.out", overwrite: true }),
  onLeaveBack: (els) => gsap.to(els, { y: 40, autoAlpha: 0, duration: 0.4, overwrite: true }),
});

const laneDist = (el) => () => el.parentElement.clientWidth - el.offsetWidth - 16;
[["#sc-1", true], ["#sc-2", 1]].forEach(([sel, scrub]) => {
  const el = $(sel);
  gsap.to(el, {
    x: laneDist(el), rotation: 360, ease: "none",
    scrollTrigger: { trigger: "#scrub-demo", start: "top 85%", end: "bottom 15%", scrub: scrub, invalidateOnRefresh: true,
      onUpdate: scrub === true ? (self) => ($("#sc-p").textContent = self.progress.toFixed(2)) : undefined },
  });
});

const steps = $$("#story .story-step");
gsap.set(steps.slice(1), { autoAlpha: 0, y: 20 });
const storyTl = gsap.timeline({
  defaults: { ease: "power2.inOut" },
  scrollTrigger: { trigger: "#story", start: "top 12%", end: "+=150%", scrub: 1, pin: true, pinSpacing: true },
});
storyTl.to(steps[0], { autoAlpha: 0, y: -20 })
  .to(steps[1], { autoAlpha: 1, y: 0 }, "<")
  .to("#story-shape", { rotation: 45, borderRadius: "50%" }, "<")
  .to(steps[1], { autoAlpha: 0, y: -20 }, "+=0.3")
  .to(steps[2], { autoAlpha: 1, y: 0 }, "<")
  .to("#story-shape", { scale: 0.6, rotation: 180, borderRadius: "12px" }, "<")
  .to({}, { duration: 0.3 });

const hTrack = $("#h-track"), hWrap = $("#h-wrap");
const hDist = () => Math.max(0, hTrack.scrollWidth - hWrap.clientWidth);
gsap.to(hTrack, {
  x: () => -hDist(), ease: "none",
  scrollTrigger: { trigger: hWrap, start: () => "top " + Math.round((innerHeight - hWrap.offsetHeight) / 2 + 28) + "px", end: () => "+=" + hDist(), scrub: 1, pin: true, pinSpacing: true, invalidateOnRefresh: true },
});

document.fonts.ready.then(() => {
  const ms = SplitText.create("#manifesto", { type: "words" });
  gsap.from(ms.words, { opacity: 0.15, stagger: 0.1, ease: "none", scrollTrigger: { trigger: "#manifesto", start: "top 80%", end: "bottom 45%", scrub: true } });
  ScrollTrigger.refresh();
});

// параллакс: генерируем кружки
const pal = ["var(--line)", "var(--accent-soft)", "var(--accent)"];
$$("#para .para-layer").forEach((layer, li) => {
  const n = [14, 8, 5][li];
  let html = "";
  for (let i = 0; i < n; i++){
    const s = [16, 34, 64][li] * gsap.utils.random(0.6, 1.3);
    html += '<span style="width:' + s + 'px;height:' + s + 'px;left:' + gsap.utils.random(2, 94) + '%;top:' + gsap.utils.random(10, 130) + '%;background:' + pal[li] + '"></span>';
  }
  layer.innerHTML = html;
  const speed = parseFloat(layer.dataset.speed);
  gsap.to(layer, { y: -200 * speed, ease: "none", scrollTrigger: { trigger: "#para", start: "top bottom", end: "bottom top", scrub: true } });
});

/* ---------- 08 плагины ---------- */
let splitDemo;
document.fonts.ready.then(() => {
  splitDemo = SplitText.create("#split-demo", { type: "lines, words, chars", mask: "lines", autoSplit: true });
  ScrollTrigger.create({ trigger: "#split-demo", start: "top 80%", once: true, onEnter: () => runSplit("chars") });
});
let splitTween;
function runSplit(kind){
  if (!splitDemo) return;
  if (splitTween) splitTween.progress(1).kill();
  const cfg = {
    chars: [splitDemo.chars, { yPercent: 100, stagger: 0.015, duration: 0.8, ease: "expo.out" }],
    words: [splitDemo.words, { y: 30, autoAlpha: 0, rotation: 6, stagger: 0.05, duration: 0.7, ease: "power3.out" }],
    lines: [splitDemo.lines, { yPercent: 100, stagger: 0.12, duration: 0.9, ease: "expo.out" }],
  }[kind];
  splitTween = gsap.from(cfg[0], cfg[1]);
}
$$("[data-split]").forEach((b) => b.addEventListener("click", () => runSplit(b.dataset.split)));

const flipBox = $("#flip-box");
function flipIt(change){
  const items = $$("div", flipBox);
  const state = Flip.getState(items);
  change(items);
  Flip.from(state, { duration: 0.7, ease: "power2.inOut", stagger: 0.03 });
}
$("#flip-layout").addEventListener("click", () => flipIt(() => flipBox.classList.toggle("list")));
$("#flip-shuffle").addEventListener("click", () => flipIt((items) => gsap.utils.shuffle(items).forEach((el) => flipBox.appendChild(el))));

Draggable.create("#drag-card", { type: "x,y", bounds: "#drag-stage", inertia: true, edgeResistance: 0.7,
  onPress(){ gsap.to(this.target, { scale: 1.08, duration: 0.2 }); },
  onRelease(){ gsap.to(this.target, { scale: 1, duration: 0.3 }); } });

gsap.to("#mp-obj", { motionPath: { path: "#mp-path", align: "#mp-path", alignOrigin: [0.5, 0.5], autoRotate: true }, duration: 3.2, repeat: -1, ease: "power1.inOut", yoyo: true });

const drawIt = () => gsap.fromTo("#draw-path", { drawSVG: "0%" }, { drawSVG: "100%", duration: 1.6, ease: "power2.inOut" });
$("#draw-btn").addEventListener("click", drawIt);
ScrollTrigger.create({ trigger: "#draw-path", start: "top 80%", once: true, onEnter: drawIt });

const shapes = {
  circle: "M160,30 C193,30 220,57 220,90 C220,123 193,150 160,150 C127,150 100,123 100,90 C100,57 127,30 160,30 Z",
  star: "M160,22 L178,68 L228,70 L189,101 L203,150 L160,122 L117,150 L131,101 L92,70 L142,68 Z",
  square: "M104,34 L216,34 L216,146 L104,146 Z",
};
$$("[data-morph]").forEach((b) => b.addEventListener("click", () => gsap.to("#morph", { morphSVG: shapes[b.dataset.morph], duration: 0.8, ease: "power2.inOut" })));

const words = ["ДИЗАЙН", "АНИМАЦИЯ", "СКРОЛЛ", "ТАЙМЛАЙН", "GSAP"];
let wi = 0;
$("#scramble-btn").addEventListener("click", () => {
  wi = (wi + 1) % words.length;
  gsap.to("#scramble", { scrambleText: { text: words[wi], chars: "АБВГДЕЖЗИКЛМН0123456789", speed: 0.4 }, duration: 1 });
});

/* ---------- 10 приёмы ---------- */
const magWrap = $("#mag-wrap"), magBtn = $("#mag-btn"), fill = $(".fill", magBtn);
magWrap.addEventListener("pointermove", (e) => {
  const r = magBtn.getBoundingClientRect();
  gsap.to(magBtn, { x: (e.clientX - (r.left + r.width / 2)) * 0.35, y: (e.clientY - (r.top + r.height / 2)) * 0.35, duration: 0.3, ease: "power3.out" });
});
magBtn.addEventListener("pointerenter", () => gsap.to(fill, { scale: 1.6, duration: 0.45, ease: "power3.out" }));
magWrap.addEventListener("pointerleave", () => {
  gsap.to(magBtn, { x: 0, y: 0, duration: 0.8, ease: "elastic.out(1, 0.4)" });
  gsap.to(fill, { scale: 0, duration: 0.35, ease: "power2.in" });
});

const area = $("#cursor-area");
const dX = gsap.quickTo("#c-dot", "x", { duration: 0.15, ease: "power3" }), dY = gsap.quickTo("#c-dot", "y", { duration: 0.15, ease: "power3" });
const rX = gsap.quickTo("#c-ring", "x", { duration: 0.6, ease: "power3" }), rY = gsap.quickTo("#c-ring", "y", { duration: 0.6, ease: "power3" });
gsap.set(["#c-dot", "#c-ring"], { x: area.clientWidth / 2, y: 60 });
area.addEventListener("pointermove", (e) => {
  const r = area.getBoundingClientRect();
  const x = e.clientX - r.left, y = e.clientY - r.top;
  dX(x); dY(y); rX(x); rY(y);
});
area.addEventListener("pointerdown", () => gsap.to("#c-ring", { scale: 0.6, duration: 0.15, yoyo: true, repeat: 1 }));

const loop = gsap.to("#marquee-track", { xPercent: -50, duration: 22, ease: "none", repeat: -1 });
ScrollTrigger.create({
  onUpdate: (self) => {
    const boost = 1 + Math.min(Math.abs(self.getVelocity()) / 300, 5);
    gsap.to(loop, { timeScale: boost, duration: 0.2, overwrite: true });
    gsap.to(loop, { timeScale: 1, duration: 1, delay: 0.2 });
  },
});

$$("[data-to]").forEach((el) => {
  const obj = { val: 0 };
  gsap.to(obj, { val: +el.dataset.to, duration: 2, ease: "power2.out",
    scrollTrigger: { trigger: el, start: "top 85%", once: true },
    onUpdate: () => (el.textContent = Math.round(obj.val).toLocaleString("ru-RU")) });
});

const tStage = $("#tilt-stage"), tCard = $("#tilt-card");
tStage.addEventListener("pointermove", (e) => {
  const r = tStage.getBoundingClientRect();
  const px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
  gsap.to(tCard, { rotationY: px * 24, rotationX: -py * 24, transformPerspective: 900, duration: 0.5, ease: "power2.out" });
});
tStage.addEventListener("pointerleave", () => gsap.to(tCard, { rotationX: 0, rotationY: 0, duration: 0.8, ease: "power3.out" }));

addEventListener("load", () => ScrollTrigger.refresh());
})();
