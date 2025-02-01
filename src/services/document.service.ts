import {getChromaClient} from "../helpers/chroma-helpers";
import {RecursiveCharacterTextSplitter} from "@langchain/textsplitters";
import {DefaultEmbeddingFunction, Documents, Embeddings, IDs, Metadatas, QueryRecordsParams} from "chromadb";

export async function getDocumentList(collection: string) {
    const chromaClient = getChromaClient();
    const embeddingFunction = new DefaultEmbeddingFunction(process.env.EMBEDDING_FUNCTION);
    
    const documentCollection = await chromaClient.getCollection({
        name: collection,
        embeddingFunction
    });
    
    const results = await documentCollection.get({ include: ['metadatas']} as QueryRecordsParams);
    return results.metadatas.map(m => {
            if ("filename" in m) {
                return m.filename
            }
            return null;
        })
        .filter(f => !f);
}

export async function addDocument(req) {
    const chromaClient = getChromaClient();
    const embeddingFunction = new DefaultEmbeddingFunction(process.env.EMBEDDING_FUNCTION);
    const text = req.file.buffer.toString('utf-8');
    const fileName = req.file.originalName;
    const collection: string = req.params.metadata;
    const metadata: Record<string, string | number | boolean> = req.body.metadata;
    
    // split into chunks
    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
    });
    const documents: Documents = await splitter.createDocuments([text]) as Documents;
    
    // generate ids and metadatas
    const ids: IDs = [];
    const metadatas: Metadatas = [];
    
    for (let i = 0; i < documents.length; i++) {
        ids.push(`${fileName}-${i}`);
        metadatas.push(metadata);
    }
    
    // create embeddings
    const embeddings: Embeddings = await embeddingFunction.generate(documents);
    
    // get collection
    const documentCollection = await chromaClient.getCollection({
        name: collection, 
        embeddingFunction
    });

    await documentCollection.add({
        ids,
        embeddings,
        metadatas,
        documents
    });
}

export async function deleteDocument(collection: string, filename: string) {
    const chromaClient = getChromaClient();
    const embeddingFunction = new DefaultEmbeddingFunction(process.env.EMBEDDING_FUNCTION);

    const documentCollection = await chromaClient.getCollection({
        name: collection,
        embeddingFunction
    });

    await documentCollection.delete({
        filter: {
            filename
        }
    } as QueryRecordsParams);
}