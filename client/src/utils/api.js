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

// Generates a full course outline and persists it to the database.
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

// Generates rich content for an existing lesson and updates it in the database.
export const generateLessonContent = async (courseId, moduleId, lessonId, token) => {
  const response = await apiClient.post('/api/lesson/generate', {
    courseId,
    moduleId,
    lessonId,
  }, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

export default apiClient;
