declare namespace NodeJS {
    interface ProcessEnv {
        PORT: number;
        CHROMA_URL: string;
        OPEN_AI_KEY: string;
        OPEN_AI_EMBEDDING_MODEL: string;
    }
}