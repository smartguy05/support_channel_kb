import {ChromaClient, DefaultEmbeddingFunction, Documents, Embeddings} from "chromadb";
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
    const embeddingFunction = new DefaultEmbeddingFunction({ model: process.env.EMBEDDING_FUNCTION});
    
    return await chromaClient.getCollection({
        name: collection,
        embeddingFunction
    });
}

export async function getEmbeddings(text: string): Promise<Embeddings> {
    const embeddingFunction = new DefaultEmbeddingFunction({ model: process.env.EMBEDDING_FUNCTION });

    // split into chunks
    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
    });
    const documents = await splitter.createDocuments([text]);
    const pageContents = documents.map(m => m.pageContent);

    return await embeddingFunction.generate(pageContents);
}