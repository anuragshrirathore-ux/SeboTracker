import { GoogleGenAI, Type } from "@google/genai";
import { FoodCategory } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

function sanitizeCategory(cat: string): FoodCategory {
  // Remove any (score) suffixes like "(+4)" or "(0)"
  const clean = cat.replace(/\s*\([+-]?\d+\)/, "").trim();
  
  const validCategories: FoodCategory[] = [
    "Sugary Dairy", "Creamy Gravy", "Deep Fried", 
    "Sweet Tea", "Home Meal/Veg", "Lean Protein/Grilled"
  ];

  // Try to find a match
  const match = validCategories.find(v => v.toLowerCase() === clean.toLowerCase());
  return match || "Home Meal/Veg"; // Default to safe category if no match
}

export async function analyzeFoodImage(base64Image: string): Promise<{ 
  category: FoodCategory; 
  confidence: number; 
  reason: string;
  flag: "Red" | "Yellow" | "Green";
  regularity_warning?: string;
}> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image.split(",")[1] || base64Image,
            },
          },
          {
            text: `Analyze this food image and categorize it for Seborrheic Dermatitis risk tracking.
            
            Categories:
            - Sugary Dairy: Ice cream, milkshakes, sweet yogurt.
            - Creamy Gravy: Heavy cream sauces, buttery curries.
            - Deep Fried: Fries, fried chicken, oily snacks.
            - Sweet Tea: Sugary drinks, sodas.
            - Home Meal/Veg: Balanced vegetables, simple grains.
            - Lean Protein/Grilled: Grilled chicken, fish, tofu.

            Flags:
            - Red Flag: Strictly not allowed for the patient (e.g., Sugary Dairy, Deep Fried).
            - Green Flag: No problem, safe for regular consumption (e.g., Lean Protein, Home Meal/Veg).
            - Yellow Flag: Not a problem now, but regular intake can lead to issues (e.g., Creamy Gravy, Sweet Tea). 
              If Yellow, provide a 'regularity_warning' explaining how often is too often (e.g., "Limit to once a week").

            Return the result as JSON.`,
          },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          category: {
            type: Type.STRING,
            description: "The food category from the provided list.",
          },
          flag: {
            type: Type.STRING,
            enum: ["Red", "Yellow", "Green"],
            description: "Risk flag for the patient.",
          },
          confidence: {
            type: Type.NUMBER,
            description: "Confidence score between 0 and 1.",
          },
          reason: {
            type: Type.STRING,
            description: "Brief explanation of why this category and flag were chosen.",
          },
          regularity_warning: {
            type: Type.STRING,
            description: "Explanation for Yellow flags on how regular intake becomes an issue.",
          },
          calories: {
            type: Type.NUMBER,
            description: "Estimated calorie count for the food item.",
          },
        },
        required: ["category", "flag", "confidence", "reason", "calories"],
      },
    },
  });

  const result = JSON.parse(response.text || "{}");
  return {
    ...result,
    category: sanitizeCategory(result.category)
  };
}

export async function searchFoodByName(foodName: string): Promise<{ 
  category: FoodCategory; 
  reason: string;
  flag: "Red" | "Yellow" | "Green";
  regularity_warning?: string;
  image: string;
  calories: number;
}> {
  // 1. Analyze the food name
  const analysisResponse = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyze the food "${foodName}" and categorize it for Seborrheic Dermatitis risk tracking.
    
    Categories:
    - Sugary Dairy: Ice cream, milkshakes, sweet yogurt.
    - Creamy Gravy: Heavy cream sauces, buttery curries.
    - Deep Fried: Fries, fried chicken, oily snacks.
    - Sweet Tea: Sugary drinks, sodas.
    - Home Meal/Veg: Balanced vegetables, simple grains.
    - Lean Protein/Grilled: Grilled chicken, fish, tofu.

    Flags:
    - Red Flag: Strictly not allowed for the patient.
    - Green Flag: No problem, safe for regular consumption.
    - Yellow Flag: Not a problem now, but regular intake can lead to issues.
      If Yellow, provide a 'regularity_warning' explaining how often is too often.

    Return the result as JSON.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          category: { type: Type.STRING },
          flag: { type: Type.STRING, enum: ["Red", "Yellow", "Green"] },
          reason: { type: Type.STRING },
          regularity_warning: { type: Type.STRING },
          calories: { type: Type.NUMBER },
        },
        required: ["category", "flag", "reason", "calories"],
      },
    },
  });

  const analysis = JSON.parse(analysisResponse.text || "{}");
  const sanitizedAnalysis = {
    ...analysis,
    category: sanitizeCategory(analysis.category)
  };

  // 2. Generate a representative image
  const imageResponse = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: `A high-quality, realistic photo of ${foodName} served on a plate, professional food photography style.`,
  });

  let base64Image = "";
  for (const part of imageResponse.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      base64Image = `data:image/png;base64,${part.inlineData.data}`;
      break;
    }
  }

  return {
    ...sanitizedAnalysis,
    image: base64Image,
  };
}
