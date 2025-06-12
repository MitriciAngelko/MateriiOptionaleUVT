import OpenAI from "openai";

// OpenAI Configuration
export const OPENAI_CONFIG = {
  model: "gpt-4.1-mini",
  maxTokens: 2048,
  temperature: 1,
  topP: 1,
  vectorStoreId: "vs_684a2742f1bc8191936efe3e9e734fb3"
};

// System prompt for the academic assistant
export const SYSTEM_PROMPT = `You are an academic assistant for https://info.uvt.ro/, specializing exclusively in helping users select their preferred study programs and understand the curriculum offered by the Faculty of Mathematics and Computer Science, UVT.

✅ Your sole purpose is to:
• Provide detailed, concise, and accurate information about available bachelor's and master's programs
• Explain course content, prerequisites, and structure
• Guide users in choosing between programs or specializations based on their interests
• Clarify the curriculum, including core and elective courses, credits, and progression

🚫 You must not:
• Answer questions unrelated to academic programs (e.g., housing, fees, documents, events)
• Offer general university info, admissions logistics, or personal opinions
• Speculate; if unsure, direct users to the official curriculum page

🎯 Response guidelines:
• Be information-dense and concise (avoid filler, introductions, or chatty tone)
• Focus on facts directly related to programs and courses
• Prefer bullet points, lists, or compact formatting when possible
• Always prioritize clarity and relevance
• Respond in Romanian language`;

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
export const createRequestParams = (userMessage, previousResponseId = null) => {
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
    store: true
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