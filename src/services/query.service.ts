import {getDocumentCollection, getEmbeddings} from "../helpers/chroma-helpers";
import {QueryRecordsParams} from "chromadb";

export async function queryChromaDb(collection: string, query: string) {
    const documentCollection = await getDocumentCollection(collection);
    const vectors = getEmbeddings(query);
    
    return await documentCollection.query({
        queryEmbeddings: vectors,
        include: ['documents']
    } as QueryRecordsParams); 
}