import { runEval } from '../evalTool'
import { runLLM } from '../../src/llm'
import { ToolCallMatch } from '../scorers'
import { redditToolDefinition } from '../../src/tools/reddit'
import { readChatToolDefinition } from '../../src/tools/readChatTool'

const createToolCallMessage = (toolName: string) => ({
  role: 'assistant',
  tool_calls: [
    {
      type: 'function',
      function: { name: toolName },
    },
  ],
})

runEval('read_chat_file', {
  task: (input: string) =>
    runLLM({
      messages: [{ role: 'user', content: input }],
      tools: [readChatToolDefinition],
    }),
  data: [
    {
      input: 'who is riya talking to?',
      expected: createToolCallMessage(readChatToolDefinition.name),
    },
  ],
  scorers: [ToolCallMatch],
})