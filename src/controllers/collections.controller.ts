import {getChromaClient} from "../helpers/chroma-helpers";
import {KbCollection} from "../models/dto/kb-collection";
import {internalServerError, ok} from "../helpers/controller-helpers";
import {createCollection, deleteCollection} from "../services/collection.service";

exports.get = async (req, res) => {
    const chromaClient = await getChromaClient();
    const collections = await chromaClient.listCollections();

    ok(res, collections);
}

exports.post = async (req, res) => {
    const kbCollection = req.body as KbCollection;
    
    try {
        await createCollection(kbCollection);
    } catch (e) {
        internalServerError(res, e);
    }
    
    ok(res);
}

exports.delete = async (req, res) => {
    try {
        const collection = req.params.name;
        await deleteCollection(collection);
        ok(res);
    } catch (e) {
        internalServerError(res, e, "An error occurred while attempting to delete the collection");
    }
}