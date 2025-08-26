export default async function handler(req, res) {
  const { level = "B2" } = req.query;

  const system = `You are an IELTS Writing teacher. Generate one concise Task 2 prompt only, localized for Vietnamese learners. Keep it <40 words. Level: ${level}.`;

  const completion = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: system },
        { role: "user", content: "Give me one IELTS Writing Task 2 topic." }
      ],
      temperature: 0.7
    })
  }).then(r => r.json());

  const prompt = completion.choices?.[0]?.message?.content?.trim()
               || "Some people believe… Do you agree or disagree?";

  res.status(200).json({ prompt });
}
