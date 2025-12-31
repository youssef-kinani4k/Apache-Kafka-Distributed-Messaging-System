FROM node:18-alpine
WORKDIR /app
COPY package.json .
RUN npm install
COPY . .
# En développement, on lance le serveur de dev React
CMD ["npm", "start"]