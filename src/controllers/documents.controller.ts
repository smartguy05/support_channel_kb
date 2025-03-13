import {badRequest, internalServerError, ok} from "../helpers/controller-helpers";
import {addDocument, deleteDocument, getDocumentDetails, getDocumentList} from "../services/document.service";

exports.get = async (req, res) => {
    try {
        const fileNames = await getDocumentList(req.params.collection);
        ok(res, fileNames);
    } catch (e) {
        internalServerError(res, e);
    }
};

exports.getDetails = async (req, res) => {
    try {
        const document = req.params.document;
        const collection = req.params.collection;
        const result = await getDocumentDetails(collection, document);
        if (!result) {
            return badRequest(res, 'Document details not found');
        }
        ok(res, result);
    } catch (e) {
        internalServerError(res, e);
    }
};

exports.post = async (req, res) => {
    try {
        if (!req.file) {
            badRequest(res, 'No file uploaded');
        }

        await addDocument(req)
        ok(res);
    } catch (e) {
        internalServerError(res, e);
    }
}

exports.delete = async (req, res) => {
    try {
        await deleteDocument(req.params.collection, req.params.filename);
        return ok(res);
    } catch (e) {
        internalServerError(res, e);
    }
}