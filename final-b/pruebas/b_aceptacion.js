// Criterios de aceptación de la versión B (alternativa generada con IA), tomados del prompt del Taller 6.
// Resultados posibles: PASA, FALLA (nunca NO APLICA aquí: todos los criterios existen en B).
// Uso: node b_aceptacion.js [URL_BASE]   (por defecto http://127.0.0.1:8765/)
const { chromium } = require('playwright-core');
const fs = require('fs'), path = require('path');
const BASE = (process.argv[2] || 'http://127.0.0.1:8765/') + 'final-b/';
const MAC = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const exe = process.env.CHROME || (fs.existsSync(MAC) ? MAC : undefined);
const AXE = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
const SH = path.join(__dirname, 'capturas');
(async () => {
  const b = await chromium.launch(exe ? { executablePath: exe } : {});
  const res = []; const ok = (id, c, d) => res.push({ id, ok: !!c, d });
  const nuevo = async (w = 1440) => { const p = await b.newPage({ viewport: { width: w, height: 900 } }); await p.goto(BASE); return p; };
  const h1 = p => p.textContent('h1').then(t => t.replace(/\s+/g, ' ').trim());
  const foco = p => p.evaluate(() => document.activeElement && (document.activeElement.id || document.activeElement.tagName));
  const serias = async p => { await p.addScriptTag({ content: AXE }); const r = await p.evaluate(t => axe.run(document, { runOnly: { type: 'tag', values: t } }), TAGS); return r.violations.filter(v => ['serious', 'critical'].includes(v.impact)).map(v => v.id); };

  // Flujo principal con una sola ciudad
  let p = await nuevo();
  await p.click('#c-PE31-0001202'); await p.click('#gen'); await p.waitForSelector('#con');
  const t3 = await h1(p), cli = await p.inputValue('#dest'), sub3 = await p.textContent('h1 + p.sub'), sinAviso = !(await p.textContent('main')).includes('Se crearon');
  ok('B-07', /Agro El Cafetal/.test(cli) && /PE31-0001202/.test(sub3) && sinAviso, `destinatario «${cli}» (el cliente elegido) · «${sub3.trim()}» · sin «Se crearon» con una sola ciudad (${sinAviso})`);   // EDA-03, HZ-10, HZ-09
  await p.click('#ready'); const errCon = await p.textContent('#ce');
  await p.selectOption('#con', 'Andrés Mejía · ABC123'); await p.click('#ready'); await p.waitForSelector('#mov');
  await p.click('#mov'); await p.waitForSelector('#desp'); await p.waitForTimeout(150);
  const f0 = await foco(p); await p.keyboard.press('Enter'); await p.waitForTimeout(300); const trasEnter = await h1(p);
  await p.screenshot({ path: SH + '/B04_en_plataforma.png' });
  await p.click('#desp'); await p.waitForSelector('[role=alertdialog]');
  const dlg = (await p.textContent('[role=alertdialog]')).replace(/\s+/g, ' '), f1 = await foco(p);
  await p.screenshot({ path: SH + '/B05_confirmacion.png' });
  await p.keyboard.press('Escape'); await p.waitForTimeout(200);
  ok('B-01', /¿Despachar la guía TMS-2026-0412/.test(dlg) && /Agro El Cafetal/.test(dlg) && /Andrés Mejía/.test(dlg) && /6 cajas/.test(dlg) && f1 === 'cancel' && f0 !== 'desp' && /En plataforma/.test(trasEnter) && /En plataforma/.test(await h1(p)) && await foco(p) === 'desp',
     `foco al llegar=#${f0} · Enter no despacha: «${trasEnter}» · confirmación repite guía, destino, conductor y cajas · foco inicial=#${f1} · Esc deja En plataforma`);   // HZ-01
  await p.click('#desp'); await p.click('#confirm'); await p.waitForSelector('#dretry');
  const errD = await p.textContent('.msg.er'), est = await h1(p), fd = await foco(p);
  await p.screenshot({ path: SH + '/B06_error_al_despachar.png' });
  await p.click('#dretry'); await p.waitForSelector('#undo');
  ok('B-02', /No se pudo despachar/.test(errD) && /En plataforma/.test(est) && fd === 'dretry' && /En tránsito/.test(await h1(p)), `error en el primer intento · estado «${est}» · foco=#${fd} · tras reintentar «${await h1(p)}»`);
  await p.screenshot({ path: SH + '/B07_despachada_con_deshacer.png' });
  await p.click('#undo'); await p.waitForSelector('#platmsg');
  const deshecho = /En plataforma/.test(await h1(p)) && /Se deshizo/.test(await p.textContent('#platmsg'));
  await p.click('#desp'); await p.click('#confirm'); await p.waitForSelector('#undo');   // el error solo ocurre en el primer intento
  const venceAntes = await p.$('#undo') !== null; await p.waitForSelector('#undo', { state: 'detached', timeout: 13000 });
  const msgVence = await p.textContent('#ub').catch(() => '');
  ok('B-03', deshecho && venceAntes && /plazo para deshacer terminó/.test(msgVence), `«Deshacer» devuelve a En plataforma=${deshecho} · visible tras despachar=${venceAntes} · vence a los 10 s: «${msgVence.trim()}»`);
  const menuDentro = await p.$eval('nav.menu [aria-current]', e => e.textContent);
  await p.click('nav.menu a[href="#guias"]'); await p.waitForSelector('[data-abrir]');
  const menuLista = await p.$eval('nav.menu [aria-current]', e => e.textContent);
  await p.goto(BASE + '#p1'); const menuPedidos = await p.$eval('nav.menu [aria-current]', e => e.textContent);
  ok('B-05', menuDentro === 'Guías' && menuLista === 'Guías' && menuPedidos === 'Pedidos pendientes', `el menú resalta la sección actual: dentro de la guía «${menuDentro}» · lista «${menuLista}» · pedidos «${menuPedidos}»`);   // HZ-04
  await p.close();

  // Dos ciudades: una guía por ciudad, aviso correcto, y la guía pendiente aparece primero con lo que falta
  p = await nuevo();
  await p.click('#c-PE07-0001201'); await p.click('#c-PE14-0001203'); await p.click('#gen'); await p.waitForSelector('#scrim');
  const dlg2 = await p.textContent('#scrim');
  await p.screenshot({ path: SH + '/B02_decision_ciudades.png' });
  await p.click('#split'); await p.waitForSelector('#con');
  const hay = /Se crearon 2 guías/.test(await p.textContent('#app'));
  await p.screenshot({ path: SH + '/B03_guia_datos.png' });
  await p.click('nav.menu a[href="#guias"]'); await p.waitForSelector('[data-abrir]');
  const filas = await p.$$eval('tbody tr', r => r.map(x => x.textContent.replace(/\s+/g, ' ').trim()));
  await p.screenshot({ path: SH + '/B08_guias.png' });
  ok('B-06', filas.length === 2 && filas.every(f => /Falta: conductor/.test(f)) && /PE07-0001201|Ferretería|Manizales/.test(dlg2) && /PE14-0001203/.test(dlg2) && hay,
     `diálogo con la lista de pedidos por ciudad · «Se crearon 2 guías» solo con dos ciudades (${hay}) · Guías: ${filas.length} guías, ${filas.filter(f => /Falta: conductor/.test(f)).length} con «Falta: conductor»`);   // HZ-05, HZ-09, HZ-10
  await p.close();

  // Horas reales (HZ-03)
  p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.clock.install({ time: new Date('2026-10-17T09:00:00') }); await p.goto(BASE);
  const h0 = await p.textContent('#syncat'); await p.clock.runFor(125000); await p.click('#sync'); await p.clock.runFor(900);
  const h2 = await p.textContent('#syncat'), m2 = await p.textContent('#syncmsg');
  ok('B-04', h0 !== h2 && m2.includes(h2), `«Actualizado a las» pasa de ${h0} a ${h2} al sincronizar, con aviso «${m2.trim()}»`);
  await p.close();

  // Accesibilidad y reflujo en los estados clave, a 1440 y 390 px
  const fallas = [];
  for (const w of [1440, 390]) {
    p = await nuevo(w);
    const chk = async n => { const s = await serias(p), ov = await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth); if (s.length || !ov) fallas.push(`${w}px ${n}: ${s.join(',') || ''}${ov ? '' : ' desborda'}`); };
    await chk('P1'); await p.click('#c-PE07-0001201'); await p.click('#gen'); await p.waitForSelector('#con'); await chk('P3');
    await p.selectOption('#con', 'Andrés Mejía · ABC123'); await p.click('#ready'); await p.waitForSelector('#mov'); await chk('P4');
    await p.click('#mov'); await p.waitForSelector('#desp'); await chk('P4b'); await p.click('#desp'); await p.waitForSelector('[role=alertdialog]'); await chk('confirmación');
    await p.click('#confirm'); await p.waitForSelector('#dretry'); await chk('error al despachar'); await p.click('#dretry'); await p.waitForSelector('#undo'); await chk('P5');
    await p.click('nav.menu a[href="#guias"]'); await p.waitForSelector('[data-abrir]'); await chk('Guías');
    await p.close();
  }
  ok('B-08', fallas.length === 0, fallas.length ? fallas.join(' | ') : 'axe sin infracciones serias y sin desplazamiento horizontal en 7 estados a 1440 y 390 px');
  // Cuatro formatos
  p = await b.newPage({ viewport: { width: 1440, height: 900 } }); await p.goto(BASE + 'formatos.html');
  const hs = await p.$$eval('h2', e => e.map(x => x.textContent)); await p.screenshot({ path: SH + '/B-formatos.png', fullPage: true });
  ok('B-09', ['Computador', 'Tableta', 'Celular', 'Reloj'].every(k => hs.some(h => h.startsWith(k))) && (await serias(p)).length === 0, `formatos presentes: ${hs.join(' | ')}`);
  await p.close();
  await b.close();

  console.log(`Aceptación de la versión B · ${new Date().toISOString()} · base ${BASE}`);
  for (const r of res.sort((a, c) => a.id.localeCompare(c.id))) console.log(`${r.ok ? 'PASA ' : 'FALLA'} ${r.id}  ${r.d}`);
  const n = res.filter(r => r.ok).length; console.log(`\nResumen: ${n}/${res.length} pasan`); process.exitCode = n === res.length ? 0 : 1;
})();
