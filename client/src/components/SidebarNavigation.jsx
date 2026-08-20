/**
 * SidebarNavigation — Enterprise dark-mode sidebar.
 *
 * Props:
 *   course          — Course document with populated modules/lessons
 *   onSelectLesson  — (lessonId, moduleId, courseId) => void
 *   isSidebarOpen   — boolean
 *   isDarkMode      — boolean
 *   onCollapse      — () => void
 */
function SidebarNavigation({ course, onSelectLesson, isSidebarOpen, isDarkMode, onCollapse }) {
  if (!course) return null;

  if (!isSidebarOpen) return null;

  return (
    <aside className={`flex flex-col w-72 flex-shrink-0 overflow-y-auto h-full transition-colors duration-300 ${isDarkMode ? 'bg-[#1f2937] border-r border-gray-700' : 'bg-white border-r border-gray-200'}`}>
      {/* Header */}
      <div className={`flex items-center justify-between px-4 py-3 flex-shrink-0 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <span className={`text-xs font-bold uppercase tracking-widest ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          Content
        </span>
        <button
          onClick={onCollapse}
          className={`p-1 rounded transition-colors ${isDarkMode ? 'text-gray-400 hover:text-white hover:bg-gray-600' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
          title="Collapse Sidebar"
          aria-label="Collapse Sidebar"
        >
          ◀
        </button>
      </div>

      {/* Course title */}
      <div className={`px-4 py-3 text-sm font-semibold border-b word-break-all ${isDarkMode ? 'text-gray-200 border-gray-700' : 'text-gray-800 border-gray-200'}`}>
        {course.title}
      </div>

      {/* Module/Lesson tree */}
      <nav className="flex-1 overflow-y-auto py-2">
        {course.modules && course.modules.length > 0 ? (
          course.modules
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((mod) => (
              <details key={mod._id} className="group">
                <summary className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold cursor-pointer list-none select-none transition-colors ${isDarkMode ? 'text-gray-300 hover:bg-gray-700/50' : 'text-gray-700 hover:bg-gray-100'}`}>
                  <span className="text-xs opacity-50 group-open:rotate-90 transition-transform inline-block">▶</span>
                  {mod.order}. {mod.title}
                </summary>
                <ul className="pb-1">
                  {mod.lessons && mod.lessons.length > 0 ? (
                    mod.lessons
                      .slice()
                      .sort((a, b) => a.order - b.order)
                      .map((lesson) => (
                        <li key={lesson._id}>
                          <button
                            className={`w-full text-left pl-8 pr-4 py-1.5 text-xs transition-colors ${isDarkMode ? 'text-gray-400 hover:bg-indigo-600/20 hover:text-indigo-300' : 'text-gray-600 hover:bg-indigo-50 hover:text-indigo-700'}`}
                            onClick={() => onSelectLesson(lesson._id, mod._id, course._id)}
                          >
                            {lesson.order}. {lesson.title}
                          </button>
                        </li>
                      ))
                  ) : (
                    <li className={`pl-8 py-1.5 text-xs italic ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      No lessons
                    </li>
                  )}
                </ul>
              </details>
            ))
        ) : (
          <p className={`px-4 py-3 text-sm italic ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            No modules available.
          </p>
        )}
      </nav>
    </aside>
  );
}

export default SidebarNavigation;
