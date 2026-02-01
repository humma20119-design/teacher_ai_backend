import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
 app.post('/analyze-lesson', async (req, res) => {
  try {
    const { transcript, meta } = req.body;

    if (!transcript) {
      return res.status(400).json({
        error: "Transcript yuborilmadi"
      });
    }

    // Hozircha fake javob (test uchun)
    res.json({
      score: 85,
      summary: "Dars yaxshi o‘tilgan",
      strengths: [
        "Tushuntirish ravshan",
        "Misollar yetarli"
      ],
      improvements: [
        "O‘quvchilar bilan ko‘proq savol-javob"
      ],
      fan: meta?.fan ?? "Noma’lum fan"
    });

  } catch (e) {
    res.status(500).json({
      error: "AI tahlilda xatolik",
      details: e.message
    });
  }
});
