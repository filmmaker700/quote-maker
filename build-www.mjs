import fs from 'fs'; import path from 'path'; import { build } from 'esbuild';
const SRC = 'web-src', OUT = 'www';
fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT + '/fonts', { recursive: true });
for (const f of ['index.html', 'style.css', 'app.js', 'icon.svg']) fs.copyFileSync(path.join(SRC, f), path.join(OUT, f));
// fonts (offline)
const fonts = [['dm-sans', 'DM Sans', [400, 500, 600, 700]], ['manrope', 'Manrope', [400, 600, 700, 800]]];
let ff = '';
for (const [pkg, fam, ws] of fonts) for (const w of ws) {
  const file = `${pkg}-latin-${w}-normal.woff2`;
  fs.copyFileSync(`node_modules/@fontsource/${pkg}/files/${file}`, `${OUT}/fonts/${file}`);
  ff += `@font-face{font-family:'${fam}';font-weight:${w};font-style:normal;font-display:swap;src:url(fonts/${file}) format('woff2')}\n`;
}
let css = fs.readFileSync(`${OUT}/style.css`, 'utf8');
const n = css.length; css = css.replace(/@import url\('https:\/\/fonts\.googleapis[^;]*;/, ''); if (css.length === n) throw Error('font import not found');
fs.writeFileSync(`${OUT}/style.css`, ff + css);
// app.js hooks
let js = fs.readFileSync(`${OUT}/app.js`, 'utf8');
const rep = (a, b) => { if (!js.includes(a)) throw Error('hook not found: ' + a.slice(0, 40)); js = js.replace(a, b); };
rep("window.print();setTimeout(()=>document.title=original,1000);", "(window.QMNative?QMNative.exportPdf(document.title):window.print());setTimeout(()=>document.title=original,1000);");
rep("const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});", "if(window.QMNative){QMNative.backup(JSON.stringify(data,null,2));return;}const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});");
rep("if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});", "");
fs.writeFileSync(`${OUT}/app.js`, js);
let html = fs.readFileSync(`${OUT}/index.html`, 'utf8');
html = html.replace('<link rel="manifest" href="manifest.json">', '').replace('<script src="app.js"></script>', '<script src="native.js"></script><script src="app.js"></script>');
fs.writeFileSync(`${OUT}/index.html`, html);
await build({ entryPoints: ['src/native.js'], bundle: true, minify: true, format: 'iife', outfile: `${OUT}/native.js`, target: 'chrome80' });
console.log('www built');
