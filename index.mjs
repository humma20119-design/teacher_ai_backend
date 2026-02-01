import express from "express";
import cors from "cors";

const app = express();

// Render uchun kerak (body)
app.use(express.json({ limit: "2mb" }));
app.use(cors({ origin: "*"}));

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

// POST /analyze
// body: { transcript: "..." }
app.post("/analyze", async (req, res) => {
  try {
    const transcript = (req.body?.transcript || "").toString().trim();

    if (!transcript) {
      return res.status(400).json({ error: "transcript bo‘sh" });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "GROQ_API_KEY topilmadi (Render env)" });
    }

    // PROMPT (bu yerda  backticklar to‘liq yopilgan!)
    const systemPrompt = [
      "Sen o‘qituvchi darsini tahlil qiluvchi AI san.",
      "Dars matnini o‘qib, quyidagi JSON formatda javob ber:",
      "{",
      '  "score": 0-100,',
      '  "summary": "qisqa xulosa",',
      '  "strengths": ["..."],',
      '  "improvements": ["..."],',
      '  "fan": "..."',
      "}",
      "Faqat JSON qaytar. Hech qanday ortiqcha matn yozma."
    ].join("\n");

    const userPrompt = `Dars matni:\n${transcript}`;

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // MUHIM: bu string ichida bo‘lishi shart!
        "Authorization": Bearer ${apiKey}
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        temperature: 0.2,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ]
      })
    });

    const data = await groqRes.json();

    if (!groqRes.ok) {
      return res.status(groqRes.status).json({
        error: "Groq error",
        details: data
      });
    }

    const text = data?.choices?.[0]?.message?.content || "";

    // JSON parse qilishga harakat qilamiz
    // (AI ba’zan ``json ...
    const cleaned = text
      .replace(/
json/gi, "")
      .replace(/```/g, "")
      .trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (e) {
      // Agar parse bo‘lmasa, xom matnni qaytaramiz
      return res.json({ raw: text });
    }

    return res.json(parsed);
  } catch (err) {
    return res.status(500).json({ error: "Server error", message: String(err) });
  }
});

// Render PORT ni o‘zi beradi — shuni esdan chiqarmaymiz
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("Server listening on port", PORT);
});

