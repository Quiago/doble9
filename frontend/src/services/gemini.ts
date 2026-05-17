// services/gemini.ts — Gemini image-gen wrapper for avatars (CLAUDE.md §6).
// AGENT: Frontend. Claude is poor at images; Gemini gives consistent Muppet
// variants. Key from VITE_GEMINI_API_KEY (dev budget ~$20/mo, CLAUDE.md §15).
const ENDPOINT =
  "https://generativelanguage.googleapis.com/v1beta/models/" +
  "gemini-2.0-flash-exp-image-generation:generateContent";

interface GeminiPart {
  inlineData?: { mimeType: string; data: string };
  text?: string;
}

export class GeminiAvatarService {
  constructor(private apiKey = import.meta.env.VITE_GEMINI_API_KEY) {}

  /** Returns a `data:` URL for the generated Manolito-style avatar. */
  async generateAvatar(style: string, expression: string): Promise<string> {
    if (!this.apiKey) throw new Error("VITE_GEMINI_API_KEY is not set");

    const prompt =
      `Generate a Muppet-style Cuban puppet character named Manolito. ` +
      `${style}. ${expression}. White guayabera shirt, gold chain, ` +
      `sunglasses. Felt texture with visible stitching. Plain white ` +
      `background. High quality toy photography.`;

    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": this.apiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseModalities: ["Text", "Image"] },
      }),
    });

    if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`);

    const json = await res.json();
    const parts: GeminiPart[] =
      json?.candidates?.[0]?.content?.parts ?? [];
    const img = parts.find((p) => p.inlineData);
    if (!img?.inlineData) throw new Error("Gemini returned no image");
    return `data:${img.inlineData.mimeType};base64,${img.inlineData.data}`;
  }
}

export const geminiAvatars = new GeminiAvatarService();
