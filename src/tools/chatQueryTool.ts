import { z } from 'zod';
import { queryDatabase } from '../rag/query.js';

export const chatQueryToolDefinition = {
  type: "function" as const,
  function: {
    name: 'search_chat_history',
    description: 'Searches through chat history of Riya and Aman using vector similarity. Useful for finding specific conversations, topics, or messages. Use this when users ask about finding specific messages, topics, or conversations.',
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query to find relevant chat messages (e.g., 'love', 'work project', 'meeting discussion')"
        },
        topK: {
          type: "number",
          description: "Number of results to return (default: 5)",
          default: 5
        }
      },
      required: ["query"]
    }
  }
};

type Args = {
  query: string;
  topK?: number;
};

export const searchChatHistory = async ({ query, topK = 5 }: Args) => {
  try {
    console.log(`🔍 Searching chat history for: "${query}"`);
    const results = await queryDatabase(query, topK);
    
    if (results.length === 0) {
      return `No chat messages found for query: "${query}". Try different keywords or check if the chat database has been populated.`;
    }
    
    // Format results for the AI agent
    const formattedResults = results.map((match: any, idx: number) => {
      const metadata = match.metadata as any;
      return `Result ${idx + 1} (Similarity: ${match.score?.toFixed(4)}):
Sender: ${metadata?.sender || 'Unknown'}
Message: ${metadata?.message || 'No message'}
Timestamp: ${metadata?.timestamp || 'No timestamp'}
---`;
    }).join('\n');
    
    return `Found ${results.length} relevant chat messages for "${query}":\n\n${formattedResults}`;
    
  } catch (error) {
    console.error('Error searching chat history:', error);
    return `Error occurred while searching chat history: ${error instanceof Error ? error.message : 'Unknown error'}. Please check if the chat database has been properly set up and populated.`;
  }
}; 