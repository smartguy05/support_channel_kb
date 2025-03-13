
export function ok(res, body: any = { message: 'Ok'}) {
    res.status(200).json(body);
}

export function internalServerError(res, exception?: any, message?: string) {
    message ??= exception.message;
    if (!!exception) {
        console.error(exception);
    }
    if (!!message) {
        res.status(500).send({ message});
    } else {
        res.status(500).send();   
    }
}

export function badRequest(res, error?: string) {
    if (!!error) {
        res.status(400).send({ error });
    } else {
        res.status(400).send();
    }
}

export function notAuthorized(res) {
    res.status(401).send('API Key missing');
}