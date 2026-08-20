import axios from 'axios';

// ---------------------------------------------------------------------------
// Axios client instance
// ---------------------------------------------------------------------------
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// ---------------------------------------------------------------------------
// API helper functions
// ---------------------------------------------------------------------------

/**
 * Generates a full course outline and persists it to the database.
 * @param {string} topic - The subject or topic for the course.
 * @param {string} creatorId - Identifier for the course creator.
 * @returns {Promise<object>} The saved Course document (with populated modules).
 */
export const generateCourse = async (topic, token) => {
  const response = await apiClient.post('/api/course/generate', {
    topic,
  }, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

/**
 * Generates rich content for an existing lesson and updates it in the database.
 * @param {string} courseId - The MongoDB ObjectId of the course.
 * @param {string} moduleId - The MongoDB ObjectId of the module.
 * @param {string} lessonId - The MongoDB ObjectId of the lesson.
 * @returns {Promise<object>} The updated Lesson document.
 */
export const generateLessonContent = async (courseId, moduleId, lessonId) => {
  const response = await apiClient.post('/api/lesson/generate', {
    courseId,
    moduleId,
    lessonId,
  });
  return response.data;
};

export default apiClient;
