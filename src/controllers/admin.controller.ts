import {internalServerError, ok} from "../helpers/controller-helpers";
import {DbAdapter} from "../models/db-adapter.model";
import {addApiKey} from "../services/admin.service";

exports.get = async (req, res) => {
    try {
        const result = await DbAdapter.find();
        ok(res, result);
    } catch (e) {
        internalServerError(res, e)
    }
}

exports.find = async (req, res) => {
    try {
        const collection = req.params.collection?.toLowerCase();
        const result = await DbAdapter.first({collection})
        ok(res, result?.api_key ?? '');
    } catch (e) {
        internalServerError(res, e);
    }
}

exports.post = async (req, res) => {
    try {
        const collection = req.params.collection?.toLowerCase();
        const newId = addApiKey(collection);
        ok(res, newId);
    } catch (e) {
        internalServerError(res, e);
    }
}

exports.delete = async (req, res) => {
    try {
        const collection = req.params.collection;
        await DbAdapter.delete({ collection });
        ok(res);
    } catch (e) {
        internalServerError(res, e);
    }
}