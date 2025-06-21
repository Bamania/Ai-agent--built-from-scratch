import { log } from "console";
import { runLLM } from "./llm";
import { addMessages, getMessages, saveToolResponse } from "./memory";
import { logMessage, showLoader } from "./ui";
import { runTool } from "./toolRunner";

export const runAgent = async ({userMessage,tools}:{userMessage:string,tools:any[]} ) => {
  
//   always add the messages to the history first --KEY RULE

while(true){
  const history = await getMessages();

  const loader =  showLoader("Thinking ");
  
  //feed the llm your messages and the tools 
  const response = await runLLM({
    messages: history,
    tools
  });

  // addiing the response that ai asks us to do the tool call
await addMessages([response])

if(response.content){
  loader.stop();
  logMessage(response)
  return getMessages();
}


  // openai sdk stuff-if you get the response.content =>that means ai has the final answer
  // if you get the response.tool_calls =>that means ai has the tool call
  // you can also check on the stop reason property
if(response.tool_calls){
  // for(const toolCall of response.tool_calls){ only when we had parallel tool calls but we have parallel tool call set to false 
  const toolCall=response.tool_calls[0]

  loader.update(`executing: ${toolCall.function.name}`)
  const toolResponse=await runTool(toolCall,userMessage)
  await saveToolResponse(toolCall.id ,toolResponse )
  // now we have to add the tool call to the history
  logMessage(response)
  // now adding the response of the tool call that ai asked us to do on line 21
  await addMessages([{ role: "tool", content: toolResponse,tool_call_id:toolCall.id }]);
  
  loader.succeed(`executed: ${toolCall.function.name}`)
  // now we have to add the tool call to the history
}

}
};
