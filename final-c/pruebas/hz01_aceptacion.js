// Prueba de aceptación de HZ-01 (Taller 6, Paso 5) — se ejecuta contra A (/final/) y C (/final-c/).
// Uso:  cd final-c/pruebas && npm install && node hz01_aceptacion.js [URL_BASE]
//   URL_BASE por defecto: http://127.0.0.1:8765/  (servir la raíz del repo: python3 -m http.server 8765)
//   CHROME: ruta a Chrome/Chromium (por defecto, Google Chrome de macOS).
const { chromium } = require('playwright-core');
const path = require('path');
const BASE = process.argv[2] || 'http://127.0.0.1:8765/';
const MAC = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const CHROME = process.env.CHROME || (require('fs').existsSync(MAC) ? MAC : undefined);   // en CI: Chromium de playwright-core
const SHOTS = path.join(__dirname, 'capturas');

const h1 = p => p.textContent('h1').then(t => t.trim());
const active = p => p.evaluate(() => document.activeElement && (document.activeElement.id || document.activeElement.tagName));

async function enPlataforma(p, url) {           // llega al estado En plataforma pasando por el error del primer intento
  await p.goto('about:blank');                 // carga limpia: el estado del prototipo vive en memoria
  await p.goto(url + '#p4e'); await p.waitForSelector('#retry');
  await p.click('#retry'); await p.waitForSelector('#desp');
}

async function casos(p, version, url, shot) {
  const r = [];
  const ok = (id, cond, detalle) => r.push({ version, id, resultado: cond ? 'PASA' : 'FALLA', detalle });
  const noAplica = (id, motivo) => r.push({ version, id, resultado: 'NO APLICA', detalle: motivo });   // S-09: no se cuenta como falla

  // CA-06 · al llegar a En plataforma el foco no queda en «Despachar» y Enter no despacha
  await enPlataforma(p, url);
  const foco = await active(p);
  await p.keyboard.press('Enter'); await p.waitForTimeout(300);
  const trasEnter = await h1(p);
  ok('CA-06', foco !== 'desp' && trasEnter.includes('En plataforma'), `foco=#${foco} · tras Enter: «${trasEnter}»`);

  // CA-01 · Despachar pide confirmación con el resumen, y la guía sigue En plataforma
  await enPlataforma(p, url);
  await p.click('#desp'); await p.waitForTimeout(300);
  const dlg = await p.$('[role=alertdialog]');
  const txt = dlg ? await dlg.textContent() : '';
  const est1 = await p.$('h1') ? await h1(p) : '';
  ok('CA-01', !!dlg && /Ferretería La 30/.test(txt) && /Andrés Mejía/.test(txt) && /6 cajas/.test(txt) && est1.includes('En plataforma'),
     dlg ? `diálogo con resumen · estado «${est1}»` : `sin diálogo · estado «${est1}»`);
  if (dlg) await shot('C01_confirmacion');

  if (!dlg) {                                   // A no tiene confirmación: el resto no aplica
    for (const id of ['CA-02', 'CA-03', 'CA-04', 'CA-05', 'CA-07']) noAplica(id, 'no aplica: no existe la confirmación (depende de CA-01)');
    return r;
  }

  // CA-02 · Cancelar (Esc) deja la guía En plataforma y devuelve el foco a «Despachar»
  const f0 = await active(p);
  await p.keyboard.press('Escape'); await p.waitForTimeout(200);
  ok('CA-02', f0 === 'cancel' && !(await p.$('[role=alertdialog]')) && (await h1(p)).includes('En plataforma') && (await active(p)) === 'desp',
     `foco inicial=#${f0} · tras Esc: «${await h1(p)}», foco=#${await active(p)}`);

  // CA-03 · confirmar muestra «Despachando…» y luego En tránsito con «Deshacer» disponible
  await p.click('#desp'); await p.click('#confirm');
  const espera = await p.textContent('#desp');
  await shot('C02_despachando');
  await p.waitForSelector('#undo');
  ok('CA-03', espera === 'Despachando…' && (await h1(p)).includes('En tránsito') && /mientras sigas en esta pantalla/.test(await p.textContent('#undoleft')),
     `espera «${espera}» · «${await h1(p)}» · ${await p.textContent('#undoleft')}`);
  await shot('C03_despachada_con_deshacer');

  // CA-04 · Deshacer devuelve la guía a En plataforma con los mismos datos y lo registra
  await p.click('#undo'); await p.waitForSelector('#platmsg');
  const datos = [await p.inputValue('#caj'), await p.inputValue('#lio'), await p.inputValue('#fle')].join('/');
  const msg = await p.textContent('#platmsg');
  ok('CA-04', (await h1(p)).includes('En plataforma') && datos === '6/2/30.000' && /Se deshizo/.test(msg) && (await active(p)) === 'platmsg',
     `«${await h1(p)}» · cajas/líos/flete=${datos} · foco=#${await active(p)}`);
  await shot('C04_despacho_deshecho');
  await p.click('#desp'); await p.click('#confirm'); await p.waitForSelector('#undo');
  const hist = await p.$$eval('ol.hist li', l => l.map(x => x.textContent.trim()));
  ok('CA-04b', hist.some(t => t.includes('Despacho deshecho')) && hist[hist.length - 1].includes('En tránsito'),
     'historial: ' + hist.join(' | '));
  await shot('C05_historial_con_anulacion');

  // CA-05 · error al despachar y recuperación
  await enPlataforma(p, url.replace(/\/$/, '/') + '?simular=fallo-despacho');
  await p.click('#desp'); await p.click('#confirm');
  await p.waitForSelector('#dretry');
  const err = await p.textContent('.msg.er');
  const est5 = await h1(p), f5 = await active(p);
  await shot('C06_error_al_despachar');
  await p.click('#dretry'); await p.waitForSelector('#undo');
  ok('CA-05', /No se pudo despachar/.test(err) && est5.includes('En plataforma') && f5 === 'dretry' && (await h1(p)).includes('En tránsito'),
     `error visible · estado durante el error «${est5}» · foco=#${f5} · tras reintentar «${await h1(p)}»`);
  await shot('C07_recuperado_tras_reintentar');
  return r;
}

async function plazo(b, url) {                   // CA-07 · sin límite de tiempo (2.2.1); se cierra al salir de P5
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.clock.install();
  await p.goto(url + '#p4e'); await p.clock.runFor(1000);
  await p.click('#retry'); await p.clock.runFor(1000);
  await p.click('#desp'); await p.click('#confirm'); await p.clock.runFor(1000);
  await p.clock.runFor(120000);                  // dos minutos después
  const tras2min = await p.$('#undo') !== null;
  await p.click('#next'); await p.waitForSelector('#q');
  await p.goBack(); await p.waitForTimeout(200);  // volver a P5 con el botón Atrás
  const trasSalir = await p.$('#undo') !== null;
  await p.close();
  return { version: 'C', id: 'CA-07', resultado: tras2min && !trasSalir ? 'PASA' : 'FALLA',
           detalle: `Deshacer disponible tras 2 min=${tras2min} · tras pasar a la siguiente guía y volver=${trasSalir}` };
}

(async () => {
  const b = await chromium.launch(CHROME ? { executablePath: CHROME } : {});
  const todos = [];
  for (const [version, ruta] of [['A', 'final/'], ['C', 'final-c/']]) {
    const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
    const shot = async n => { if (version === 'C') await p.screenshot({ path: path.join(SHOTS, n + '.png') }); };
    todos.push(...await casos(p, version, BASE + ruta, shot));
    await p.close();
  }
  todos.push(await plazo(b, BASE + 'final-c/'));
  await b.close();
  const fecha = new Date().toISOString();
  console.log(`Prueba de aceptación HZ-01 · ${fecha} · base ${BASE}`);
  for (const t of todos) console.log(`${t.version} ${t.id.padEnd(6)} ${t.resultado.padEnd(6)} ${t.detalle}`);
  const c = todos.filter(t => t.version === 'C');
  const a = todos.filter(t => t.version === 'A'), ejec = a.filter(t => t.resultado !== 'NO APLICA');
  console.log(`\nResumen C: ${c.filter(t => t.resultado === 'PASA').length}/${c.length} pasan · A (línea base): ${a.filter(t => t.resultado === 'PASA').length} de ${ejec.length} ejecutables pasan; ${a.length - ejec.length} no aplican porque dependen de la confirmación`);
  process.exitCode = c.every(t => t.resultado === 'PASA') ? 0 : 1;
})();
