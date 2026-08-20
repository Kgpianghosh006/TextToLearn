// CodeBlock — Renders a VS Code-style code block with a language badge.
function CodeBlock({ block, isExportMode = false }) {
  const { language, code } = block;

  // 
  if (isExportMode) {
    return (
      <div style={{ margin: '0' }}>
        {language && (
          <div style={{
            display: 'inline-block',
            padding: '2px 10px',
            backgroundColor: '#374151',
            color: '#f9fafb',
            fontSize: '11px',
            fontFamily: 'monospace',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            borderRadius: '4px 4px 0 0',
          }}>
            {language}
          </div>
        )}
        <pre style={{
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          overflowX: 'visible',
          backgroundColor: '#f9fafb',
          color: '#000',
          padding: '16px',
          border: '1px solid #e5e7eb',
          borderRadius: language ? '0 4px 4px 4px' : '4px',
          margin: '0',
          fontFamily: 'monospace',
          fontSize: '13px',
          lineHeight: '1.6',
        }}>
          <code>{code}</code>
        </pre>
      </div>
    );
  }

  // 
  return (
    <div className="my-4 rounded-xl overflow-hidden border border-slate-700/50 shadow-lg shadow-black/20">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#1a2235] border-b border-slate-700/50">
        <div className="flex items-center gap-1.5">
          {/* Traffic light dots */}
          <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
        </div>
        {language && (
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 font-mono">
            {language}
          </span>
        )}
      </div>
      {/* Code body */}
      <pre className="bg-[#0d1117] text-slate-300 px-5 py-4 overflow-x-auto font-mono text-sm leading-relaxed">
        <code className="font-mono">{code}</code>
      </pre>
    </div>
  );
}

export default CodeBlock;
