import {ChromaClient} from "chromadb";

export function getChromaClient() {
    return new ChromaClient({ path: process.env.CHROMA_URL });
    // to use auth
    // const chromaClient = new ChromaClient({
    //     path: "http://localhost:8000",
    //     auth: {
    //         provider: "basic",
    //         credentials: process.env.CHROMA_CLIENT_AUTH_CREDENTIALS
    //     }
    // })
}