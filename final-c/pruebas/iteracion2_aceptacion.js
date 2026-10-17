// Criterios de aceptación de la iteración 2 de C (derivada de la ronda R3, 17-oct-2026).
// Cubre: conductor por transportadora (comentario de U01), título de la guía (U02), vista «Guías» (HZ-04),
// retomar y conservar al recargar (HZ-05), deshacer desde la lista (S-06) y atajos E, M y D (M-11).
// Uso: node iteracion2_aceptacion.js [URL_BASE]   (por defecto http://127.0.0.1:8765/)
const { chromium } = require('playwright-core');
const fs = require('fs');
const BASE = (process.argv[2] || 'http://127.0.0.1:8765/') + 'final-c/';
const MAC = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const exe = process.env.CHROME || (fs.existsSync(MAC) ? MAC : undefined);
const AXE = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
const SHOTS = require('path').join(__dirname, 'capturas');

(async () => {
  const b = await chromium.launch(exe ? { executablePath: exe } : {});
  const res = []; const ok = (id, cond, det) => res.push({ id, ok: !!cond, det });
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const h1 = () => p.textContent('h1').then(t => t.replace(/\s+/g, ' ').trim());
  const activo = () => p.evaluate(() => document.activeElement && (document.activeElement.id || document.activeElement.tagName));
  const shot = n => p.screenshot({ path: SHOTS + '/' + n + '.png' });
  const axe = async () => { await p.addScriptTag({ content: AXE });
    const r = await p.evaluate(t => axe.run(document, { runOnly: { type: 'tag', values: t } }), TAGS);
    return r.violations.filter(v => ['serious', 'critical'].includes(v.impact)).map(v => v.id); };

  await p.goto(BASE);
  await p.click('#c-PE07-0001201'); await p.click('#gen'); await p.waitForSelector('#con');

  // CI-01 · el conductor depende de la transportadora y cambiarla obliga a volver a elegir
  const opts = async () => p.$$eval('#con option', o => o.map(x => x.textContent));
  const roble = await opts();
  await p.selectOption('#tra', 'Rápido Caldas'); await p.waitForSelector('#con');
  const caldas = await opts();
  await p.selectOption('#tra', 'Transportes El Roble');
  await p.selectOption('#con', 'Andrés Mejía · ABC123');
  await p.selectOption('#tra', 'Rápido Caldas');
  const reinicia = await p.inputValue('#con');
  await p.selectOption('#tra', 'Transportes El Roble'); await p.selectOption('#con', 'Andrés Mejía · ABC123');
  ok('CI-01', roble.length === 3 && roble.every(x => !/Mesa|Ruiz|López/.test(x)) && caldas.some(x => /Andrés Mesa/.test(x)) && !caldas.some(x => /Mejía/.test(x)) && reinicia === '',
     `El Roble: ${roble.slice(1).join(' / ')} · Rápido Caldas: ${caldas.slice(1).join(' / ')} · al cambiar de transportadora el conductor queda «${reinicia}»`);

  // CI-02 · cada pantalla de la guía tiene título descriptivo con el paso y el destino
  const t3 = await h1(); const sub3 = await p.textContent('h1 + p.sub');
  ok('CI-02', /Guía de despacho TMS-2026-0412/.test(t3) && /Paso 2 de 4/.test(sub3) && /Ferretería La 30/.test(sub3), `«${t3}» · «${sub3.trim()}»`);
  await shot('C13_titulo_y_conductor_por_transportadora');

  // CI-03 · atajos E, M y D; D solo abre la confirmación y no despacha (HZ-01 se mantiene)
  await p.click('h1'); await p.keyboard.press('e'); await p.waitForSelector('#mov');
  const trasE = await h1();
  await p.keyboard.press('m'); await p.waitForTimeout(1100);
  await p.click('#retry'); await p.waitForSelector('#desp');
  await p.keyboard.press('d'); await p.waitForSelector('[role=alertdialog]');
  const dialogo = await p.$('[role=alertdialog]') !== null, aunPlat = (await h1()).includes('En plataforma');
  await p.keyboard.press('Escape');
  ok('CI-03', /En preparación/.test(trasE) && dialogo && aunPlat, `E → «${trasE}» · M mueve y recupera · D abre la confirmación=${dialogo} y la guía sigue En plataforma=${aunPlat}`);

  // CI-04 · recargar conserva la guía, su estado y lo escrito (HZ-05)
  await p.fill('#caj', '5');
  await p.reload(); await p.waitForSelector('#caj');
  const trasRecarga = await h1(), caj = await p.inputValue('#caj');
  ok('CI-04', /En plataforma/.test(trasRecarga) && caj === '5', `tras recargar: «${trasRecarga}» · cajas=${caj}`);
  await p.fill('#caj', '6');

  // CI-05 · despachar, pasar a la siguiente guía y deshacer desde «Guías» (S-06)
  await p.click('#desp'); await p.click('#confirm'); await p.waitForSelector('#undo');
  await p.click('#next'); await p.waitForSelector('#q');
  await p.click('nav[aria-label="Menú principal"] a[href="#guias"]'); await p.waitForSelector('[data-deshacer]');
  const fila = (await p.textContent('tbody tr')).replace(/\s+/g, ' ');
  const menu = await p.$eval('nav[aria-label="Menú principal"] [aria-current]', e => e.textContent);
  await shot('C14_guias_con_deshacer');
  const serias = await axe();
  ok('CI-06', /TMS-2026-0412/.test(fila) && /En tránsito/.test(fila) && menu === 'Guías' && serias.length === 0,
     `lista: «${fila.trim()}» · menú marcado: ${menu} · axe serias: ${serias.join(',') || 'ninguna'}`);
  await p.click('[data-deshacer]'); await p.waitForSelector('#platmsg');
  ok('CI-05', /TMS-2026-0412/.test(await h1()) && /En plataforma/.test(await h1()) && /Se deshizo/.test(await p.textContent('#platmsg')),
     `deshacer desde Guías: «${await h1()}»`);
  const menuDentro = await p.$$eval('nav[aria-label="Menú principal"] [aria-current]', e => e.length);
  ok('CI-07', menuDentro === 0, `dentro de una guía el menú no marca «Pedidos pendientes» ni «Guías» (${menuDentro} marcados)`);

  // CI-08 · retomar desde la lista y que la lista sobreviva a recargar
  await p.click('nav[aria-label="Menú principal"] a[href="#guias"]'); await p.waitForSelector('[data-retomar]');
  await p.reload(); await p.waitForSelector('[data-retomar]');
  const sigue = /TMS-2026-0412/.test(await p.textContent('tbody'));
  await p.click('[data-retomar]'); await p.waitForSelector('#desp');
  ok('CI-08', sigue && /En plataforma/.test(await h1()), `la lista sobrevive a recargar=${sigue} · retomar abre «${await h1()}»`);

  // CI-09 · una guía interrumpida en «Pendiente» también se puede retomar
  const q = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await q.goto(BASE); await q.click('#c-PE31-0001202'); await q.click('#gen'); await q.waitForSelector('#con');
  await q.click('a[href="#guias"]', { timeout: 3000 }).catch(() => {});
  await q.click('nav[aria-label="Menú principal"] a[href="#guias"]'); await q.waitForSelector('tbody tr');
  const fila2 = (await q.textContent('tbody tr')).replace(/\s+/g, ' ');
  await q.click('[data-retomar]'); await q.waitForSelector('#con');
  ok('CI-09', /Pendiente/.test(fila2) && /Agro El Cafetal/.test(fila2) && /Paso 2 de 4/.test(await q.textContent('h1 + p.sub')),
     `guía interrumpida: «${fila2.trim()}» → retomar vuelve al paso 2`);
  await q.close();
  await p.close();

  // CI-10 · a 390 px, sin desplazamiento horizontal en la lista de guías
  const m = await b.newPage({ viewport: { width: 390, height: 844 } });
  await m.goto(BASE + '#guias'); await m.waitForTimeout(200);
  ok('CI-10', await m.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), 'Guías a 390 px sin desplazamiento horizontal');
  await m.close();
  await b.close();

  console.log(`Aceptación de la iteración 2 de C · ${new Date().toISOString()} · base ${BASE}`);
  for (const r of res.sort((a, c) => a.id.localeCompare(c.id))) console.log(`${r.ok ? 'PASA ' : 'FALLA'} ${r.id}  ${r.det}`);
  const n = res.filter(r => r.ok).length;
  console.log(`\nResumen: ${n}/${res.length} pasan`);
  process.exitCode = n === res.length ? 0 : 1;
})();
