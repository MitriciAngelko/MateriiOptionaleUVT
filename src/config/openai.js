import OpenAI from "openai";

// OpenAI Configuration
export const OPENAI_CONFIG = {
  model: "gpt-4.1-mini", // Updated to a standard model name
  maxTokens: 200,
  temperature: 1,
  topP: 1,
  vectorStoreId: "vs_684a2742f1bc8191936efe3e9e734fb3",
  streaming: true
};

// System prompt for the academic assistant
export const SYSTEM_PROMPT = `Role: Academic assistant for info.uvt.ro, focused only on the Faculty of Mathematics and Computer Science (UVT).

✅ Purpose:
Provide clear, fact-based info on bachelor’s/master’s programs.

Explain course content, structure, prerequisites.
Help compare programs/specializations based on interests.
Clarify curriculum: core/electives, credits, progression.

🚫 Do not:
Discuss housing, fees, documents, events, or general UVT info.
Handle admissions, logistics, or give personal opinions.
Speculate—refer to official curriculum if uncertain. 
Make sure everything you say is according to the files shared with you.

🎯 Style Guide:
Prioritize clarity, density, and relevance.
Use bullet points, compact formatting, avoid filler.
No intros, chit-chat, or off-topic content.

Answer should not exceed 300 characters.
BE CONCISE AND THE INFORMATION SHOULD BE AS DENSE PACKED AS POSSIBLE (YOU HAVE A LIMIT OF 150 TOKENS).`;

// Initialize OpenAI client
export const initializeOpenAI = () => {
  const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
  
  if (!apiKey) {
    console.warn('OpenAI API key not found. Please set REACT_APP_OPENAI_API_KEY in your .env file.');
    return null;
  }
  
  return new OpenAI({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true, // Note: For production, use a backend proxy
  });
};

// Create request parameters for the Responses API
export const createRequestParams = (userMessage, previousResponseId = null, streaming = false) => {
  const inputData = [
    {
      "role": "system",
      "content": [
        {
          "type": "input_text",
          "text": SYSTEM_PROMPT
        }
      ]
    },
    {
      "role": "user",
      "content": [
        {
          "type": "input_text",
          "text": userMessage
        }
      ]
    }
  ];

  const requestParams = {
    model: OPENAI_CONFIG.model,
    input: inputData,
    text: {
      "format": {
        "type": "text"
      }
    },
    reasoning: {},
    tools: [
      {
        "type": "file_search",
        "vector_store_ids": [OPENAI_CONFIG.vectorStoreId]
      }
    ],
    temperature: OPENAI_CONFIG.temperature,
    max_output_tokens: OPENAI_CONFIG.maxTokens,
    top_p: OPENAI_CONFIG.topP,
    store: true,
    stream: streaming
  };

  // Add previous response ID for conversation continuity
  if (previousResponseId) {
    requestParams.previous_response_id = previousResponseId;
  }

  return requestParams;
};

// Extract response text from OpenAI Responses API response
export const extractResponseText = (response) => {
  let aiResponseText = "Nu am putut procesa răspunsul. Te rog să încerci din nou.";
  
  if (response.output && response.output.length > 0) {
    // Check for output_text property first (simpler approach)
    if (response.output_text) {
      return response.output_text;
    }
    
    // Find the message type output
    const messageOutput = response.output.find(output => output.type === "message");
    if (messageOutput && messageOutput.content && messageOutput.content.length > 0) {
      const textContent = messageOutput.content.find(content => content.type === "output_text");
      if (textContent && textContent.text) {
        aiResponseText = textContent.text;
      }
    }
  }
  
  return aiResponseText;
};

 