import { z } from 'zod'
import type { ToolFn } from '../../globaltypes'

export const dadJokeToolDefinition = {
  name: 'dad_joke',
  parameters: z.object({}),
  description: 'Generate a dad joke for entertainment',
}

type Args = z.infer<typeof dadJokeToolDefinition.parameters>

interface DadJokeResponse {
  id: string;
  joke: string;
  status: number;
}

export const dadJoke: ToolFn<Args, string> = async ({ toolArgs }) => {
  const res = await fetch('https://icanhazdadjoke.com/', {
    headers: {
      Accept: 'application/json',
    },
  })
  const data = (await res.json()) as DadJokeResponse
  return data.joke
}
