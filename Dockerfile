FROM node:20-alpine

WORKDIR /frontend_inaqstock

# 1. Copia primero solo los archivos de dependencias
COPY package.json yarn.lock ./

# 2. Instala dependencias (con cache limpia)
RUN yarn install --frozen-lockfile --network-timeout 1000000 && \
    yarn cache clean

# 3. Copia el resto del código
COPY . .

# 4. Variables de entorno esenciales
ENV HOST=0.0.0.0
ENV PORT=5173
ENV CHOKIDAR_USEPOLLING=true
ENV NODE_ENV=development

EXPOSE 5173

# 5. Comando mejorado para desarrollo
CMD ["yarn", "dev"]