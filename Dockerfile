FROM oven/bun:latest
WORKDIR /app
COPY package.json bun.lock* ./
RUN bun install --production
COPY src/ src/
COPY tests/fixtures/ tests/fixtures/
COPY tsconfig.json ./
ENV PORT=8080
EXPOSE 8080
CMD ["bun", "src/server.ts"]
