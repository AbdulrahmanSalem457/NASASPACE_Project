FROM node:20-alpine

WORKDIR /app

# Install dos2unix to ensure line endings are clean
RUN apk add --no-cache dos2unix

COPY package*.json ./
RUN npm install

COPY . .

ENV VITE_BACKEND_URL=http://backend:8000

RUN dos2unix /app/entrypoint.sh && chmod +x /app/entrypoint.sh

EXPOSE 5173

CMD ["/app/entrypoint.sh"]
