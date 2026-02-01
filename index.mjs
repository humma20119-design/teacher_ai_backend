import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.post("/analyze", async (req, res) => {
  try {
    const { transcript, fan } = req.body;

    if (!transcript || typeof transcript !== "string") {
      return res.status(400).json({ error: "transcript required (string)" });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "GROQ_API_KEY not set on server" });
    }

    const prompt = 
Sen o'qituvchi darsini tahlil qiluvchi AI'san.
Quyidagi transcript asosida JSON qaytar:

JSON format:
{
  "score": 0-100,
  "summary": "...",
  "strengths": ["..."],
  "improvements": ["..."],
  "fan": "..."
}

Fan (agar berilgan bo'lsa) shuni yoz: ${fan || "aniqlanmagan"}.

Transcript:
${transcript}
;

    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: Bearer ${apiKey},
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
      }),
    });

    const data = await r.json();

    if (!r.ok) {
      return res.status(500).json({
        error: "groq_request_failed",
        status: r.status,
        details: data,
      });
    }

    const text = data?.choices?.[0]?.message?.content ?? "";
    return res.json({ raw: text });
  } catch (e) {
    return res.status(500).json({ error: "server_error", details: String(e) });
  }
});

// Render uchun port
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("Server is running on port:", PORT);
});
