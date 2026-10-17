// Criterios de aceptación de la iteración 3 de C: panel de accesibilidad (temas, contraste, tamaño, espaciado,
// tipografía, movimiento, foco, objetivos, atajos de una tecla, voz) y axe en los cuatro temas.
// Uso: node iteracion3_accesibilidad.js [URL_BASE]   (por defecto http://127.0.0.1:8765/)
const { chromium } = require('playwright-core');
const fs = require('fs'), path = require('path');
const BASE = (process.argv[2] || 'http://127.0.0.1:8765/') + 'final-c/';
const MAC = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const exe = process.env.CHROME || (fs.existsSync(MAC) ? MAC : undefined);
const AXE = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
const SH = path.join(__dirname, 'capturas');
const KEY = 'tms-c-a11y-v1';

(async () => {
  const b = await chromium.launch(exe ? { executablePath: exe } : {});
  const res = []; const ok = (id, c, d) => res.push({ id, ok: !!c, d });
  // Página nueva con preferencias guardadas (o sin ellas) y opciones del contexto (tema o movimiento del sistema)
  const abrir = async (prefs, ctxOpts = {}, w = 1440, h = 900, hash = '') => {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, ...ctxOpts });
    await ctx.addInitScript(([k, p]) => {
      if (p && !sessionStorage.getItem('__init')) { localStorage.setItem(k, JSON.stringify(p)); sessionStorage.setItem('__init', '1'); }
      window.__voz = []; window.speechSynthesis && (window.speechSynthesis.speak = u => window.__voz.push(u.text));   // la voz real no se reproduce en la prueba
    }, [KEY, prefs || null]);
    const p = await ctx.newPage(); await p.goto(BASE + hash); return { ctx, p };
  };
  const desborda = p => p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  const serias = async p => { await p.addScriptTag({ content: AXE }); const r = await p.evaluate(t => axe.run(document, { runOnly: { type: 'tag', values: t } }), TAGS);
    return r.violations.filter(v => ['serious', 'critical'].includes(v.impact)).map(v => `${v.id}(${v.nodes.length})`); };
  // Recorre el flujo y llama a fn en cada estado clave
  const flujo = async (p, fn) => {
    await fn('P01'); await p.click('#c-PE07-0001201'); await p.click('#gen'); await p.waitForSelector('#con'); await fn('P03');
    await p.selectOption('#con', 'Andrés Mejía · ABC123'); await p.click('#ready'); await p.waitForSelector('#mov'); await fn('P04');
    await p.click('#mov'); await p.waitForSelector('#retry'); await p.click('#retry'); await p.waitForSelector('#desp'); await fn('P04b');
    await p.click('#desp'); await p.waitForSelector('[role=alertdialog]'); await fn('confirmación');
    await p.click('#confirm'); await p.waitForSelector('#undo'); await fn('P05');
    await p.click('#next'); await p.click('nav[aria-label="Menú principal"] a[href="#guias"]'); await p.waitForSelector('[data-deshacer]'); await fn('Guías');
    await p.click('#a11yb'); await p.waitForSelector('#a11y:not([hidden])'); await fn('panel abierto'); await p.keyboard.press('Escape');
  };

  // A3-01 · el panel se abre y se usa solo con teclado; atrapa el foco; Esc lo cierra y devuelve el foco
  let { ctx, p } = await abrir(null);
  let tabs = 0, primero = '';
  while (tabs < 30 && primero !== 'a11yb') { await p.keyboard.press('Tab'); tabs++; primero = await p.evaluate(() => document.activeElement.id); }
  await p.keyboard.press('Enter'); await p.waitForSelector('#a11y:not([hidden])');
  const exp = await p.getAttribute('#a11yb', 'aria-expanded'), fIn = await p.evaluate(() => document.activeElement.id);
  let fuera = 0; for (let i = 0; i < 40; i++) { await p.keyboard.press('Tab'); if (!(await p.evaluate(() => !!document.activeElement.closest('#a11y')))) fuera++; }
  await p.screenshot({ path: SH + '/C15_panel_accesibilidad.png' });
  await p.keyboard.press('Escape'); await p.waitForTimeout(150);
  ok('A3-01', primero === 'a11yb' && exp === 'true' && fIn === 'a11yt' && fuera === 0 && await p.evaluate(() => document.activeElement.id) === 'a11yb' && await p.getAttribute('#a11yb', 'aria-expanded') === 'false',
     `con Tab se llega a «Accesibilidad» (${tabs} Tab) · abre con Enter, foco en el título · 40 Tab sin salir del panel (${fuera} fuera) · Esc cierra y devuelve el foco`);

  // A3-02 · tema oscuro: se aplica, se nota y se conserva al recargar
  await p.click('#a11yb'); await p.check('#t-oscuro');
  const fondo = await p.evaluate(() => getComputedStyle(document.body).backgroundColor);
  await p.reload(); const tras = await p.getAttribute('html', 'data-tema');
  ok('A3-02', fondo === 'rgb(15, 23, 38)' && tras === 'oscuro', `fondo ${fondo} · tras recargar data-tema=${tras}`);
  await ctx.close();

  // A3-03 · «Automático» sigue al sistema operativo
  ({ ctx, p } = await abrir(null, { colorScheme: 'dark' })); const auto1 = await p.getAttribute('html', 'data-tema'); await ctx.close();
  ({ ctx, p } = await abrir(null, { colorScheme: 'light' })); const auto2 = await p.getAttribute('html', 'data-tema'); await ctx.close();
  ok('A3-03', auto1 === 'oscuro' && auto2 === 'claro', `sistema oscuro → ${auto1} · sistema claro → ${auto2}`);

  // A3-04 · axe sin infracciones serias en el flujo completo, en los cuatro temas
  const temas = [['claro', { tema: 'claro' }], ['oscuro', { tema: 'oscuro' }], ['alto contraste', { tema: 'claro', contraste: true }], ['oscuro + alto contraste', { tema: 'oscuro', contraste: true }]];
  const fallasAxe = [];
  for (const [n, pref] of temas) {
    ({ ctx, p } = await abrir(pref));
    await flujo(p, async est => { const s = await serias(p); if (s.length) fallasAxe.push(`${n} · ${est}: ${s.join(', ')}`); if (est === 'P04b') await p.screenshot({ path: SH + `/C16_tema_${n.replace(/[^a-z]+/g, '_')}.png` }); });
    await ctx.close();
  }
  ok('A3-04', fallasAxe.length === 0, fallasAxe.length ? fallasAxe.join(' | ') : '4 temas × 8 estados (incluido el panel abierto): 0 infracciones serias');

  // A3-05 · texto al 200 % sin perder contenido (1.4.4)
  ({ ctx, p } = await abrir({ escala: 200 }, {}, 1280, 800));
  const h1 = await p.evaluate(() => getComputedStyle(document.querySelector('h1')).fontSize);
  const desb200 = []; await flujo(p, async est => { if (await desborda(p)) desb200.push(est); });
  ok('A3-05', h1 === '56px' && desb200.length === 0, `h1 a ${h1} (28 px al 100 %) · desborde en: ${desb200.join(', ') || 'ninguno'} (1280 px)`);
  await ctx.close();

  // A3-06 · espaciado de lectura (1.4.12) a 1280 y 390 px
  const desbEsp = [];
  for (const w of [1280, 390]) { ({ ctx, p } = await abrir({ espaciado: true }, {}, w, 844)); await flujo(p, async est => { if (await desborda(p)) desbEsp.push(`${w}px ${est}`); }); await ctx.close(); }
  ({ ctx, p } = await abrir({ espaciado: true })); const ls = await p.evaluate(() => getComputedStyle(document.querySelector('p.sub')).letterSpacing); await ctx.close();
  ok('A3-06', ls !== 'normal' && desbEsp.length === 0, `letter-spacing ${ls} · desborde en: ${desbEsp.join(', ') || 'ninguno'}`);

  // A3-07 · atajos de una tecla desactivables (2.1.4)
  ({ ctx, p } = await abrir({ atajos: false }));
  await p.click('#c-PE07-0001201'); await p.focus('#c-PE07-0001201'); await p.keyboard.press('g'); await p.waitForTimeout(250);
  const sinG = !(await p.$('#con')), pista = await p.isVisible('#gen .kbd');
  await p.click('#gen'); await p.waitForSelector('#con'); const ks = await p.$$eval('[aria-keyshortcuts]', e => e.length);
  await ctx.close();
  ({ ctx, p } = await abrir({ atajos: true }));
  await p.click('#c-PE07-0001201'); await p.focus('#c-PE07-0001201'); await p.keyboard.press('g'); await p.waitForTimeout(250); const conG = !!(await p.$('#con'));
  await ctx.close();
  ok('A3-07', sinG && !pista && ks === 0 && conG, `apagados: G no hace nada (${sinG}), la pista «(G)» no se ve, ${ks} aria-keyshortcuts · encendidos: G genera la guía (${conG})`);

  // A3-08 · reducir movimiento: sigue al sistema y quita transiciones
  ({ ctx, p } = await abrir(null, { reducedMotion: 'reduce' }));
  const mov = await p.getAttribute('html', 'data-movimiento'), tr = await p.evaluate(() => getComputedStyle(document.querySelector('button')).transitionDuration);
  await ctx.close();
  ok('A3-08', mov === 'reducido' && tr === '0s', `sistema con movimiento reducido → data-movimiento=${mov} · transición ${tr}`);

  // A3-09 · foco reforzado y botones grandes
  ({ ctx, p } = await abrir({ foco: true, grandes: true }));
  await p.keyboard.press('Tab'); const ow = await p.evaluate(() => getComputedStyle(document.activeElement).outlineWidth);
  const mh = await p.evaluate(() => document.getElementById('sync').getBoundingClientRect().height);
  await ctx.close();
  ok('A3-09', ow === '5px' && mh >= 48, `marco de foco ${ow} · botón «Sincronizar» de ${Math.round(mh)} px`);

  // A3-10 · voz: lee los avisos (con concordancia) y el estado de la pantalla
  ({ ctx, p } = await abrir({ voz: true }));
  await p.click('#c-PE07-0001201'); await p.waitForTimeout(150);
  await p.click('#gen'); await p.waitForSelector('#con');
  await p.click('#a11yb'); await p.click('#leer'); await p.waitForTimeout(100);
  const voz = await p.evaluate(() => window.__voz), msg = await p.textContent('#vozmsg');
  await ctx.close();
  ok('A3-10', voz.includes('1 pedido seleccionado') && voz.some(t => /Guía de despacho TMS-2026-0412/.test(t) && /Paso 2 de 4/.test(t)) && /^Leyendo:/.test(msg),
     `avisos leídos: ${voz.map(t => '«' + t.slice(0, 60) + '»').join(' · ')}`);

  // A3-11 · restablecer vuelve a lo predeterminado
  ({ ctx, p } = await abrir({ tema: 'oscuro', contraste: true, escala: 175, atajos: false, espaciado: true }, { colorScheme: 'light' }));
  await p.click('#a11yb'); await p.click('#a11yr');
  const st = await p.evaluate(() => ({ t: document.documentElement.dataset.tema, c: document.documentElement.dataset.contraste || '', e: document.documentElement.style.fontSize, a: document.documentElement.dataset.atajos, s: document.documentElement.dataset.espaciado || '' }));
  await ctx.close();
  ok('A3-11', st.t === 'claro' && !st.c && st.e === '16px' && st.a === 'on' && !st.s, `tras restablecer: tema ${st.t}, contraste «${st.c}», texto ${st.e}, atajos ${st.a}`);

  await b.close();
  console.log(`Iteración 3 de C · accesibilidad · ${new Date().toISOString()} · base ${BASE}`);
  for (const r of res.sort((a, c) => a.id.localeCompare(c.id))) console.log(`${r.ok ? 'PASA ' : 'FALLA'} ${r.id}  ${r.d}`);
  const n = res.filter(r => r.ok).length; console.log(`\nResumen: ${n}/${res.length} pasan`); process.exitCode = n === res.length ? 0 : 1;
})();
