import {internalServerError, notAuthorized, ok} from "../helpers/controller-helpers";
import {queryChromaDb} from "../services/query.service";
import {DbAdapter} from "../models/db-adapter.model";

exports.post = async (req, res) => {
    try {
        if (!(await validateApiKey(req))) {
            return notAuthorized(res);
        }
        
        const result = await queryChromaDb(req.params.collection, req.body.text);
        ok(res, result);
    } catch (e) {
        internalServerError(res, e, 'An error occurred while attempting to search for the supplied search criteria');
    }
}

export async function validateApiKey(req): Promise<boolean> {
    const authHeader = req.headers.authorization;
    const split = authHeader.split(' ');
    let api_key: string;

    if (split.length > 1) {
        api_key = split[1];
    } else  {
        api_key = split[0];
    }
    const collection = req.params.collection?.toLowerCase();
    if (!api_key || !collection) {
        return false;
    }
    return !!(await DbAdapter.first({ collection, api_key })); // todo: convert to using hash after admin post update
}