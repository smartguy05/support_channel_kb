import {getDocumentCollection, getEmbeddings} from "../helpers/chroma-helpers";
import {QueryRecordsParams} from "chromadb";

export async function queryChromaDb(collection: string, query: string): Promise<string[]> {
    const documentCollection = await getDocumentCollection(collection);
    const queryEmbeddings = await getEmbeddings(query);
    
    const results = await documentCollection.query({
        queryEmbeddings,
        include: ['documents']
    } as QueryRecordsParams);
    
    if (!!results && results.documents) {
        console.log("search result", results);
        return results.documents[0]; // todo: verify only one item is always returned
    }
}