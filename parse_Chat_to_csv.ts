import * as fs from 'fs';
import * as path from 'path';
import { createObjectCsvWriter } from 'csv-writer';

const chatFilePath = path.join(process.cwd(), 'Chat.txt'); // input
const outputCsvPath = path.join(process.cwd(), 'cleanChat.csv'); // output

const chatText = fs.readFileSync(chatFilePath, 'utf-8');

// Matches messages like: 25/10/24, 8:49 pm - Name: Message
const messageRegex = /^(\d{2})\/(\d{2})\/(\d{2}),\s(\d{1,2}):(\d{2})\u202f?(am|pm)?\s-\s(.*?):\s([\s\S]*?)(?=\n\d{2}\/\d{2}\/\d{2},|\n*$)/gmi;

type ChatRow = {
  timestamp: string;
  sender: string;
  message: string;
};

const parsedMessages: ChatRow[] = [];

let match: RegExpExecArray | null;

while ((match = messageRegex.exec(chatText)) !== null) {
  const [_, day, month, year, hour, minute, meridian, sender, message] = match;

  let hr = parseInt(hour);
  const min = parseInt(minute);

  // Handle 12-hour to 24-hour conversion
  if (meridian?.toLowerCase() === 'pm' && hr !== 12) hr += 12;
  if (meridian?.toLowerCase() === 'am' && hr === 12) hr = 0;

  const fullYear = parseInt(year) > 50 ? `19${year}` : `20${year}`;

  const timestamp = `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')} ${String(hr).padStart(2, '0')}:${String(min).padStart(2, '0')}`;

  parsedMessages.push({
    timestamp,
    sender: sender.trim(),
    message: message.replace(/\n/g, ' ').trim(),
  });
}

const csvWriter = createObjectCsvWriter({
  path: outputCsvPath,
  header: [
    { id: 'timestamp', title: 'timestamp' },
    { id: 'sender', title: 'sender' },
    { id: 'message', title: 'message' },
  ],
});

csvWriter.writeRecords(parsedMessages).then(() => {
  console.log(`✅ CSV file written to ${outputCsvPath}`);
});
