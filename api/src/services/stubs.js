/**
 * Stub interfaces for features NOT fully implemented.
 * Each stub documents how to integrate the real service.
 */

// ─── AR Try-On Stub ──────────────────────────────────────────────────────
class ARTryOnAdapter {
  /**
   * @param {string} userId
   * @param {string} outfitId
   * @returns {Promise<{available: boolean, previewUrl: string|null, message: string}>}
   */
  async startTryOn(userId, outfitId) {
    return {
      available: false,
      previewUrl: null,
      message: 'AR Try-On is coming soon. Integration point: implement ARTryOnAdapter with an AR SDK (e.g., 8thWall, AR.js).'
    };
  }
}

// ─── Voice Assistant Stub ────────────────────────────────────────────────
class VoiceAssistantAdapter {
  async processVoiceCommand(audioBuffer) {
    return {
      available: false,
      transcript: null,
      message: 'Voice assistant stub. Integrate with Google Speech-to-Text or Whisper API.'
    };
  }
}

// ─── Chatbot Stub ────────────────────────────────────────────────────────
class ChatbotAdapter {
  async chat(userId, message) {
    return {
      reply: 'Style chatbot coming soon! I\'ll help you pick outfits via conversation.',
      available: false,
      message: 'Chatbot stub. Integrate with Gemini/GPT conversational API.'
    };
  }
}

module.exports = {
  arTryOn: new ARTryOnAdapter(),
  voiceAssistant: new VoiceAssistantAdapter(),
  chatbot: new ChatbotAdapter()
};
