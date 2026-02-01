import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Teacher AI backend ishlayapti"
  });
});

// AI analyze (hozircha fake javob)
app.post("/analyze-lesson", async (req, res) => {
  try {
    const { transcript, meta } = req.body;

    if (!transcript) {
      return res.status(400).json({
        error: "Transcript yuborilmadi"
      });
    }

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
      fan: meta?.fan ?? "Noma'lum fan"
    });

  } catch (e) {
    res.status(500).json({
      error: "AI tahlilda xatolik",
      details: e.message
    });
  }
});

// PORT (Render uchun MUHIM)
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log("Server ishga tushdi:", PORT);
});
