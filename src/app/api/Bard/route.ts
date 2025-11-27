// src/app/api/Bard/route.ts
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(request: Request) {
  try {
    // Safely parse JSON body
    const body = await request.json().catch(() => null);
    const questionRaw = (body as any)?.question;
    const question =
      typeof questionRaw === "string" ? questionRaw.trim() : "";

    if (!question) {
      return NextResponse.json(
        { text: "No question provided." },
        { status: 400 }
      );
    }

    const apiKey = process.env.BARD_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          text:
            "AI is not configured. Please set BARD_API_KEY in your .env file.",
        },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

    // Simple prompt – let Gemini handle Q/A style
    const result = await model.generateContent(question);
    const response = result.response;
    const text = response.text();

    return NextResponse.json({ text });
  } catch (error: any) {
    console.error("Bard route error:", error);
    return NextResponse.json(
      { text: `AI error: ${error?.message || "Unknown error"}` },
      { status: 500 }
    );
  }
}
