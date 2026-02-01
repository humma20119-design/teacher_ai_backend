import express from "express";
import cors from "cors";
import Groq from "groq-sdk";

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

// 1) Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// 2) Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// 3) Analyze lesson (Groq)
app.post("/analyze-lesson", async (req, res) => {
  try {
    const { transcript, meta } = req.body;

    if (!transcript || transcript.trim().length === 0) {
      return res.status(400).json({ error: "Transcript yuborilmadi" });
    }

    // Prompt (o'zing xohlagancha o'zgartirasan)
    const subject = meta?.fan ?? "noma'lum fan";

    const systemPrompt = 
Sen tajribali metodistsan.
Menga dars transkripti bo'yicha baho berasan.
Natijani faqat JSON ko'rinishida chiqar.
JSON format:
{
  "score": 0-100,
  "summary": "qisqa xulosa",
  "strengths": ["...","..."],
  "improvements": ["...","..."],
  "fan": "..."
}
;

    const userPrompt = 
Fan: ${subject}
Dars transkripti:
${transcript}
;

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant", // tez va arzon
      temperature: 0.3,
      messages: [
        { role: "system", content: systemPrompt.trim() },
        { role: "user", content: userPrompt.trim() },
      ],
    });

    const text = completion.choices?.[0]?.message?.content ?? "";

    // Ba'zan model JSONni text bilan aralashtirishi mumkin.
    // Shuning uchun JSON ajratib olishga harakat qilamiz:
    const jsonStart = text.indexOf("{");
    const jsonEnd = text.lastIndexOf("}");
    if (jsonStart === -1 || jsonEnd === -1) {
      return res.status(500).json({
        error: "Model JSON qaytarmadi",
        raw: text,
      });
    }

    const jsonText = text.slice(jsonStart, jsonEnd + 1);
    const data = JSON.parse(jsonText);

    return res.json(data);
  } catch (e) {
    return res.status(500).json({
      error: "AI tahlilda xatolik",
      details: e.message,
    });
  }
});

// 4) Render PORT
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("Server ishga tushdi:", PORT);
});
