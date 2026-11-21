
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  const message = req.body?.message;

  if (!apiKey) {
    return res.status(500).json({ error: "API key missing" });
  }

  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "Message required" });
  }

  const url =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent";

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },
        body: JSON.stringify({
          system_instruction: {
            parts: [{
              text: "You are Kyra AI, a smart and friendly assistant. Reply in the user's language."
            }]
          },
          contents: [{
            role: "user",
            parts: [{ text: message }]
          }]
        })
      });

      const data = await response.json();

      if (response.ok) {
        const reply = data.candidates?.[0]?.content?.parts
          ?.map(part => part.text || "")
          .join("");

        return res.status(200).json({
          reply: reply || "Please try again."
        });
      }

      if (![429, 500, 502, 503, 504].includes(response.status)) {
        return res.status(502).json({
          error: data.error?.message || "Gemini API error"
        });
      }

    } catch (error) {
      console.error("Attempt failed:", error);
    }

    if (attempt < 3) {
      await new Promise(resolve =>
        setTimeout(resolve, attempt * 2000)
      );
    }
  }

  return res.status(503).json({
    error: "Gemini server is busy. Please try again in a few minutes."
  });
}

