import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

// Normal tek seferde cevap
export async function sendPrompt(prompt, imageData) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const parts = [];
    if (imageData) parts.push({ inlineData: imageData.inlineData });
    if (prompt) parts.push({ text: prompt });

    const contents = [{ role: "user", parts }];

    const result = await model.generateContent({ contents });
    return result.response.text();
  } catch (error) {
    console.error("Gemini API error:", error);
    return null;
  }
}

// STREAMING destekli fonksiyon
export async function sendPromptStream(prompt, imageData, onStream) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const parts = [];
    if (imageData && imageData.inlineData && imageData.inlineData.data) {
      parts.push({ inlineData: imageData.inlineData });
    }
    if (prompt) parts.push({ text: prompt });

    // Eğer parts tamamen boşsa, hata ver!
    if (parts.length === 0) throw new Error("No valid prompt or image data!");

    const contents = [{ role: "user", parts }];

    const stream = await model.generateContentStream({ contents });

    let fullText = "";
    for await (const chunk of stream.stream) {
      const text = chunk.text();
      if (text) {
        fullText += text;
        if (onStream) onStream(fullText);
      }
    }
    return fullText;
  } catch (error) {
    console.error("Gemini STREAM API error:", error);
    return "";
  }
}
