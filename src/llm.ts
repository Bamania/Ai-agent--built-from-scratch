import type { AIMessage } from "../globaltypes";
import { openai } from "./ai";
import {zodFunction} from "openai/helpers/zod";
import {v4 as uuidv4} from "uuid"
import { systemPrompt } from "./systemPrompt";

export const runLLM=async({messages,tools}:{messages:AIMessage[],tools:any[]})=>{
    
    // Handle both zod and regular tool definitions
    const formattedTools = tools.map(tool => {
        // If tool has parameters as zod object, use zodFunction
        if (tool.parameters && typeof tool.parameters.parse === 'function') {
            return zodFunction(tool);
        }
        // If tool is already in OpenAI format, use as is
        return tool;
    });
    
    const response = await openai.chat.completions.create({
        model: 'gemini-2.5-flash',
        temperature: 0.1,
        messages: [{role: "system", content: systemPrompt}, ...messages],
        tools: formattedTools,
        tool_choice:"auto", //give the  llm power to choose the tool on its use
        parallel_tool_calls:false, //dont call the tools in parallel
        // max_tokens:1000 this lets you control the length of the response ! 
        // however you still could bigger response of more tokens ,but it will cut the ans off at just max tokens
        // due to which you will get a bad response !
      })
    
    const message = response.choices[0].message;

      if (message.tool_calls) {
        message.tool_calls = message.tool_calls.map((toolCall) => ({
          ...toolCall,
          id: toolCall.id || uuidv4(),
        }));
      }
    

    return message;
}
     
