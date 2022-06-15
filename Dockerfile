FROM node:16
COPY . /taiga-api
WORKDIR /taiga-api
RUN npm ci && npm run build
