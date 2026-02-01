import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

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
          "Content-Type": "application/json",
          // 🔥 MUHIM TUZATISH SHU YERDA
          "Authorization": Bearer ${process.env.GROQ_API_KEY}
        },
        body: JSON.stringify({
          model: "llama3-8b-8192",
          messages: [
            {
              role: "system",
              content:
                "Sen o‘qituvchi darsini tahlil qiladigan AI’san. Faqat JSON qaytar."
            },
            {
              role: "user",
              content: 
Fan: ${fan}
Dars matni:
${transcript}

JSON format:
{
  "score": number,
  "summary": string,
  "strengths": string[],
  "improvements": string[]
}

            }
          ],
          temperature: 0.4
        })
      }
    );

    const data = await response.json();

    const result = JSON.parse(
      data.choices[0].message.content
    );

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "AI tahlilda xatolik",
      details: err.message
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server ishga tushdi:", PORT);
});
