FROM node:22-alpine

WORKDIR /app

COPY package.json ./

RUN npm config set registry https://registry.npmmirror.com/ && npm install

COPY . .

RUN npx prisma generate

RUN npm run build

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

EXPOSE 3000

CMD ["node", ".next/standalone/server.js"]