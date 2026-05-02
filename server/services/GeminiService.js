/**
 * GeminiService.js — Gemini 2.0 Flash integration
 * Primary LLM for SkillForge AI Finals
 * All methods return null on failure — callers fall back to rule-based logic
 */

class GeminiService {
  constructor() {
    // DO NOT cache apiKey here — ES modules are imported before loadEnv() runs
    // Always read from process.env at call-time via the getter below
    this.model = 'gemini-2.0-flash';
    this.maxRetries = 3;
    this.callCount = 0;
  }

  // Read key fresh every time — never stale
  get apiKey() {
    return process.env.GEMINI_API_KEY || '';
  }

  get endpoint() {
    const model = process.env.GEMINI_MODEL || this.model;
    return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  }

  isEnabled() {
    return !!(this.apiKey && this.apiKey.length > 10);
  }

  /**
   * Generate structured JSON output from Gemini
   * @param {string} prompt
   * @param {string} system - optional system instruction
   * @returns {Promise<object|null>}
   */
  async generateJSON(prompt, system = '') {
    if (!this.isEnabled()) return null;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const body = {
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
            responseMimeType: 'application/json'
          }
        };

        if (system) {
          body.systemInstruction = { parts: [{ text: system }] };
        }

        const res = await fetch(`${this.endpoint}?key=${this.apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(30000)
        });

        if (!res.ok) {
          const err = await res.text();
          throw new Error(`HTTP ${res.status}: ${err.slice(0, 200)}`);
        }

        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) throw new Error('Empty response from Gemini');

        // Strip markdown code fences if present
        const clean = text
          .replace(/^```json\s*/i, '')
          .replace(/^```\s*/i, '')
          .replace(/```\s*$/i, '')
          .trim();

        const parsed = JSON.parse(clean);
        this.callCount++;
        console.log(`[Gemini] ✅ Success (attempt ${attempt + 1}) — call #${this.callCount}`);
        return parsed;

      } catch (err) {
        console.error(`[Gemini] ❌ Attempt ${attempt + 1}/${this.maxRetries} failed: ${err.message}`);
        if (attempt < this.maxRetries - 1) {
          await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
        }
      }
    }

    console.warn('[Gemini] All retries failed — using rule-based fallback');
    return null;
  }

  /**
   * Generate plain text from Gemini
   */
  async generateText(prompt, system = '') {
    if (!this.isEnabled()) return null;

    try {
      const body = {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.8, maxOutputTokens: 1024 }
      };
      if (system) body.systemInstruction = { parts: [{ text: system }] };

      const res = await fetch(`${this.endpoint}?key=${this.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(20000)
      });

      if (!res.ok) return null;
      const data = await res.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
    } catch {
      return null;
    }
  }

  getStats() {
    return { callCount: this.callCount, enabled: this.isEnabled(), model: this.model };
  }
}

// Singleton
export default new GeminiService();
