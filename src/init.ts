const { body } = require('express-validator');
const multer = require('multer');

const searchController = require('./controllers/search.controller');
const documentsController = require('./controllers/documents.controller');
const adminController = require('./controllers/admin.controller');
const collectionsController = require('./controllers/collections.controller');
const healthCheckController = require('./controllers/health-check.controller');

const upload = multer({ storage: multer.memoryStorage() });
export function initializeControllers(app) {
    
    app.post('/search/:collection',
        /* 
            #swagger.tags = ['Search']
            #swagger.summary = 'Search for related kb content'
            #swagger.description = 'Searches kb articles to find relevant content based on search'
            #swagger.parameters['collection'] = {
              in: 'path',
              description: 'Name of the collection the file is in',
              required: true,
              type: 'string'
            }
            #swagger.parameters['query'] = {
              in: 'body',
              description: 'KbCollection payload',
              required: true,
              schema: {
                  text: "search text"
              }
          }
        */
        searchController.post);
    
    app.get('/documents/:collection',
        /* 
            #swagger.tags = ['Documents']
            #swagger.summary = 'Get list of documents'
            #swagger.description = 'Get list of documents from the specified collection'
            #swagger.parameters['collection'] = {
              in: 'path',
              description: 'Name of the collection to get the list of documents from',
              required: true,
              type: 'string'
            } 
        */
        documentsController.get);

    app.post(
        '/documents/:collection',
        /* 
            #swagger.tags = ['Documents']
            #swagger.summary = 'Add new document'
            #swagger.description = 'Adds document to specified collection'
            #swagger.consumes = ['multipart/form-data']
            #swagger.parameters['file'] = { 
              in: 'formData', 
              type: 'file', 
              description: 'The file to upload' 
            }
            #swagger.parameters['collection'] = {
              in: 'path',
              description: 'Name of the collection to add the document to',
              required: true,
              type: 'string'
            } 
        */
        upload.single('file'),
        documentsController.post);
    
    app.delete('/documents/:collection/:filename',
        /* 
            #swagger.tags = ['Documents']
            #swagger.summary = 'Delete a document'
            #swagger.description = 'Deletes document with specified name in specified collection'
            #swagger.parameters['collection'] = {
              in: 'path',
              description: 'Name of the collection the file is in',
              required: true,
              type: 'string'
            }
            #swagger.parameters['filename'] = {
              in: 'path',
              description: 'Name of the file to delete',
              required: true,
              type: 'string'
            } 
        */
        documentsController.delete);
    
    app.post('/admin',
        /* 
          #swagger.tags = ['Admin']
          #swagger.summary = 'Post'
          #swagger.description = 'Something admin-y'
        */
        adminController.post);

    app.put('/admin',
        /* 
          #swagger.tags = ['Admin']
          #swagger.summary = 'Put'
          #swagger.description = 'Something admin-y'
        */
        adminController.put);

    app.delete('/admin',
        /* 
          #swagger.tags = ['Admin']
          #swagger.summary = 'Delete'
          #swagger.description = 'Something admin-y'
        */
        adminController.delete);
    
    app.get('/collections',
        /* 
          #swagger.tags = ['Collections']
          #swagger.summary = 'Retrieve collections'
          #swagger.description = 'Retrieves a list of collections from the ChromaDB database.'
        */
        collectionsController.get);

    app.post(
        '/collections',
        /* 
          #swagger.tags = ['Collections']
          #swagger.summary = 'Create a new KB collection'
          #swagger.description = 'Endpoint to create a new knowledge base collection'
          #swagger.parameters['body'] = {
              in: 'body',
              description: 'KbCollection payload',
              required: true,
              schema: {
                  name: "Sample Collection",
                  description: "A description for the collection"
              }
          }
        */
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

    app.delete('/collections/:name',
        /* 
          #swagger.tags = ['Collections']
          #swagger.summary = 'Delete a collection'
          #swagger.description = 'Deletes the collection specified by the name in the path parameter.'
          #swagger.parameters['name'] = {
              in: 'path',
              description: 'Name of the collection to delete',
              required: true,
              type: 'string'
          }
        */
        collectionsController.delete);
    
    app.get('/healthcheck',
        /* 
          #swagger.tags = ['Health Check']
          #swagger.summary = 'Health Check'
          #swagger.description = 'Perform a health check'
        */
        healthCheckController.get);

}
