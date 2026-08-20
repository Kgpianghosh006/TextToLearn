'use strict';

const googleTTS = require('google-tts-api');

// Converts a text string to a raw audio buffer using Google Translate TTS.
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
