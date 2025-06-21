import { z } from 'zod';
import { promises as fs } from 'fs';
import path from 'path';

export const readChatToolDefinition = {
  name: 'read_chat_file',
  description: 'Reads the content of the Chat_formatted.txt file.',
  parameters: z.object({}),
};

type Args = z.infer<typeof readChatToolDefinition.parameters>;

export const readChatFile= async () => {
  try {
    const chatFilePath = path.join(process.cwd(), 'Chat_formatted.txt');
    const content = await fs.readFile(chatFilePath, 'utf-8');
    return content;
  } catch (error) {
    if (error instanceof Error && (error as NodeJS.ErrnoException).code === 'ENOENT') {
        const chatFilePath = path.join(process.cwd(), 'Chat_formatted.txt');
        await fs.writeFile(chatFilePath, '');
        return "Chat_formatted.txt did not exist. I have created it for you. It's currently empty.";
    }
    console.error('Error reading Chat_formatted.txt:', error);
    return 'An error occurred while trying to read the Chat_formatted.txt file.';
  }
}; 