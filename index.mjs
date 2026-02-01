const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Teacher AI backend ishlayapti" });
});

app.post("/analyze-lesson", (req, res) => {
  const { transcript, meta } = req.body;

  res.json({
    summary: "Dars tahlil qilindi",
    fan: meta?.fan,
    baho: "Yaxshi",
    tavsiya: "Faoliyatni yanada interaktiv qiling"
  });
});

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});