# syntax=docker/dockerfile:experimental

# stage 1
FROM node:12.22-alpine As development
WORKDIR /usr/src/app
COPY ./package*.json ./
COPY .yarnrc.yml ./
COPY .yarn ./.yarn

RUN npm install -g -f yarn
RUN npm i -g -f corepack
RUN yarn set version berry
RUN --mount=type=ssh yarn install
COPY . .

RUN yarn build

# stage 2
FROM node:12.22-alpine as production
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}
WORKDIR /usr/src/app
COPY package*.json ./
COPY .yarnrc.yml ./
COPY .yarn ./.yarn

RUN npm install -g -f yarn
RUN npm i -g -f corepack
RUN yarn set version berry
RUN --mount=type=ssh yarn install
COPY . .
COPY --from=development /usr/src/app/dist ./dist

#COPY --from=builder /app ./
CMD ["yarn", "run", "start:prod"]