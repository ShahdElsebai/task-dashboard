# Mock REST API (json-server) with the seed data from mock-api/db.json.
FROM node:22-alpine
WORKDIR /api
RUN npm install --global json-server@1.0.0-beta.15
COPY mock-api/db.json ./db.json

EXPOSE 3000
# Start from a fresh copy of the seed data each time, like `npm run mock:api`.
CMD ["sh", "-c", "cp db.json db.runtime.json && json-server db.runtime.json --host 0.0.0.0 --port 3000"]
