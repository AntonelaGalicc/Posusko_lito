FROM node:23-slim@sha256:8d56afd4d4f445a584eefd8d2415fc5e40a169ab92347c0a8a97c67b588ec707

WORKDIR /app

# Kopiraj package datoteke i instaliraj
COPY package.json package-lock.json ./
RUN npm install

# Kopiraj .env (mora biti prije builda da React build vidi varijable)
COPY .env .env

# Kopiraj ostatak koda
COPY . .

# Za OpenSSL legacy opciju ako trebaš
ENV NODE_OPTIONS=--openssl-legacy-provider

# Buildaj aplikaciju
RUN npm run build

# Instaliraj statički server globalno
RUN npm install -g serve

# Pokreni statički server za build direktorij na portu 3000
CMD ["serve", "-s", "build", "-l", "3000"]
