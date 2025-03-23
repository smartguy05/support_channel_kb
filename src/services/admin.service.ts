import {DbAdapter} from "../models/db-adapter.model";
import {KbConfig} from "../models/kb-config.model";
import {randomUUID} from "crypto";

export async function addApiKey(collection: string) {
	const existingConfig = await DbAdapter.first({ collection });
	if (!!existingConfig) {
		return existingConfig.api_key;
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
	return newId;
}