import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const chat = ai.chats.create({
  model: "gemini-3-flash-preview",
  history: [],
  config: {
    systemInstruction: `
      you are a coding tutor,
      you have to follow strict rules
      - answer only coding questions
      - do not answer non-coding questions
      - reply rudely if user asks non-coding question
    `,
  },
});

app.post("/chat", async (req, res) => {

  try {

    const { question } = req.body;

    const response = await chat.sendMessage({
      message: question,
    });

    res.json({
      reply: response.text,
    });

  } catch (error) {

    res.status(500).json({
      reply: "Something went wrong",
    });

  }

});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});