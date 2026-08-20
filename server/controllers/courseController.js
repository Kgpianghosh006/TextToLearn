const mongoose = require('mongoose');
const Course = require('../models/Course');
const Module = require('../models/Module');
const Lesson = require('../models/Lesson');
const { generateCourseOutline, generateLessonContent } = require('../services/aiService');

/** Pause helper — used to throttle sequential Gemini API calls. */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * POST /api/course/generate
 * Generates a full course outline via AI and persists all documents to MongoDB.
 * Body: { topic: string, creatorId: string }
 */
const generateAndSaveCourse = async (req, res) => {
  try {
    const { topic, creatorId } = req.body;

    // Prefer the verified JWT subject (set by checkJwt middleware) so the creator
    // is always the authenticated Auth0 user. Fall back to body.creatorId for
    // legacy / unauthenticated dev-mode calls.
    const resolvedCreatorId = req.auth?.payload?.sub || creatorId;
    console.log('[generateAndSaveCourse] Resolved creator ID:', resolvedCreatorId);

    if (!topic || !resolvedCreatorId) {
      return res.status(400).json({ message: 'topic and creatorId are required.' });
    }

    // 1. Generate the course outline from the AI service
    const outline = await generateCourseOutline(topic);

    // 2. Create the Course document (modules will be linked after they are created)
    const course = new Course({
      title: outline.title,
      description: outline.description,
      creator: resolvedCreatorId, // Auth0 sub from JWT, or fallback body value
      tags: outline.tags || [],
      modules: [],
    });
    await course.save();

    // 3. Iterate through AI-returned modules and create Module + Lesson documents
    const moduleIds = [];

    for (const moduleData of outline.modules) {
      // 3a. Create all Lesson documents for this module first (need module._id)
      //     We create a temporary module ID upfront using a new ObjectId so lessons
      //     can be linked before the module document is saved.
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

      // 3b. Create the Module document using the pre-assigned tempModuleId
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

    // 4. Update the Course document with the collected Module ObjectIds
    course.modules = moduleIds;
    await course.save();

    // 5. Return the saved course deeply populated: modules + their lessons
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

/**
 * POST /api/lesson/generate
 * Fetches an existing Lesson, generates rich content via AI, and updates the document.
 * Body: { courseId: string, moduleId: string, lessonId: string }
 */
const generateAndSaveLessonContent = async (req, res) => {
  try {
    const { courseId, moduleId, lessonId } = req.body;

    if (!courseId || !moduleId || !lessonId) {
      return res.status(400).json({ message: 'courseId, moduleId, and lessonId are required.' });
    }

    // 1. Fetch all three documents to retrieve their titles
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

    // 2. Generate lesson content via the AI service
    const generated = await generateLessonContent(course.title, module.title, lesson.title);

    // 3. Update the Lesson document with generated content
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

/**
 * GET /api/courses/:id/export
 * Returns a fully populated Course document — modules with their lessons
 * fully embedded (including content, objectives, etc.) — for PDF export.
 * Path param: id — Course ObjectId
 */
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

/**
 * POST /api/courses/:id/publish
 * Sequentially enriches every unenriched lesson in the course by calling the AI
 * service lesson-by-lesson to avoid Gemini API rate-limit errors.
 * Path param: id — Course ObjectId
 */
const batchEnrichCourse = async (req, res) => {
  try {
    // 1. Fully populate the course: modules → lessons
    const course = await Course.findById(req.params.id).populate({
      path: 'modules',
      populate: { path: 'lessons' },
    });

    if (!course) {
      return res.status(404).json({ message: 'Course not found.' });
    }

    let enrichedCount = 0;
    let skippedCount = 0;

    // 2. Iterate sequentially — for...of prevents parallel Gemini API hammering
    for (const module of course.modules) {
      for (const lesson of module.lessons) {
        // Skip already-enriched lessons to avoid redundant AI calls
        if (lesson.isEnriched && lesson.content && lesson.content.length > 0) {
          skippedCount++;
          continue;
        }

        console.log(`[batchEnrich] Enriching lesson: "${lesson.title}" (module: "${module.title}")`);

        try {
          // 3a. Generate content — wrapped in its own try/catch so one failure
          //     doesn't abort the entire batch.
          const generated = await generateLessonContent(course.title, module.title, lesson.title);

          // 3b. Persist the enriched lesson back to MongoDB
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

          // 3c. Throttle — 4-second pause after each successful call to stay within
          //     Gemini's Requests Per Minute limit.
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

/**
 * GET /api/user/courses  (protected — requires checkJwt middleware on the route)
 *
 * Returns a list of courses created by the authenticated user, with their
 * modules and lessons populated for sidebar history rendering.
 *
 * The authenticated user's Auth0 sub is read from `req.auth.payload.sub`,
 * which is set by the `express-oauth2-jwt-bearer` `auth()` middleware.
 */
const getUserCourses = async (req, res) => {
  try {
    const creatorId = req.auth?.payload?.sub;
    if (!creatorId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Fetch the user's courses, populating modules and their lessons so the
    // sidebar history tree can render the full nested module → lesson structure.
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

module.exports = {
  generateAndSaveCourse,
  generateAndSaveLessonContent,
  getFullCourseForExport,
  batchEnrichCourse,
  getUserCourses,
};

