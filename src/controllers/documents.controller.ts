import {badRequest, internalServerError, ok} from "../helpers/controller-helpers";
import {addDocument, deleteDocument, getDocumentList} from "../services/document.service";

exports.get = async (req, res) => {
    try {
        const fileNames = await getDocumentList(req.params.collection);
        ok(res, fileNames);
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
    } catch (e) {
        internalServerError(res, e);
    }
}