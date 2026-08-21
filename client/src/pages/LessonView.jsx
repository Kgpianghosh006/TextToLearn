import { useParams, useOutletContext } from 'react-router-dom';

// LessonView — Displays a specific lesson inside a course.
function LessonView() {
  const { courseId, moduleIndex, lessonIndex } = useParams();
  const { isDarkMode } = useOutletContext();

  const Param = ({ label, value }) => (
    <div className="flex items-center gap-2">
      <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>{label}:</span>
      <code className="font-mono bg-gray-800 text-blue-300 px-2 py-0.5 rounded text-xs">{value}</code>
    </div>
  );

  return (
    <div className={`flex flex-col items-center justify-center h-full min-h-[300px] gap-4 text-center px-8 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
      <span className="text-5xl">📖</span>
      <h1 className="text-2xl font-bold">Lesson View</h1>
      <div className="flex flex-col gap-2 mt-2">
        <Param label="courseId" value={courseId} />
        <Param label="moduleIndex" value={moduleIndex} />
        <Param label="lessonIndex" value={lessonIndex} />
      </div>
      <p className={`text-xs max-w-sm mt-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
        This route is ready. Lesson content fetching will be wired in a subsequent milestone.
      </p>
    </div>
  );
}

export default LessonView;