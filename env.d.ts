declare namespace NodeJS {
    interface ProcessEnv {
        PORT: number;
        CHROMA_URL: string;
        EMBEDDING_FUNCTION: string;
    }
}