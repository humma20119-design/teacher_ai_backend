import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.post("/analyze", async (req, res) => {
  try {
    const { transcript, fan } = req.body;

    if (!transcript) {
      return res.status(400).json({ error: "transcript required" });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "GROQ_API_KEY yo‘q" });
    }

    const prompt = 
Sen 'oqituvchi' darsini tahlil qiluvchi AI san.

Quyidagi dars matnini tahlil qil va JSON qaytar:

{
  "score": 0-100,
  "summary": "qisqa xulosa",
  "strengths": ["kuchli tomonlar"],
  "improvements": ["takomillashtirish"],
  "fan": "${fan || "noma'lum"}"
}

Dars matni:
${transcript}
;

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: Bearer ${apiKey},
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [{ role: "user", content: prompt }],
        }),
      }
    );

    const data = await response.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});


