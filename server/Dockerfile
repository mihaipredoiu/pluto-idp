FROM node:12.16.1-alpine

# Create app directory
WORKDIR /app

# Install dependencies
COPY package*.json /app/
RUN npm install

# Bundle app source
COPY . /app

# Exports
EXPOSE 8080
ENTRYPOINT [ "npm", "start" ]