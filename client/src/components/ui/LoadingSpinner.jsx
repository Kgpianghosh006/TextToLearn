/**
 * LoadingSpinner — Centered spinner with label.
 * Props:
 *   message?: string   — label text (default: "Loading…")
 *   fullPage?: boolean — if true, takes up full screen height
 */
function LoadingSpinner({ message = 'Loading…', fullPage = false }) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 ${fullPage ? 'min-h-screen' : 'min-h-[300px]'}`}
      role="status"
      aria-label={message}
    >
      {/* Spinner ring */}
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-4 border-slate-800" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-500 animate-spin" />
      </div>

      {message && (
        <div className="flex flex-col items-center gap-1">
          <p className="text-sm font-medium text-slate-400">{message}</p>
        </div>
      )}
    </div>
  );
}

export default LoadingSpinner;
