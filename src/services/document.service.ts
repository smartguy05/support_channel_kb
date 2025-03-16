import {getDocumentCollection, getEmbeddingFunction} from '../helpers/chroma-helpers';
import {RecursiveCharacterTextSplitter} from "@langchain/textsplitters";
import {Embeddings, IDs, Metadatas, QueryRecordsParams} from "chromadb";
import * as path from "node:path";
import {TextData} from "../models/text-data";
import {PdfReader} from "pdfreader";

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
            fileData = await parsePlainText(req);
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

export async function deleteDocument(collection: string, filename: string): Promise<void> {
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

async function parsePlainText(req): Promise<TextData> {
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

// todo: fix
async function parsePdf(req): Promise<TextData> {
    return new Promise<TextData>(async (resolve, reject) => {
        const filename = req.file.originalname;
        const collection: string = req.params.collection;
        const metadata: Record<string, string | number | boolean>[] = req.body.metadata;
        const grouped: {[key: string]: {text: string, page: number}} = {};
        const metadatas: Metadatas = [];
        const documents: string[] =[];
        const ids: IDs = [];

        let currentPage = 0;
        const pages = {}; // store per-page lines (grouped by y)
        
        new PdfReader().parseBuffer(req.file.buffer, async (err, pdfBuffer: any) => {
            if (!!err) {
                return reject(new Error(`Unable to parse pdf, Error: ${err}`));
    
            }
    
            if (!pdfBuffer) {
                // End of file – now process pages
                Object.keys(pages).forEach((pageNum) => {
                    const linesByY = pages[pageNum];
                    // Get sorted list of line positions (as numbers)
                    const yValues = Object.keys(linesByY)
                        .map(Number)
                        .sort((a, b) => a - b);
    
                    // Compute differences between consecutive y values (as a proxy for line height)
                    const spacings = [];
                    for (let i = 1; i < yValues.length; i++) {
                        spacings.push(yValues[i] - yValues[i - 1]);
                    }
                    const avgSpacing =
                        spacings.reduce((acc, v) => acc + v, 0) / (spacings.length || 1);
    
                    // Group lines into sections by assuming that a line with a larger spacing before it is a heading.
                    // (You might also check for text characteristics like all-uppercase.)
                    let currentHeading = "Intro";
    
                    // grouped[currentHeading] = [];
    
                    yValues.forEach((y, index) => {
                        const lineText = linesByY[y]?.join(" ").trim() ?? "";
                        // Heuristic: if the spacing before this line is, say, 1.5× the average, treat it as a heading.
                        // For the first line (index 0) you may use other criteria (like if it’s all uppercase).
                        if (
                            index > 0 &&
                            yValues[index] - yValues[index - 1] > 1.5 * avgSpacing
                            // You can add additional tests here (e.g. lineText === lineText.toUpperCase())
                        ) {
                            // Start a new group using this line as heading.
                            currentHeading = lineText;
                            // grouped[currentHeading] = [];
                        } else {
                            // Append this line under the current heading.
                            grouped[currentHeading] = { text: lineText, page: +pageNum };
                        }
                    });
    
                    console.log(`Page ${pageNum}:`);
                    console.log(grouped);
                });
                
                if (!Object.keys(grouped).length) {
                    reject(new Error(`Unable to parse pdf, Error: ${err}`));
                }

                // split into chunks
                try {
                    const splitter = new RecursiveCharacterTextSplitter({
                        chunkSize: 1000,
                        chunkOverlap: 200,
                    });
                    for (const heading of Object.keys(grouped)) {
                        const text = grouped[heading].text;
                        const page = grouped[heading].page;
                        const docs = await splitter.createDocuments([text]);
                        documents.push(...docs.map(m => m.pageContent));

                        // generate ids and metadatas
                        for (let i = 0; i < docs.length; i++) {
                            ids.push(`${collection}-${filename}-${heading}-${page}-${i}`);
                            // @ts-ignore
                            metadatas.push({
                                ...metadata,
                                filename,
                                page: 1,
                                added: (new Date()).toISOString(),
                                heading
                            });
                        }
                    }

                    resolve({
                        metadatas,
                        documents,
                        ids
                    });
                } catch (processingError) {
                    reject(processingError);
                }
            } else if (pdfBuffer.page) {
                // New page metadata
                currentPage = pdfBuffer.page;
                pages[currentPage] = {};
            } else if (pdfBuffer.text) {
                // Group text items by y coordinate (rounded to 2 decimal places)
                const yKey = pdfBuffer.y.toFixed(2);
                if (!pages[currentPage][yKey]) {
                    pages[currentPage][yKey] = [];
                }
                pages[currentPage][yKey].push(pdfBuffer.text);
            }
        });
        
    });
}
