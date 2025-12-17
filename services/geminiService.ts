
import { GoogleGenAI } from "@google/genai";
import { HorseLot } from "../types";

const getClient = () => {
    if (!process.env.API_KEY) {
        console.warn("Gemini API Key missing");
        return null;
    }
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const askGeminiAboutHorse = async (horse: HorseLot, question: string): Promise<string> => {
  const ai = getClient();
  if (!ai) return "A chave de API do Gemini não foi configurada.";

  const context = `
    ATUE COMO: Auditor Técnico do Horse Bid Market.
    OBJETIVO: Responder tecnicamente sobre o cavalo ${horse.name}.
    REGRAS: 
    1. Respostas curtas e secas. 
    2. Apenas fatos genealógicos. 
    3. Use Markdown.
    
    DADOS:
    Nome: ${horse.name}
    Raça: ${horse.breed}
    Pai: ${horse.sire}
    Mãe: ${horse.dam}
    Avô Materno: ${horse.damSire}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ role: 'user', parts: [{ text: `${context}\n\nPergunta: ${question}` }] }],
      config: {
          temperature: 0.1,
          maxOutputTokens: 300,
      },
    });

    return response.text || "Sem dados técnicos suficientes.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Erro na consulta técnica.";
  }
};
