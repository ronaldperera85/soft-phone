# Etapa 1: Build
FROM node:16-alpine AS builder

WORKDIR /usr/src/app

# Copiar package.json y package-lock.json si existe
COPY package*.json ./

# Instalar las dependencias del servidor
RUN npm install

# Copiar el resto del código de la aplicación
COPY . .

# Etapa 2: Run
FROM node:16-alpine

WORKDIR /usr/src/app

# Copiar las dependencias instaladas y el código de la etapa de build
COPY --from=builder /usr/src/app .

# Exponer el puerto que nuestra app usará
EXPOSE 80

# Comando para correr la aplicación
CMD [ "npm", "start" ]