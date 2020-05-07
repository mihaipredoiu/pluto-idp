FROM node:12.16.1-alpine

WORKDIR /notifier


COPY package*.json /notifier/
RUN npm install


COPY . /notifier


EXPOSE 8082
CMD [ "npm", "run", "start" ]

