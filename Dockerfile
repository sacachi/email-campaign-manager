FROM node:20-alpine

WORKDIR /app

COPY package.json yarn.lock ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/

RUN yarn install --frozen-lockfile --ignore-engines || yarn install --ignore-engines

COPY . .

WORKDIR /app/backend
RUN yarn build

EXPOSE 3000

CMD ["sh", "-c", "yarn migrate && yarn start"]
