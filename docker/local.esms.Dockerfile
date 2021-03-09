FROM node:12.10 as base

RUN npm install -g nodemon

WORKDIR /app

COPY package*.json /app/
COPY . /app

# Install app dependencies
RUN npm install

ARG BUILD_MODE=local
ENV mode ${BUILD_MODE}
ENTRYPOINT ["nodemon", "main.js"]