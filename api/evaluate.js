export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  try {
    const { prompt, answer, level = "B2" } = req.body || {};
    if (!prompt || !answer) {
      return res.status(400).json({ error: "Missing prompt or answer" });
    }

    const system = `
You are an IELTS Writing examiner and coach.
Assess the student's Task 2 essay against the four official band descriptors.
Return STRICTLY a JSON object with keys:
- band_estimate (string like "6.0–6.5"),
- overview (2–3 sentences, strengths + priorities),
- task_response (actionable feedback),
- coherence (actionable feedback),
- lexical (actionable feedback),
- grammar (actionable feedback),
- sentence_fixes (array of exactly 3 improved rewrites of weak sentences from the student's essay; each item is a single sentence).
Tone: constructive and concise. Target learner level: ${level}.
`;

    const body = {
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      temperature: 0.2,
      messages: [
        { role: "system", content: system },
        {
          role: "user",
          content:
            `TASK PROMPT:\n${prompt}\n\nSTUDENT ANSWER:\n${answer}\n\nReturn only the JSON object.`
        }
      ]
    };

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    if (!resp.ok) {
      const text = await resp.text();
      console.error("OpenAI evaluate error:", text);
      return res.status(502).json({ error: "Upstream error from OpenAI" });
    }

    const data = await resp.json();
    const raw = data?.choices?.[0]?.message?.content || "{}";

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      console.error("JSON parse failed. RAW:", raw);
      // Trả về cấu trúc tối thiểu để UI vẫn hiển thị
      parsed = {
        band_estimate: "—",
        overview: "Xin lỗi, phản hồi không đúng định dạng JSON. Hãy bấm Gửi lại.",
        task_response: "", coherence: "", lexical: "", grammar: "",
        sentence_fixes: []
      };
    }

    return res.status(200).json({ result: parsed });
  } catch (err) {
    console.error("evaluate exception:", err);
    return res.status(500).json({ error: "Server error while evaluating answer" });
  }
}
