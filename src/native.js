import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const native = Capacitor.isNativePlatform();
const toast = m => { const t = document.getElementById('toast'); if (t) { t.textContent = m; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 3500); } };
const safe = s => (String(s || 'quotation').replace(/[<>:"/\\|?*\x00-\x1f]/g, '').trim().slice(0, 80) || 'quotation');

async function deliver(name, base64, mime, title) {
  if (native) {
    const w = await Filesystem.writeFile({ path: name, data: base64, directory: Directory.Cache });
    await Share.share({ title, files: [w.uri], dialogTitle: title });
  } else {
    const bin = atob(base64), u8 = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    const url = URL.createObjectURL(new Blob([u8], { type: mime }));
    const a = document.createElement('a'); a.href = url; a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }
}

async function buildPdf() {
  const src = document.getElementById('paper');
  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;left:-10000px;top:0;width:794px;background:#fff';
  const clone = src.cloneNode(true);
  clone.style.cssText = 'width:794px;max-width:none;margin:0;box-shadow:none;border-radius:0;min-height:0';
  host.appendChild(clone); document.body.appendChild(host);
  try {
    if (document.fonts && document.fonts.ready) await document.fonts.ready;
    const canvas = await html2canvas(clone, { scale: 2, backgroundColor: '#ffffff', useCORS: true, windowWidth: 794 });
    const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
    const pw = 210, ph = 297, m = 10, cw = pw - 2 * m, chh = ph - 2 * m;
    const pxPerMm = canvas.width / cw, sliceH = Math.floor(chh * pxPerMm);
    for (let y = 0, page = 0; y < canvas.height; y += sliceH, page++) {
      const h = Math.min(sliceH, canvas.height - y);
      const part = document.createElement('canvas'); part.width = canvas.width; part.height = h;
      const ctx = part.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, part.width, h);
      ctx.drawImage(canvas, 0, y, canvas.width, h, 0, 0, canvas.width, h);
      if (page) pdf.addPage();
      pdf.addImage(part.toDataURL('image/jpeg', 0.95), 'JPEG', m, m, cw, h / pxPerMm);
    }
    return pdf.output('datauristring').split(',')[1];
  } finally { host.remove(); }
}

window.QMNative = {
  isNative: native,
  async exportPdf(label) {
    try {
      toast('Preparing PDF…');
      const b64 = await buildPdf();
      const name = safe(label) + '.pdf';
      await deliver(name, b64, 'application/pdf', name);
      toast(native ? 'PDF ready — choose where to save or share it.' : 'PDF downloaded.');
    } catch (e) { if (!/cancel/i.test(String(e && e.message))) toast('Could not create the PDF: ' + (e && e.message || e)); }
  },
  async backup(json) {
    try {
      const b64 = btoa(unescape(encodeURIComponent(json)));
      const name = 'quote-maker-backup-' + new Date().toISOString().slice(0, 10) + '.json';
      await deliver(name, b64, 'application/json', name);
      toast(native ? 'Backup ready — save it to Drive/Files or share it.' : 'Backup downloaded.');
    } catch (e) { if (!/cancel/i.test(String(e && e.message))) toast('Backup failed: ' + (e && e.message || e)); }
  }
};
