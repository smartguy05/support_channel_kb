import OpenAI, {toFile} from 'openai';
import { PDFDocument } from 'pdf-lib';
import fs from 'fs';

export async function extractPdfText(fileBuffer, fileName: string): Promise<any> {
	// Check file size
	const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB limit
	if (fileBuffer.length > MAX_FILE_SIZE) {
		// Split large PDF into smaller chunks
		return await processLargePdf(fileBuffer, fileName);
	}

	return await processPdfWithOpenAI(fileBuffer, fileName);
}

async function processPdfWithOpenAI(uploadedFile, fileName: string): Promise<any> {
	const client = new OpenAI({
		apiKey: process.env.OPEN_AI_KEY,
		baseURL: process.env.OPEN_AI_API_URL || 'https://api.openai.com/v1'
	});
	let response;
	
	try {
		const file = await client.files.create({
			file: await toFile(fs.createReadStream(uploadedFile.path)),
			purpose: 'assistants'
		});

		const systemPrompt = "I have a PDF document where text content might be protected or embedded as images. Please perform the following steps:\n" +
			"\n" +
			"    1. Apply OCR: If the PDF’s text is not directly accessible, use OCR to capture all the content accurately.\n" +
			"    2. Comprehensive extraction: Extract every bit of text from the document—not only the table data, but also all accompanying descriptions, captions, and contextual information that explains what the tables are and what the measurements mean.\n" +
			"    3. Maintain logical structure: Preserve the natural reading order. Ensure that section titles, headers, footers, paragraphs, and any descriptive text are maintained in the correct order relative to the tables.\n" +
			"    4. Convert tables to Markdown: For any tables in the PDF, convert them to Markdown table syntax using pipes and dashes. Ensure the table content is complete.\n" +
			"    5. Organize into a Markdown document: Structure the final output in Markdown format, using appropriate Markdown headings (e.g., #, ##, etc.) to separate sections. Ensure that the descriptive text is clearly associated with the corresponding tables and measurements."

		response = await client.chat.completions.create({
			messages: [
				{ role: "system", content: systemPrompt },
				{
					role: "user",
					content: [
						{
							type: 'file',
							file: {
								file_id: file.id
							}
						}
					]
				}
			],
			model: process.env.PDF_MODEL
		});

		// Clean up uploaded file
		await client.files.del(file.id);
	} finally {
		if (uploadedFile.path && fs.existsSync(uploadedFile.path)) {
			fs.unlinkSync(uploadedFile.path);
		}
	}
	
	return response.choices[0].message.content.trim();
}

async function processLargePdf(fileBuffer, fileName: string): Promise<string> {
	const pdfDoc = await PDFDocument.load(fileBuffer);
	const pageCount = pdfDoc.getPageCount();
	let combinedText = '';

	// Process PDF in chunks (e.g., 5 pages at a time)
	for (let i = 0; i < pageCount; i += 5) {
		const chunk = await extractPdfChunk(fileBuffer, i, Math.min(i + 5, pageCount));
		const chunkText = await processPdfWithOpenAI(chunk, fileName);
		combinedText += chunkText + '\n\n';
	}

	return combinedText;
}

async function extractPdfChunk(fileBuffer, startPage, endPage): Promise<Buffer> {
	const pdfDoc = await PDFDocument.load(fileBuffer);
	const newPdfDoc = await PDFDocument.create();

	for (let i = startPage; i < endPage; i++) {
		const [copiedPage] = await newPdfDoc.copyPages(pdfDoc, [i]);
		newPdfDoc.addPage(copiedPage);
	}

	return Buffer.from(await newPdfDoc.save());
}