import { useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import PromptForm from '../components/PromptForm';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ErrorMessage from '../components/ui/ErrorMessage';
import { generateCourse } from '../utils/api';

const EXAMPLE_TOPICS = [
  'Introduction to Machine Learning',
  'React.js for Beginners',
  'Fundamentals of Robotics',
  'Python Data Science',
  'Blockchain Explained',
  'Digital Marketing 101',
];

/**
 * HomeView — Authenticated user landing page with course creation prompt.
 */
function HomeView() {
  const { isDarkMode, fetchUserCourses } = useOutletContext();
  const navigate = useNavigate();
  const { getAccessTokenSilently, user } = useAuth0();
  const dark = isDarkMode;

  const [isCourseLoading, setIsCourseLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleCourseSubmit = async (topic) => {
    setIsCourseLoading(true);
    setError(null);

    try {
      const token = await getAccessTokenSilently();
      const generatedCourse = await generateCourse(topic, token);

      if (fetchUserCourses) {
        await fetchUserCourses();
      }

      navigate(`/courses/${generatedCourse._id}`);
    } catch (err) {
      setError(
        err?.response?.data?.message || err?.message || 'Failed to generate course. Please try again.'
      );
      setIsCourseLoading(false);
    }
  };

  if (isCourseLoading) {
    return (
      <div className={`flex flex-col h-full items-center justify-center ${dark ? 'bg-[#0f172a]' : 'bg-slate-50'}`}>
        <LoadingSpinner message="Building your course with AI…" fullPage />
        <p className="text-slate-500 text-xs mt-2">This may take up to 30 seconds</p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full overflow-y-auto ${dark ? 'bg-[#0f172a]' : 'bg-slate-50'}`}>
      {error && (
        <div className="px-8 pt-6">
          <ErrorMessage message={error} onDismiss={() => setError(null)} />
        </div>
      )}

      {/* ── Hero Section ───────────────────────────────────────────────────── */}
      <div className="flex flex-col items-center justify-center flex-1 px-4 py-16 max-w-3xl mx-auto w-full">

        {/* Greeting */}
        <p className={`text-sm font-medium mb-3 ${dark ? 'text-indigo-400' : 'text-indigo-600'}`}>
          Hello, {user?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'there'} 👋
        </p>

        <h1 className={`text-4xl sm:text-5xl font-extrabold text-center leading-tight tracking-tight mb-4 ${dark ? 'text-white' : 'text-slate-900'}`}>
          What do you want to<br />
          <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
            learn today?
          </span>
        </h1>

        <p className={`text-center text-sm leading-relaxed mb-10 max-w-md ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
          Type any topic and get a complete AI-generated course — with structured modules,
          interactive quizzes, videos, and audio summaries.
        </p>

        {/* ── Search Form ─────────────────────────────────────────────────── */}
        <div className="w-full">
          <PromptForm onSubmit={handleCourseSubmit} isLoading={isCourseLoading} />
        </div>

        {/* ── Example Topic Chips ─────────────────────────────────────────── */}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {EXAMPLE_TOPICS.map((topic) => (
            <button
              key={topic}
              onClick={() => handleCourseSubmit(topic)}
              disabled={isCourseLoading}
              className={`px-3 py-1.5 text-xs rounded-full border transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${
                dark
                  ? 'border-slate-700 text-slate-400 hover:border-indigo-600 hover:text-indigo-300 hover:bg-indigo-950/40'
                  : 'border-slate-300 text-slate-500 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50'
              }`}
            >
              {topic}
            </button>
          ))}
        </div>

        {/* ── Stats Row ───────────────────────────────────────────────────── */}
        <div className="mt-16 flex items-center gap-8">
          {[
            { label: 'AI Models', value: 'Gemini 2.0' },
            { label: 'Content Types', value: '5 Blocks' },
            { label: 'Export Formats', value: 'PDF + Audio' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className={`text-sm font-bold ${dark ? 'text-slate-200' : 'text-slate-700'}`}>{stat.value}</div>
              <div className={`text-[10px] font-medium uppercase tracking-wider mt-0.5 ${dark ? 'text-slate-600' : 'text-slate-400'}`}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default HomeView;