import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

// health
app.get("/health", (req, res) => {
  res.json({ ok: true });
});

// AI dars tahlili
app.post("/analyze", async (req, res) => {
  try {
    const { fan, transcript } = req.body;

    if (!fan || !transcript) {
      return res.status(400).json({
        error: "fan va transcript majburiy"
      });
    }

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.1-70b-versatile",
          messages: [
            {
              role: "system",
              content:
                "Sen tajribali metodist-o‘qituvchisan. Darsni professional tarzda tahlil qil."
            },
            {
              role: "user",
              content: 
Fan: `${fan}`

Dars matni:
${transcript}

Natijani JSON ko‘rinishida qaytar:
{
  "score": number,
  "summary": string,
  "strengths": string[],
  "improvements": string[]
}

            }
          ],
          temperature: 0.3
        })
      }
    );

    const data = await response.json();

    const text = data.choices[0].message.content;
    const json = JSON.parse(text);

    res.json(json);
  } catch (err) {
    res.status(500).json({
      error: "AI xatolik",
      details: err.message
    });
  }
});

// Render PORT
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on", PORT);
});


