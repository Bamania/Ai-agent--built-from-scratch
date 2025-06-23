// tool runner is a function that runs a tool call according to the user message ,
// to execute the tool call we need to know the tool call id ,user message and the tool call arguments
import type OpenAI from 'openai'
import { readChatFile } from './tools/readChatTool';
import { getWeather } from './tools/getWeather';
import { dadJoke } from './tools/DadJokeGen';
import { reddit } from './tools/reddit';
import { searchChatHistory } from './tools/chatQueryTool';

// one tool function working 


export const runTool = async (
  toolCall: OpenAI.Chat.Completions.ChatCompletionMessageToolCall,
  userMessage: string
) => {
    // to control the function inputs !
  const input = {
    userMessage,
    toolArgs: JSON.parse(toolCall.function.arguments),
  }
//   this is how we makes sure how to run things that i want and has the right arguments 
  switch (toolCall.function.name) {
    case 'get_weather':
        return getWeather(input)
      // case "read_chat_file":
      //   return readChatFile()
      case "dad_joke":
        return dadJoke(input)
    case "reddit_posts":
      return reddit(input)
    case "search_chat_history":
      return searchChatHistory(input.toolArgs)
    default:
      throw new Error(`Unknown tool: ${toolCall.function.name}`)
  }
}
