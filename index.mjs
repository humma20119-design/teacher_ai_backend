import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Teacher AI backend ishlayapti",
  });
});

const PORT = process.env.PORT || 5050;
app.listen(PORT, () => {
  console.log("Server ishga tushdi:", PORT);
});
