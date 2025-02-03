import {Collection, Db, MongoClient} from "mongodb";

export class DbAdapter {
    private static client;
    private static collection: string;
    
    public static async init(collection: string): Promise<void> {
        // todo: use auth
        this.client = new MongoClient(process.env.MONGO_DB_URL);
        this.collection = collection;
    }
    
    public static async first(query: any): Promise<any> {
        const dbCollection = this.getDbCollection();
        return await dbCollection.findOne(query);
    }

    public static async find(query?: any): Promise<any> {
        let results;
        const dbCollection = this.getDbCollection();
        const cursor = dbCollection.find(query);
        results = await cursor.toArray();
        
        return results;
    }
    
    public static async insert(record: any): Promise<void> {
        const dbCollection = this.getDbCollection();
        await dbCollection.insertOne(record);
    }

    public static async update(query: any, values: any): Promise<void> {
        const dbCollection = this.getDbCollection();
        await dbCollection.updateOne(query, values);
    }
    
    public static async delete(query: any): Promise<void> {
        const dbCollection = this.getDbCollection();
        await dbCollection.deleteOne(query);
    }

    public static async deleteMany(collection: string, query: any): Promise<void> {
        const dbCollection = this.getDbCollection();
        await dbCollection.deleteMany(query);
    }
    
    private static getDbCollection(): Collection<Document> {
        const database: Db = this.client.db(process.env.MONGO_DB_SCHEMA);
        return database.collection(this.collection);
    }
}