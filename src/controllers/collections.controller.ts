import {getChromaClient} from "../helpers/chroma-helpers";
import {KbCollection} from "../models/dto/kb-collection";
import {internalServerError, ok} from "../helpers/controller-helpers";
import {createCollection, deleteCollection} from "../services/collection.service";
import {addApiKey} from "../services/admin.service";
import {DbAdapter} from "../models/db-adapter.model";

exports.get = async (req, res) => {
    const chromaClient = await getChromaClient();
    const collections = await chromaClient.listCollectionsAndMetadata();
    const apiKeys = await DbAdapter.find();
    
    const formattedCollections = collections.map(collection => ({
        name: collection.name,
        description: collection.metadata?.description || '',
        created: collection.metadata?.created || '',
        api_key: apiKeys.find(f => f.collection === collection.name)?.api_key
    }));

    ok(res, formattedCollections);
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

exports.postWithKey = async (req, res) => {
    const kbCollection = req.body as KbCollection;

    try {
        await createCollection(kbCollection);
        ok(res, await addApiKey(kbCollection.name));
    } catch (e) {
        internalServerError(res, e);
    }
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