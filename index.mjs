import express from "express";

const app = express();
app.use(express.json());

// ✅ health
app.get("/health", (req, res) => {
  res.status(200).json({ ok: true });
});

// ✅ analyze (hozircha test javob)
app.post("/analyze", (req, res) => {
  const { fan, transcript } = req.body || {};

  if (!fan || !transcript) {
    return res.status(400).json({ error: "fan va transcript majburiy" });
  }

  return res.json({
    score: 85,
    summary: "Dars yaxshi o‘tilgan",
    strengths: ["Tushuntirish ravshan", "Misollar yetarli"],
    improvements: ["O‘quvchilar bilan ko‘proq savol-javob"],
    fan: fan
  });
});

// ✅ Render uchun PORT shart
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("RUN:", PORT));
