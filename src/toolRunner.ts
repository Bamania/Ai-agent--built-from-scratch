// tool runner is a function that runs a tool call according to the user message ,
// to execute the tool call we need to know the tool call id ,user message and the tool call arguments
import type OpenAI from 'openai'

const getWeather = (input:any) => 'very cold. 17deg'

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

    default:
      throw new Error(`Unknown tool: ${toolCall.function.name}`)
  }
}
