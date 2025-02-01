const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const { initializeControllers } = require('./init');
require('dotenv').config();

const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

const swaggerSpec = swaggerJsdoc({
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Support Channel KB',
            version: '0.0.1',
            description: 'API to look up relevant KB articles based on text input',
        },
        servers: [
            {
                url: 'http://localhost:3000',
            },
        ],
    },
    // Paths to files containing OpenAPI definitions
    apis: ['./app.js'], // This will pick up the annotations in this file.
});

// Setup Swagger UI at /docs
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

initializeControllers(app);

// Start the server on port 3000 (or a port specified in the environment variables)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`ChromaDB search API server is running on port ${PORT}`);
});
