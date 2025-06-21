import { z } from 'zod';

export const weatherToolDefinition = {
    name: 'get_weather',
    description: `use this to tell the weather whenever asked about the weather!  `,
    parameters: z.object({
      reasoning: z.string().describe('why did you pick this tool?'),
    }),
  }

export const getWeather = (input:any) => 'very cold. 17deg' 