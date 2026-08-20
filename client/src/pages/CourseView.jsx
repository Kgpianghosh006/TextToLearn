import { useState, useEffect } from 'react';
import { useParams, useOutletContext, useLocation, Link } from 'react-router-dom';
import CoursePDFExporter from '../components/CoursePDFExporter';
import LessonRenderer from '../components/blocks/LessonRenderer';
import LessonPDFExporter from '../components/LessonPDFExporter';
import LessonAudioPlayer from '../components/LessonAudioPlayer';
import ErrorMessage from '../components/ui/ErrorMessage';
import apiClient, { generateLessonContent } from '../utils/api';

/**
 * CourseView — Displays a course workspace and lesson renderer.
 * Route: /courses/:courseId  AND  /courses/:courseId/module/:moduleIndex/lesson/:lessonIndex
 */
function CourseView() {
  const { courseId } = useParams();
  const { isDarkMode } = useOutletContext();
  const location = useLocation();
  const dark = isDarkMode;

  const [course, setCourse] = useState(null);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [isCourseLoading, setIsCourseLoading] = useState(true);
  const [isLessonLoading, setIsLessonLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch course on mount
  useEffect(() => {
    const fetchCourse = async () => {
      setIsCourseLoading(true);
      setError(null);
      try {
        const response = await apiClient.get(`/api/courses/${courseId}/export`);
        setCourse(response.data);
      } catch (err) {
        setError(err?.response?.data?.message || err?.message || 'Failed to fetch course data.');
      } finally {
        setIsCourseLoading(false);
      }
    };
    if (courseId) fetchCourse();
  }, [courseId]);

  // Sync selected lesson from URL
  useEffect(() => {
    if (!course) return;
    const match = location.pathname.match(/\/module\/(\d+)\/lesson\/(\d+)/);
    if (match) {
      const mIndex = parseInt(match[1], 10);
      const lIndex = parseInt(match[2], 10);
      const mod = course.modules?.[mIndex];
      if (mod?.lessons?.[lIndex]) {
        const lesson = mod.lessons[lIndex];
        if (!selectedLesson || selectedLesson._id !== lesson._id) {
          handleSelectLesson(lesson._id, mod._id, course._id, lesson);
        }
      }
    } else {
      setSelectedLesson(null);
    }
  }, [location.pathname, course]);

  const handleSelectLesson = async (lessonId, moduleId, cId, lessonObj) => {
    setIsLessonLoading(true);
    setError(null);
    try {
      if (lessonObj?.content?.length > 0) {
        setSelectedLesson(lessonObj);
      } else {
        const enrichedLesson = await generateLessonContent(cId, moduleId, lessonId);
        setSelectedLesson(enrichedLesson);
        setCourse(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            modules: prev.modules.map(m => m._id === moduleId
              ? { ...m, lessons: m.lessons.map(l => l._id === lessonId ? enrichedLesson : l) }
              : m
            ),
          };
        });
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load lesson content.');
    } finally {
      setIsLessonLoading(false);
    }
  };

  const selectedModule = course?.modules?.find(m => m.lessons?.some(l => l._id === selectedLesson?._id));

  // ── Loading skeleton ────────────────────────────────────────────────────────
  if (isCourseLoading) {
    return (
      <div className={`flex flex-col flex-1 w-full h-full ${dark ? 'bg-[#0f172a]' : 'bg-slate-50'}`}>
        {/* Skeleton header */}
        <div className={`flex items-center justify-between px-8 py-4 border-b ${dark ? 'border-slate-800 bg-[#0f172a]' : 'border-slate-200 bg-white'}`}>
          <div className="flex items-center gap-2">
            <div className={`w-12 h-4 rounded animate-pulse ${dark ? 'bg-slate-800' : 'bg-slate-200'}`} />
            <div className={`w-4 h-4 rounded animate-pulse ${dark ? 'bg-slate-800' : 'bg-slate-200'}`} />
            <div className={`w-48 h-4 rounded animate-pulse ${dark ? 'bg-slate-800' : 'bg-slate-200'}`} />
          </div>
          <div className={`w-36 h-8 rounded-lg animate-pulse ${dark ? 'bg-slate-800' : 'bg-slate-200'}`} />
        </div>
        {/* Skeleton content */}
        <div className="flex-1 px-8 py-8 max-w-3xl flex flex-col gap-4">
          <div className={`w-3/4 h-8 rounded-lg animate-pulse ${dark ? 'bg-slate-800' : 'bg-slate-200'}`} />
          <div className={`w-full h-4 rounded animate-pulse ${dark ? 'bg-slate-800/60' : 'bg-slate-200/60'}`} />
          <div className={`w-5/6 h-4 rounded animate-pulse ${dark ? 'bg-slate-800/60' : 'bg-slate-200/60'}`} />
          <div className={`w-full h-4 rounded animate-pulse ${dark ? 'bg-slate-800/40' : 'bg-slate-200/40'}`} />
          <div className={`mt-4 w-full h-32 rounded-xl animate-pulse ${dark ? 'bg-slate-800/40' : 'bg-slate-200/40'}`} />
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className={`flex flex-col flex-1 w-full h-full p-8 ${dark ? 'bg-[#0f172a]' : 'bg-slate-50'}`}>
        {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}
        {!error && (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <span className="text-5xl">⚠️</span>
            <p className={`text-sm ${dark ? 'text-slate-400' : 'text-slate-500'}`}>Course not found.</p>
            <Link to="/" className="text-indigo-400 hover:text-indigo-300 text-sm font-medium">← Back to Home</Link>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`flex flex-col flex-1 h-full w-full ${dark ? 'bg-[#0f172a] text-slate-100' : 'bg-slate-50 text-slate-900'}`}>

      {/* ── Sticky Header ─────────────────────────────────────────────────────── */}
      <div className={`sticky top-0 z-10 flex items-center justify-between px-6 py-3 w-full flex-shrink-0 border-b backdrop-blur-sm ${dark ? 'bg-[#0f172a]/95 border-slate-800' : 'bg-white/95 border-slate-200'} shadow-sm`}>

        {/* Breadcrumbs */}
        <nav className="flex items-center text-sm min-w-0 font-medium gap-1.5">
          <Link to="/" className={`transition-colors ${dark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'}`}>
            Home
          </Link>
          <svg className="w-3 h-3 text-slate-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
          <Link
            to={`/courses/${courseId}`}
            className={`font-semibold truncate max-w-[200px] hover:underline underline-offset-2 transition-colors ${dark ? 'text-slate-200 hover:text-white' : 'text-slate-700 hover:text-slate-900'}`}
          >
            {course.title}
          </Link>
          {selectedModule && (
            <>
              <svg className="w-3 h-3 text-slate-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
              <span className={`truncate max-w-[140px] ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                {selectedModule.title}
              </span>
            </>
          )}
          {selectedLesson && (
            <>
              <svg className="w-3 h-3 text-slate-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
              <span className={`font-semibold truncate max-w-[180px] ${dark ? 'text-white' : 'text-slate-900'}`}>
                {selectedLesson.title}
              </span>
            </>
          )}
        </nav>

        {/* Download PDF */}
        <CoursePDFExporter course={course} />
      </div>

      {/* ── Body ──────────────────────────────────────────────────────────────── */}
      <div className={`flex-1 flex flex-col overflow-y-auto min-w-0`}>
        {error && (
          <div className="px-8 pt-4">
            <ErrorMessage message={error} onDismiss={() => setError(null)} />
          </div>
        )}

        <div className="flex-1 px-6 py-8 flex flex-col items-stretch">
          {isLessonLoading ? (
            /* Lesson loading skeleton */
            <div className="max-w-3xl mx-auto w-full flex flex-col gap-4">
              <div className={`flex items-center gap-2 mb-2`}>
                <svg className="w-4 h-4 text-indigo-400 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span className={`text-sm ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Generating lesson content with AI…
                </span>
              </div>
              {[1, 2, 3, 4].map(i => (
                <div key={i} className={`h-4 rounded animate-pulse ${dark ? 'bg-slate-800' : 'bg-slate-200'}`} style={{ width: `${70 + (i % 3) * 10}%` }} />
              ))}
              <div className={`mt-2 h-24 rounded-xl animate-pulse ${dark ? 'bg-slate-800/60' : 'bg-slate-200/60'}`} />
            </div>
          ) : selectedLesson ? (
            /* ── Lesson content ─────────────────────────────────────────────── */
            <div className="max-w-3xl mx-auto w-full">
              {/* Lesson title row */}
              <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
                <h1 className={`text-2xl font-bold leading-tight ${dark ? 'text-white' : 'text-slate-900'}`}>
                  {selectedLesson.title}
                </h1>
                <LessonPDFExporter selectedLesson={selectedLesson} />
              </div>

              {/* Audio player */}
              <LessonAudioPlayer lessonId={selectedLesson._id} isDarkMode={dark} />

              {/* Learning Objectives */}
              {selectedLesson.objectives?.length > 0 && (
                <div className={`rounded-xl p-5 mb-7 border ${dark ? 'bg-indigo-950/30 border-indigo-900/50' : 'bg-indigo-50 border-indigo-200'}`}>
                  <p className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-3 flex items-center gap-1.5">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Learning Objectives
                  </p>
                  <ul className="space-y-2">
                    {selectedLesson.objectives.map((obj, idx) => (
                      <li key={idx} className={`flex items-start gap-2 text-sm ${dark ? 'text-indigo-200' : 'text-indigo-900'}`}>
                        <span className="text-indigo-400 mt-0.5 flex-shrink-0">•</span>
                        {obj}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Lesson body */}
              <LessonRenderer content={selectedLesson.content} />
            </div>
          ) : (
            /* ── Empty state (no lesson selected yet) ─────────────────────── */
            <div className="flex flex-col min-h-[400px] max-w-4xl mx-auto w-full">
              {/* Course overview header */}
              <div className={`rounded-2xl p-6 mb-6 border ${dark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'} shadow-sm`}>
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <div className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${dark ? 'text-indigo-400' : 'text-indigo-600'}`}>
                      Course Overview
                    </div>
                    <h2 className={`text-xl font-bold ${dark ? 'text-white' : 'text-slate-900'}`}>
                      {course.title}
                    </h2>
                    {course.description && (
                      <p className={`text-sm mt-1 leading-relaxed ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {course.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className={`flex items-center gap-1.5 text-xs ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                    {course.modules?.length ?? 0} Modules
                  </div>
                  <div className={`flex items-center gap-1.5 text-xs ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    {course.modules?.reduce((acc, m) => acc + (m.lessons?.length ?? 0), 0)} Lessons
                  </div>
                </div>
              </div>

              {/* Module cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {course.modules
                  ?.slice()
                  .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                  .map((mod, mIndex) => (
                    <div
                      key={mod._id}
                      className={`rounded-xl p-4 border flex flex-col gap-2 ${dark ? 'bg-slate-900/50 border-slate-800 hover:border-indigo-800' : 'bg-white border-slate-200 hover:border-indigo-300'} transition-colors duration-150`}
                    >
                      <div className={`text-[10px] font-bold uppercase tracking-wider ${dark ? 'text-slate-600' : 'text-slate-400'}`}>
                        Module {mIndex + 1}
                      </div>
                      <h3 className={`text-sm font-semibold leading-snug ${dark ? 'text-slate-200' : 'text-slate-800'}`}>
                        {mod.title}
                      </h3>
                      <div className={`text-xs ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
                        {mod.lessons?.length ?? 0} lessons
                      </div>
                      {/* First lesson quick-link */}
                      {mod.lessons?.[0] && (
                        <Link
                          to={`/courses/${course._id}/module/${mIndex}/lesson/0`}
                          className="mt-auto pt-2 text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 transition-colors"
                        >
                          Start module
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </Link>
                      )}
                    </div>
                  ))}
              </div>

              {/* Hint */}
              <p className={`mt-8 text-xs text-center ${dark ? 'text-slate-600' : 'text-slate-400'}`}>
                Select a lesson from the sidebar or click "Start module" on a card above
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CourseView;
