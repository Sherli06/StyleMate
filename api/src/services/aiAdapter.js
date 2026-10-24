/**
 * AI Outfit Generation Adapter Interface
 * =========================================
 * Isolated behind this interface so you can plug in any AI service.
 *
 * HOW TO PLUG IN AN AI KEY:
 * 1. Set AI_PROVIDER=gemini (or openai) in api/.env
 * 2. Set GEMINI_API_KEY=your_key or OPENAI_API_KEY=your_key
 * 3. Implement generateOutfitSuggestion() in a GeminiAdapter or OpenAIAdapter class
 * 4. The system will auto-select based on AI_PROVIDER env var
 *
 * When no key is configured (default), the deterministic rule-based engine in
 * recommendationEngine.js is used instead.
 */

class AIAdapter {
  constructor(name) {
    this.name = name;
  }

  /**
   * Generate outfit suggestions using AI
   * @param {Object} context - { profile, preferences, wardrobe, occasion, weather }
   * @returns {Promise<{suggestions: Array, model: string}>}
   */
  async generateOutfitSuggestion(context) {
    throw new Error('AIAdapter.generateOutfitSuggestion() must be implemented.');
  }
}

class GeminiStubAdapter extends AIAdapter {
  constructor() {
    super('gemini-stub');
  }

  async generateOutfitSuggestion(context) {
    // This is a stub — would call Gemini API with context when key is present
    console.log('[AI Adapter] Gemini stub called. Set GEMINI_API_KEY to enable live AI.');
    return {
      suggestions: [],
      model: 'gemini-stub',
      message: 'AI adapter stub. Configure GEMINI_API_KEY in .env and implement call to Gemini API.'
    };
  }
}

class OpenAIStubAdapter extends AIAdapter {
  constructor() {
    super('openai-stub');
  }

  async generateOutfitSuggestion(context) {
    console.log('[AI Adapter] OpenAI stub called. Set OPENAI_API_KEY to enable live AI.');
    return {
      suggestions: [],
      model: 'openai-stub',
      message: 'AI adapter stub. Configure OPENAI_API_KEY in .env and implement call to OpenAI API.'
    };
  }
}

function getAIAdapter(provider) {
  switch (provider) {
    case 'gemini':
      return new GeminiStubAdapter();
    case 'openai':
      return new OpenAIStubAdapter();
    default:
      return null; // Falls back to rule-based engine
  }
}

module.exports = { AIAdapter, getAIAdapter, GeminiStubAdapter, OpenAIStubAdapter };
