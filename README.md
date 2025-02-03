# Support Channel KB

## Getting Started
### Steps
1. Run Chromadb
2. Set up .env file
3. Run api

### Run Chromadb
I use Docker Desktop
1. Pull the image: `chromadb/chroma:latest`
2. Start the container (you may want to configure options for retaining data)

### Set up .env file
1. Add a new file to root of project called .env (no file extension)
2. Add the properties found in env.d.ts to the file along with the corresponding dev values:
```
PORT=3000
CHROMA_URL=http://0.0.0.0:8000 
OPEN_AI_KEY=sk-your-api-key
OPEN_AI_EMBEDDING_MODEL=text-embedding-3-small
```~~~~
- Port is the port the api will run on
- Chroma_url is the url of your docker instance running chromadb
```

To run locally:
npm run serve
```
To generate Swagger Docs:
```
npm run swagger-gen
```
To debug Node.js
```
npm run debug
```