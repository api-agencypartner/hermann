{
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const hover = matchMedia('(hover:hover)').matches;

/* smooth scroll */
let lenis = null;
if (!RM && window.Lenis) {
  lenis = new Lenis({ duration: 1.1, easing: t => 1 - Math.pow(1 - t, 4) });
  const raf = t => { lenis.raf(t); requestAnimationFrame(raf); }; requestAnimationFrame(raf);
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => { const id = a.getAttribute('href'); if (id.length > 1 && $(id)) { e.preventDefault(); lenis.scrollTo(id, { offset: -70 }); } }));
}

/* split headlines */
$$('.split').forEach(el => {
  const walk = n => [...n.childNodes].forEach(c => {
    if (c.nodeType === 3) { const f = document.createDocumentFragment(); c.textContent.split(/(\s+)/).forEach(w => { if (!w) return; if (/^\s+$/.test(w)) f.append(w); else { const s = document.createElement('span'); s.className = 'w'; s.innerHTML = `<i>${w}</i>`; f.append(s); } }); c.replaceWith(f); }
    else if (c.nodeType === 1) walk(c);
  });
  walk(el); $$('.w>i', el).forEach((i, k) => i.style.transitionDelay = `${k * 35}ms`);
});

/* reveal + count-up */
const fmt = (v, d, suf) => (d ? v.toFixed(d) : Math.round(v).toString()) + (suf || '');
const countUp = el => { const to = +el.dataset.count, d = +(el.dataset.dec || 0), suf = el.dataset.suf || ''; if (RM) { el.textContent = fmt(to, d, suf); return; } const t0 = performance.now(); const tick = now => { const p = clamp((now - t0) / 1600), e = 1 - Math.pow(1 - p, 4); el.textContent = fmt(to * e, d, suf); if (p < 1) requestAnimationFrame(tick); }; requestAnimationFrame(tick); };
$$('[data-count]').forEach(el => el.textContent = fmt(0, +(el.dataset.dec || 0), el.dataset.suf));
const io = new IntersectionObserver(es => es.forEach(e => { if (!e.isIntersecting) return; const t = e.target; io.unobserve(t); t.classList.add('in'); if (t.dataset.count) countUp(t); }), { rootMargin: '0px 0px -10% 0px' });
$$('.rv,.split,[data-count]').forEach(el => io.observe(el));

/* nav */
const nav = $('#nav'), hero = $('#top'), burger = $('.burger'), mnav = $('#mnav'); let lastY = 0;
const setMenu = open => { mnav.hidden = !open; burger.setAttribute('aria-expanded', open); burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu'); open ? lenis?.stop() : lenis?.start(); document.body.style.overflow = open ? 'hidden' : ''; };
burger.addEventListener('click', () => setMenu(mnav.hidden));
$$('a', mnav).forEach(a => a.addEventListener('click', () => setMenu(false)));
addEventListener('keydown', e => { if (e.key === 'Escape' && !mnav.hidden) setMenu(false); });

/* videos */
const vio = new IntersectionObserver(es => es.forEach(e => { const v = e.target; if (RM || v.dataset.user) return; e.isIntersecting ? v.play().catch(() => {}) : v.pause(); }), { threshold: .1 });
$$('video').forEach(v => { if (RM) { v.removeAttribute('autoplay'); v.pause(); } vio.observe(v); });
$$('.vidbtn').forEach(b => { const v = $(b.dataset.vid), set = p => { b.classList.toggle('paused', p); b.setAttribute('aria-label', (p ? 'Play' : 'Pause') + ' background video'); }; if (RM) set(true);
  b.addEventListener('click', () => { if (v.paused) { v.dataset.user = ''; v.play(); set(false); } else { v.dataset.user = '1'; v.pause(); set(true); } }); });

/* warehouse card crossfade */
$$('.fade').forEach(f => { const im = $$('img', f); let i = 0, t; const step = () => { im[i].classList.remove('on'); i = (i + 1) % im.length; im[i].classList.add('on'); };
  new IntersectionObserver(([e]) => { clearInterval(t); if (e.isIntersecting && !RM) t = setInterval(step, 4200); }, { threshold: .3 }).observe(f); });

/* stacked cards: index for sticky offset */
const cards = $$('.card'); cards.forEach((c, i) => c.style.setProperty('--i', i));

/* tracker + scroll-linked */
const tracker = $('#tracker'), tsteps = $$('.tracker__steps li'), tstat = $('#trkStatus'), labels = ['Booked', 'At port', 'In transit', 'Stored', 'Delivered'];
const svc = $('#services'), journey = $('#journey'), track = $('.journey__track'), legs = $$('.leg'), jFill = $('#jFill'), jClock = $('#jClock'), jPlace = $('#jPlace');
const ind = $('#industries'), endZone = $('#locations');
let stage = -1;
const setStage = s => { if (s === stage) return; stage = s; tsteps.forEach((li, k) => { li.classList.toggle('done', k < s); li.classList.toggle('on', k === s); }); tstat.textContent = labels[s]; };
let curLeg = -1;
const onScroll = y => {
  nav.classList.toggle('solid', y > hero.offsetHeight - 80);
  if ($('#mnav').hidden) { if (y > 500 && y > lastY + 3) nav.classList.add('hide'); else if (y < lastY - 3) nav.classList.remove('hide'); }
  lastY = y;
  const vh = innerHeight;
  // tracker visibility: from services to the start of locations
  const show = svc.getBoundingClientRect().top < vh * .6 && endZone.getBoundingClientRect().top > vh * .5;
  tracker.classList.toggle('show', show);
  // stage
  const jr = journey.getBoundingClientRect(), span = journey.offsetHeight - vh, jp = clamp(-jr.top / span);
  if (jr.top > vh * .3) setStage(0);
  else if (ind.getBoundingClientRect().top < vh * .6) setStage(4);
  else setStage(Math.min(4, 1 + Math.floor(jp * 4 * .999)));
  // journey
  if (innerWidth > 860 && !RM) {
    const max = track.scrollWidth - innerWidth + 64;
    track.style.transform = `translate3d(${-jp * max}px,0,0)`;
    jFill.style.transform = `scaleX(${jp})`;
    legs.forEach(l => { const r = l.getBoundingClientRect(); l.querySelector('img').style.transform = `scale(1.1) translateX(${((r.left + r.width / 2) / innerWidth - .5) * -36}px)`; });
    const k = Math.min(legs.length - 1, Math.floor(jp * legs.length * .999));
    if (k !== curLeg) { curLeg = k; jClock.textContent = legs[k].dataset.t; jPlace.textContent = legs[k].dataset.p; }
    // stacked cards: earlier cards shrink slightly as the next covers them
    cards.forEach((c, i) => { const n = cards[i + 1]; if (!n) return; const nr = n.getBoundingClientRect(), cr = c.getBoundingClientRect(); const p = clamp(1 - (nr.top - cr.top) / cr.height); c.style.transform = `scale(${1 - p * .05})`; c.style.filter = `brightness(${1 - p * .25})`; });
  }
};
if (lenis) lenis.on('scroll', e => onScroll(e.scroll)); else addEventListener('scroll', () => onScroll(scrollY), { passive: true });
addEventListener('resize', () => onScroll(scrollY)); onScroll(scrollY);

/* industries: floating image follows the cursor (photos load from assets/ind/<key>.jpg) */
{
  const fl = $('#ifloat'), fimg = $('img', fl), have = {};
  $$('#ilist li').forEach(li => { const src = `assets/ind/${li.dataset.img}.jpg`, test = new Image(); test.onload = () => have[li.dataset.img] = src; test.src = src; });
  let x = 0, y = 0, tx = 0, ty = 0, raf = 0;
  const loop = () => { x += (tx - x) * .14; y += (ty - y) * .14; fl.style.transform = `translate(${x - 150}px,${y - 112}px) scale(1)`; raf = requestAnimationFrame(loop); };
  if (hover && !RM) {
    $$('#ilist li').forEach(li => {
      li.addEventListener('mouseenter', e => { const s = have[li.dataset.img]; if (!s) return; fimg.src = s; tx = x = e.clientX; ty = y = e.clientY; fl.classList.add('on'); if (!raf) raf = requestAnimationFrame(loop); });
      li.addEventListener('mouseleave', () => { fl.classList.remove('on'); cancelAnimationFrame(raf); raf = 0; });
      li.addEventListener('mousemove', e => { tx = e.clientX + 170; ty = e.clientY; });
    });
  }
}

/* departure board */
{
  const sites = [
    ['Monmouth Junction', '21 Distribution Way, Monmouth Junction, NJ 08852', 'NJ', '800-524-0067', 'loc-distribution'],
    ['North Brunswick', '481 Blackhorse Lane, North Brunswick, NJ', 'NJ', '732-710-0408', 'loc-blackhorse'],
    ['Bordentown, Rising Sun', '445 Rising Sun Road, Bordentown, NJ', 'NJ', '640-216-6947', 's87'],
    ['Bordentown, Hedding', '304 Bordentown-Hedding Road, Bordentown, NJ', 'NJ', '640-216-6946', 'loc-hedding'],
    ['New Castle', '350 Anchor Mill Road, New Castle, DE', 'DE', '302-427-2830', 'loc-anchormill'],
    ['Houston, Sam Houston Pkwy', '3520 E Sam Houston Pkwy N, Houston, TX', 'TX', '800-524-0067 (main)', 'loc-samhouston'],
    ['Houston, Cavalcade', '6410 Cavalcade Street, Houston, TX', 'TX', '713-674-0805', 'loc-cavalcade'],
  ];
  const body = $('#fidsBody');
  body.innerHTML = sites.map((s, i) => `<div class="fids__row" role="row" data-st="${s[2]}" data-i="${i}" tabindex="0"><span class="fx" role="cell" data-t="${s[0]}">${s[0]}</span><span role="cell">${s[1]}</span><span role="cell"><span class="flap">${[...s[2]].map(c => `<b>${c}</b>`).join('')}</span></span><span role="cell"><a href="tel:+1${s[3].replace(/\D/g, '')}">${s[3]}</a></span><span class="stat" role="cell">Open</span></div>`).join('');
  const CH = 'ABCDEFGHIJKLMNOPRSTUVWXYZ';
  const flip = el => { if (RM) return; const t = el.dataset.t; let f = 0; const n = 14; const id = setInterval(() => { f++; el.textContent = [...t].map((c, i) => c === ' ' || c === ',' || c === '·' || i < (f / n) * t.length ? c : CH[(Math.random() * CH.length) | 0]).join(''); if (f >= n) { clearInterval(id); el.textContent = t; } }, 45); };
  const bio = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { bio.unobserve(e.target); $$('.fx', e.target).forEach((el, i) => setTimeout(() => flip(el), i * 90)); } }), { threshold: .3 });
  bio.observe(body);
  const bg = $$('#boardBg img'); let bi = 0, curRow = -1;
  sites.forEach(x => { const im = new Image(); im.src = `assets/${x[4]}.webp`; });
  const pickRow = i => { if (i === curRow) return; curRow = i; $$('.fids__row', body).forEach(r => r.classList.toggle('on', +r.dataset.i === i)); const nx = bg[1 - bi]; nx.src = `assets/${sites[i][4]}.webp`; nx.alt = ''; nx.classList.add('on'); bg[bi].classList.remove('on'); bi = 1 - bi; };
  $$('.fids__row', body).forEach(r => { r.addEventListener('mouseenter', () => pickRow(+r.dataset.i)); r.addEventListener('focus', () => pickRow(+r.dataset.i)); r.addEventListener('click', () => pickRow(+r.dataset.i)); });
  pickRow(0);
  $$('.seg button').forEach(b => b.addEventListener('click', () => {
    $$('.seg button').forEach(x => x.classList.toggle('on', x === b));
    $$('.fids__row', body).forEach(r => { r.hidden = b.dataset.st !== 'all' && r.dataset.st !== b.dataset.st; if (!r.hidden) flip($('.fx', r)); });
    const first = $$('.fids__row', body).find(r => !r.hidden); if (first) pickRow(+first.dataset.i);
  }));
}

/* timeline: arrows, keys, drag */
{
  const tl = $('#tl'), step = () => tl.querySelector('article').offsetWidth + 24;
  $('#tlPrev').addEventListener('click', () => tl.scrollBy({ left: -step(), behavior: RM ? 'auto' : 'smooth' }));
  $('#tlNext').addEventListener('click', () => tl.scrollBy({ left: step(), behavior: RM ? 'auto' : 'smooth' }));
  tl.addEventListener('keydown', e => { if (e.key === 'ArrowRight') tl.scrollBy({ left: step() }); if (e.key === 'ArrowLeft') tl.scrollBy({ left: -step() }); });
  let down = false, sx = 0, s0 = 0;
  tl.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') return; down = true; sx = e.clientX; s0 = tl.scrollLeft; });
  addEventListener('pointermove', e => { if (!down) return; const dx = e.clientX - sx; if (Math.abs(dx) > 4) tl.classList.add('drag'); tl.scrollLeft = s0 - dx; });
  addEventListener('pointerup', () => { down = false; tl.classList.remove('drag'); });
}

/* quotes */
{
  const qs = $$('.q'), fill = $('#qFill'), DUR = 8000; let qi = 0, t0 = performance.now(), vis = false;
  const show = n => { qs[qi].classList.remove('on'); qi = (n + qs.length) % qs.length; qs[qi].classList.add('on'); $('#qCount').textContent = `${qi + 1} / ${qs.length}`; t0 = performance.now(); };
  $('#qPrev').addEventListener('click', () => show(qi - 1)); $('#qNext').addEventListener('click', () => show(qi + 1));
  new IntersectionObserver(([e]) => { vis = e.isIntersecting; t0 = performance.now(); }).observe($('.proof'));
  const loop = now => { if (vis && !RM) { const p = clamp((now - t0) / DUR); fill.style.transform = `scaleX(${p})`; if (p >= 1) show(qi + 1); } requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
}

/* form */
const form = $('#qform'), note = $('#fnote');
form.addEventListener('submit', e => {
  e.preventDefault(); let first = null;
  $$('[required]', form).forEach(i => { const bad = !i.value.trim() || (i.type === 'email' && !/^\S+@\S+\.\S+$/.test(i.value)); i.setAttribute('aria-invalid', bad); if (bad && !first) first = i; });
  if (first) { first.focus(); note.style.color = '#9a2f2f'; note.textContent = 'Please add your name, company and a valid email.'; return; }
  note.style.color = ''; note.textContent = 'Thanks. In this preview the form does not send; on the live site it goes to sales@hermanntds.com.';
});

/* mega menu */
{
  const items = $$('.menu__item'), scrim = document.createElement('div'); scrim.className = 'scrim'; document.body.append(scrim);
  let openEl = null, tClose;
  const close = () => { if (!openEl) return; openEl.querySelector('.menu__btn').setAttribute('aria-expanded', false); openEl.querySelector('.mega').classList.remove('on'); openEl = null; nav.classList.remove('open'); scrim.classList.remove('on'); };
  const open = it => { if (openEl === it) return; close(); openEl = it; it.querySelector('.menu__btn').setAttribute('aria-expanded', true); it.querySelector('.mega').classList.add('on'); nav.classList.add('open'); nav.classList.remove('hide'); scrim.classList.add('on'); };
  items.forEach(it => {
    const b = it.querySelector('.menu__btn');
    b.addEventListener('click', () => openEl === it ? close() : open(it));
    if (hover) { it.addEventListener('mouseenter', () => { clearTimeout(tClose); open(it); }); it.addEventListener('mouseleave', () => { tClose = setTimeout(close, 180); }); }
    $$('a', it).forEach(a => a.addEventListener('click', close));
  });
  scrim.addEventListener('click', close);
  addEventListener('keydown', e => { if (e.key === 'Escape' && openEl) { const b = openEl.querySelector('.menu__btn'); close(); b.focus(); } });
}

/* truck buttons */
{
  const svg = '<svg class="truck" viewBox="0 0 30 14" aria-hidden="true"><rect x="0" y="1" width="17" height="9" rx="1" fill="currentColor"/><path d="M18 4h6l4 3.5V10H18z" fill="currentColor"/><path d="M21 5h2.6l2 2H21z" fill="rgba(0,0,0,.35)"/><circle class="wh" cx="5" cy="11.5" r="2.2" fill="currentColor" stroke="rgba(0,0,0,.4)" stroke-width="1"/><circle class="wh" cx="12" cy="11.5" r="2.2" fill="currentColor" stroke="rgba(0,0,0,.4)" stroke-width="1"/><circle class="wh" cx="24" cy="11.5" r="2.2" fill="currentColor" stroke="rgba(0,0,0,.4)" stroke-width="1"/></svg>';
  if (!RM) $$('.btn--green,.btn--white').forEach(b => {
    b.insertAdjacentHTML('afterbegin', svg);
    b.addEventListener('mouseenter', () => { b.style.setProperty('--bw', b.offsetWidth + 'px'); b.classList.remove('drive-out'); void b.offsetWidth; b.classList.add('drive-in'); });
    b.addEventListener('mouseleave', () => { b.classList.remove('drive-in'); void b.offsetWidth; b.classList.add('drive-out'); });
    b.addEventListener('animationend', e => { if (e.animationName === 'tout') b.classList.remove('drive-out'); });
  });
}
}
