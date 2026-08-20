import { useState, useEffect } from 'react';

// Module-level cache: persists across re-renders and component instances.
// Keyed by block.query; stores the resolved YouTube videoId so the export
// mode can render the exact watch URL without firing an async fetch.
export const videoIdCache = {};

/**
 * VideoBlock — Fetches a YouTube videoId from the backend and renders an iframe embed.
 * Falls back to a YouTube search anchor link if the fetch fails or returns no result.
 *
 * Props:
 *   block:        { type: 'video', query: string }
 *   isExportMode: boolean (default false) — when true, skips the API fetch and iframe
 *                 entirely; renders only the plain fallback anchor for PDF capture
 */
function VideoBlock({ block, isExportMode = false }) {
  const [videoId, setVideoId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Hooks must be declared unconditionally (React rules of hooks).
  // Guard the effect body so no fetch fires in export mode.
  useEffect(() => {
    if (isExportMode) return;

    if (!block.query) {
      setIsLoading(false);
      return;
    }

    const apiBase =
      typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL
        ? import.meta.env.VITE_API_URL
        : 'http://localhost:5000';

    fetch(
      `${apiBase}/api/video/search?query=${encodeURIComponent(block.query)}`
    )
      .then((res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((data) => {
        if (data && data.videoId) {
          setVideoId(data.videoId);
          // Save to module-level cache so export mode can look up the exact URL
          videoIdCache[block.query] = data.videoId;
        }
      })
      .catch(() => {
        // Silently fall back to anchor link
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [block.query, isExportMode]);

  // ── Fallback anchor URL (used in all states) ───────────────────────────────
  const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
    block.query
  )}`;

  // ── Export mode: inline-styled, no classNames, prints resolved watch URL ────
  if (isExportMode) {
    // Check cache for the resolved videoId fetched during the live session
    const cachedId = videoIdCache[block.query];
    const displayUrl = cachedId
      ? `https://www.youtube.com/watch?v=${cachedId}`
      : `https://www.youtube.com/results?search_query=${encodeURIComponent(block.query)}`;

    return (
      <div style={{
        padding: '12px 16px',
        backgroundColor: '#fef3c7',
        border: '1px solid #fde68a',
        borderRadius: '6px',
      }}>
        <p style={{
          fontWeight: '600',
          fontSize: '11px',
          textTransform: 'uppercase',
          color: '#92400e',
          margin: '0 0 4px 0',
          letterSpacing: '0.05em',
        }}>
          Recommended Video
        </p>
        <p style={{
          fontWeight: '600',
          fontSize: '13px',
          color: '#111827',
          margin: '0 0 4px 0',
        }}>
          {block.query}
        </p>
        <p style={{
          fontSize: '11px',
          color: '#1d4ed8',
          wordBreak: 'break-all',
          margin: 0,
        }}>
          <span
            className="pdf-link-target"
            data-query={block.query}
            data-url={displayUrl}
            style={{ color: '#2563eb', fontSize: '0.875rem', wordBreak: 'break-all' }}
          >
            {displayUrl}
          </span>
        </p>
      </div>
    );
  }

  // ── Loading state ──────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="block-video">
        <div className="block-video__icon" aria-hidden="true">▶</div>
        <div className="block-video__content">
          <p className="block-video__label">Recommended Video</p>
          <p className="block-video__loading">Loading video…</p>
        </div>
      </div>
    );
  }

  // ── Embed state ────────────────────────────────────────────────────────────
  if (videoId) {
    return (
      <div className="block-video block-video--embed">
        <p className="block-video__label">Recommended Video</p>
        <div className="block-video__iframe-wrapper">
          <iframe
            className="block-video__iframe"
            src={`https://www.youtube.com/embed/${videoId}`}
            title={block.query}
            width="100%"
            height="315"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
          />
        </div>
        <a
          href={searchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block-video__link block-video__link--caption video-fallback-link"
        >
          {block.query}
        </a>
      </div>
    );
  }

  // ── Fallback anchor state ──────────────────────────────────────────────────
  return (
    <div className="block-video">
      <div className="block-video__icon" aria-hidden="true">▶</div>
      <div className="block-video__content">
        <p className="block-video__label">Recommended Video</p>
        <a
          href={searchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block-video__link"
        >
          {block.query}
        </a>
      </div>
    </div>
  );
}

export default VideoBlock;
