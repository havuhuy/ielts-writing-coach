export default async function handler(req, res) {
  const { level = "B2" } = req.query;

  try {
    const system = `
You are an IELTS Writing Task 2 teacher.
Produce ONE realistic IELTS Task 2 prompt similar to exam topics from 2024–2025.
Be specific (mention a concrete topic like technology, education policy, environment, AI, work-from-home, aging population, etc.).
Keep it under 40 words. Do NOT use vague templates like "Some people believe...".
Audience: Vietnamese learners. Target level: ${level}.
Return ONLY the prompt text, no preface, no numbering, no quotes.
`;

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.7,
        messages: [
          { role: "system", content: system },
          { role: "user", content: "Give one IELTS Writing Task 2 question (realistic 2024–2025 style)." }
        ]
      })
    });

    if (!resp.ok) {
      const text = await resp.text();
      console.error("OpenAI new-prompt error:", text);
      return res.status(502).json({ error: "Upstream error from OpenAI" });
    }

    const data = await resp.json();
    const prompt = data?.choices?.[0]?.message?.content?.trim();

    if (!prompt) {
      // Fallback an toàn, rõ ràng (không còn “Some people believe…”)
      return res.status(200).json({
        prompt:
          "In many countries, AI tools are used in schools to assist learning. Should schools encourage or restrict AI for homework and exams? Give reasons for your answer and include relevant examples."
      });
    }

    return res.status(200).json({ prompt });
  } catch (err) {
    console.error("new-prompt exception:", err);
    return res.status(500).json({ error: "Server error while generating prompt" });
  }
}
