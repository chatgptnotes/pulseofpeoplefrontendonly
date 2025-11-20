/**
 * OpenAI Service
 * Provides GPT-4 chat completion for conversation bot
 */

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatCompletionRequest {
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

class OpenAIService {
  private apiKey: string;
  private baseUrl: string = 'https://api.openai.com/v1';
  private model: string = 'gpt-4-turbo-preview'; // or gpt-3.5-turbo for faster/cheaper

  constructor() {
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY || '';
    if (!this.apiKey) {
      console.warn('[OpenAI] API key not configured');
    }
  }

  /**
   * Check if OpenAI is configured
   */
  isConfigured(): boolean {
    return !!this.apiKey && this.apiKey.length > 0;
  }

  /**
   * Get Tamil Nadu Pulse Assistant system prompt
   */
  getSystemPrompt(language: string = 'English'): string {
    const languageInstructions = {
      'Tamil': 'Respond primarily in Tamil (தமிழில்) when appropriate, but you can use English for technical terms.',
      'English': 'Respond in English, but be aware of Tamil context and can use Tamil phrases when culturally appropriate.',
      'Hindi': 'Respond in Hindi (हिंदी में), but understand Tamil Nadu context and use English for technical terms.',
    };

    const langInstruction = languageInstructions[language as keyof typeof languageInstructions] || languageInstructions.English;

    return `You are the Tamil Nadu Pulse Assistant, an AI-powered chatbot helping citizens of Tamil Nadu with:

**Your Role:**
- Provide information about government services and schemes
- Answer questions about Tamil Nadu politics and parties (TVK, DMK, ADMK, BJP, Congress, etc.)
- Help voters understand electoral processes and voting procedures
- Address citizen concerns and grievances
- Provide sentiment-aware, empathetic responses

**Key Context:**
- Tamil Nadu is a state in South India
- Major political parties: DMK (ruling), ADMK, TVK (Vijay's party), BJP, Congress
- Current issues: employment, water supply, education, healthcare, infrastructure
- Cultural context: Tamil language and culture are very important to citizens

**Response Guidelines:**
1. ${langInstruction}
2. Be respectful, empathetic, and non-partisan
3. If you don't know something, say so honestly
4. For urgent issues, direct users to appropriate government helplines
5. Keep responses concise but informative (2-4 sentences typically)
6. Use emojis sparingly and appropriately
7. If discussing politics, remain neutral and factual
8. Acknowledge user sentiment (positive, negative, concerned, etc.)

**Important:**
- You represent a citizen engagement platform, not a government authority
- Encourage democratic participation and civic engagement
- Respect all political viewpoints while providing factual information

Now respond to the citizen's message:`;
  }

  /**
   * Chat completion - get AI response for conversation
   */
  async getChatCompletion(
    messages: ChatMessage[],
    options: {
      temperature?: number;
      max_tokens?: number;
      language?: string;
    } = {}
  ): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      const systemPrompt = this.getSystemPrompt(options.language);

      // Prepare messages with system prompt
      const apiMessages: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
        ...messages
      ];

      console.log('[OpenAI] Sending chat completion request:', {
        model: this.model,
        message_count: apiMessages.length,
        temperature: options.temperature ?? 0.7
      });

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: apiMessages,
          temperature: options.temperature ?? 0.7,
          max_tokens: options.max_tokens ?? 500,
          top_p: 1,
          frequency_penalty: 0.3,
          presence_penalty: 0.3,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[OpenAI] API error:', errorData);

        if (response.status === 401) {
          throw new Error('Invalid API key');
        } else if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please try again in a moment.');
        } else if (response.status === 500) {
          throw new Error('OpenAI service temporarily unavailable');
        } else {
          throw new Error(`OpenAI API error: ${response.statusText}`);
        }
      }

      const data: ChatCompletionResponse = await response.json();

      if (!data.choices || data.choices.length === 0) {
        throw new Error('No response from AI');
      }

      const reply = data.choices[0].message.content.trim();

      console.log('[OpenAI] Response received:', {
        length: reply.length,
        tokens_used: data.usage?.total_tokens || 'unknown'
      });

      return reply;
    } catch (error) {
      console.error('[OpenAI] Chat completion error:', error);
      throw error;
    }
  }

  /**
   * Generate a contextual response based on conversation history
   */
  async generateResponse(
    userMessage: string,
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [],
    options: {
      language?: string;
      userSentiment?: string;
      userIntent?: string;
    } = {}
  ): Promise<string> {
    try {
      // Prepare messages with conversation history (last 10 messages for context)
      const recentHistory = conversationHistory.slice(-10);

      // Add context about user sentiment/intent if available
      let contextualMessage = userMessage;
      if (options.userSentiment || options.userIntent) {
        const contextParts = [];
        if (options.userSentiment) contextParts.push(`User sentiment: ${options.userSentiment}`);
        if (options.userIntent) contextParts.push(`User intent: ${options.userIntent}`);
        contextualMessage = `[${contextParts.join(', ')}]\n\n${userMessage}`;
      }

      const messages: ChatMessage[] = [
        ...recentHistory.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        })),
        { role: 'user', content: contextualMessage }
      ];

      return await this.getChatCompletion(messages, {
        language: options.language || 'English',
        temperature: 0.7,
        max_tokens: 500
      });
    } catch (error) {
      console.error('[OpenAI] Generate response error:', error);

      // Fallback response
      if (error instanceof Error) {
        if (error.message.includes('API key')) {
          return "I apologize, but I'm experiencing configuration issues. Please contact support.";
        } else if (error.message.includes('Rate limit')) {
          return "I'm receiving a high volume of messages right now. Please try again in a moment. 🙏";
        } else if (error.message.includes('unavailable')) {
          return "I'm temporarily unavailable. Please try again shortly.";
        }
      }

      return "I apologize, but I'm having trouble processing your message right now. Our team has been notified and will assist you shortly.";
    }
  }

  /**
   * Set model (gpt-4-turbo-preview or gpt-3.5-turbo)
   */
  setModel(model: 'gpt-4' | 'gpt-3.5-turbo') {
    if (model === 'gpt-4') {
      this.model = 'gpt-4-turbo-preview';
    } else {
      this.model = 'gpt-3.5-turbo';
    }
    console.log(`[OpenAI] Model set to: ${this.model}`);
  }
}

// Export singleton instance
export const openaiService = new OpenAIService();

// Export class for testing
export default OpenAIService;
