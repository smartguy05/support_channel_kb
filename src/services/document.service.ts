﻿import {getDocumentCollection, getEmbeddingFunction} from '../helpers/chroma-helpers';
import {RecursiveCharacterTextSplitter} from "@langchain/textsplitters";
import {
    AddRecordsParams,
    Embeddings,
    IDs,
    Metadatas,
    QueryRecordsParams
} from "chromadb";

export async function getDocumentList(collection: string) {
    const documentCollection = await getDocumentCollection(collection);
    
    const results = await documentCollection.get({ include: ['metadatas']} as QueryRecordsParams);
    // removes duplicates and null/empty values
    return Array.from(
        new Set(
            results.metadatas
                .map(m => !m || !("filename" in m)
                    ? null
                    : m.filename)
                .filter(f => !!f)
        )
    );
}

export async function addDocument(req) {
    const embeddingFunction = getEmbeddingFunction();
    const text = req.file.buffer.toString('utf-8');
    const fileName = req.file.originalname;
    const collection: string = req.params.collection;
    const metadata: Record<string, string | number | boolean>[] = req.body.metadata;
    
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
        ids.push(`${collection}-${fileName}-${i}`);
        metadatas.push(...metadata ?? []);
        metadatas.push({"filename": fileName });
    }
    
    // create embeddings
    const embeddings: Embeddings = await embeddingFunction.generate(pageContents);
    
    // get collection
    const documentCollection = await getDocumentCollection(collection);

    // @ts-ignore
    await documentCollection.add({
        ids,
        embeddings,
        metadatas,
        documents: pageContents
    });
}

export async function deleteDocument(collection: string, filename: string) {
    const documentCollection = await getDocumentCollection(collection);

    // @ts-ignore
    const results = await documentCollection.query({
        queryTexts: [filename],
        where: { filename }
    });
    
    const idsToDelete = results.ids.flat();

    // @ts-ignore
    await documentCollection.delete({ 
        ids: idsToDelete as IDs
    });
}
