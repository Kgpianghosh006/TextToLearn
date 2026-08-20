const mongoose = require('mongoose');
const { Schema } = mongoose;

const LessonSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    module: {
      type: Schema.Types.ObjectId,
      ref: 'Module',
      required: true,
      index: true,
    },
    order: {
      type: Number,
      required: true,
    },
    objectives: [String],
    isEnriched: {
      type: Boolean,
      default: false,
    },
    content: {
      type: [Schema.Types.Mixed],
      required: true,
      default: [],
    },
    audioUrl: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Lesson', LessonSchema);
