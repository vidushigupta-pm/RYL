// src/utils/pdfGenerator.ts
// Generates a clean A4 PDF of the full product analysis.
// Uses jsPDF — no DOM capture, fully data-driven.

import { jsPDF } from 'jspdf';

// ── Colour helpers ───────────────────────────────────────────────────────────
const C = {
  green:      [27,  61,  47]  as [number,number,number],
  orange:     [212, 135, 30]  as [number,number,number],
  red:        [217, 79,  61]  as [number,number,number],
  amber:      [224, 123, 42]  as [number,number,number],
  white:      [255, 255, 255] as [number,number,number],
  lightBg:    [253, 246, 238] as [number,number,number],
  borderGray: [232, 221, 208] as [number,number,number],
  textGray:   [100, 100, 100] as [number,number,number],
  scoreGreen: [46,  125, 79]  as [number,number,number],
};

function tierColor(tier: string): [number, number, number] {
  switch ((tier || '').toUpperCase()) {
    case 'SAFE':           return C.scoreGreen;
    case 'CAUTION':        return C.amber;
    case 'AVOID':          return C.red;
    case 'BANNED_IN_INDIA':return C.red;
    default:               return C.textGray;
  }
}

function scoreColor(score: number): [number, number, number] {
  if (score >= 70) return C.scoreGreen;
  if (score >= 50) return C.orange;
  return C.red;
}

// ── Main export ──────────────────────────────────────────────────────────────
export function generateAnalysisPDF(result: any, profileVerdict?: { score: number; concerns: any[] } | null) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const PAGE_W   = 210;
  const PAGE_H   = 297;
  const MARGIN   = 14;
  const CONTENT_W = PAGE_W - MARGIN * 2;
  let y = 0;

  // ── Helper: check page overflow and add new page ─────────────────────────
  function checkPage(needed = 10) {
    if (y + needed > PAGE_H - 16) {
      doc.addPage();
      y = 16;
    }
  }

  // ── Helper: wrapped text, returns new y ──────────────────────────────────
  function wrappedText(text: string, x: number, startY: number, maxWidth: number, lineHeight: number): number {
    const lines = doc.splitTextToSize(text, maxWidth);
    lines.forEach((line: string) => {
      checkPage(lineHeight);
      doc.text(line, x, startY);
      startY += lineHeight;
    });
    return startY;
  }

  // ── Helper: section header ────────────────────────────────────────────────
  function sectionHeader(title: string) {
    checkPage(12);
    doc.setFillColor(...C.borderGray);
    doc.rect(MARGIN, y - 4, CONTENT_W, 8, 'F');
    doc.setTextColor(...C.green);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(title.toUpperCase(), MARGIN + 2, y);
    y += 7;
  }

  // ════════════════════════════════════════════════════════════════════════
  // HEADER BAND
  // ════════════════════════════════════════════════════════════════════════
  doc.setFillColor(...C.green);
  doc.rect(0, 0, PAGE_W, 28, 'F');

  doc.setTextColor(...C.white);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text('Read Your Label', MARGIN, 11);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Product Safety Analysis Report', MARGIN, 18);

  const dateStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  doc.text(dateStr, PAGE_W - MARGIN, 18, { align: 'right' });

  y = 36;

  // ════════════════════════════════════════════════════════════════════════
  // PRODUCT NAME + SCORE
  // ════════════════════════════════════════════════════════════════════════
  const score = result.overall_score ?? 0;
  const sc = scoreColor(score);

  // Score badge on the right
  doc.setFillColor(...sc);
  doc.roundedRect(PAGE_W - MARGIN - 24, y - 6, 24, 20, 3, 3, 'F');
  doc.setTextColor(...C.white);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(String(score), PAGE_W - MARGIN - 12, y + 6, { align: 'center' });
  doc.setFontSize(6);
  doc.text('/ 100', PAGE_W - MARGIN - 12, y + 11, { align: 'center' });

  // Product name
  doc.setTextColor(...C.green);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  const nameLines = doc.splitTextToSize(result.product_name || 'Unknown Product', CONTENT_W - 30);
  nameLines.forEach((line: string) => { doc.text(line, MARGIN, y); y += 6; });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...C.textGray);
  if (result.brand) { doc.text(`Brand: ${result.brand}`, MARGIN, y); y += 5; }
  if (result.category) { doc.text(`Category: ${result.category}`, MARGIN, y); y += 5; }

  y += 4;

  // ════════════════════════════════════════════════════════════════════════
  // PLAIN ENGLISH SUMMARY
  // ════════════════════════════════════════════════════════════════════════
  if (result.summary) {
    sectionHeader('In Plain English');
    doc.setFillColor(...C.lightBg);
    const summaryLines = doc.splitTextToSize(result.summary, CONTENT_W - 8);
    const boxH = summaryLines.length * 5 + 6;
    checkPage(boxH + 4);
    doc.rect(MARGIN, y, CONTENT_W, boxH, 'F');
    doc.setTextColor(...C.green);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    summaryLines.forEach((line: string) => { doc.text(line, MARGIN + 4, y + 5); y += 5; });
    y += 10;
  }

  // ════════════════════════════════════════════════════════════════════════
  // NUTRITION FACTS
  // ════════════════════════════════════════════════════════════════════════
  const n = result.nutrition;
  const hasNutrition = n && (n.energy_kcal != null || n.sugar_g != null || n.sodium_mg != null || n.protein_g != null);

  if (hasNutrition) {
    sectionHeader('Nutrition per 100g');
    checkPage(28);

    const cols = [
      { label: 'Calories',  val: n.energy_kcal != null ? `${n.energy_kcal} kcal` : '—' },
      { label: 'Sugar',     val: n.sugar_g != null ? `${n.sugar_g}g  (≈${+(n.sugar_g / 4).toFixed(1)} tsp)` : '—' },
      { label: 'Sodium',    val: n.sodium_mg != null ? `${n.sodium_mg}mg` : '—' },
      { label: 'Protein',   val: n.protein_g != null ? `${n.protein_g}g` : '—' },
      { label: 'Total Fat', val: n.fat_g != null ? `${n.fat_g}g` : '—' },
      { label: 'Fibre',     val: n.fibre_g != null ? `${n.fibre_g}g` : '—' },
    ];

    const colW = CONTENT_W / 3;
    let cx = MARGIN;
    let row = 0;

    cols.forEach((col, i) => {
      if (i % 3 === 0 && i > 0) { cx = MARGIN; row++; y += 14; }
      cx = MARGIN + (i % 3) * colW;

      doc.setFillColor(...C.lightBg);
      doc.rect(cx, y, colW - 2, 12, 'F');

      doc.setTextColor(...C.green);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(col.val, cx + 3, y + 5);

      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...C.textGray);
      doc.text(col.label, cx + 3, y + 10);
    });
    y += 18;
  }

  // ════════════════════════════════════════════════════════════════════════
  // TRUTH ALERTS
  // ════════════════════════════════════════════════════════════════════════
  const hasAlerts = result.top_ingredient_warning || result.maida_alert ||
    (result.hidden_sugar_count >= 2) || result.serving_size_trick || result.no_msg_deception;

  if (hasAlerts) {
    sectionHeader('Truth Alerts');

    const alerts: { emoji: string; title: string; detail?: string }[] = [];
    if (result.top_ingredient_warning) alerts.push({ emoji: '⚠', title: result.top_ingredient_warning });
    if (result.hidden_sugar_count >= 2) alerts.push({
      emoji: '🍬',
      title: `Sugar listed ${result.hidden_sugar_count} times under different names`,
      detail: (result.hidden_sugar_names || []).join(', '),
    });
    if (result.maida_alert) alerts.push({
      emoji: '🌾',
      title: '"Wheat Flour" = Maida, not Atta',
      detail: 'In India, "Wheat Flour" on labels means refined maida, not whole wheat atta.',
    });
    if (result.serving_size_trick) alerts.push({
      emoji: '📏',
      title: `Tiny serving size used (${result.serving_size_g}g)`,
      detail: 'Nutrition numbers are shown for a very small serving. Actual consumption is usually much more.',
    });
    if (result.no_msg_deception) alerts.push({
      emoji: '🧪',
      title: '"No Added MSG" — but contains MSG alternatives',
    });

    alerts.forEach(alert => {
      const detailLines = alert.detail ? doc.splitTextToSize(alert.detail, CONTENT_W - 10) : [];
      const boxH = 8 + detailLines.length * 4;
      checkPage(boxH + 2);

      doc.setFillColor(255, 240, 235);
      doc.rect(MARGIN, y, CONTENT_W, boxH, 'F');

      doc.setTextColor(...C.red);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text(`${alert.emoji}  ${alert.title}`, MARGIN + 3, y + 5);

      if (detailLines.length > 0) {
        doc.setTextColor(...C.textGray);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        detailLines.forEach((line: string) => { doc.text(line, MARGIN + 6, y + 9); y += 4; });
      }
      y += boxH + 3;
    });
    y += 2;
  }

  // ════════════════════════════════════════════════════════════════════════
  // INGREDIENT BREAKDOWN
  // ════════════════════════════════════════════════════════════════════════
  const ingredients = (result.ingredients || []).filter((ing: any) => ing && (ing.name || ing.plain_name));

  if (ingredients.length > 0) {
    sectionHeader('Ingredient Breakdown');

    ingredients.forEach((ing: any, idx: number) => {
      const name       = ing.plain_name || ing.name || '—';
      const fn         = ing.function   || '';
      const tier       = ing.safety_tier || 'UNVERIFIED';
      const explanation = ing.plain_explanation || '';
      const expLines   = explanation ? doc.splitTextToSize(explanation, CONTENT_W - 10) : [];
      const rowH       = 9 + expLines.length * 4;

      checkPage(rowH + 2);

      // Alternate row background
      if (idx % 2 === 0) {
        doc.setFillColor(...C.lightBg);
        doc.rect(MARGIN, y, CONTENT_W, rowH, 'F');
      }

      // Safety tier pill
      const tc = tierColor(tier);
      doc.setFillColor(...tc);
      doc.roundedRect(PAGE_W - MARGIN - 22, y + 1, 22, 5, 1, 1, 'F');
      doc.setTextColor(...C.white);
      doc.setFontSize(6);
      doc.setFont('helvetica', 'bold');
      doc.text(tier.replace('_', ' '), PAGE_W - MARGIN - 11, y + 4.5, { align: 'center' });

      // Name + function
      doc.setTextColor(...C.green);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text(name, MARGIN + 2, y + 5);

      doc.setTextColor(...C.textGray);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      if (fn) doc.text(fn, MARGIN + 2, y + 9);

      if (expLines.length > 0) {
        doc.setFontSize(7);
        doc.setTextColor(80, 80, 80);
        let ey = y + 13;
        expLines.forEach((line: string) => { doc.text(line, MARGIN + 4, ey); ey += 4; });
      }

      y += rowH + 2;
    });
    y += 4;
  }

  // ════════════════════════════════════════════════════════════════════════
  // PROFILE VERDICT
  // ════════════════════════════════════════════════════════════════════════
  if (profileVerdict) {
    sectionHeader('Personalised Verdict');
    checkPage(20);

    const pvScore = profileVerdict.score ?? score;
    const pvc = scoreColor(pvScore);

    doc.setFillColor(...pvc);
    doc.roundedRect(PAGE_W - MARGIN - 24, y - 2, 24, 14, 3, 3, 'F');
    doc.setTextColor(...C.white);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(String(pvScore), PAGE_W - MARGIN - 12, y + 6, { align: 'center' });
    doc.setFontSize(6);
    doc.text('YOUR SCORE', PAGE_W - MARGIN - 12, y + 10, { align: 'center' });

    const concerns = profileVerdict.concerns || [];
    if (concerns.length > 0) {
      doc.setTextColor(...C.green);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('Specific Concerns for Your Profile:', MARGIN, y + 5);
      y += 10;

      concerns.slice(0, 5).forEach((c: any) => {
        const reason = c.reason || c.label || '';
        const lines  = reason ? doc.splitTextToSize(reason, CONTENT_W - 8) : [];
        checkPage(6 + lines.length * 4);

        doc.setFillColor(255, 240, 235);
        doc.rect(MARGIN, y, CONTENT_W, 5 + lines.length * 4, 'F');
        doc.setTextColor(...C.red);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        lines.forEach((line: string) => { doc.text(`• ${line}`, MARGIN + 3, y + 4); y += 4; });
        y += 4;
      });
    } else {
      y += 14;
    }
  }

  // ════════════════════════════════════════════════════════════════════════
  // FOOTER
  // ════════════════════════════════════════════════════════════════════════
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFillColor(...C.borderGray);
    doc.rect(0, PAGE_H - 10, PAGE_W, 10, 'F');
    doc.setTextColor(...C.textGray);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('Generated by Read Your Label • ryl-six.vercel.app', MARGIN, PAGE_H - 4);
    doc.text(`Page ${i} of ${totalPages}`, PAGE_W - MARGIN, PAGE_H - 4, { align: 'right' });
  }

  // ── Save ─────────────────────────────────────────────────────────────────
  const safeName = (result.product_name || 'product').replace(/[^a-z0-9]/gi, '_').slice(0, 30);
  doc.save(`RYL_${safeName}_analysis.pdf`);
}
