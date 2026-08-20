const express = require('express');
const router = express.Router();

const {
  generateAndSaveCourse,
  generateAndSaveLessonContent,
  getFullCourseForExport,
  batchEnrichCourse,
  getUserCourses,
} = require('../controllers/courseController');

const { getVideoId } = require('../controllers/videoController');
const { getLessonAudio } = require('../controllers/audioController');
const { checkJwt } = require('../middlewares/auth');

// POST /api/course/generate
// Generates a full AI course outline and persists all Course, Module, and Lesson documents.
router.post('/course/generate', checkJwt, generateAndSaveCourse);

// POST /api/lesson/generate
// Generates rich content for an existing Lesson document and marks it as enriched.
router.post('/lesson/generate', generateAndSaveLessonContent);

// GET /api/video/search?query=<search term>
// Returns the YouTube videoId for the top search result.
router.get('/video/search', getVideoId);

// POST /api/audio/generate
// Generates a Hinglish audio summary of a lesson and returns a raw audio buffer.
router.post('/audio/generate', getLessonAudio);

// GET /api/courses/:id/export
// Returns a fully populated course (modules + lessons with content) for PDF export.
router.get('/courses/:id/export', getFullCourseForExport);

// POST /api/courses/:id/publish
// Sequentially enriches all unenriched lessons in a course via the AI service.
router.post('/courses/:id/publish', batchEnrichCourse);

// GET /api/user/courses  [PROTECTED — requires valid Auth0 JWT]
// Returns the authenticated user's course history (title + modules + lessons)
// for sidebar history rendering. The user is identified via req.auth.payload.sub.
router.get('/user/courses', checkJwt, getUserCourses);

module.exports = router;
