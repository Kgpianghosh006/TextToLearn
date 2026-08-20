import { useState, useEffect, useCallback } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import LoadingSpinner from '../ui/LoadingSpinner';
import LandingPage from '../LandingPage';

function MainLayout() {
  const {
    logout,
    user, isAuthenticated, isLoading,
    getAccessTokenSilently,
  } = useAuth0();

  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [userCourses, setUserCourses] = useState([]);

  const location = useLocation();
  const dark = isDarkMode;

  // Sync dark mode with <html> and body classes
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    if (isDarkMode) {
      html.classList.add('dark');
      body.classList.add('dark-mode');
      body.classList.remove('light-mode');
    } else {
      html.classList.remove('dark');
      body.classList.remove('dark-mode');
      body.classList.add('light-mode');
    }
  }, [isDarkMode]);

  // Fetch authenticated user's saved courses
  const fetchUserCourses = useCallback(async () => {
    if (isAuthenticated) {
      try {
        const token = await getAccessTokenSilently();
        const API_BASE = import.meta.env.VITE_API_URL || '';
        const response = await fetch(`${API_BASE}/api/user/courses`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setUserCourses(data);
        }
      } catch (error) {
        console.error('Failed to fetch user courses', error);
      }
    }
  }, [isAuthenticated, getAccessTokenSilently]);

  useEffect(() => {
    fetchUserCourses();
  }, [fetchUserCourses]);

  // Auth gates 
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <LoadingSpinner message="Authenticating…" fullPage />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LandingPage />;
  }

  return (
    <div className={`flex flex-col h-[100dvh] w-screen overflow-hidden transition-colors duration-300 ${dark ? 'bg-[#0f172a] text-gray-100' : 'bg-slate-50 text-gray-900'}`}>

      {/*Topbar*/}
      <nav className={`flex items-center justify-between px-4 py-3 flex-shrink-0 border-b transition-colors duration-300 ${dark ? 'bg-[#0f172a] border-slate-800' : 'bg-white border-slate-200'} shadow-sm`}>

        {/* Left: sidebar toggle + logo */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`p-1.5 rounded-md transition-all duration-150 flex items-center justify-center ${dark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}
            aria-label="Toggle Sidebar"
            title="Toggle Sidebar"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="9" y1="3" x2="9" y2="21"></line>
            </svg>
          </button>

          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <span className={`font-bold text-base tracking-tight whitespace-nowrap ${dark ? 'text-white' : 'text-gray-900'}`}>
              Text<span className="text-indigo-400">To</span>Learn
            </span>
          </Link>
        </div>

        {/* Right: theme toggle */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div
            className="theme-toggle-label cursor-pointer"
            onClick={() => setIsDarkMode(d => !d)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && setIsDarkMode(d => !d)}
            title="Toggle Dark Mode"
            aria-label="Toggle Dark Mode"
          >
            <span style={{ fontSize: '11px', lineHeight: 1 }}>🌙</span>
            <span style={{ fontSize: '11px', lineHeight: 1 }}>☀️</span>
            <div className="slider" />
          </div>
        </div>
      </nav>

      {/*  Body: Sidebar + Content */}
      <div className="flex flex-1 overflow-hidden relative">



        {/* Unified Sidebar*/}
        <aside
          className={`flex flex-col border-r h-full transition-all duration-300 overflow-hidden flex-shrink-0 ${dark ? 'bg-[#0f1929] border-slate-800' : 'bg-white border-slate-200'} ${isSidebarOpen ? 'w-64' : 'w-0'}`}
        >
          {/* ① New Search button */}
          <div className={`p-3 border-b flex-shrink-0 ${dark ? 'border-slate-800' : 'border-slate-200'}`}>
            <Link
              to="/"
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white py-2 px-3 rounded-lg font-semibold transition-all duration-150 text-sm shadow-sm"
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
              </svg>
              New Course
            </Link>
          </div>

          {/* ② History section */}
          <nav className="flex-1 overflow-y-auto py-2 px-2 min-w-0">
            <p className={`px-2 pt-1 pb-2 text-[10px] font-bold uppercase tracking-widest ${dark ? 'text-slate-600' : 'text-slate-400'}`}>
              History
            </p>

            {userCourses.length === 0 ? (
              <div className="px-2 py-4 flex flex-col items-center gap-2 text-center">
                <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <p className={`text-xs leading-relaxed ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
                  No courses yet.<br />Create one to get started!
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-0.5">
                {userCourses.map((course) => {
                  const isActiveCourse = location.pathname.includes(course._id);
                  return (
                    <div key={course._id} className="flex flex-col">
                      {/* Course title link */}
                      <Link
                        to={`/courses/${course._id}`}
                        title={course.title}
                        className={`flex items-center gap-2 px-2 py-2 rounded-md text-sm truncate transition-all duration-150 ${
                          isActiveCourse
                            ? dark
                              ? 'bg-indigo-950 text-indigo-300 font-semibold'
                              : 'bg-indigo-50 text-indigo-700 font-semibold'
                            : dark
                              ? 'text-slate-300 hover:bg-slate-800 hover:text-white'
                              : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                      >
                        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        <span className="truncate">{course.title}</span>
                      </Link>

                      {/* Nested modules + lessons */}
                      {isActiveCourse && course.modules && (
                        <div className="ml-2 mt-0.5 mb-1 flex flex-col">
                          {course.modules
                            .slice()
                            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                            .map((mod, mIndex) => (
                              <div key={mod._id ?? mIndex} className="flex flex-col">
                                {/* Module heading */}
                                <span className={`px-2 pt-2 pb-0.5 text-[10px] font-bold uppercase tracking-wider truncate ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                                  {mod.title}
                                </span>
                                {/* Lesson links */}
                                {mod.lessons && mod.lessons
                                  .slice()
                                  .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                                  .map((lesson, lIndex) => {
                                    const lessonUrl = `/courses/${course._id}/module/${mIndex}/lesson/${lIndex}`;
                                    const isActiveLesson = location.pathname === lessonUrl;
                                    return (
                                      <Link
                                        key={lesson._id ?? lIndex}
                                        to={lessonUrl}
                                        title={lesson.title}
                                        className={`flex items-center gap-1.5 pl-3 pr-2 py-1.5 text-xs truncate border-l-2 transition-all duration-150 ${
                                          isActiveLesson
                                            ? dark
                                              ? 'border-indigo-500 text-indigo-300 bg-indigo-950/50 font-medium'
                                              : 'border-indigo-500 text-indigo-700 bg-indigo-50 font-medium'
                                            : dark
                                              ? 'border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-500'
                                              : 'border-slate-300 text-slate-600 hover:text-slate-800 hover:border-slate-500'
                                        }`}
                                      >
                                        <svg className="w-2.5 h-2.5 flex-shrink-0" fill="currentColor" viewBox="0 0 8 8">
                                          <circle cx="4" cy="4" r="2"/>
                                        </svg>
                                        <span className="truncate">{lesson.title}</span>
                                      </Link>
                                    );
                                  })}
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </nav>

          {/* ③ User profile — pinned to the bottom */}
          <div className={`mt-auto p-3 border-t flex flex-col gap-2 flex-shrink-0 ${dark ? 'border-slate-800' : 'border-slate-200'}`}>
            <div className="flex items-center gap-2.5 min-w-0">
              {user?.picture ? (
                <img
                  src={user.picture}
                  alt="Profile"
                  className="w-8 h-8 rounded-full border-2 border-indigo-500/30 flex-shrink-0 object-cover"
                />
              ) : (
                <div className={`w-8 h-8 rounded-full border-2 border-indigo-500/30 flex items-center justify-center text-xs font-bold flex-shrink-0 ${dark ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-600'}`}>
                  {user?.email?.[0]?.toUpperCase() ?? 'U'}
                </div>
              )}
              <div className="flex flex-col min-w-0">
                <span className={`text-xs font-semibold truncate ${dark ? 'text-slate-200' : 'text-slate-800'}`}>
                  {user?.name || user?.email?.split('@')[0]}
                </span>
                <span className={`text-[10px] truncate ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
                  {user?.email}
                </span>
              </div>
            </div>
            <button
              onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
              className={`w-full py-1.5 text-xs rounded-md border transition-all duration-150 font-medium ${dark ? 'text-slate-400 border-slate-700 hover:bg-slate-800 hover:text-slate-200 hover:border-slate-600' : 'text-slate-600 border-slate-300 hover:bg-slate-100 hover:text-slate-900'}`}
            >
              Sign Out
            </button>
          </div>
        </aside>

        {/* ── Main Content (Outlet) ─────────────────────────────────────────── */}
        <main className={`flex-1 w-full overflow-y-auto min-w-0 ${dark ? 'bg-[#0f172a]' : 'bg-slate-50'}`}>
          <div className="h-full">
            <Outlet context={{ isDarkMode, setIsDarkMode, isSidebarOpen, setIsSidebarOpen, fetchUserCourses }} />
          </div>
        </main>
      </div>
    </div>
  );
}

export default MainLayout;
