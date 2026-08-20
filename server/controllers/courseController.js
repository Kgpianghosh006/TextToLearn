const mongoose = require('mongoose');
const Course = require('../models/Course');
const Module = require('../models/Module');
const Lesson = require('../models/Lesson');
const { generateCourseOutline, generateLessonContent } = require('../services/aiService');

// Pause helper — used to throttle sequential Gemini API calls.
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// POST /api/course/generate
const generateAndSaveCourse = async (req, res) => {
  try {
    const { topic, creatorId } = req.body;

    // Resolve creator ID
    const resolvedCreatorId = req.auth?.payload?.sub || creatorId;
    console.log('[generateAndSaveCourse] Resolved creator ID:', resolvedCreatorId);

    if (!topic || !resolvedCreatorId) {
      return res.status(400).json({ message: 'topic and creatorId are required.' });
    }

    // Deduplication check
    const existingCourse = await Course.findOne({
      creator: resolvedCreatorId,
      title: { $regex: new RegExp(`^${topic.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
    }).populate({ path: 'modules', populate: { path: 'lessons' } });

    if (existingCourse) {
      console.log('[generateAndSaveCourse] Duplicate detected — returning cached course:', existingCourse._id);
      return res.status(200).json(existingCourse);
    }
    const outline = await generateCourseOutline(topic);
    const course = new Course({
      title: outline.title,
      description: outline.description,
      creator: resolvedCreatorId, // Auth0 sub from JWT, or fallback body value
      tags: outline.tags || [],
      modules: [],
    });
    await course.save();
    const moduleIds = [];

    for (const moduleData of outline.modules) {

      const tempModuleId = new mongoose.Types.ObjectId();
      const lessonIds = [];

      for (const lessonData of moduleData.lessons) {
        const lesson = new Lesson({
          title: lessonData.title,
          module: tempModuleId,
          order: lessonData.order,
          objectives: [],
          isEnriched: false,
          content: [],
          audioUrl: null,
        });
        await lesson.save();
        lessonIds.push(lesson._id);
      }
      const module = new Module({
        _id: tempModuleId,
        title: moduleData.title,
        course: course._id,
        lessons: lessonIds,
        order: moduleData.order,
      });
      await module.save();
      moduleIds.push(module._id);
    }
    course.modules = moduleIds;
    await course.save();
    const savedCourse = await Course.findById(course._id).populate({
      path: 'modules',
      populate: { path: 'lessons' },
    });

    return res.status(201).json(savedCourse);
  } catch (error) {
    console.error('[courseController] generateAndSaveCourse failed:', error.message);
    return res.status(500).json({ message: error.message });
  }
};

// POST /api/lesson/generate
const generateAndSaveLessonContent = async (req, res) => {
  try {
    const { courseId, moduleId, lessonId } = req.body;

    if (!courseId || !moduleId || !lessonId) {
      return res.status(400).json({ message: 'courseId, moduleId, and lessonId are required.' });
    }
    const [course, module, lesson] = await Promise.all([
      Course.findById(courseId),
      Module.findById(moduleId),
      Lesson.findById(lessonId),
    ]);

    if (!course) return res.status(404).json({ message: 'Course not found.' });
    if (!module) return res.status(404).json({ message: 'Module not found.' });
    if (!lesson) return res.status(404).json({ message: 'Lesson not found.' });

    // Short-circuit: if content has already been generated, serve the cached
    // data directly and skip the Gemini API call entirely.
    if (lesson.isEnriched === true) {
      return res.status(200).json(lesson);
    }
    const generated = await generateLessonContent(course.title, module.title, lesson.title);
    const updatedLesson = await Lesson.findByIdAndUpdate(
      lessonId,
      {
        objectives: generated.objectives || [],
        content: generated.content || [],
        isEnriched: true,
      },
      { new: true }
    );

    return res.status(200).json(updatedLesson);
  } catch (error) {
    console.error('[courseController] generateAndSaveLessonContent failed:', error.message);
    return res.status(500).json({ message: error.message });
  }
};

// GET /api/courses/:id/export
const getFullCourseForExport = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate({
      path: 'modules',
      populate: { path: 'lessons' },
    });

    if (!course) {
      return res.status(404).json({ message: 'Course not found.' });
    }

    return res.json(course);
  } catch (error) {
    console.error('[courseController] getFullCourseForExport failed:', error.message);
    return res.status(500).json({ message: error.message });
  }
};

// POST /api/courses/:id/publish
const batchEnrichCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate({
      path: 'modules',
      populate: { path: 'lessons' },
    });

    if (!course) {
      return res.status(404).json({ message: 'Course not found.' });
    }

    let enrichedCount = 0;
    let skippedCount = 0;
    for (const module of course.modules) {
      for (const lesson of module.lessons) {
        // Skip already-enriched lessons to avoid redundant AI calls
        if (lesson.isEnriched && lesson.content && lesson.content.length > 0) {
          skippedCount++;
          continue;
        }

        console.log(`[batchEnrich] Enriching lesson: "${lesson.title}" (module: "${module.title}")`);

        try {
          const generated = await generateLessonContent(course.title, module.title, lesson.title);
          await Lesson.findByIdAndUpdate(
            lesson._id,
            {
              objectives: generated.objectives || [],
              content: generated.content || [],
              isEnriched: true,
            },
            { new: true }
          );

          enrichedCount++;
          await sleep(4000);
        } catch (lessonErr) {
          // Log and skip — do NOT re-throw; the loop continues to the next lesson.
          console.warn(`[batchEnrich] Skipping lesson due to AI failure: "${lesson.title}" — ${lessonErr.message}`);
          skippedCount++;
        }
      }
    }

    console.log(`[batchEnrich] Done. Enriched: ${enrichedCount}, Skipped: ${skippedCount}.`);
    return res.status(200).json({
      message: 'Course fully published',
      enrichedCount,
      skippedCount,
    });
  } catch (error) {
    console.error('[courseController] batchEnrichCourse failed:', error.message);
    return res.status(500).json({ message: error.message });
  }
};

// GET /api/user/courses  (protected — requires checkJwt middleware on the route)
const getUserCourses = async (req, res) => {
  try {
    const creatorId = req.auth?.payload?.sub;
    if (!creatorId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Fetch user courses
    console.log('[getUserCourses] Querying courses for creator ID:', creatorId);
    const courses = await Course.find({ creator: creatorId })
      .populate({
        path: 'modules',
        populate: { path: 'lessons', select: 'title order _id' },
        select: 'title order _id lessons',
      })
      .select('title modules createdAt')
      .sort({ createdAt: -1 });

    return res.json(courses);
  } catch (error) {
    console.error('[courseController] getUserCourses failed:', error.message);
    return res.status(500).json({ error: 'Failed to fetch user history' });
  }
};

// DELETE /api/course/:id  (protected — requires checkJwt)
const deleteCourse = async (req, res) => {
  console.log('[deleteCourse] 1. Function STARTED');
  try {
    const creatorId = req.auth?.payload?.sub;
    console.log('[deleteCourse] 2. Auth ID:', creatorId);

    const course = await Course.findById(req.params.id);
    console.log('[deleteCourse] 3. Course found in DB');

    if (!course) return res.status(404).json({ message: 'Course not found.' });
    if (course.creator !== creatorId) return res.status(403).json({ message: 'Forbidden.' });

    // Modules and Lessons are cascade-deleted by the pre('findOneAndDelete')
    // hook on the Course model — do not duplicate that logic here.
    await Course.findByIdAndDelete(req.params.id);
    console.log('[deleteCourse] 4. Course and cascaded children deleted');

    return res.status(200).json({ message: 'Course deleted successfully.' });
  } catch (error) {
    console.error('[courseController] deleteCourse CRASHED AT:', error);
    return res.status(500).json({ message: 'Internal server error while deleting course.' });
  }
};

module.exports = {
  generateAndSaveCourse,
  generateAndSaveLessonContent,
  getFullCourseForExport,
  batchEnrichCourse,
  getUserCourses,
  deleteCourse,
};