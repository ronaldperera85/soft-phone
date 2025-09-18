# --- ETAPA 1: CONSTRUIR LA APLICACIÓN CON VITE ---
# Usamos una imagen de Node.js para tener las herramientas de construcción (npm, node)
FROM node:18-alpine AS build

# Establecemos el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiamos package.json y package-lock.json para instalar dependencias
COPY package*.json ./

# Instalamos las dependencias del proyecto
RUN npm install

# Copiamos el resto del código fuente de la aplicación (src, index.html, etc.)
COPY . .

# ¡El comando mágico! Esto ejecuta Vite en modo 'build' y crea la carpeta 'dist'
RUN npm run build


# --- ETAPA 2: SERVIR LOS ARCHIVOS CONSTRUIDOS CON NGINX ---
# Usamos una imagen de Nginx, que es un servidor web muy ligero y rápido
FROM nginx:stable-alpine

# Copiamos los archivos estáticos optimizados desde la etapa de 'build' 
# a la carpeta donde Nginx sirve los archivos por defecto.
COPY --from=build /app/dist /usr/share/nginx/html

# Le decimos a Docker que el contenedor escuchará en el puerto 80
EXPOSE 80

# Nginx se inicia automáticamente, por lo que no necesitamos un comando CMD.
# Simplemente sirve el contenido de /usr/share/nginx/html.