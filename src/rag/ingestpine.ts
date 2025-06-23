import 'dotenv/config'
import { Pinecone } from '@pinecone-database/pinecone'
import { parse } from 'csv-parse/sync'
import fs from 'fs'
import path from 'path'
import ora from 'ora'

// Type for chat record
interface ChatRecord {
  sender: string
  message: string
  timestamp: string
}

// Initialize Pinecone client
const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!
})

// Get your index using environment variables
const indexName = process.env.PINECONE_INDEX_NAME || 'chatagent'
const index = pc.index(indexName)

// Function to index chat data
export async function indexChatData() {
  const spinner = ora('Reading chat file...').start()

  // Read and parse CSV file
  let csvPath = path.join(process.cwd(), 'src/rag/cleanChat.csv')
  
  if (!fs.existsSync(csvPath)) {
    // Try alternative path in root directory
    csvPath = path.join(process.cwd(), 'cleanChat.csv')
    if (!fs.existsSync(csvPath)) {
      spinner.fail('cleanChat.csv file not found in either src/rag/ or root directory!')
      return
    }
    spinner.text = 'Found cleanChat.csv in root directory'
  } else {
    spinner.text = 'Found cleanChat.csv in src/rag/ directory'
  }
  
  const csvData = fs.readFileSync(csvPath, 'utf-8')
  const records: ChatRecord[] = parse(csvData, {
    columns: true,
    skip_empty_lines: true,
  })

  spinner.text = `Starting chat indexing... (${records.length} messages to process)`

  // Process in batches (Pinecone upsertRecords limit is 96)
  const batchSize = 90 // Staying safely under the 96 limit
  const totalBatches = Math.ceil(records.length / batchSize)
  
  for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
    const start = batchIndex * batchSize
    const end = Math.min(start + batchSize, records.length)
    const batch = records.slice(start, end)
    
    spinner.text = `Processing batch ${batchIndex + 1}/${totalBatches} (messages ${start + 1}-${end})`
    
    // Prepare batch data for Pinecone using upsertRecords (auto-embedding)
    const records_to_upsert = batch.map((chat: ChatRecord, i: number) => {
      const globalIndex = start + i
      
      // Create meaningful text for embedding
      const text = `${chat.sender} said: ${chat.message} at ${chat.timestamp}`
      
      return {
        "_id": `chat_${globalIndex}`,
        "text": text, // This will be automatically converted to embeddings by Pinecone
        "sender": chat.sender,
        "message": chat.message,
        "timestamp": chat.timestamp,
        "messageIndex": globalIndex,
        "date": chat.timestamp.split(' ')[0], // Extract date part
        "time": chat.timestamp.split(' ')[1], // Extract time part
      }
    })

    try {
      // Upsert batch to Pinecone using the newer upsertRecords method
      await index.namespace("__default__").upsertRecords(records_to_upsert)
      
      console.log(`✅ Successfully processed batch ${batchIndex + 1}/${totalBatches} (${records_to_upsert.length} messages)`)
      
    } catch (error) {
      spinner.fail(`Error processing batch ${batchIndex + 1}`)
      console.error('Error details:', error)
      
      // Check for common Pinecone errors
      if (error instanceof Error) {
        if (error.message.includes('UNAUTHENTICATED')) {
          console.error('\n🚨 AUTHENTICATION ERROR: Invalid Pinecone API key!')
          console.error('📝 Please check your PINECONE_API_KEY environment variable')
        } else if (error.message.includes('NOT_FOUND')) {
          console.error('\n🚨 INDEX ERROR: Pinecone index not found!')
          console.error(`📝 Please check your index name: ${indexName}`)
          console.error('💡 Make sure the index exists in your Pinecone dashboard')
        }
      }
      throw error
    }
    
    // Small delay between batches
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  spinner.succeed(`🎉 Finished indexing ${records.length} chat messages to Pinecone!`)
  console.log(`📊 Total batches processed: ${totalBatches}`)
  console.log(`📝 Index used: ${indexName}`)
  console.log(`🤖 Using Pinecone auto-embeddings (upsertRecords method)`)
}

// Run the indexing
indexChatData().catch(console.error)