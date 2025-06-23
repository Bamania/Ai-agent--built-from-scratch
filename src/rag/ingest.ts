import 'dotenv/config'
import { Index as UpstashIndex } from '@upstash/vector'
import { parse } from 'csv-parse/sync'
import fs from 'fs'
import path from 'path'
import ora from 'ora'

// Initialize Upstash Vector client
const index = new UpstashIndex({
  url: process.env.UPSTASH_VECTOR_REST_URL ,
  token: process.env.UPSTASH_VECTOR_REST_TOKEN 
})

// Function to index chat data
export async function indexChatData() {
  const spinner = ora('Reading chat file...').start()

  // Read and parse CSV file
  const csvPath = path.join(process.cwd(), 'src/rag/cleanChat.csv')
  
  if (!fs.existsSync(csvPath)) {
    // Try alternative path
    const altPath = path.join(process.cwd(), 'cleanChat.csv')
    if (!fs.existsSync(altPath)) {
      spinner.fail('cleanChat.csv file not found in either location!')
      return
    }
    console.log('Found cleanChat.csv in root directory')
    const csvData = fs.readFileSync(altPath, 'utf-8')
  } else {
    console.log('Found cleanChat.csv in src/rag/ directory')
  }
  
  const csvData = fs.readFileSync(csvPath, 'utf-8')
  const records = parse(csvData, {
    columns: true,
    skip_empty_lines: true,
  })

  spinner.text = `Starting chat indexing... (${records.length} messages to process)`

  // Index each chat message
  for (let i = 0; i < records.length; i++) {
    const chat = records[i]
    spinner.text = `Indexing message ${i + 1} of ${records.length}`
    
    // Create a meaningful text for embedding that includes context
    const text = `${chat.sender} said: ${chat.message} at ${chat.timestamp}`

    try {
      // Use the correct upsert format (array of objects)
      await index.upsert([{
        id: `chat_${i}`, // Using index as unique ID
        data: text, // Text will be automatically embedded
        metadata: {
          timestamp: chat.timestamp,
          sender: chat.sender,
          message: chat.message,
          messageIndex: i,
          date: chat.timestamp.split(' ')[0], // Extract date part
          time: chat.timestamp.split(' ')[1], // Extract time part
        },
      }])

      // Log progress every 100 messages
      if (i % 100 === 0 && i > 0) {
        console.log(`✓ Processed ${i} messages...`)
      }

    } catch (error) {
      spinner.fail(`Error indexing message ${i + 1}`)
      console.error('Error details:', error)
      
      // Check if it's a permissions error
      if (error instanceof Error && error.message.includes('Forbidden')) {
        console.error('\n🚨 PERMISSION ERROR: Your token appears to be read-only!')
        console.error('📝 Please get a WRITE-enabled token from your Upstash dashboard')
        console.error('🔗 Go to: https://console.upstash.com/vector')
        console.error('💡 Create a new token with write permissions')
      }
      throw error
    }
  }

  spinner.succeed(`Finished indexing ${records.length} chat messages!`)
}

// Run the indexing
indexChatData().catch(console.error)