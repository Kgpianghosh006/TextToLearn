import { useState, useRef, useEffect } from 'react';
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

// CoursePDFExporter — Fetches a fully-populated course and renders it to PDF
function CoursePDFExporter({ course }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [fullCourseData, setFullCourseData] = useState(null);
  const hiddenRef = useRef(null);

  if (!course || !course._id) return null;
  const handleExportClick = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    setFullCourseData(null);

    const apiBase =
      typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL
        ? import.meta.env.VITE_API_URL
        : 'http://localhost:5000';

    try {
      // STEP 1: Batch-enrich all unenriched lessons (idempotent — skips already-enriched)
      const publishRes = await fetch(`${apiBase}/api/courses/${course._id}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!publishRes.ok) {
        const errData = await publishRes.json().catch(() => ({}));
        throw new Error(errData.message || `Publish error: ${publishRes.status}`);
      }

      // STEP 2: Fetch the fully populated course (all lessons now guaranteed enriched)
      const exportRes = await fetch(`${apiBase}/api/courses/${course._id}/export`);
      if (!exportRes.ok) {
        const errData = await exportRes.json().catch(() => ({}));
        throw new Error(errData.message || `Export fetch error: ${exportRes.status}`);
      }
      const fetchedCourse = await exportRes.json();

      // Setting state triggers a re-render that populates the hidden DOM node.
      // The useEffect below then waits 500ms for React to flush before capturing.
      setFullCourseData(fetchedCourse);
    } catch (err) {
      console.error('[CoursePDFExporter] Smart download failed:', err.message);
      setIsGenerating(false);
    }
  };

  // 
  useEffect(() => {
    if (!fullCourseData) return;

    // 500ms grace period — gives React time to flush the heavy DOM render
    // (all modules, lessons, and content blocks) before html2canvas captures.
    const timer = setTimeout(async () => {
      if (!hiddenRef?.current) {
        setFullCourseData(null);
        setIsGenerating(false);
        return;
      }

      try {
        // STEP 1: Swap URLs first — so DOM height adjusts to shorter watch URLs
        // before the spacer algorithm measures element positions.
        const preCaptureLinks = hiddenRef.current.querySelectorAll('.pdf-link-target');
        preCaptureLinks.forEach(link => {
          const query = link.getAttribute('data-query');
          const exactId = videoIdCache[query];
          if (exactId) {
            const exactUrl = `https://youtu.be/${exactId}`.trim();
            link.textContent = exactUrl;
            link.setAttribute('data-url', exactUrl);
          }
        });

        // STEP 2: Spacer algorithm — measures final, true heights after URL swap.
        // Synchronous for-loop so each spacer insertion is reflected in layout.
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

          if (childBottom > pageBottom) {
            const pushAmount = pageBottom - relativeTop + 40;
            const spacer = document.createElement('div');
            spacer.style.height = `${pushAmount}px`;
            spacer.className = 'pdf-page-spacer';
            hiddenRef.current.insertBefore(spacer, child);
          }
        }

        // Capture the hidden, off-screen DOM node at 2× scale.
        const canvas = await html2canvas(hiddenRef.current, {
          scale: 2,
          windowWidth: 794,
          logging: false,
        });

        const imgData = canvas.toDataURL('image/png');

        const pdf = new jsPDF({
          unit: 'mm',
          format: 'a4',
          orientation: 'portrait',
        });

        const pdfWidth = 210;
        const pageHeight = 297;
        const imgHeight = (canvas.height * pdfWidth) / canvas.width;

        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
          heightLeft -= pageHeight;
        }

        // Clickable URL hotspot injection
        const pxToMm = pdfWidth / 794;
        const parentRect = hiddenRef.current.getBoundingClientRect();
        const links = hiddenRef.current.querySelectorAll('.pdf-link-target');

        links.forEach(link => {
          const linkRect = link.getBoundingClientRect();
          const relativeTop = linkRect.top - parentRect.top;
          const relativeLeft = linkRect.left - parentRect.left;

          const pageIndex = Math.floor(relativeTop / A4_HEIGHT_PX);
          const yOnPagePx = relativeTop - (pageIndex * A4_HEIGHT_PX);

          const xMm = relativeLeft * pxToMm;
          const yMm = yOnPagePx * pxToMm;
          const wMm = linkRect.width * pxToMm;
          const hMm = linkRect.height * pxToMm;

          pdf.setPage(pageIndex + 1);
          pdf.link(xMm - 1, yMm - 1, wMm + 2, hMm + 2, { url: link.getAttribute('data-url') });
        });

        const safeFilename = (fullCourseData.title ?? 'course').replace(/\s+/g, '_');
        pdf.save(`${safeFilename}_Full_Course.pdf`);
      } catch (err) {
        console.error('[CoursePDFExporter] PDF generation failed:', err.message);
      } finally {
        // Clean up spacers so repeated exports don't accumulate them
        if (hiddenRef.current) {
          hiddenRef.current.querySelectorAll('.pdf-page-spacer').forEach(el => el.remove());
        }
        // Reset state — hides the hidden DOM node and re-enables the button
        setFullCourseData(null);
        setIsGenerating(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [fullCourseData]);

  // Sort modules and lessons by order for consistent rendering
  const sortedModules = fullCourseData
    ? [...fullCourseData.modules].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    : [];

  return (
    <>
      {/*  */}
      <button
        onClick={handleExportClick}
        disabled={isGenerating}
        title="Enrich all lessons then download the full course as a PDF"
        className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-150 ${
          isGenerating
            ? 'bg-indigo-700 opacity-70 cursor-not-allowed text-white'
            : 'bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white shadow-sm'
        }`}
      >
        {isGenerating ? (
          <>
            <svg className="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Generating PDF…
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download PDF
          </>
        )}
      </button>

      {/*  */}
      {/* Only rendered when fullCourseData is populated (after JIT fetch). */}
      {/* Block components receive isExportMode={true} for clean output.   */}
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
        {fullCourseData ? (
          <>
            {/* Course cover title */}
            <h1 style={{
              fontSize: '28px',
              fontWeight: '800',
              marginBottom: '8px',
              color: '#111827',
              borderBottom: '3px solid #111827',
              paddingBottom: '12px',
            }}>
              {fullCourseData.title}
            </h1>
            {fullCourseData.description && (
              <p style={{ fontSize: '14px', color: '#374151', marginBottom: '32px' }}>
                {fullCourseData.description}
              </p>
            )}

            {/* Modules + Lessons */}
            {sortedModules.map((module, mIdx) => {
              const sortedLessons = module.lessons
                ? [...module.lessons].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                : [];

              return (
                <div key={module._id ?? mIdx}>
                  {/* Module heading */}
                  <h1 style={{
                    fontSize: '2rem',
                    fontWeight: '700',
                    marginTop: '40px',
                    marginBottom: '20px',
                    borderBottom: '2px solid black',
                    paddingBottom: '8px',
                    color: '#111827',
                  }}>
                    {module.title}
                  </h1>

                  {/* Lessons inside this module */}
                  {sortedLessons.map((lesson, lIdx) => (
                    <div key={lesson._id ?? lIdx} style={{ marginBottom: '32px' }}>
                      <h2 style={{
                        fontSize: '20px',
                        fontWeight: '700',
                        marginBottom: '12px',
                        color: '#1f2937',
                      }}>
                        {lesson.title}
                      </h2>

                      {lesson.objectives && lesson.objectives.length > 0 && (
                        <div style={{ marginBottom: '16px', padding: '12px 16px', background: '#f0f9ff', borderRadius: '6px', border: '1px solid #bae6fd' }}>
                          <p style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#0369a1', marginBottom: '8px' }}>
                            Learning Objectives
                          </p>
                          <ul style={{ margin: 0, paddingLeft: '20px', color: '#0c4a6e' }}>
                            {lesson.objectives.map((obj, idx) => (
                              <li key={idx} style={{ marginBottom: '4px', fontSize: '13px' }}>{obj}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {lesson.content && lesson.content.map((block, idx) => {
                          const BlockComponent = BLOCK_COMPONENTS[block.type];
                          if (!BlockComponent) return null;
                          return <BlockComponent key={idx} block={block} isExportMode={true} />;
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </>
        ) : (
          // Empty placeholder — hidden DOM is invisible when not exporting
          <div />
        )}
      </div>
    </>
  );
}

export default CoursePDFExporter;