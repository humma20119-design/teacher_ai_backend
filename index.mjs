import express from "express";
import cors from "cors";
import Groq from "groq-sdk";

const app = express();
app.use(cors());
app.use(express.json());

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.post("/analyze-lesson", async (req, res) => {
  try {
    const { transcript, meta } = req.body;

    if (!transcript) {
      return res.status(400).json({ error: "Transcript yuborilmadi" });
    }

    const completion = await groq.chat.completions.create({
      model: "llama3-8b-8192",
      messages: [
        {
          role: "system",
          content: "Sen tajribali o‘qituvchisan va darslarni tahlil qilasan"
        },
        {
          role: "user",
          content: Fan: ${meta?.fan}\nDars matni: ${transcript}
        }
      ]
    });

    res.json({
      result: completion.choices[0].message.content
    });
  } catch (e) {
    res.status(500).json({
      error: "Groq xatosi",
      details: e.message
    });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("Server ishga tushdi:", PORT);
});
