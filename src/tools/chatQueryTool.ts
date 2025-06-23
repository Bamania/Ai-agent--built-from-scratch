import { z } from 'zod';
import { queryDatabase } from '../rag/query.js';

export const chatQueryToolDefinition = {
  name: 'search_chat_history',
  description: 'Searches through chat history using vector similarity. Useful for finding specific conversations, topics, or messages.',
  parameters: z.object({
    query: z.string().describe('Search query to find relevant chat messages'),
    topK: z.number().optional().default(5).describe('Number of results to return (default: 5)')
  }),
};

type Args = z.infer<typeof chatQueryToolDefinition.parameters>;

export const searchChatHistory = async ({ query, topK = 5 }: Args) => {
  try {
    const results = await queryDatabase(query, topK);
    
    if (results.length === 0) {
      return `No chat messages found for query: "${query}". Try different keywords or check if the chat database has been populated.`;
    }
    
    // Format results for the AI agent
    const formattedResults = results.map((match: any, idx: number) => {
      const metadata = match.metadata as any;
      return `Result ${idx + 1} (Score: ${match.score?.toFixed(4)}):
Sender: ${metadata?.sender || 'Unknown'}
Message: ${metadata?.message || 'No message'}
Timestamp: ${metadata?.timestamp || 'No timestamp'}
---`;
    }).join('\n');
    
    return `Found ${results.length} relevant chat messages for "${query}":\n\n${formattedResults}`;
    
  } catch (error) {
    console.error('Error searching chat history:', error);
    return `Error occurred while searching chat history: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}; 