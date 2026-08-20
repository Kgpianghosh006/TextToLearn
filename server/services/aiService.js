const { GoogleGenAI } = require('@google/genai');
const { z } = require('zod');

// ---------------------------------------------------------------------------
// Zod Schema Definitions
// ---------------------------------------------------------------------------

const courseOutlineSchema = z.object({
  title: z.string(),
  description: z.string(),
  tags: z.array(z.string()),
  modules: z.array(
    z.object({
      title: z.string(),
      order: z.number(),
      lessons: z.array(
        z.object({
          title: z.string(),
          order: z.number(),
        })
      ),
    })
  ),
});

const lessonContentSchema = z.object({
  title: z.string(),
  objectives: z.array(z.string()),
  content: z.array(
    z.object({
      type: z.string(),           // "heading" | "paragraph" | "code" | "video" | "mcq"
      // heading / paragraph
      text: z.string().optional(),
      // heading only
      level: z.number().optional(),
      // code only
      language: z.string().optional(),
      code: z.string().optional(),
      // video only
      query: z.string().optional(),
      // mcq only
      question: z.string().optional(),
      options: z.array(z.string()).optional(),
      answer: z.string().optional(),
    })
  ),
});

// ---------------------------------------------------------------------------
// Service Functions
// ---------------------------------------------------------------------------

// Generates a structured course outline for a given topic using Gemini AI.
async function generateCourseOutline(topic) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: `Generate a comprehensive and detailed course outline for the following topic: "${topic}". Populate all fields thoroughly.`,
      config: {
        systemInstruction:
          'You are an expert curriculum designer. Your sole output must be a single, valid JSON object. ' +
          'Do not include any markdown formatting, code fences, backticks, or explanatory text. ' +
          'Return only the raw JSON object that strictly conforms to the provided schema.',
        responseMimeType: 'application/json',
        responseSchema: z.toJSONSchema(courseOutlineSchema),
      },
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error('[aiService] generateCourseOutline failed:', error.message);
    throw new Error('AI course outline generation failed.');
  }
}

// Generates rich, structured lesson content using Gemini AI.
async function generateLessonContent(courseTitle, moduleTitle, lessonTitle) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash-lite',
      contents:
        `Generate rich, detailed educational lesson content for the following:\n` +
        `Course: "${courseTitle}"\n` +
        `Module: "${moduleTitle}"\n` +
        `Lesson: "${lessonTitle}"\n\n` +
        `Use a variety of content block types (heading, paragraph, code, video, mcq) where appropriate. ` +
        `Populate only the fields relevant to each block's type value.`,
      config: {
        systemInstruction:
          'You are an expert educator and instructional designer. Your sole output must be a single, valid JSON object. ' +
          'Do not include any markdown formatting, code fences, backticks, or explanatory text. ' +
          'Each content block must have a "type" field. ' +
          'For "heading": populate "text" and "level" (1-3). ' +
          'For "paragraph": populate "text" only. ' +
          'For "code": populate "language" and "code" only. ' +
          'For "video": populate "query" only (a YouTube search query). ' +
          'For "mcq": populate "question", "options" (array of 4 strings), and "answer". ' +
          'Do not populate fields that do not belong to the block type. ' +
          'Return only the raw JSON object that strictly conforms to the provided schema.',
        responseMimeType: 'application/json',
        responseSchema: z.toJSONSchema(lessonContentSchema),
      },
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error('[aiService] generateLessonContent failed:', error.message);
    throw new Error('AI lesson content generation failed.');
  }
}


// Generates a short, conversational Hinglish audio script from lesson text.
async function generateHinglishScript(lessonText) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents:
        `Here is the full text of an educational lesson:\n\n"""\n${lessonText}\n"""\n\n` +
        `Summarize this lesson into a short, highly engaging audio script of exactly 3 to 4 sentences. ` +
        `The script will be read aloud by a text-to-speech engine, so write naturally and conversationally.`,
      config: {
        systemInstruction:
          'You are a highly engaging Indian EdTech content creator writing scripts for a short audio lesson summary. ' +
          'Write ONLY in Hinglish: Hindi language written using the English alphabet, freely mixed with English technical terms. ' +
          'Do NOT write in Devanagari (Hindi script). Use only the Roman/English alphabet throughout. ' +
          'Start with an energetic greeting like "Hello dosto!" or "Namaste students!". ' +
          'Example style: "Hello dosto! Aaj hum seekhenge Linear Regression ke baare mein. ' +
          'Yeh ek fundamental Machine Learning concept hai jo numbers ke beech relationship dhundta hai. ' +
          'Is lesson ke baad aap confidently regression problems solve kar paoge!" ' +
          'Output ONLY the script text — no JSON, no markdown, no labels, no quotes.',
      },
    });

    return response.text.trim();
  } catch (error) {
    console.error('[aiService] generateHinglishScript failed:', error.message);
    throw new Error('AI Hinglish script generation failed.');
  }
}

module.exports = { generateCourseOutline, generateLessonContent, generateHinglishScript };
