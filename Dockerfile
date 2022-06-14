FROM node:16
COPY . /taiga-api
RUN npm ci
