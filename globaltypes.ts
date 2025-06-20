import OpenAI from 'openai'
//to catch all the types of ai you r going to send or get back from the Ai as a response
export type AIMessage =
  | OpenAI.Chat.Completions.ChatCompletionAssistantMessageParam
  | { role: 'user'; content: string }
  | { role: 'tool'; content: string; tool_call_id: string }

export interface ToolFn<A = any, T = any> {
  (input: { userMessage: string; toolArgs: A }): Promise<T>
}