export default async function handler(req, res) {
  const { level = "B2" } = req.query;

  try {
    const completion = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.7,
        messages: [
          {
            role: "system",
            content: `You are an IELTS Writing Task 2 teacher.
Give one realistic IELTS Writing Task 2 question from 2024 or 2025 exam style.
Be concrete (education, AI, environment, technology, jobs, etc).
Keep it under 40 words. Level: ${level}.
Return ONLY the prompt sentence, nothing else.`
          },
          { role: "user", content: "Generate one IELTS Writing Task 2 question." }
        ]
      })
    });

    if (!completion.ok) {
      const text = await completion.text();
      console.error("OpenAI error:", text);
      return res.status(500).json({ error: "OpenAI API error", details: text });
    }

    const data = await completion.json();
    const prompt = data?.choices?.[0]?.message?.content?.trim();

    return res.status(200).json({ prompt: prompt || "Error: no prompt returned" });
  } catch (err) {
    console.error("Exception:", err);
    return res.status(500).json({ error: "Server exception", details: String(err) });
  }
}
