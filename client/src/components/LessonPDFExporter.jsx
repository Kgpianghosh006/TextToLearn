import { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import HeadingBlock from './blocks/HeadingBlock';
import ParagraphBlock from './blocks/ParagraphBlock';
import CodeBlock from './blocks/CodeBlock';
import VideoBlock, { videoIdCache } from './blocks/VideoBlock';
import MCQBlock from './blocks/MCQBlock';

// Block-type → component lookup (mirrors LessonRenderer)
const BLOCK_COMPONENTS = {
  heading: HeadingBlock,
  paragraph: ParagraphBlock,
  code: CodeBlock,
  video: VideoBlock,
  mcq: MCQBlock,
};

/**
 * LessonPDFExporter — Renders a hidden, print-optimized copy of the lesson
 * and captures it with html2canvas to produce a downloadable A4 PDF.
 *
 * Props:
 *   selectedLesson — the full Lesson document object
 */
function LessonPDFExporter({ selectedLesson }) {
  const [isExporting, setIsExporting] = useState(false);
  const hiddenRef = useRef(null);

  if (!selectedLesson) return null;

  const handleDownload = async () => {
    if (!hiddenRef?.current) return;

    setIsExporting(true);

    try {
      // STEP 1: Swap URLs first — so DOM height adjusts to shorter watch URLs
      // before the spacer algorithm measures element positions. If spacers were
      // inserted first, the URL swap could change line-wrapping and invalidate
      // those measurements, causing hotspot coordinate misalignment.
      const preCaptureLinks = hiddenRef.current.querySelectorAll('.pdf-link-target');
      preCaptureLinks.forEach(link => {
        const query = link.getAttribute('data-query');
        const exactId = videoIdCache[query];
        if (exactId) {
          const exactUrl = `https://youtu.be/${exactId}`.trim();
          link.textContent = exactUrl; // Updates the visible text in the PDF
          link.setAttribute('data-url', exactUrl); // Updates the hotspot target
        }
      });

      // STEP 2: Spacer algorithm — now measures final, true heights after URL swap.
      // Uses getBoundingClientRect() in a synchronous for-loop so each spacer
      // insertion is reflected in subsequent iterations' layout measurements.
      const A4_HEIGHT_PX = 1123; // A4 height at 96 dpi
      const children = Array.from(hiddenRef.current.children);

      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        const parentRect = hiddenRef.current.getBoundingClientRect();
        const childRect = child.getBoundingClientRect();

        const relativeTop = childRect.top - parentRect.top;
        const childBottom = relativeTop + childRect.height;

        const currentPage = Math.floor(relativeTop / A4_HEIGHT_PX);
        const pageBottom = (currentPage + 1) * A4_HEIGHT_PX;

        // If the block crosses the page boundary, push it to the next page
        if (childBottom > pageBottom) {
          const pushAmount = pageBottom - relativeTop + 40; // space to boundary + 40px top padding
          const spacer = document.createElement('div');
          spacer.style.height = `${pushAmount}px`;
          spacer.className = 'pdf-page-spacer';
          hiddenRef.current.insertBefore(spacer, child);
        }
      }

      // Capture the hidden, off-screen DOM node.
      // scale: 2 for crisp 2× resolution output.
      // windowWidth: 794 matches 210mm at 96 dpi so html2canvas lays out
      // the node at exactly A4 width before scaling.
      const canvas = await html2canvas(hiddenRef.current, {
        scale: 2,
        windowWidth: 794,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');

      // Initialise jsPDF in A4 portrait (210 × 297 mm).
      const pdf = new jsPDF({
        unit: 'mm',
        format: 'a4',
        orientation: 'portrait',
      });

      // Multi-page pagination — slices the full-height image across A4 pages.
      const pdfWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add subsequent pages while content remains
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // ── Clickable URL hotspot injection ──────────────────────────────────────
      // After all pages are built, walk every .pdf-link-target element in the
      // hidden node and draw an invisible jsPDF link box over its exact position.
      // This makes URLs in the exported PDF natively clickable.

      // 1. Establish pixel-to-millimeter conversion ratio
      const pxToMm = pdfWidth / 794;
      const parentRect = hiddenRef.current.getBoundingClientRect();
      const links = hiddenRef.current.querySelectorAll('.pdf-link-target');

      // 2. Iterate through every link to calculate its exact coordinate on the PDF
      links.forEach(link => {
        const linkRect = link.getBoundingClientRect();
        const relativeTop = linkRect.top - parentRect.top;
        const relativeLeft = linkRect.left - parentRect.left;

        // Determine which page the link landed on
        const pageIndex = Math.floor(relativeTop / A4_HEIGHT_PX);
        const yOnPagePx = relativeTop - (pageIndex * A4_HEIGHT_PX);

        // Convert pixel coordinates to A4 millimeters
        const xMm = relativeLeft * pxToMm;
        const yMm = yOnPagePx * pxToMm;
        const wMm = linkRect.width * pxToMm;
        const hMm = linkRect.height * pxToMm;

        // Navigate jsPDF to the correct page and draw the clickable URL box.
        // +2mm / -1mm forgiving padding makes the hotspot easier to click.
        pdf.setPage(pageIndex + 1); // jsPDF pages are 1-indexed
        pdf.link(xMm - 1, yMm - 1, wMm + 2, hMm + 2, { url: link.getAttribute('data-url') });
      });

      // Derive a safe filename from the lesson title.
      const safeFilename = (selectedLesson.title ?? 'lesson')
        .replace(/[^a-z0-9\s-]/gi, '')
        .trim()
        .replace(/\s+/g, '_');

      pdf.save(`${safeFilename}.pdf`);
    } catch (err) {
      console.error('[LessonPDFExporter] Export failed:', err.message);
    } finally {
      // Remove injected spacers so repeated exports don’t accumulate them
      if (hiddenRef.current) {
        hiddenRef.current.querySelectorAll('.pdf-page-spacer').forEach(el => el.remove());
      }
      setIsExporting(false);
    }
  };

  return (
    <>
      {/* ── Download Button ─────────────────────────────────────────────── */}
      <button
        onClick={handleDownload}
        disabled={isExporting}
        title="Download this lesson as a PDF"
        className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 ${
          isExporting
            ? 'bg-slate-700 opacity-70 cursor-not-allowed text-slate-300'
            : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600'
        }`}
      >
        {isExporting ? (
          <>
            <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Exporting…
          </>
        ) : (
          <>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            PDF
          </>
        )}
      </button>

      {/* ── Hidden Print-Optimized Capture Node ─────────────────────────── */}
      {/* Positioned off-screen so it is never visible to the user.          */}
      {/* Block components receive isExportMode={true} so they render clean  */}
      {/* inline-styled output with no iframes and wrapped code blocks.      */}
      <div
        ref={hiddenRef}
        style={{
          position: 'absolute',
          top: '-9999px',
          left: 0,
          width: '794px',
          backgroundColor: '#ffffff',
          color: '#000000',
          padding: '40px',
          boxSizing: 'border-box',
          fontFamily: 'sans-serif',
          fontSize: '14px',
          lineHeight: '1.6',
        }}
        aria-hidden="true"
      >
        {/* Lesson title */}
        <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '12px', color: '#111827' }}>
          {selectedLesson.title}
        </h1>

        {/* Learning objectives */}
        {selectedLesson.objectives && selectedLesson.objectives.length > 0 && (
          <div style={{ marginBottom: '20px', padding: '12px 16px', background: '#f0f9ff', borderRadius: '6px', border: '1px solid #bae6fd' }}>
            <p style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#0369a1', marginBottom: '8px' }}>
              Learning Objectives
            </p>
            <ul style={{ margin: 0, paddingLeft: '20px', color: '#0c4a6e' }}>
              {selectedLesson.objectives.map((obj, idx) => (
                <li key={idx} style={{ marginBottom: '4px', fontSize: '13px' }}>{obj}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Content blocks — isExportMode={true} triggers clean inline rendering */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {selectedLesson.content && selectedLesson.content.map((block, idx) => {
            const BlockComponent = BLOCK_COMPONENTS[block.type];
            if (!BlockComponent) return null;
            return <BlockComponent key={idx} block={block} isExportMode={true} />;
          })}
        </div>
      </div>
    </>
  );
}

export default LessonPDFExporter;
