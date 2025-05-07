FROM node:23-slim@sha256:8d56afd4d4f445a584eefd8d2415fc5e40a169ab92347c0a8a97c67b588ec707

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .

# 🔧 Ovo rješava grešku s OpenSSL
ENV NODE_OPTIONS=--openssl-legacy-provider

RUN npm run build

RUN npm install -g serve
CMD ["serve", "-s", "build", "-l", "3000"]
