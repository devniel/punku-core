# syntax=docker/dockerfile:experimental

# stage 1
FROM node:12.22-alpine As development
WORKDIR /usr/src/app
COPY ./package*.json ./

RUN npm install
COPY . .

RUN npm run build

# stage 2
FROM node:12.22-alpine as production
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}
WORKDIR /usr/src/app
COPY package*.json ./

RUN npm install
COPY . .
COPY --from=development /usr/src/app/dist ./dist

#COPY --from=builder /app ./
CMD ["npm", "run", "start:prod"]