import {initializeControllers} from "./init";

const express = require('express');
const swaggerUi = require('swagger-ui-express');
require('dotenv').config();

const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

const swaggerDoc = require('./swagger_output.json');

// Setup Swagger UI at /docs
// app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));

initializeControllers(app);

// Start the server on port 3000 (or a port specified in the environment variables)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`ChromaDB search API server is running on port ${PORT}`);
});
