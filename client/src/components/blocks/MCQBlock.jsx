import { useState } from 'react';

// MCQBlock — Interactive multiple-choice question with animated feedback.
function MCQBlock({ block, isExportMode = false }) {
  const { question, options, answer } = block;
  const [selected, setSelected] = useState(null);

  const handleSelect = (option) => {
    if (selected !== null) return;
    setSelected(option);
  };

  // 
  if (isExportMode) {
    return (
      <div style={{
        border: '1px solid #e5e7eb',
        borderRadius: '6px',
        padding: '16px',
        backgroundColor: '#f9fafb',
      }}>
        <p style={{ fontWeight: 'bold', marginBottom: '10px', color: '#111827', fontSize: '14px', margin: '0 0 10px 0' }}>
          {question}
        </p>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {options?.map((option, idx) => (
            <li key={idx} style={{ color: option === answer ? '#16a34a' : '#374151', fontSize: '14px', fontWeight: option === answer ? '600' : '400' }}>
              {option}{option === answer ? ' ✅ (Correct Answer)' : ''}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  // 
  const getOptionStyle = (option) => {
    const base = 'w-full text-left px-4 py-3 rounded-lg border text-sm transition-all duration-200 cursor-pointer flex items-center gap-3';
    if (selected === null) {
      return `${base} border-slate-700 bg-slate-800/50 text-slate-200 hover:border-indigo-600 hover:bg-indigo-950/40 hover:text-white`;
    }
    if (option === answer) {
      return `${base} border-green-600 bg-green-950/50 text-green-300 cursor-default`;
    }
    if (option === selected) {
      return `${base} border-red-600 bg-red-950/40 text-red-300 cursor-default`;
    }
    return `${base} border-slate-800 bg-slate-900/30 text-slate-600 cursor-default opacity-50`;
  };

  const getOptionIcon = (option) => {
    if (selected === null) return null;
    if (option === answer) return (
      <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    );
    if (option === selected) return (
      <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
    );
    return null;
  };

  return (
    <div className="rounded-xl border border-slate-700/60 bg-slate-900/40 p-5 my-4 backdrop-blur-sm">
      {/* Question header */}
      <div className="flex items-start gap-3 mb-4">
        <div className="w-6 h-6 rounded-full bg-indigo-900 border border-indigo-700 flex items-center justify-center flex-shrink-0 mt-0.5">
          <span className="text-[10px] font-bold text-indigo-300">?</span>
        </div>
        <p className="text-sm font-semibold text-slate-100 leading-snug">{question}</p>
      </div>

      {/* Options */}
      <ul className="flex flex-col gap-2">
        {options?.map((option, idx) => (
          <li key={idx}>
            <button
              className={getOptionStyle(option)}
              onClick={() => handleSelect(option)}
              disabled={selected !== null}
            >
              {getOptionIcon(option)}
              <span>{option}</span>
            </button>
          </li>
        ))}
      </ul>

      {/* Feedback */}
      {selected !== null && (
        <div className={`mt-4 flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg ${
          selected === answer
            ? 'bg-green-950/50 text-green-300 border border-green-800'
            : 'bg-red-950/40 text-red-300 border border-red-800'
        }`}>
          {selected === answer ? (
            <>✅ Correct!</>
          ) : (
            <>❌ Incorrect. The correct answer is: <span className="text-green-300 ml-1">"{answer}"</span></>
          )}
        </div>
      )}
    </div>
  );
}

export default MCQBlock;
