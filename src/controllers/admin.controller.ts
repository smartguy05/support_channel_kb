import {internalServerError, ok} from "../helpers/controller-helpers";
import {KbConfig} from "../models/kb-config.model";
import {DbAdapter} from "../models/db-adapter.model";
import {randomUUID} from "crypto";

exports.get = async (req, res) => {
    try {
        const result = await DbAdapter.find();
        ok(res, result);
    } catch (e) {
        internalServerError(res, e)
    }
}

// exports.find = async (req, res) => {
//     try {
//         const result = await DbAdapter.find();
//         ok(res, result);
//     } catch (e) {
//         internalServerError(res, e);
//     }
// }

exports.post = async (req, res) => {
    try {
        const collection = req.params.collection?.toLowerCase();
        const existingConfig = await DbAdapter.first({ collection });
        if (!!existingConfig) {
            ok(res, existingConfig.api_key);
        }
        const config: KbConfig = {
            api_key: undefined,
            collection
        };
        let keyExists = true;
        let newId;
        while (keyExists) {
            newId = randomUUID();
            keyExists = !!(await DbAdapter.first({ api_key: newId }));
            if (!keyExists) {
                config.api_key = newId; // todo: convert to saving hash of uuid
            }
        }
        await DbAdapter.insert(config);
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