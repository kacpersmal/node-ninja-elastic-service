FROM node:16.17.1

WORKDIR /app

ADD . .

RUN npm install

CMD ["npm", "start"]