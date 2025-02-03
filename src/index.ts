import {initializeControllers} from "./init";
import {DbAdapter} from "./models/db-adapter.model";
require('dotenv').config();

const express = require('express');
const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

if (process.env.SWAGGER_ENABLED) {
    const swaggerUi = require('swagger-ui-express');
    const swaggerDoc = require('./swagger_output.json');

    app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));
}

initializeControllers(app);

console.log('Initializing db adapter');
DbAdapter.init(process.env.MONGO_DB_SCHEMA).then(() => {
    console.log('Db adapter initialized');
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Support Channel KB API server is running on port ${PORT}`);
    });
})
