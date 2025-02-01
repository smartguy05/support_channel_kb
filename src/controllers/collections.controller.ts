import {getChromaClient} from "../helpers/chroma-helpers";
import {DefaultEmbeddingFunction} from "chromadb";
import {KbCollection} from "../models/dto/kb-collection";
import {internalServerError, ok} from "../helpers/controller-helpers";

exports.get = async (req, res) => {
    const chromaClient = getChromaClient();
    
    const collections = await chromaClient.listCollections();

    ok(res, collections);
}

exports.post = async (req, res) => {
    const chromaClient = getChromaClient();
    const body = req.body as KbCollection;
    
    await chromaClient.createCollection({
        name: body.name,
        metadata: {
            "description": body.description,
            "created": (new Date()).toString()
        },
        embeddingFunction: new DefaultEmbeddingFunction(process.env.EMBEDDING_FUNCTION)
    });
    
    ok(res);
}

exports.delete = async (req, res) => {
    const collection = req.params.name;
    const chromaClient = getChromaClient();
    
    try {
        await chromaClient.deleteCollection(collection);
        ok(res);
    } catch (e) {
        internalServerError(res, e, "An error occurred while attempting to delete the collection");
    }
}