import 'dotenv/config';
import { Pinecone } from '@pinecone-database/pinecone';
import ora from 'ora';

// Get query from command line arguments
const query = process.argv[2];
if (!query) {
  console.error("❌ Please provide a query: `npm run query-pinecone \"your search text here\"`");
  console.error("📖 Example: npm run query-pinecone \"hello world\" 10");
  console.error("   The second parameter (10) is optional and sets the number of results");
  process.exit(1);
}

// Optional parameters
const topK = parseInt(process.argv[3]) || 5;

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

// Function to get embeddings using the same model as ingestion
async function getQueryEmbedding(text: string): Promise<number[]> {
  try {
    // Use Pinecone's inference API with the same model used in upsertRecords
    // The model used depends on your index configuration
    const response = await pinecone.inference.embed(
      'llama-text-embed-v2', // Common default for newer indexes
      [text],
      { inputType: 'query' }
    );
    
    return response.data[0].values || [];
  } catch (e5Error) {
    try {
      // Fallback to text-embedding-ada-002 (OpenAI model)
      const response = await pinecone.inference.embed(
        'text-embedding-ada-002',
        [text],
        { inputType: 'query' }
      );
      
      return response.data[0].values || [];
    } catch (adaError) {
      console.error('Failed with both embedding models:');
      console.error('E5 Error:', e5Error);
      console.error('Ada Error:', adaError);
      throw new Error('Unable to generate embeddings with available models');
    }
  }
}

async function queryPinecone() {
  const spinner = ora('🔍 Searching your chat history...').start();
  
  try {
    const indexName = process.env.PINECONE_INDEX_NAME || 'chatagent';
    const index = pinecone.index(indexName);

    spinner.text = '🤖 Converting query to embeddings...';
    
    // Get embeddings using the same model as ingestion
    const queryEmbedding = await getQueryEmbedding(query);
    
    spinner.text = '🔍 Searching with vector similarity...';

    // Use proper vector-based query with the correct embeddings
    const result = await index.query({
      vector: queryEmbedding,
      topK: topK,
      includeMetadata: true,
    });

    spinner.stop();

    if (!result.matches || result.matches.length === 0) {
      console.log(`\n❌ No results found for: "${query}"`);
      console.log('💡 Try different keywords or check if your database has been populated.');
      console.log('💡 Make sure you\'ve run: npm run ingest-pinecone');
      console.log('\n🔧 Debug info:');
      console.log(`   Index: ${indexName}`);
      console.log(`   Namespace: __default__`);
      console.log(`   Query: "${query}"`);
      console.log(`   Embedding dimensions: ${queryEmbedding.length}`);
      return;
    }

    console.log(`\n🔍 Query: "${query}"`);
    console.log(`📊 Found ${result.matches.length} results with vector similarity:\n`);
    
    result.matches.forEach((match: any, i: number) => {
      const metadata = match.metadata as any;
      console.log(`📝 Result ${i + 1} (Similarity: ${match.score?.toFixed(4)})`);
      console.log(`👤 Sender: ${metadata?.sender || 'Unknown'}`);
      console.log(`💬 Message: ${metadata?.message || 'No message'}`);
      console.log(`📅 Timestamp: ${metadata?.timestamp || 'No timestamp'}`);
      console.log(`🆔 ID: ${match.id}`);
      console.log('---');
    });

    // Summary
    console.log(`\n✅ Vector search completed! Found ${result.matches.length} semantically similar messages.`);
    console.log(`🤖 Using ${queryEmbedding.length}-dimensional embeddings`);

  } catch (error) {
    spinner.fail('❌ Query failed');
    
    if (error instanceof Error) {
      if (error.message.includes('UNAUTHENTICATED')) {
        console.error('\n🚨 AUTHENTICATION ERROR: Invalid Pinecone API key!');
        console.error('📝 Please check your PINECONE_API_KEY environment variable');
      } else if (error.message.includes('NOT_FOUND')) {
        console.error('\n🚨 INDEX ERROR: Pinecone index not found!');
        console.error(`📝 Please check your PINECONE_INDEX_NAME environment variable`);
        console.error(`💡 Current index name: ${process.env.PINECONE_INDEX_NAME || 'chatagent'}`);
      } else if (error.message.includes('embedding')) {
        console.error('\n🚨 EMBEDDING ERROR: Failed to generate embeddings!');
        console.error('💡 Make sure your Pinecone account has access to inference API');
        console.error('💡 You might need to upgrade your Pinecone plan');
      } else if (error.message.includes('dimension')) {
        console.error('\n🚨 DIMENSION MISMATCH: Embedding dimensions don\'t match your index!');
        console.error('💡 Your index might use a different embedding model');
        console.error('💡 Check your Pinecone dashboard for index configuration');
      } else {
        console.error('\nError details:', error.message);
        console.error('\n💡 Troubleshooting tips:');
        console.error('1. Make sure your Pinecone index exists and is active');
        console.error('2. Verify your API key has access to the index');
        console.error('3. Check that you\'ve ingested data using: npm run ingest-pinecone');
        console.error('4. Ensure your Pinecone plan supports the inference API');
      }
    }
    process.exit(1);
  }
}

// Export for use in other files
export async function queryDatabase(searchQuery: string, numResults: number = 5) {
  try {
    const indexName = process.env.PINECONE_INDEX_NAME || 'chatagent';
    const index = pinecone.index(indexName);
    
    // Use the same embedding approach as the CLI query
    const queryEmbedding = await getQueryEmbedding(searchQuery);
    
    const result = await index.query({
      vector: queryEmbedding,
      topK: numResults,
      includeMetadata: true,
    });

    return result.matches || [];
  } catch (error) {
    console.error('Error in queryDatabase:', error);
    throw error;
  }
}

// Run the query if this file is executed directly
queryPinecone().catch(console.error);
