export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { context, inputs, results } = req.body;
  // Ambil API key dari environment variables
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ message: "API key not configured." });
  }

  // Helper function untuk format mata uang di sisi server
  const formatCurrency = (value, currency = "IDR") => {
    try {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(value);
    } catch (e) {
      return `${currency} ${Math.round(value).toLocaleString('id-ID')}`;
    }
  };

  const systemPrompt = "Anda adalah konsultan bisnis dan analis keuangan senior untuk UMKM. Tugas Anda adalah memberikan analisis yang tajam, jujur, dan dapat ditindaklanjuti berdasarkan data yang diberikan. Gunakan bahasa Indonesia yang profesional namun mudah dimengerti. Format jawaban Anda menggunakan Markdown sederhana (bold, italic, bullet points, ### untuk judul, dan --- untuk garis pemisah).";
  
  const userQuery = `
    Berikut adalah data proyeksi keuangan UMKM. Tolong berikan analisis dan rekomendasi.

    ---
    **1. KONTEKS BISNIS (Kualitatif):**
    * Ide Bisnis Inti: ${context.core_business_idea || 'Tidak ada data'}
    * Lokasi Usaha: ${context.locationString || 'Tidak ada data'}
    * Data Jualan & Pasar: ${context.ctx_jualan || 'Tidak ada data'}
    * Data Pelanggan: ${context.ctx_pelanggan || 'Tidak ada data'}
    * Data Operasional: ${context.ctx_operasional || 'Tidak ada data'}
    * Rencana ke Depan: ${context.ctx_rencana || 'Tidak ada data'}
    * Faktor Luar: ${context.ctx_faktor_luar || 'Tidak ada data'}

    ---
    **2. ASUMSI FINANSIAL (Kuantitatif):**
    * Pendapatan Awal: ${formatCurrency(inputs.pendapatan, inputs.currency)}
    * Biaya Tetap (Opex): ${formatCurrency(inputs.biayaTetap, inputs.currency)} / bulan
    * Belanja Marketing: ${formatCurrency(inputs.marketingCost, inputs.currency)} / bulan
    * Biaya Variabel: ${inputs.biayaVariabelPct * 100}% dari Pendapatan
    * Target Pertumbuhan: ${inputs.growthRatePct * 100}% / bulan
    * Uang Kas Awal: ${formatCurrency(inputs.cashOnHand, inputs.currency)}
    * Horizon Proyeksi: ${inputs.horizon} bulan

    ---
    **3. HASIL PROYEKSI (Skenario Dasar):**
    * Total Pendapatan: ${formatCurrency(results.totalRevenue, inputs.currency)}
    * Total Laba Bersih: ${formatCurrency(results.totalNetProfit, inputs.currency)}
    * Margin Laba Bersih: ${(results.netProfitMargin * 100).toFixed(1)}%
    * Titik Impas (BEP): ${results.bepMonth ? `Bulan ke-${results.bepMonth}` : (results.totalNetProfit > 0 ? "Dalam Proyeksi" : "Tidak Tercapai")}
    * Perkiraan Runway: ${results.runwayMonths ? `${results.runwayMonths.toFixed(1)} Bulan` : (results.totalNetProfit > 0 ? "Profit!" : "N/A")}

    ---
    **TUGAS ANDA:**
    Berikan analisis dalam 3 bagian:
    1.  **Ringkasan Analisis:** 1 paragraf singkat tentang kesehatan proyeksi ini.
    2.  **Risiko Utama:** 3 poin utama risiko yang harus diwaspadai berdasarkan data di atas.
    3.  **Rekomendasi Tindak Lanjut:** 3 rekomendasi konkret dan praktis untuk meningkatkan hasil.

    Gunakan format:
    ### 1. Ringkasan Analisis
    [...paragraf Anda...]

    ---
    ### 2. Risiko Utama
    * **Risiko 1:** [...]
    * **Risiko 2:** [...]
    * **Risiko 3:** [...]

    ---
    ### 3. Rekomendasi Tindak Lanjut
    * **Rekomendasi 1:** [...]
    * **Rekomendasi 2:** [...]
    * **Rekomendasi 3:** [...]
  `;
  
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

  const payload = {
    contents: [{ parts: [{ text: userQuery }] }],
    systemInstruction: { parts: [{ text: systemPrompt }] },
    tools: [{ "google_search": {} }],
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
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text;

    if (text) {
      res.status(200).json({ text: text });
    } else {
      throw new Error("Respons API tidak valid.");
    }
  } catch (error) {
    console.error("Error in /api/analisis:", error);
    res.status(500).json({ message: error.message });
  }
}

