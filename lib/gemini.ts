import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

const SYSTEM_INSTRUCTION = `You are an automotive edge AI diagnostic system deployed on-vehicle. You analyze real-time sensor telemetry, anomaly detection results, and component health data to provide actionable diagnostics.

When given anomaly or sensor data, you MUST:
1. Identify the most likely root cause based on the sensor readings and fault patterns
2. Assess urgency using one of: DRIVE SAFELY / MONITOR CLOSELY / STOP IMMEDIATELY
3. Recommend specific, actionable next steps (not generic advice)
4. Flag cascading risks to other vehicle components

Format your responses clearly with sections. Be concise, technical, and actionable. Use automotive engineering terminology. Never invent sensor data - only reference what is provided to you.`;

const MAINTENANCE_SYSTEM_INSTRUCTION = `You are an automotive predictive maintenance planner. Given component Remaining Useful Life (RUL) data and vehicle health metrics, create a prioritized maintenance schedule.

You MUST format your primary response as a structured Markdown table with the following columns:
| Component | RUL (Days) | Urgency | Recommended Action | Est. Cost (USD) | Delay Risk |

Sort the table rows by Urgency (IMMEDIATE first, then SOON, SCHEDULED, ROUTINE).
Be specific about service actions - not generic. Below the table, provide a brief 1-2 sentence summary and the estimated total cost.`;

// Initialize the Google Generative AI client
function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not set');
  }
  return new GoogleGenerativeAI(apiKey);
}

function getModel(systemInstruction: string) {
  const client = getClient();
  return client.getGenerativeModel({
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    systemInstruction,
    safetySettings: [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    ],
    generationConfig: {
      temperature: 0.7,
      topP: 0.9,
      topK: 40,
      maxOutputTokens: 2048,
    },
  });
}

// Exponential backoff retry wrapper
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt) * 1000 + Math.random() * 500;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
}

// Stream diagnostic response from Gemini
export async function* streamDiagnosis(
  message: string,
  context: object,
  chatHistory: Array<{ role: string; content: string }> = []
): AsyncGenerator<string> {
  const model = getModel(SYSTEM_INSTRUCTION);

  // Build the context-enriched prompt
  const contextStr = JSON.stringify(context, null, 2);
  const fullPrompt = chatHistory.length > 0
    ? `Current vehicle sensor context:\n\`\`\`json\n${contextStr}\n\`\`\`\n\nUser message: ${message}`
    : `ANOMALY DETECTED - Full vehicle sensor context:\n\`\`\`json\n${contextStr}\n\`\`\`\n\nAnalyze this anomaly and provide your diagnostic assessment. ${message}`;

  // Convert chat history to Gemini format
  const history = chatHistory.map(msg => ({
    role: msg.role === 'user' ? 'user' as const : 'model' as const,
    parts: [{ text: msg.content }],
  }));

  const chat = model.startChat({ history });

  const result = await withRetry(() => chat.sendMessageStream(fullPrompt));

  for await (const chunk of result.stream) {
    const text = chunk.text();
    if (text) {
      yield text;
    }
  }
}

// Stream maintenance plan from Gemini
export async function* streamMaintenancePlan(
  rulData: Array<{ name: string; daysLeft: number; totalDays: number; urgency: string; confidence: number }>,
  healthScore: number
): AsyncGenerator<string> {
  const model = getModel(MAINTENANCE_SYSTEM_INSTRUCTION);

  const prompt = `Generate a comprehensive predictive maintenance plan based on this vehicle data:

Vehicle Health Score: ${healthScore}/100

Component RUL (Remaining Useful Life):
${rulData.map(c => `- ${c.name}: ${c.daysLeft} days remaining (of ${c.totalDays} total) - Urgency: ${c.urgency.toUpperCase()} - Prediction Confidence: ${c.confidence}%`).join('\n')}

Create a prioritized maintenance schedule. You MUST output a structured Markdown table as instructed.`;

  const result = await withRetry(() => model.generateContentStream(prompt));

  for await (const chunk of result.stream) {
    const text = chunk.text();
    if (text) {
      yield text;
    }
  }
}
