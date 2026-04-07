import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function getCustomRecipe(dish: string, pax: number) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate an accurate Filipino recipe for "${dish}" good for ${pax} people.
      Focus on accurate ingredients and realistic cooking times to estimate LPG consumption.
      
      Return ONLY a JSON object. Use current Philippine market prices for costs (PHP).
      Be precise. If it's a beef stew, use beef, not pork.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            ingredients: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  qty: { type: Type.NUMBER },
                  unit: { type: Type.STRING },
                  cost: { type: Type.NUMBER }
                },
                required: ["name", "qty", "unit", "cost"]
              }
            },
            instructions: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            cookingMinutes: { type: Type.NUMBER },
            basePowerKw: { type: Type.NUMBER },
            totalCost: { type: Type.NUMBER }
          },
          required: ["name", "ingredients", "instructions", "cookingMinutes", "basePowerKw", "totalCost"]
        }
      }
    });

    const text = response.text;
    if (!text) return null;
    return JSON.parse(text);
  } catch (error) {
    console.error("Error fetching custom recipe:", error);
    return null;
  }
}

export async function getEnergySavingTips() {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Provide 5 practical, high-impact energy-saving tips for households using LPG for cooking in the Philippines.
      Focus on reducing consumption during the energy crisis.
      Return as a JSON array of strings.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response text");
    return JSON.parse(text);
  } catch (error) {
    console.error("Error fetching tips:", error);
    return [
      "Use a pressure cooker for tough meats like beef to reduce cooking time by up to 50%.",
      "Ensure the flame is blue; a yellow flame indicates inefficient combustion and wasted gas.",
      "Cover pots and pans while cooking to retain heat and speed up the process.",
      "Thaw frozen food completely before cooking to avoid using extra energy to defrost in the pan.",
      "Prepare all ingredients (chopping, measuring) before turning on the stove to minimize idle burn time."
    ];
  }
}
export async function generateAuditReport(answers: Record<string, string>) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Based on these household energy audit answers: ${JSON.stringify(answers)}, 
      generate a personalized energy waste report.
      
      Return ONLY a JSON object:
      {
        "summary": "string",
        "wasteAreas": [{ "area": "string", "severity": "low|medium|high", "explanation": "string" }],
        "solutions": [{ "title": "string", "description": "string", "estSavings": "string" }]
      }`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            wasteAreas: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  area: { type: Type.STRING },
                  severity: { type: Type.STRING, enum: ["low", "medium", "high"] },
                  explanation: { type: Type.STRING }
                },
                required: ["area", "severity", "explanation"]
              }
            },
            solutions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  estSavings: { type: Type.STRING }
                },
                required: ["title", "description", "estSavings"]
              }
            }
          },
          required: ["summary", "wasteAreas", "solutions"]
        }
      }
    });

    const text = response.text;
    if (!text) return null;
    return JSON.parse(text);
  } catch (error) {
    console.error("Error generating audit report:", error);
    return null;
  }
}
