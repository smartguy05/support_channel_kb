import {getDocumentCollection} from '../helpers/chroma-helpers';
import {RecursiveCharacterTextSplitter} from "@langchain/textsplitters";
import {
    AddRecordsParams,
    DefaultEmbeddingFunction, DeleteParams,
    Embeddings,
    IDs,
    Metadatas,
    QueryRecordsParams
} from "chromadb";

export async function getDocumentList(collection: string) {
    const documentCollection = await getDocumentCollection(collection);
    
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
    const embeddingFunction = new DefaultEmbeddingFunction({ model: process.env.EMBEDDING_FUNCTION});
    const text = req.file.buffer.toString('utf-8');
    const fileName = req.file.originalName;
    const collection: string = req.params.collection;
    const metadata: Record<string, string | number | boolean> = req.body.metadata;
    
    // split into chunks
    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
    });
    const documents = await splitter.createDocuments([text]);
    const pageContents = documents.map(m => m.pageContent);
    
    // generate ids and metadatas
    const ids: IDs = [];
    const metadatas: Metadatas = [];
    
    for (let i = 0; i < documents.length; i++) {
        ids.push(`${fileName}-${i}`);
        metadatas.push(metadata);
    }
    
    // create embeddings
    const embeddings: Embeddings = await embeddingFunction.generate(pageContents);
    
    // get collection
    const documentCollection = await getDocumentCollection(collection);

    await documentCollection.add({
        ids,
        embeddings,
        metadatas
    } as AddRecordsParams);
}

export async function deleteDocument(collection: string, filename: string) {
    const documentCollection = await getDocumentCollection(collection);

    await documentCollection.delete({
        filter: {
            filename
        }
    } as DeleteParams);
}
