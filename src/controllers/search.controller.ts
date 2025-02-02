import {internalServerError, ok} from "../helpers/controller-helpers";
import {queryChromaDb} from "../services/query.service";


exports.post = async (req, res) => {
    try {
        const result = await queryChromaDb(req.params.collection, req.body.query.text);
        ok(res, result);
    } catch (e) {
        internalServerError(res, e, 'An error occurred while attempting to search for the supplied search criteria');
    }
}