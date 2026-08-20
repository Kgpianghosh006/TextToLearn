const express = require('express');
const router = express.Router();

const {
  generateAndSaveCourse,
  generateAndSaveLessonContent,
  getFullCourseForExport,
  batchEnrichCourse,
  getUserCourses,
  deleteCourse,
} = require('../controllers/courseController');

const { getVideoId } = require('../controllers/videoController');
const { getLessonAudio } = require('../controllers/audioController');
const { checkJwt } = require('../middlewares/auth');

// POST /api/course/generate
router.post('/course/generate', checkJwt, generateAndSaveCourse);

// POST /api/lesson/generate
router.post('/lesson/generate', generateAndSaveLessonContent);

// GET /api/video/search?query=<search term>
router.get('/video/search', getVideoId);

// POST /api/audio/generate
router.post('/audio/generate', getLessonAudio);

// GET /api/courses/:id/export
router.get('/courses/:id/export', getFullCourseForExport);

// POST /api/courses/:id/publish
router.post('/courses/:id/publish', batchEnrichCourse);

// GET /api/user/courses
router.get('/user/courses', checkJwt, getUserCourses);

// DELETE /api/course/:id
router.delete('/course/:id', checkJwt, deleteCourse);

module.exports = router;
