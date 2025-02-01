const { body } = require('express-validator');
const multer = require('multer');

const searchController = require('./controllers/searchController');
const documentsController = require('./controllers/documentsController');
const adminController = require('./controllers/adminController');
const collectionsController = require('./controllers/collectionsController');
const healthCheckController = require('./controllers/healthCheckController');

const upload = multer({ storage: multer.memoryStorage() });
export function initializeControllers(app) {
    /**
     * @swagger
     * /search:
     *   post:
     *     summary: Perform a vector search.
     *     description: Accepts a text query and returns matching results from the ChromaDB vector database.
     *     parameters:
     *      - in: path
     *        name: collection
     *        required: true
     *        schema:
     *          type: string
     *        description: The collection to query against
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - text
     *             properties:
     *               text:
     *                 type: string
     *                 example: "example query"
     *     responses:
     *       200:
     *         description: Search results retrieved successfully.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 results:
     *                   type: array
     *                   items:
     *                     type: object
     *       400:
     *         description: Bad Request – Missing or invalid search query.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 error:
     *                   type: string
     *                   example: 'Missing "text" in request body'
     *       500:
     *         description: Internal Server Error during vector search.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 error:
     *                   type: string
     *                 details:
     *                   type: string
     */
    app.post('/search/:collection', searchController.post);

    /**
     * @swagger
     * /documents:
     *   get:
     *     summary: Retrieve documents.
     *     description: Retrieves a list of documents from the ChromaDB database.
     *     responses:
     *       200:
     *         description: Documents retrieved successfully.
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 type: object
     *       500:
     *         description: Internal Server Error while retrieving documents.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 error:
     *                   type: string
     */
    app.get('/documents/:collection', documentsController.get);

    /**
     * @swagger
     * /documents:
     *   post:
     *     summary: Create a new document.
     *     description: Adds a new document to the ChromaDB database.
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - text
     *             properties:
     *               text:
     *                 type: string
     *                 example: "Document content"
     *     responses:
     *       201:
     *         description: Document created successfully.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 id:
     *                   type: string
     *                   example: "doc123"
     *       400:
     *         description: Bad Request – Missing or invalid document data.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 error:
     *                   type: string
     *       500:
     *         description: Internal Server Error while creating the document.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 error:
     *                   type: string
     */
    app.post(
        '/documents/:collection',
        upload.single('file'),
        documentsController.post);

    /**
     * @swagger
     * /documents:
     *   delete:
     *     summary: Delete a document.
     *     description: Deletes a document from the ChromaDB database by its identifier.
     *     parameters:
     *       - in: query
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: The document identifier.
     *     responses:
     *       200:
     *         description: Document deleted successfully.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: "Document deleted successfully"
     *       400:
     *         description: Bad Request – Missing document identifier.
     *       500:
     *         description: Internal Server Error while deleting the document.
     */
    app.delete('/documents/:collection/:filename', documentsController.delete);

    /**
     * @swagger
     * /admin:
     *   post:
     *     summary: Create an admin resource.
     *     description: Performs an admin operation to create a new resource.
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               name:
     *                 type: string
     *                 example: "Admin Name"
     *     responses:
     *       201:
     *         description: Admin resource created successfully.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 id:
     *                   type: string
     *                   example: "admin123"
     *       400:
     *         description: Bad Request – Invalid admin data.
     *       500:
     *         description: Internal Server Error during the admin operation.
     */
    app.post('/admin', adminController.post);

    /**
     * @swagger
     * /admin:
     *   put:
     *     summary: Update an admin resource.
     *     description: Updates an existing admin resource with the provided data.
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - id
     *             properties:
     *               id:
     *                 type: string
     *                 example: "admin123"
     *               name:
     *                 type: string
     *                 example: "Updated Admin Name"
     *     responses:
     *       200:
     *         description: Admin resource updated successfully.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: "Admin updated successfully"
     *       400:
     *         description: Bad Request – Invalid admin data.
     *       500:
     *         description: Internal Server Error during admin update.
     */
    app.put('/admin', adminController.put);

    /**
     * @swagger
     * /admin:
     *   delete:
     *     summary: Delete an admin resource.
     *     description: Deletes an admin resource from the system by its identifier.
     *     parameters:
     *       - in: query
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: The admin resource identifier.
     *     responses:
     *       200:
     *         description: Admin resource deleted successfully.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: "Admin deleted successfully"
     *       400:
     *         description: Bad Request – Missing admin identifier.
     *       500:
     *         description: Internal Server Error during admin deletion.
     */
    app.delete('/admin', adminController.delete);

    /**
     * @swagger
     * /collections:
     *   get:
     *     summary: Retrieve collections.
     *     description: Retrieves a list of collections from the ChromaDB database.
     *     responses:
     *       200:
     *         description: Collections retrieved successfully.
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 type: object
     *       500:
     *         description: Internal Server Error while retrieving collections.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 error:
     *                   type: string
     */
    app.get('/collections', collectionsController.get);

    /**
     * @swagger
     * /collections:
     *   post:
     *     summary: Create a new collection.
     *     description: Creates a new collection in the ChromaDB database.
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - name
     *             properties:
     *               name:
     *                 type: string
     *                 example: "My Collection"
     *     responses:
     *       201:
     *         description: Collection created successfully.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 id:
     *                   type: string
     *                   example: "col123"
     *       400:
     *         description: Bad Request – Missing or invalid collection data.
     *       500:
     *         description: Internal Server Error while creating the collection.
     */
    app.post(
        '/collections',
        [
            body('name')
                .exists({ checkNull: true, checkFalsy: true })
                .withMessage('Collection name is required')
                .isString()
                .withMessage('Collection name must be a string'),
            body('description')
                .exists({ checkNull: true, checkFalsy: true })
                .withMessage('Description is required')
                .isString()
                .withMessage('Description must be a string')
        ],
        collectionsController.post);

    /**
     * @swagger
     * /collections:
     *   delete:
     *     summary: Delete a collection.
     *     description: Deletes a collection from the ChromaDB database by its identifier.
     *     parameters:
     *       - in: query
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: The collection identifier.
     *     responses:
     *       200:
     *         description: Collection deleted successfully.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: "Collection deleted successfully"
     *       400:
     *         description: Bad Request – Missing collection identifier.
     *       500:
     *         description: Internal Server Error while deleting the collection.
     */
    app.delete('/collections/:name', collectionsController.delete);

    /**
     * @swagger
     * /healthcheck:
     *   get:
     *     summary: Check application health.
     *     description: Provides a basic health check for the application. Returns system status, uptime, and the current timestamp if the application is running normally.
     *     responses:
     *       200:
     *         description: Application is healthy.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 status:
     *                   type: string
     *                   example: "ok"
     *                 uptime:
     *                   type: number
     *                   description: The uptime of the application in seconds.
     *                   example: 123456
     *                 timestamp:
     *                   type: string
     *                   format: date-time
     *                   description: The current server timestamp.
     *                   example: "2023-01-01T00:00:00.000Z"
     *       500:
     *         description: Application is unhealthy.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 error:
     *                   type: string
     *                   example: "Internal Server Error"
     */
    app.get('/healthcheck', healthCheckController.get);

}
