
import { GoogleGenAI } from "@google/genai";
import { HorseLot } from "../types";

/**
 * Consults Gemini about a specific horse lot using the provided question.
 * Uses the mandatory process.env.API_KEY for authentication.
 */
export const askGeminiAboutHorse = async (horse: HorseLot, question: string): Promise<string> => {
  // Initialize AI client with the required process.env.API_KEY
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const context = `
    Você é o Especialista Técnico do Horse Bid Market.
    Dados do Cavalo:
    Nome: ${horse.name} | Raça: ${horse.breed}
    Pai: ${horse.sire} | Mãe: ${horse.dam}
    Desempenho: ${horse.description}
    Responda em Português, de forma técnica e objetiva.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `${context}\n\nPergunta do Comprador: ${question}`,
    });
    // Direct property access to .text as per SDK guidelines
    return response.text || "Sem resposta técnica disponível.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Erro ao consultar a IA.";
  }
};
