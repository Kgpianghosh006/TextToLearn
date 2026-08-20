'use strict';

const googleTTS = require('google-tts-api');

/**
 * Converts a text string to a raw audio buffer using Google Translate TTS.
 * Uses getAllAudioBase64() which automatically splits text exceeding the
 * 200-character API limit into multiple sequential requests, then
 * concatenates all returned base64 chunks into a single Buffer.
 *
 * @param {string} text - The text to synthesize (may exceed 200 characters).
 * @returns {Promise<Buffer>} A single concatenated audio buffer (MP3 bytes).
 */
async function generateAudioBuffer(text) {
  try {
    // getAllAudioBase64 handles long text by chunking it automatically
    const results = await googleTTS.getAllAudioBase64(text, {
      lang: 'hi',
      slow: false,
      host: 'https://translate.google.com',
    });

    // Convert each base64 chunk to a Buffer and merge into one
    const buffers = results.map(item => Buffer.from(item.base64, 'base64'));
    const audioBuffer = Buffer.concat(buffers);

    return audioBuffer;
  } catch (error) {
    console.error('[audioService] generateAudioBuffer failed:', error.message);
    throw new Error('Audio synthesis failed.');
  }
}

module.exports = { generateAudioBuffer };
