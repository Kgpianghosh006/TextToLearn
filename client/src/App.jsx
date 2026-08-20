import { Routes, Route } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import HomeView from './pages/HomeView';
import CourseView from './pages/CourseView';
import './App.css';

/**
 * App — Route tree root.
 *
 * All application state and UI logic lives in the page views (HomeView, etc.).
 * MainLayout provides the persistent topbar (Auth0) and sidebar shell via <Outlet />.
 *
 * Route structure:
 *   /                                                        → HomeView (landing + course workspace)
 *   /courses/:courseId                                       → CourseView
 *   /courses/:courseId/module/:moduleIndex/lesson/:lessonIndex → LessonView
 */
function App() {
  return (
    <Routes>
      {/* Persistent layout shell — renders Topbar + Sidebar + <Outlet /> */}
      <Route element={<MainLayout />}>
        {/* Default welcome / course-creation page */}
        <Route index element={<HomeView />} />

        {/* Course overview page */}
        <Route path="courses/:courseId" element={<CourseView />} />

        {/* Specific lesson page */}
        <Route
          path="courses/:courseId/module/:moduleIndex/lesson/:lessonIndex"
          element={<CourseView />}
        />
      </Route>
    </Routes>
  );
}

export default App;
