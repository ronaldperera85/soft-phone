const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 80; // CapRover espera que las apps escuchen en el puerto 80

// 1. Script para generar el archivo config.js
const configContent = `
window.env = {
  SERVIDOR: "${process.env.SERVIDOR || ''}",
  PUERTO_WSS: "${process.env.PUERTO_WSS || ''}",
  EXTENSION: "${process.env.EXTENSION || ''}",
  CLAVE: "${process.env.CLAVE || ''}"
};
`;

const publicDir = path.join(__dirname, 'public');
const configPath = path.join(publicDir, 'config.js');

// Asegurarse de que el directorio 'public' exista
if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir);
}

// Escribir el contenido en el archivo dentro de public
fs.writeFileSync(configPath, configContent);

console.log('config.js generado con éxito.');
console.log(`Servidor PBX: ${process.env.SERVIDOR || 'No definido'}`);

// 2. Servir los archivos estáticos desde el directorio 'public'
app.use(express.static(publicDir));

// 3. Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor web escuchando en el puerto ${port}`);
});