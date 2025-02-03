import {getChromaClient, getEmbeddingFunction} from "../helpers/chroma-helpers";
import {KbCollection} from "../models/dto/kb-collection";
import {ChromaClient} from "chromadb";

export async function deleteCollection(collection: string): Promise<void> {
    const chromaClient = await getChromaClient();
    if (await collectionExists(chromaClient, collection)) {
        await chromaClient.deleteCollection({ name: collection });
    }
}

export async function createCollection(kbCollection: KbCollection): Promise<void> {
    const chromaClient = await getChromaClient();
    
    if (!(await collectionExists(chromaClient, kbCollection.name?.toLowerCase()))) {
        await chromaClient.createCollection({
            name: kbCollection.name?.toLowerCase(),
            metadata: {
                "description": kbCollection.description,
                "created": (new Date()).toString()
            },
            embeddingFunction: getEmbeddingFunction()
        });
    }
}

async function collectionExists(chromaClient: ChromaClient, collection: string): Promise<boolean> {
    const collections = await chromaClient.listCollections();

    return !!collections?.length && !!collections.find(f => f.toLowerCase() == collection.toLowerCase());
}