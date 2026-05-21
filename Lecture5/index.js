import { GoogleGenAI, Type } from "@google/genai";
import readlineSync from "readline-sync";
import "dotenv/config";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// ================= WEATHER FUNCTION =================

async function weatherInfo({ city }) {
  const weather = await fetch(`http://api.weatherapi.com/v1/current.json?key=${process.env.WEATHER_API_KEY}&q=${city}&aqi=no`)
  const data = await weather.json();

  return data
}
//const weather = await fetch(`http://api.weatherapi.com/v1/current.json?key=0597ba51816e4078ba5135807261905&q=${city}&aqi=no`)
// ================= CRYPTO FUNCTION =================

async function cryptoCurrency({ coin }) {
  const response = await fetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=inr&ids=${coin}`);
  const data = await response.json();

  return data[0];
}

// ================= TOOL DECLARATIONS =================

const weatherTool = {
  name: "weatherInfo",
  description: "Get current weather of a city",
  parameters: {
    type: Type.OBJECT,
    properties: {
      city: {
        type: Type.STRING,
        description: "City name",
      },
    },
    required: ["city"],
  },
};

const cryptoTool = {
  name: "cryptoCurrency",
  description: "Get cryptocurrency information",
  parameters: {
    type: Type.OBJECT,
    properties: {
      coin: {
        type: Type.STRING,
        description: "Crypto coin name like bitcoin",
      },
    },
    required: ["coin"],
  },
};

// ================= TOOLS =================

const tools = [
  {
    functionDeclarations: [weatherTool, cryptoTool],
  },
];

// ================= TOOL MAPPING =================

const toolFunctions = {
  weatherInfo,
  cryptoCurrency,
};

// ================= CHAT HISTORY =================

const history = [];

// ================= AGENT =================

async function runAgent() {
  const result = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: history,
    config: {
      tools,
    },
  });

  // ================= FUNCTION CALL =================

  if (result.functionCalls && result.functionCalls.length > 0) {
    const functionCall = result.functionCalls[0];

    const { name, args } = functionCall;

    console.log(`Calling Function: ${name}`);

    const toolResponse = await toolFunctions[name](args);

    // model message
    history.push({
      role: "model",
      parts: [
        {
          functionCall: functionCall,
        },
      ],
    });

    // tool response
    history.push({
      role: "user",
      parts: [
        {
          functionResponse: {
            name: name,
            response: {
              result: toolResponse,
            },
          },
        },
      ],
    });

    // call model again with tool response
    return runAgent();
  }

  // ================= FINAL RESPONSE =================

  console.log("\nAI:", result.text);

  history.push({
    role: "model",
    parts: [
      {
        text: result.text,
      },
    ],
  });
}

// ================= CLI LOOP =================

while (true) {
  const question = readlineSync.question("\nAsk anything: ");

  if (question.toLowerCase() === "exit") {
    break;
  }

  history.push({
    role: "user",
    parts: [
      {
        text: question,
      },
    ],
  });

  await runAgent();
}