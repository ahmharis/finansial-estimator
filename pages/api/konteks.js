export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { coreIdea, locationString } = req.body;
  // Ambil API key dari environment variables
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ message: "API key not configured." });
  }

  const systemPrompt = "Anda adalah konsultan bisnis UMKM yang kreatif. Tugas Anda adalah menghasilkan draf JSON berisi contoh realistis untuk 5 poin konteks bisnis berdasarkan ide bisnis yang diberikan. Buatlah jawaban yang singkat dan padat untuk setiap poin. Gunakan lokasi yang diberikan sebagai konteks.";
  const userQuery = `Buatkan draf konteks bisnis untuk ide: "${coreIdea}"${locationString ? ` berlokasi di "${locationString}"` : ''}. Jangan buatkan contoh lokasi, gunakan lokasi itu sebagai konteks.`;
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
  
  const payload = {
    contents: [{ parts: [{ text: userQuery }] }],
    systemInstruction: { parts: [{ text: systemPrompt }] },
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: {
          "jualan": { "type": "STRING", "description": "Contoh data jualan dan pasar" },
          "pelanggan": { "type": "STRING", "description": "Contoh data pelanggan" },
          "operasional": { "type": "STRING", "description": "Contoh data operasional" },
          "rencana": { "type": "STRING", "description": "Contoh data rencana ke depan" },
          "faktor_luar": { "type": "STRING", "description": "Contoh faktor luar" }
        },
      }
    }
  };

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Gemini API Error:", errorData);
      throw new Error(errorData.error?.message || `API Error: ${response.status}`);
    }

    const result = await response.json();
    const jsonText = result.candidates?.[0]?.content?.parts?.[0]?.text;

    if (jsonText) {
      res.status(200).json(JSON.parse(jsonText));
    } else {
      throw new Error("Respons API tidak valid.");
    }
  } catch (error) {
    console.error("Error in /api/konteks:", error);
    res.status(500).json({ message: error.message });
  }
}

