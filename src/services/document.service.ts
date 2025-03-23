import {getDocumentCollection, getEmbeddingFunction} from '../helpers/chroma-helpers';
import {RecursiveCharacterTextSplitter} from "@langchain/textsplitters";
import {Embeddings, IDs, Metadatas, QueryRecordsParams} from "chromadb";
import * as path from "node:path";
import {TextData} from "../models/text-data";
import {extractPdfText} from "./pdf.service";

export async function getDocumentList(collection: string): Promise<(string | number | boolean)[]> {
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

export async function getDocumentDetails(collection: string, document: string) {
    const documentCollection = await getDocumentCollection(collection);
    return await documentCollection.get({
        where: { filename: document }
    });
}

export async function addDocument(req): Promise<void> {
    const embeddingFunction = getEmbeddingFunction();
    const collection: string = req.params.collection;
    
    let fileData: TextData;
    switch (path.extname(req.file.originalname).toLowerCase()) {
        case '.md':
            fileData = await parseMd(req);
            break;
        case '.pdf':
            fileData = await parsePdf(req);
            break;
        default:
            fileData = await parseTextFile(req);
    }
    
    if (!fileData || !fileData.documents?.length) {
        throw new Error('Unable to parse text data');
    }
    
    // create embeddings
    const embeddings: Embeddings = await embeddingFunction.generate(fileData.documents);
    
    // get collection
    const documentCollection = await getDocumentCollection(collection);

    // @ts-ignore
    await documentCollection.add({
        ids: fileData.ids,
        embeddings,
        metadatas: fileData.metadatas,
        documents: fileData.documents
    });
}

export async function addDocuments(req): Promise<void> {
    const promises = [];
    for (let x = 0; x < req.files.length; x++) {
        req.file = req.files[x];
        promises.push(addDocument(req));
    }
    await Promise.all(promises);
}

export async function addPlainText(req): Promise<void> {
    const text = req.body.text;
    const filename = req.body.data;
    const collection: string = req.params.collection;
    const metadata: Record<string, string | number | boolean>[] = req.body.metadata;

    // split into chunks
    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 300,
        chunkOverlap: 75,
    });
    const docs = await splitter.createDocuments([text]);
    const documents = docs.map(m => m.pageContent);

    // generate ids and metadatas
    const ids: IDs = [];
    const metadatas: Metadatas = [];

    for (let i = 0; i < docs.length; i++) {
        ids.push(`${collection}-${filename}-${i}`);
        // @ts-ignore
        metadatas.push({
            ...metadata,
            filename,
            page: 1,
            added: (new Date()).toISOString()
        });
    }

    const fileData = {
        metadatas,
        documents,
        ids
    };
    
    // create embeddings
    const embeddings: Embeddings = await getEmbeddingFunction().generate(fileData.documents);

    // get collection
    const documentCollection = await getDocumentCollection(collection);

    // @ts-ignore
    await documentCollection.add({
        ids: fileData.ids,
        embeddings,
        metadatas: fileData.metadatas,
        documents: fileData.documents
    });
}

export async function deleteDocument(collection: string, filename: string): Promise<void> {
    const documentCollection = await getDocumentCollection(collection);

    // Get documents with the matching filename in metadata
    const results = await documentCollection.get({
        where: { filename: filename }
    });

    if (results.ids.length > 0) {
        // Delete the documents
        await documentCollection.delete({
            ids: results.ids
        });
    }
}

async function parseTextFile(req): Promise<TextData> {
    const text = req.file.buffer.toString('utf-8');
    const filename = req.file.originalname;
    const collection: string = req.params.collection;
    const metadata: Record<string, string | number | boolean>[] = req.body.metadata;

    // split into chunks
    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
    });
    const docs = await splitter.createDocuments([text]);
    const documents = docs.map(m => m.pageContent);

    // generate ids and metadatas
    const ids: IDs = [];
    const metadatas: Metadatas = [];

    for (let i = 0; i < docs.length; i++) {
        ids.push(`${collection}-${filename}-${i}`);
        // @ts-ignore
        metadatas.push({
            ...metadata,
            filename,
            page: 1,
            added: (new Date()).toISOString()
        });
    }
    
    return {
        metadatas,
        documents,
        ids
    }
}

async function parseMd(req): Promise<TextData> {
    const text = req.file.buffer.toString('utf-8');
    const filename = req.file.originalname;
    const collection: string = req.params.collection;
    const metadata: Record<string, string | number | boolean>[] = req.body.metadata;

    const headingRegex = /^(#{1,6})\s+(.*)$/gm;
    let match;
    let lastIndex = 0;
    const sections: { heading: string; content: string }[] = [];

    while ((match = headingRegex.exec(text)) !== null) {
        if (lastIndex !== match.index) {
            const content = text.slice(lastIndex, match.index).trim();
            if (sections.length > 0) {
                sections[sections.length - 1].content += `\n${content}`;
            }
        }
        sections.push({ heading: match[2].trim(), content: '' });
        lastIndex = headingRegex.lastIndex;
    }

    // Add remaining text
    const remaining = text.slice(lastIndex).trim();
    if (remaining && sections.length > 0) {
        sections[sections.length - 1].content += `\n${remaining}`;
    }

    const documents: string[] = [];
    const ids: IDs = [];
    const metadatas: Metadatas = [];
    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
    });

    for (const [sectionIndex, section] of sections.entries()) {
        const splitDocs = await splitter.createDocuments([section.content]);
        for (const [docIndex, doc] of splitDocs.entries()) {
            const uniqueId = `${collection}-${filename}-${section.heading.replace(/\s+/g, '_')}-${sectionIndex}-${docIndex}`;
            ids.push(uniqueId);
            documents.push(doc.pageContent);
            // @ts-ignore
            metadatas.push({
                ...metadata,
                filename,
                page: 1,
                added: new Date().toISOString(),
                heading: section.heading,
            });
        }
    }

    return {
        metadatas,
        documents,
        ids,
    };
}

async function parsePdf(req): Promise<TextData> {
    const value = await extractPdfText(req.file, req.file.originalname);
    req.file.buffer  = Buffer.from(value, 'utf-8');
    return await parseMd(req);
}
