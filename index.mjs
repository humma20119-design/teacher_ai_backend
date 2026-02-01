import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs/promises";

const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "2mb" }));

// Render / Linux’da vaqtinchalik joy: /tmp
const upload = multer({ dest: "/tmp" });

app.get("/health", (req, res) => res.json({ ok: true }));

/**
 * 1) AUDIO -> TEXT (OpenAI Transcribe)
 * OpenAI endpoint: POST https://api.openai.com/v1/audio/transcriptions
 * multipart/form-data: file + model
 */
async function transcribeWithOpenAI(filePath) {
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) throw new Error("OPENAI_API_KEY topilmadi (Render env)");

  const audioBuffer = await fs.readFile(filePath);

  // Node 22 fetch + FormData ishlaydi
  const form = new FormData();
  form.append(
    "file",
    new Blob([audioBuffer], { type: "audio/m4a" }),
    "audio.m4a"
  );

  // Model variantlari doc’da bor; masalan gpt-4o-mini-transcribe yoki whisper-1. 1
  form.append("model", "gpt-4o-mini-transcribe");

  const resp = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openaiKey}`,
    },
    body: form,
  });

  const data = await resp.json();
  if (!resp.ok) {
    throw new Error(`OpenAI transcribe error: ${resp.status} ${JSON.stringify(data)}`);
  }

  // Ko‘pincha javob { text: "..." }
  return (data.text || "").toString();
}

/**
 * 2) TEXT -> TAHLIL (Groq chat)
 */
async function analyzeWithGroq(transcript, fan) {
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) throw new Error("GROQ_API_KEY topilmadi (Render env)");

  const systemPrompt = [
    "Sen o‘qituvchi darsini tahlil qiluvchi AI san.",
    "Dars transkriptini o‘qib, quyidagi JSON formatda javob ber:",
    "{",
    '  "score": 0-100,',
    '  "summary": "qisqa xulosa",',
    '  "strengths": ["..."],',
    '  "improvements": ["..."],',
    '  "fan": "..."',
    "}",
    "Faqat JSON qaytar. Hech qanday ortiqcha matn yozma."
  ].join("\n");

  const userPrompt =
    `Fan: ${fan || ""}\n\nDars transkripti:\n${transcript}`;

  const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${groqKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      temperature: 0.2,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
    }),
  });

  const data = await groqRes.json();
  if (!groqRes.ok) {
    throw new Error(`Groq error: ${groqRes.status} ${JSON.stringify(data)}`);
  }

  const text = (data?.choices?.[0]?.message?.content || "").toString();

  // JSON’ni tozalash (
  const cleaned = text
    .replace(/\r?\n/g, " ")
    .replace(/
json/g, "")
    .replace(/`/g, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    return { raw: text };
  }
}

/**
 * POST /analyze-audio
 * multipart/form-data:
 *  - file: audio (m4a)
 *  - fan: string (optional)
 */
app.post("/analyze-audio", upload.single("file"), async (req, res) => {
  let tmpPath = req.file?.path;

  try {
    if (!tmpPath) return res.status(400).json({ error: "audio file kelmadi (file)" });

    const fan = (req.body?.fan || "").toString();

    const transcript = await transcribeWithOpenAI(tmpPath);
    if (!transcript.trim()) return res.status(400).json({ error: "transcript bo‘sh chiqdi" });

    const analysis = await analyzeWithGroq(transcript, fan);

    return res.json({
      transcript,
      analysis,
    });
  } catch (e) {
    return res.status(500).json({ error: "Server error", message: e?.message || String(e) });
  } finally {
    // faylni o‘chirib tashlaymiz
    if (tmpPath) {
      try { await fs.unlink(tmpPath); } catch {}
    }
  }
});// (Senda eski /analyze ham qolaversin — matn bilan test uchun)
app.post("/analyze", async (req, res) => {
  try {
    const transcript = (req.body?.transcript || "").toString().trim();
    const fan = (req.body?.meta?.fan || "").toString();

    if (!transcript) return res.status(400).json({ error: "transcript bo‘sh" });

    const analysis = await analyzeWithGroq(transcript, fan);
    return res.json(analysis);
  } catch (e) {
    return res.status(500).json({ error: "Server error", message: e?.message || String(e) });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port", PORT));




const upload = multer({ dest: "/tmp" });

app.post("/analyze-audio", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Audio topilmadi" });
    }

    // 1️⃣ Audio → Matn (OpenAI Whisper)
    const formData = new FormData();
    formData.append(
      "file",
      fs.createReadStream(req.file.path)
    );
    formData.append("model", "gpt-4o-transcribe");

    const whisperRes = await fetch(
      "https://api.openai.com/v1/audio/transcriptions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: formData,
      }
    );

    const whisperData = await whisperRes.json();
    const transcript = whisperData.text;

    if (!transcript) {
      return res.status(500).json({ error: "Transkripsiya chiqmadi" });
    }

    // 2️⃣ Matn → Dars tahlili (GROQ)
    const systemPrompt = 
Sen o‘qituvchi darsini tahlil qiluvchi AI san.
Darsni 45 daqiqalik dars sifatida bahola.
Faoliyat, tushuntirish, o‘quvchi ishtiroki,
tartib-intizom va samaradorlikni bahola.

Faqat JSON qaytar:
{
  "score": 0-100,
  "summary": "",
  "strengths": [],
  "improvements": [],
  "engagement": "",
  "discipline": "",
  "overall": ""
}
;

    const groqRes = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: transcript },
          ],
          temperature: 0.3,
        }),
      }
    );

    const groqData = await groqRes.json();
    const text = groqData.choices[0].message.content;

    res.json(JSON.parse(text));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});





