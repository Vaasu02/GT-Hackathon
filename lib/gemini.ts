import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function generateCreativePrompts(productCategory: string, count: number = 3): Promise<string[]> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `
    You are a creative director. Generate ${count} distinct, high-converting advertising setting descriptions for a "${productCategory}".
    
    The descriptions should be visual and suitable for an AI image generator.
    Focus on lighting, background texture, and mood.
    Do NOT describe the product itself, only the environment around it.
    
    Return ONLY a JSON array of strings. Example:
    ["on a marble podium with golden sunlight", "floating in a splash of water", "cyberpunk city street at night"]
  `;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();

  try {
    // Clean up markdown code blocks if present
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanText);
  } catch (e) {
    console.error('Failed to parse Gemini response:', text);
    return [];
  }
}

export async function generateCaption(productName: string, settingDescription: string): Promise<string> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompt = `
    Write a short, catchy, professional ad caption for a product named "${productName}".
    The visual setting is: "${settingDescription}".
    Keep it under 15 words. No hashtags.
  `;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text().trim();
}
