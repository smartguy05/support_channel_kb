
export function ok(res, body: any = { message: 'Ok'}) {
    res.status(200).json(body);
}

export function internalServerError(res, exception?: any, message?: string) {
    if (!!exception) {
        console.error(exception);
    }
    if (!!message) {
        res.status(500).json({ message });
    } else {
        res.status(500);   
    }
}

export function badRequest(res, error?: string) {
    if (!!error) {
        res.status(400).json({ error });
    } else {
        res.status(400);
    }
}