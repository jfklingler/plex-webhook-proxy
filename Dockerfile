FROM node:12.22.12

ENV NODE_ENV=production

WORKDIR /app

COPY ["package.json", "package-lock.json*", "./"]
RUN npm install --production

COPY . .

CMD [ "node", "server.js" ]
