# Usa una imagen base de Node.js
FROM node:20

# Define el directorio de trabajo
WORKDIR /app

# Copia los archivos necesarios
COPY package*.json ./
COPY . .

# Instala las dependencias
RUN npm install

# Expone el puerto del Frontend
EXPOSE 3001

# Comando para iniciar la aplicación
CMD ["npm", "start"]
