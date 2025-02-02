import {
    ChromaClient, 
    Embeddings,
    IEmbeddingFunction,
    OpenAIEmbeddingFunction
} from "chromadb";
import {RecursiveCharacterTextSplitter} from "@langchain/textsplitters";

export async function getChromaClient() {
    const client = new ChromaClient({ path: process.env.CHROMA_URL });
    await client.init();
    return client;
    // to use auth
    // const chromaClient = new ChromaClient({
    //     path: "http://localhost:8000",
    //     auth: {
    //         provider: "basic",
    //         credentials: process.env.CHROMA_CLIENT_AUTH_CREDENTIALS
    //     }
    // })
}

export async function getDocumentCollection(collection: string) {
    const chromaClient = await getChromaClient();
    const embeddingFunction = getEmbeddingFunction();
    
    return await chromaClient.getCollection({
        name: collection,
        embeddingFunction
    });
}

export async function getEmbeddings(text: string): Promise<Embeddings> {
    const embeddingFunction = getEmbeddingFunction();

    // split into chunks
    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
    });
    const documents = await splitter.createDocuments([text]);
    const pageContents = documents.map(m => m.pageContent);

    return await embeddingFunction.generate(pageContents);
}

export function getEmbeddingFunction(): IEmbeddingFunction {
    return new OpenAIEmbeddingFunction({
        openai_model: process.env.OPEN_AI_EMBEDDING_MODEL,
        openai_api_key: process.env.OPEN_AI_KEY
    });
}