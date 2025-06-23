import { runEval } from '../evalTool'
import { runLLM } from '../../src/llm'
import { ToolCallMatch } from '../scorers'
import { redditToolDefinition } from '../../src/tools/reddit'

const createToolCallMessage = (toolName: string) => ({
  role: 'assistant',
  tool_calls: [
    {
      type: 'function',
      function: { name: toolName },
    },
  ],
})

runEval('reddit_posts', {
  task: (input: string) =>
    runLLM({
      messages: [{ role: 'user', content: input }],
      tools: [redditToolDefinition],
    }),
  data: [
    {
      input: 'tell me something cool from reddit',
      expected: createToolCallMessage(redditToolDefinition.name),
    },
    {
      input: 'tell me something cool from google',
      expected: createToolCallMessage(redditToolDefinition.name),
    },
    {
      input: 'tell me something cool ',
      expected: createToolCallMessage(redditToolDefinition.name),
    },
  ],
  scorers: [ToolCallMatch],
})

/* 

const rulEval=(input,output,expected)



*/