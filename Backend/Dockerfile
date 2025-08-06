# Usa una imagen base con Node.js
FROM node:20

# Establece el directorio de trabajo dentro del contenedor
WORKDIR /Backend

# Copia los archivos del proyecto al contenedor
COPY package*.json ./
COPY . .

# Instala las dependencias
RUN npm install

# Expone el puerto 3000 para el backend
EXPOSE 3000

# Comando para iniciar el servidor
CMD ["npm", "start"]
