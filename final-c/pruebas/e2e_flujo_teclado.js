// E2E del flujo crítico completo de C (P01 → P05 → deshacer), SOLO con teclado, con axe-core en cada estado.
// Criterios de salida del HCI Lab (Calidad): flujo crítico cubierto de extremo a extremo y sin infracciones
// serias detectables por axe. Uso: node e2e_flujo_teclado.js [URL_BASE]   (por defecto http://127.0.0.1:8765/)
const { chromium } = require('playwright-core');
const fs = require('fs');
const BASE = (process.argv[2] || 'http://127.0.0.1:8765/') + 'final-c/';
const MAC = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const exe = process.env.CHROME || (fs.existsSync(MAC) ? MAC : undefined);
const AXE = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

(async () => {
  const b = await chromium.launch(exe ? { executablePath: exe } : {});
  let fallos = 0; const log = (ok, m) => { if (!ok) fallos++; console.log(`${ok ? 'PASA ' : 'FALLA'} ${m}`); };
  for (const [w, h] of [[1440, 900], [390, 844]]) {
    const p = await b.newPage({ viewport: { width: w, height: h } });
    const axe = async estado => { await p.addScriptTag({ content: AXE });
      const r = await p.evaluate(t => axe.run(document, { runOnly: { type: 'tag', values: t } }), TAGS);
      const serias = r.violations.filter(v => ['serious', 'critical'].includes(v.impact));
      log(serias.length === 0, `[${w}px] axe sin infracciones serias en ${estado}${serias.length ? ': ' + serias.map(v => v.id).join(', ') : ''}`); };
    const tabHasta = async (pred, max = 40) => { for (let i = 0; i < max; i++) { await p.keyboard.press('Tab'); if (await p.evaluate(pred)) return true; } return false; };
    const espera = ms => p.waitForTimeout(ms);
    await p.goto(BASE + '#p1'); await espera(150); await axe('P01');
    log(await tabHasta(() => document.activeElement.id === 'c-PE07-0001201'), `[${w}px] llega con Tab a la casilla de PE07-0001201`);
    await p.keyboard.press('Space'); await espera(100);
    await p.keyboard.press('g'); await espera(150);
    log(!!(await p.$('#dest')), `[${w}px] G con el foco en la casilla abre la guía (HZ-12)`);
    log((await p.inputValue('#dest')) === 'Ferretería La 30', `[${w}px] destinatario = cliente elegido (EDA-03)`);
    await axe('P03');
    await tabHasta(() => document.activeElement.id === 'con'); await p.keyboard.press('a'); await espera(80);
    await tabHasta(() => document.activeElement.id === 'ready'); await p.keyboard.press('Enter'); await espera(150);
    log((await p.textContent('h1')).includes('En preparación'), `[${w}px] «Lista para empacar» pasa a En preparación`);
    await axe('P04');
    await tabHasta(() => document.activeElement.id === 'mov'); await p.keyboard.press('Enter'); await espera(1100);
    log((await p.evaluate(() => document.activeElement.id)) === 'retry', `[${w}px] el error del servidor lleva el foco a «Reintentar»`);
    await p.keyboard.press('Enter'); await espera(1100);
    log((await p.textContent('h1')).includes('En plataforma') && (await p.evaluate(() => document.activeElement.id)) !== 'desp', `[${w}px] En plataforma, con el foco fuera de «Despachar»`);
    await axe('P04b');
    await tabHasta(() => document.activeElement.id === 'desp'); await p.keyboard.press('Enter'); await espera(200);
    log((await p.evaluate(() => document.activeElement.id)) === 'cancel', `[${w}px] la confirmación abre con el foco en «Cancelar»`);
    await axe('confirmación');
    await p.keyboard.press('Tab'); await p.keyboard.press('Enter'); await espera(1100);
    log((await p.textContent('h1')).includes('En tránsito'), `[${w}px] confirmar despacha: En tránsito`);
    await axe('P05');
    await tabHasta(() => document.activeElement.id === 'undo'); await p.keyboard.press('Enter'); await espera(200);
    log((await p.textContent('h1')).includes('En plataforma'), `[${w}px] «Deshacer despacho» con teclado devuelve la guía a En plataforma`);
    log(await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `[${w}px] sin desplazamiento horizontal`);
    await p.close();
  }
  await b.close();
  console.log(fallos ? `\n${fallos} comprobación(es) fallaron` : '\nTodas las comprobaciones pasan');
  process.exitCode = fallos ? 1 : 0;
})();
