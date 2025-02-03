declare namespace NodeJS {
    interface ProcessEnv {
        PORT: number;
        SWAGGER_ENABLED: boolean;
        CHROMA_URL: string;
        OPEN_AI_KEY: string;
        OPEN_AI_EMBEDDING_MODEL: string;
        MONGO_DB_URL: string;
        MONGO_DB_SCHEMA: string;
        MONGO_DB_PASSWORD: string;
    }
}