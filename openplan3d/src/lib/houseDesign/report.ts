import { clearSize, requirements, REVISION, type HouseConcept } from './model';
const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
export function planSVG(m: HouseConcept, floor: number) {
  if (!m.valid) return '';
  const W = m.input.depth, D = m.input.frontage;
  const rect = (x: number, z: number, w: number, d: number, fill: string, stroke = 'none') => `<rect x="${x}" y="${z}" width="${w}" height="${d}" fill="${fill}" stroke="${stroke}" stroke-width=".12"/>`;
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-14 -7 ${W + 21} ${D + 15}" role="img" aria-label="${floor ? 'First' : 'Ground'} floor site plan, north up"><style>text{font-family:system-ui,sans-serif;fill:#344b40;text-anchor:middle} .small{font-size:.8px}.label{font-size:1px;font-weight:600}</style>`;
  svg += rect(-12, 0, 11, D, '#d1d7d0') + rect(0, 0, W, D, '#e8e1d4', '#697f6b');
  for (const g of m.gardens) svg += rect(g.x, g.z, g.w, g.d, '#b6c6a0');
  const p = m.patnam;
  svg += rect(p.x, p.z, p.w, p.d, '#d5b78f', '#ab8c65');
  svg += `<text class="label" x="${p.x + p.w / 2}" y="${p.z + 5}">Outdoor Patnam</text><text class="small" x="${p.x + p.w / 2}" y="${p.z + 7}">12 × 12 ft assumed</text>`;
  for (let i = 0; i < requirements.parking.cars; i++) {
    svg += rect(.5, 5 + i * 12, 16, 10, '#d2ccc0', '#fff9ed');
    svg += rect(1, 7 + i * 12, 15, 6, i ? '#81949f' : '#f8f6ee', '#788579');
    svg += `<text class="small" x="8.5" y="${10.5 + i * 12}">Car ${i + 1}</text>`;
  }
  svg += `<text class="small" x="8" y="29.4">2 two-wheelers</text>`;
  for (const path of m.paths) svg += rect(path.x, path.z, path.w, path.d, '#d2c5ad');
  for (const r of m.rooms.filter(r => r.floor === floor)) {
    svg += rect(r.x, r.z, r.w, r.d, r.color);
    if (r.use !== 'hall') svg += `<text class="label" x="${r.x + r.w / 2}" y="${r.z + r.d / 2 - .5}">${esc(r.name)}</text><text class="small" x="${r.x + r.w / 2}" y="${r.z + r.d / 2 + 1}">${clearSize(r)}</text>`;
  }
  for (const w of m.walls.filter(w => w.floor === floor)) {
    svg += `<path d="M${w.x1} ${w.z1}L${w.x2} ${w.z2}" fill="none" stroke="#746c5e" stroke-width=".5"/>`;
    const len = Math.hypot(w.x2 - w.x1, w.z2 - w.z1), dx = (w.x2 - w.x1) / len, dz = (w.z2 - w.z1) / len;
    for (const o of w.openings) {
      const a = o.offset - o.width / 2, b = o.offset + o.width / 2;
      svg += `<path d="M${w.x1 + dx * a} ${w.z1 + dz * a}L${w.x1 + dx * b} ${w.z1 + dz * b}" fill="none" stroke="${o.kind === 'door' ? '#fcfaf3' : '#75aab1'}" stroke-width=".65"/>`;
    }
  }
  const s = m.stair;
  svg += rect(s.x, s.z, s.w, s.d, '#c3bdad', '#6b7767');
  for (let i = 0; i < 10; i++) svg += `<path d="M${s.x} ${s.z + 4 + i}h9" stroke="#8b8b7b" stroke-width=".1"/>`;
  svg += rect(s.x + 5, s.z, m.house.x - s.x - 5, 4, '#cbc6b6', '#6b7767');
  svg += `<text class="small" x="${s.x + s.w / 2}" y="${s.z + 8}">Separate stair</text>`;
  if (floor === 0) {
    const r = m.rooms.find(r => r.id === '0-mallanna')!, x = r.x + r.w / 2;
    svg += rect(x - 3, r.z + 1, 6, 4, '#b98c58', '#8d6234');
    for (const dx of [-2.65, 2.65]) for (const dz of [1.35, 4.65]) svg += `<circle cx="${x + dx}" cy="${r.z + dz}" r=".2" fill="#795732"/>`;
    for (const dx of [-2, 2]) for (const dz of [7, 10]) svg += rect(x + dx - .9, r.z + dz - .9, 1.8, 1.8, '#b57e5f');
  }
  svg += `<text x="${W / 2}" y="-3" font-size="1.4">${W} ft · east–west depth</text><text x="-7" y="${D / 2}" font-size="1.4" transform="rotate(-90 -7 ${D / 2})">WEST ROAD · ${D} ft frontage</text><text x="${W + 3}" y="1" font-size="2">N ↑</text><text class="label" x="${W / 2}" y="${D - 4}">Garden &amp; play space</text></svg>`;
  return svg;
}
export function engineerReport(m: HouseConcept, image = '') {
  const rows = m.rooms.map(r => `<tr><td>${r.floor ? 'First' : 'Ground'}</td><td>${esc(r.name)}</td><td>${clearSize(r)}</td><td>${((r.w - .5) * (r.d - .5)).toFixed(0)} sq ft</td></tr>`).join('');
  return `<!doctype html><html lang="en"><meta charset="utf-8"><title>Family home · ${REVISION}</title><style>body{font:14px/1.6 system-ui,sans-serif;color:#243c30;margin:40px auto;max-width:1000px;padding:0 24px}h1{font:42px Georgia,serif}h2{margin-top:32px}p,li{max-width:850px}small{color:#637264}table{width:100%;border-collapse:collapse}th,td{text-align:left;border-bottom:1px solid #dbe1d8;padding:8px}img{max-width:100%;border-radius:10px}.plans{display:grid;grid-template-columns:1fr 1fr;gap:24px}.plans svg{width:100%;max-height:690px}.note{padding:14px;background:#f0e6d6}button{padding:12px 18px;background:#355c48;color:white;border:0;border-radius:5px}@media print{body{margin:0;font-size:10pt;padding:0}button{display:none}.plans{break-before:page}table{font-size:9pt}tr{break-inside:avoid}h2{break-after:avoid}img{max-height:350px}}@page{size:A4;margin:14mm}</style><button onclick="window.print()">Print / Save as PDF</button><p>LAND & HOME / ENGINEER DISCUSSION</p><h1>Your family home.</h1><p>${REVISION} · West-facing · ${m.input.frontage} ft frontage × ${m.input.depth} ft depth</p><p class="note">Concept for discussion. Assumed dimensions are shown below. Structure, local approvals and detailed Vaastu interpretation have not been verified.</p>${image ? `<img alt="Current 3D inspection view" src="${image}"/>` : ''}<h2>Fixed brief</h2><p>G+1: owner’s 3-bedroom home below, brother’s 2-bedroom home above. Separate entrances and a dedicated outside staircase. Parking for ${requirements.parking.cars} cars and ${requirements.parking.twoWheelers} two-wheelers. Daily pooja plus a Mallanna room for ${requirements.mallannaPooja.capacityPeople} people, raised platform/table, decorated four-pillar pandal and prasadam in front. Outdoor Patnam in front of the home. Garden and children’s play space.</p><p>Plot: ${m.input.frontage * m.input.depth} sq ft. House footprint measured on wall centre lines: ${m.footprint.toFixed(0)} sq ft; garden patches: ${m.gardenArea.toFixed(0)} sq ft. These are concept measurements, not statutory coverage calculations.</p><div class="plans"><section><h2>Ground floor</h2>${planSVG(m, 0)}</section><section><h2>First floor</h2>${planSVG(m, 1)}</section></div><h2>Room schedule</h2><p>Clear dimensions between wall faces, excluding 6-inch walls. Areas exclude wall thickness but do not deduct furniture.</p><table><thead><tr><th>Floor</th><th>Space</th><th>Clear dimensions</th><th>Clear area</th></tr></thead><tbody>${rows}</tbody></table><h2>Assumptions and decisions to review</h2><ul>${m.assumptions.map(a => `<li>${esc(a)}</li>`).join('')}</ul><h2>Next engineer discussion</h2><p>Confirm surveyed plot and north; local setbacks; soil and structure; stairs and landings; ventilation and plumbing; parking manoeuvring; shrine and Patnam dimensions; Vaastu exceptions and the daily pooja arrangement. The exterior staircase is kept separate from both homes’ private circulation.</p></html>`;
}
