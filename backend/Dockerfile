FROM node:22-alpine AS builder
WORKDIR /app
RUN apk add --no-cache openssl curl font-noto-bengali
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
RUN npx prisma generate
# Copy NotoSansBengali from Alpine package into assets/fonts so the PDF service can find them
RUN mkdir -p assets/fonts && \
    cp /usr/share/fonts/noto/NotoSansBengali-Regular.ttf assets/fonts/ && \
    cp /usr/share/fonts/noto/NotoSansBengali-Bold.ttf assets/fonts/
RUN sh scripts/download-fonts.sh || echo "Font download skipped — place TTF files in assets/fonts/ for PDF support"

FROM node:22-alpine AS runner
WORKDIR /app
RUN apk add --no-cache openssl
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/assets ./assets
EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
