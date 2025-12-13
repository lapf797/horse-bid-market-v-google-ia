
import { GoogleGenAI } from "@google/genai";
import { HorseLot } from "../types";

const getClient = () => {
    // Check if key is available
    if (!process.env.API_KEY) {
        console.warn("Gemini API Key missing");
        return null;
    }
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const askGeminiAboutHorse = async (horse: HorseLot, question: string): Promise<string> => {
  const ai = getClient();
  if (!ai) return "A chave de API do Gemini não foi configurada. Não é possível consultar a IA no momento.";

  const context = `
    ATUE COMO: Auditor Técnico do Horse Bid Market.
    
    OBJETIVO: Responder tecnicamente sobre o cavalo.
    
    REGRAS RÍGIDAS (IMPORTANTE):
    1. SEJA SUCINTO: Respostas curtas. Máximo 2 ou 3 parágrafos breves.
    2. NEUTRALIDADE ABSOLUTA: Não emita opiniões (nem positivas, nem negativas). Apenas fatos.
    3. SEM ADJETIVOS DE VENDA: Nunca use "lindo", "incrível", "pena que", "infelizmente".
    4. FORMATO: Use Markdown (negrito para dados chave).
    
    DADOS DO LOTE:
    Nome: ${horse.name}
    Raça: ${horse.breed}
    Nascimento: ${horse.dob}
    Pai: ${horse.sire}
    Mãe: ${horse.dam}
    Avô Materno: ${horse.damSire}
    
    Pergunta do usuário: "${question}"
    
    Responda apenas o que foi perguntado, baseando-se nos dados acima e em conhecimento genético geral, de forma seca e técnica.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { text: context }
        ]
      },
      config: {
          temperature: 0.2, // Low temp for factual/concise output
          maxOutputTokens: 250, // Force brevity
      }
    });

    return response.text || "Sem dados técnicos suficientes.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Erro na consulta técnica.";
  }
};
