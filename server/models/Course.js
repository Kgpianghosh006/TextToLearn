const mongoose = require('mongoose');
const { Schema } = mongoose;

const CourseSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    creator: {
      type: String,
      required: true,
      index: true,
    },
    tags: [String],
    modules: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Module',
      },
    ],
  },
  { timestamps: true }
);

// Cascade delete: when a Course is deleted via findOneAndDelete,
// remove all associated Modules and their Lessons.
CourseSchema.pre('findOneAndDelete', async function (next) {
  try {
    const course = await this.model.findOne(this.getQuery());
    if (course) {
      // Lazy requires to avoid circular dependency issues at module load time
      const Module = require('./Module');
      const Lesson = require('./Lesson');

      // Delete all lessons that belong to any module of this course
      await Lesson.deleteMany({ module: { $in: course.modules } });

      // Delete all modules that belong to this course
      await Module.deleteMany({ course: course._id });
    }
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('Course', CourseSchema);
