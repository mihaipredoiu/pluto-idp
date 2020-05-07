FROM node:12.16.1-alpine

WORKDIR /client


COPY package*.json /client/
RUN npm install


COPY . /client


EXPOSE 8081
