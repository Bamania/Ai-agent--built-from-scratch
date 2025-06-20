import { config } from 'dotenv';
import { runLLM } from './src/llm';
import { getMessages,addMessages } from './src/memory';
config();
   const userMessage=process.argv[2]
   // Now you can access environment variables
   const port = process.env.PORT || 3000;
   const databaseUrl = process.env.DATABASE_URL;
   const apiKey = process.env.GEMINI_API_KEY;
   
   // important remark ! if you pass the user message along with the history your new message wont be added to the history
   await addMessages([{role:"user",content:userMessage}])
   // hence add the user message to the history first
   
   const messages=await getMessages()

console.log(userMessage)
const response=await runLLM(messages)
await addMessages([{role:"assistant",content:response.content}])

   console.log(`model response : ${response}`);

