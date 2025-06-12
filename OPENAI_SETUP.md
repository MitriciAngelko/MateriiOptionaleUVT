# OpenAI Responses API Setup Guide

This document provides instructions for setting up the OpenAI Responses API integration in the AI Assistant component.

## Prerequisites

1. **OpenAI Account**: You need an active OpenAI account with API access
2. **API Key**: Generate an API key from the OpenAI platform
3. **Model Access**: Ensure your account has access to `gpt-4.1-mini` model
4. **Responses API Access**: The new Responses API should be available in your account
5. **Vector Store**: Access to the configured vector store (`vs_684a2742f1bc8191936efe3e9e734fb3`)

## Setup Instructions

### 1. Get Your OpenAI API Key

1. Visit [OpenAI API Keys](https://platform.openai.com/api-keys)
2. Sign in to your account
3. Click "Create new secret key"
4. Copy the generated API key (starts with `sk-`)
5. Store it securely - you won't be able to see it again

### 2. Configure Environment Variables

Create a `.env` file in the root directory of your project:

```bash
# Create the .env file
touch .env
```

Add the following content to your `.env` file:

```env
# OpenAI API Configuration
REACT_APP_OPENAI_API_KEY=your_actual_api_key_here
```

**Important**: Replace `your_actual_api_key_here` with your real OpenAI API key.

### 3. Update .gitignore

Make sure your `.env` file is in `.gitignore` to prevent accidentally committing your API key:

```gitignore
# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
```

### 4. Install Dependencies

The OpenAI package should already be installed. If not, run:

```bash
npm install openai
```

### 5. Start the Application

```bash
npm start
```

## Configuration Options

You can modify the AI Assistant behavior by editing `src/config/openai.js`:

### Available Models
- `gpt-4.1-mini` (default)
- `gpt-4.1`
- `gpt-4o`
- `o3`
- `o4-mini`

### Configurable Parameters
- `model`: The OpenAI model to use
- `maxTokens`: Maximum response length (default: 2048)
- `temperature`: Response randomness (0-2, default: 1)
- `topP`: Nucleus sampling parameter (default: 1)
- `vectorStoreId`: Vector store for file search tool

## Features

### Core Functionality
- **Stateful Conversations**: Automatic conversation history management
- **File Search Integration**: Access to uploaded curriculum documents via vector store
- **Academic Focus**: Specialized for UVT Faculty of Mathematics and Computer Science
- **Romanian Language**: Responses in Romanian language
- **Error Handling**: Comprehensive error handling with user-friendly messages

### New Responses API Features
- **Multi-turn Conversations**: Seamless conversation continuity
- **Tool Integration**: Built-in file search capability
- **Enhanced Context**: Better understanding of conversation flow
- **Improved Performance**: Optimized for academic assistance use cases

## Troubleshooting

### Common Issues

#### "API key not found" Error
- Ensure you've created a `.env` file in the project root
- Check that the variable name is exactly `REACT_APP_OPENAI_API_KEY`
- Restart the development server after adding the API key

#### "Model not found" Error
- Verify your OpenAI account has access to `gpt-4.1-mini`
- Check if the Responses API is available in your region
- Try using `gpt-4o` or `gpt-4o-mini` as alternative models

#### "Quota exceeded" Error
- Check your OpenAI account billing and usage limits
- Upgrade your plan if necessary
- Monitor your API usage in the OpenAI dashboard

#### "Network/Connection" Errors
- Check your internet connection
- Verify firewall settings aren't blocking API calls
- For production, consider implementing a backend proxy instead of direct client calls

### Security Considerations

#### Development vs Production
- The current implementation uses `dangerouslyAllowBrowser: true` for development
- **For production**, implement a backend proxy to protect your API key
- Never expose API keys in client-side code in production environments

#### Rate Limiting
- Implement client-side rate limiting if needed
- Monitor API usage to avoid unexpected charges
- Consider implementing request queuing for high-traffic scenarios

## Academic Assistant Capabilities

The AI Assistant is specifically configured for the UVT Faculty of Mathematics and Computer Science and can help with:

- **Program Information**: Bachelor's and master's programs
- **Curriculum Details**: Course content, prerequisites, structure
- **Academic Guidance**: Program selection based on interests
- **Course Information**: Core and elective courses, credits, progression

### What the Assistant Won't Do
- Answer questions about housing, fees, or administrative documents
- Provide general university information unrelated to academic programs
- Offer personal opinions or speculative information
- Handle non-academic queries

## API Reference

### Responses API Endpoint
The implementation uses the new OpenAI Responses API:
```javascript
openai.responses.create({
  model: "gpt-4.1-mini",
  input: [...],
  tools: [{ type: "file_search", vector_store_ids: [...] }],
  // ... other parameters
})
```

### Response Structure
The API returns a response object with:
- `id`: Unique response identifier for conversation continuity
- `output`: Array of response outputs (messages, tool calls, etc.)
- `output_text`: Simplified text response
- `usage`: Token usage information

## Support

For technical issues:
1. Check the browser console for detailed error messages
2. Verify your OpenAI account status and quotas
3. Ensure all dependencies are properly installed
4. Review the OpenAI API documentation for the latest updates

For configuration questions, refer to the `src/config/openai.js` file which contains all configurable parameters and detailed comments. 