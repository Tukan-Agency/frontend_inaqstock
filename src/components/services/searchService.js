const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const BEARER_TOKEN = import.meta.env.VITE_OPENAI_API_KEY; // ✅ desde .env

export const searchService = {
  searchSymbol: async (query) => {
    const payload = {
      model: "alibaba/tongyi-deepresearch-30b-a3b:free",
      messages: [
        {
          role: "system",
          content: `Eres un asistente que actúa como buscador de símbolos compatibles con Polygon.io.

Reglas de respuesta:

1. Si el input es el nombre de una empresa de mercado, criptomoneda o mercado reconocido, devuelve únicamente el símbolo compatible en formato:
   - AMZN
2. Si el input es el nombre de una criptomoneda (ya sea el símbolo o el nombre completo), devuelve únicamente el símbolo compatible en formato:
   - X:XXXUSD
3. Si el input es una pregunta general (ej. "mercados adecuados para invertir", "en qué invertir ahora"), responde con un array JSON que contenga una lista de símbolos recomendados, por ejemplo:
   [
     "X:BTCUSD",
     "X:ETHUSD",
     "AMZN",
     "TSLA",
     "AAPL"
   ]
4. No agregues explicaciones ni texto adicional, solo devuelve el símbolo o el array.
5. Si el input no corresponde a un mercado válido ni a una pregunta de recomendación, no devuelvas nada.
6. NO incluyas tokens de formato como <|begin_of_sentence|>, <|end_of_sentence|>, ni comillas adicionales.
7. Si respondes con un array JSON, asegúrate de que sea un JSON válido, con comillas dobles correctas.`,
        },
        {
          role: "user",
          content: `Devuélveme un símbolo compatible con Polygon.io para: ${query}`,
        },
      ],
    };

    try {
      const response = await fetch(OPENROUTER_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${BEARER_TOKEN}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      let result = data.choices?.[0]?.message?.content?.trim() || "";

      // 🧹 Limpieza de caracteres extraños o tokens del modelo
      result = result
        .replace(/<\|begin_of_sentence\|>|<\|end_of_sentence\|>/gi, "")
        .replace(/\|/g, "")
        .replace(/[\u0000-\u001F]+/g, "") // elimina caracteres invisibles
        .replace(/“|”/g, '"') // reemplaza comillas tipográficas
        .replace(/‘|’/g, "'") // reemplaza comillas simples raras
        .replace(/```json|```/g, "") // limpia código formateado
        .trim();

      // 🧠 Si parece un array, intenta convertirlo
      if (result.startsWith("[") && result.endsWith("]")) {
        try {
          const parsed = JSON.parse(result);
          if (Array.isArray(parsed)) {
            return parsed.map((s) => s.replace(/["'\s]/g, "").trim());
          }
        } catch {
          // Si no es JSON válido, limpia manualmente
          return result
            .replace(/\[|\]/g, "")
            .split(",")
            .map((s) => s.replace(/["'\s]/g, "").trim())
            .filter(Boolean);
        }
      }

      // Si no es array, devolver un solo símbolo limpio
      return result.replace(/["'\[\]\s]/g, "").trim();
    } catch (error) {
      console.error("Error searching symbol with AI:", error);
      throw error;
    }
  },
};
