import type { AIMessage } from "../globaltypes";
import { openai } from "./ai";
import {zodFunction} from "openai/helpers/zod";

export const runLLM=async({messages,tools}:{messages:AIMessage[],tools:any[]})=>{
    
    const formattedTools=tools.map(zodFunction)
    
    const response = await openai.chat.completions.create({
        model: 'gemini-2.5-flash',
        temperature: 0.1,
        messages,
        tools:formattedTools,
        tool_choice:"auto", //give the  llm power to choose the tool on its use
        parallel_tool_calls:false //dont call the tools in parallel
      })
    
    console.log(response.choices[0].message);
    return response.choices[0].message;
}
     