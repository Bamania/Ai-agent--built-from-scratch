import type { AIMessage } from "../globaltypes";
import { openai } from "./ai";

export const runLLM=async(messages:AIMessage[])=>{

    const response = await openai.chat.completions.create({
        model: 'gemini-2.5-flash',
        temperature: 0.1,
        messages,
      })
    
    console.log(response.choices[0].message);
    return response.choices[0].message;
}
     