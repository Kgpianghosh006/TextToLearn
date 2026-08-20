/**
 * ErrorMessage — Dismissable error alert banner.
 * Props:
 *   message: string      — the error text
 *   onDismiss?: () => void — optional dismiss callback
 *   compact?: boolean    — renders as inline pill instead of full-width banner
 */
function ErrorMessage({ message, onDismiss, compact = false }) {
  if (!message) return null;

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 text-sm bg-red-950/60 border border-red-800/60 text-red-300 rounded-xl ${
        compact ? 'px-3 py-2 inline-flex' : 'w-full px-4 py-3.5'
      }`}
    >
      {/* Error icon */}
      <svg
        className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
        />
      </svg>

      <span className="flex-1 min-w-0 leading-relaxed">{message}</span>

      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-red-500 hover:text-red-300 transition-colors p-0.5 rounded flex-shrink-0"
          aria-label="Dismiss error"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

export default ErrorMessage;
