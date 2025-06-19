FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./

# Install application dependencies
RUN npm ci --only=production

COPY src ./src
COPY public ./public

EXPOSE 3000

CMD [ "node", "src/index.js" ]