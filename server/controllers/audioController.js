'use strict';

const Lesson = require('../models/Lesson');
const { generateHinglishScript } = require('../services/aiService');
const { generateAudioBuffer } = require('../services/audioService');

// Extracts all readable plain-text from a lesson's structured content array.
function extractLessonText(lesson) {
  const parts = [];

  // Title and objectives
  parts.push(lesson.title);
  if (lesson.objectives && lesson.objectives.length > 0) {
    parts.push('Learning objectives: ' + lesson.objectives.join('. '));
  }

  // Content blocks
  for (const block of lesson.content || []) {
    switch (block.type) {
      case 'heading':
      case 'paragraph':
        if (block.text) parts.push(block.text);
        break;
      case 'code':
        if (block.code) {
          const lang = block.language ? `${block.language} code: ` : 'Code: ';
          parts.push(lang + block.code);
        }
        break;
      case 'video':
        if (block.query) parts.push(`Recommended video topic: ${block.query}`);
        break;
      case 'mcq':
        if (block.question) {
          const optionsText = (block.options || []).join(', ');
          parts.push(
            `Question: ${block.question}. Options: ${optionsText}. Answer: ${block.answer || ''}`
          );
        }
        break;
      default:
        break;
    }
  }

  return parts.join('\n\n');
}

// POST /api/audio/generate
const getLessonAudio = async (req, res) => {
  try {
    const { lessonId } = req.body;

    if (!lessonId) {
      return res.status(400).json({ message: 'lessonId is required.' });
    }

    // 1. Fetch lesson from the database
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found.' });
    }

    // 2. Extract all readable text from the lesson document
    const lessonText = extractLessonText(lesson);

    // 3. Generate a short Hinglish audio script via Gemini
    const script = await generateHinglishScript(lessonText);

    // 4. Synthesize the script to an audio buffer via Google TTS
    const audioBuffer = await generateAudioBuffer(script);

    // 5. Return the raw binary buffer as an audio file
    res.set({
      'Content-Type': 'audio/wav',
      'Content-Disposition': 'attachment; filename="lesson.wav"',
      'Content-Length': audioBuffer.length,
    });
    return res.send(audioBuffer);
  } catch (error) {
    console.error('[audioController] getLessonAudio failed:', error.message);
    return res.status(500).json({ message: error.message });
  }
};

module.exports = { getLessonAudio };
