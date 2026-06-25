FROM node:16-alpine

# Установка всех необходимых build-инструментов
RUN apk add --no-cache \
    python3 \
    py3-pip \
    make \
    g++ \
    gcc

RUN ln -sf python3 /usr/bin/python

WORKDIR /app

COPY app/package*.json ./
RUN npm install

COPY app/ .

EXPOSE 3000

CMD ["npm", "start"]