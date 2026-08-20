import { useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';

function LessonAudioPlayer({ lessonId, isDarkMode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [error, setError] = useState(null);
  const dark = isDarkMode;

  const { getAccessTokenSilently } = useAuth0();

  const handleGenerateAudio = async () => {
    if (!lessonId) return;
    setIsLoading(true);
    setError(null);

    try {
      const token = await getAccessTokenSilently();
      const API_BASE = import.meta.env.VITE_API_URL || '';
      const response = await fetch('/api/audio/generate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
         },
        body: JSON.stringify({ lessonId }),
      });

      if (!response.ok) {
        let msg = 'Failed to generate audio.';
        try {
          const errData = await response.json();
          if (errData.message) msg = errData.message;
        } catch (_) {}
        throw new Error(msg);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
    } catch (err) {
      console.error('[LessonAudioPlayer]', err);
      setError(err.message || 'An error occurred while generating audio.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`rounded-xl p-4 mb-6 border flex items-center gap-4 ${dark ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
      {/* Icon */}
      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${dark ? 'bg-violet-950 text-violet-300' : 'bg-violet-100 text-violet-600'}`}>
        🎧
      </div>

      <div className="flex-1 min-w-0">
        <p className={`text-xs font-bold uppercase tracking-wider mb-0.5 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
          Hinglish Audio Summary
        </p>

        {audioUrl ? (
          <audio controls src={audioUrl} className="w-full h-8 mt-1" style={{ colorScheme: dark ? 'dark' : 'light' }} />
        ) : (
          <div className="flex items-center gap-3">
            <button
              onClick={handleGenerateAudio}
              disabled={isLoading}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 ${
                isLoading
                  ? 'opacity-60 cursor-not-allowed'
                  : dark
                    ? 'bg-violet-700 hover:bg-violet-600 text-white'
                    : 'bg-violet-600 hover:bg-violet-500 text-white'
              }`}
            >
              {isLoading ? (
                <>
                  <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Generating audio…
                </>
              ) : (
                <>
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                  Generate Audio
                </>
              )}
            </button>
            {!isLoading && (
              <span className={`text-xs ${dark ? 'text-slate-600' : 'text-slate-400'}`}>
                Get a spoken summary in Hinglish
              </span>
            )}
          </div>
        )}

        {error && (
          <p className="text-red-400 text-xs mt-1">{error}</p>
        )}
      </div>
    </div>
  );
}

export default LessonAudioPlayer;
