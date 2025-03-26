import OpenAI from 'openai';
import { getLocalRecommendations } from './maintenanceRecommendations';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
  dangerouslyAllowBrowser: true
});

interface QuickFix {
  title: string;
  steps: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  tools_needed: string[];
}

async function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function retryWithBackoff<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  let retries = 0;
  while (true) {
    try {
      return await fn();
    } catch (error) {
      if (error instanceof Error && error.message.includes('429') && retries < maxRetries) {
        const waitTime = Math.pow(2, retries) * 1000; // Exponential backoff
        await wait(waitTime);
        retries++;
        continue;
      }
      throw error;
    }
  }
}

export async function analyzeMaintenanceIssue(title: string, description: string): Promise<QuickFix[]> {
  try {
    // If no API key is configured, use local recommendations
    if (!openai.apiKey) {
      console.log('OpenAI API key not configured, using local recommendations');
      return getLocalRecommendations(title, description);
    }

    const prompt = `Analyze this maintenance issue and suggest quick fixes:
Title: ${title}
Description: ${description}

Provide 2-3 potential solutions in the following JSON format:
{
  "quick_fixes": [{
    "title": "solution title",
    "steps": ["step 1", "step 2", ...],
    "difficulty": "easy|medium|hard",
    "tools_needed": ["tool1", "tool2", ...]
  }]
}`;

    const makeRequest = async () => {
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500,
        temperature: 0.7,
        n: 1
      });

      if (!response.choices[0]?.message?.content) {
        throw new Error('Invalid response format from OpenAI');
      }

      return response;
    };

    try {
      const response = await retryWithBackoff(makeRequest);
      const suggestions = JSON.parse(response.choices[0].message.content || '');
      return Array.isArray(suggestions.quick_fixes) ? suggestions.quick_fixes : [];
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      // Fallback to local recommendations if parsing fails
      return getLocalRecommendations(title, description);
    }
  } catch (error) {
    console.error('Error analyzing maintenance issue:', error);
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        console.log('OpenAI API key issue, using local recommendations');
      } else if (error.message.includes('429')) {
        console.log('Rate limit reached, using local recommendations');
      }
    }
    // Fallback to local recommendations for any error
    return getLocalRecommendations(title, description);
  }
}