export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { prompt, answer, level = "B2" } = req.body || {};
  if (!prompt || !answer) return res.status(400).json({ error: "Missing prompt or answer" });

  const system = `
You are an IELTS Writing examiner and coach. Assess the student's essay for Task 2.
Return STRICTLY a JSON object with keys:
band_estimate (e.g., "5.5–6.0"),
overview,
task_response,
coherence,
lexical,
grammar,
sentence_fixes (array of 3 concrete rewrites of weak sentences).
Be constructive, clear, and actionable. Target level ${level}.
`;

  const completion = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: `PROMPT: ${prompt}\n\nSTUDENT ANSWER:\n${answer}` }
      ],
      temperature: 0.2
    })
  }).then(r => r.json());

  let parsed;
  try {
    const raw = completion.choices?.[0]?.message?.content || "{}";
    parsed = JSON.parse(raw);
  } catch (e) {
    parsed = { overview: "Xin lỗi, định dạng phản hồi không đúng.", band_estimate: "—",
               task_response:"", coherence:"", lexical:"", grammar:"", sentence_fixes: [] };
  }
  res.status(200).json({ result: parsed });
}
