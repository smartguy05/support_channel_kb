
const swaggerAutogen = require('swagger-autogen')();

const doc = {
    info: {
        title: 'ChromaDB API',
        description: 'API endpoints for ChromaDB operations.',
    },
    host: 'localhost:3000',
    schemes: ['http'],
};

const outputFile = '../swagger_output.json';
// List the files that contain your endpoints (you can add more files if needed)
const endpointsFiles = ['../init.ts']; // adjust this path to your main file (or files) with your routes

swaggerAutogen(outputFile, endpointsFiles, doc).then(() => {
    // Optionally, you can automatically start your app after generating the documentation
    console.log('Swagger documentation generated successfully.');
    // If you want to start your app automatically:
    // require('./dist/app.js'); // if you compile TS to dist, or use ts-node if desired
});