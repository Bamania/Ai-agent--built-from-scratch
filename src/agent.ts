import { log } from "console";
import { runLLM } from "./llm";
import { addMessages, getMessages } from "./memory";
import { logMessage, showLoader } from "./ui";

export const runAgent = async ({userMessage,tools}:{userMessage:string,tools:any[]} ) => {
  await addMessages([{ role: "user", content: userMessage }]);
//   always add the messages to the history first --KEY RULE
  const history = await getMessages();

  const loader =  showLoader("Thinking ");
  
  //feed the llm your messages and the tools 
  const response = await runLLM({
    messages: history,
    tools
  });
if(response.tool_calls){
console.log(response.tool_calls)
}
  await addMessages([{ role: "assistant", content: response.content }]);
logMessage(response);
  loader.stop(); 
  return getMessages(); 
};
