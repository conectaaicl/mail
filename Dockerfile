FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --legacy-peer-deps --ignore-scripts &&     npm rebuild better-sqlite3 2>/dev/null || true

COPY . .

RUN npx prisma generate
RUN npm run build

EXPOSE 3000

CMD ["sh", "-c", "node node_modules/prisma/build/index.js db push --skip-generate 2>/dev/null; npm start"]
