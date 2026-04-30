# Stage 1: Build stage
FROM node:22-alpine AS build

# Define build arguments
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY

# Pass ARGs to ENV so Vite can see them during 'npm run build'
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

WORKDIR /app

# --- FAIL-FAST CHECK ---
# This ensures the build stops if secrets are missing
RUN if [ -z "$VITE_SUPABASE_URL" ] || [ -z "$VITE_SUPABASE_ANON_KEY" ]; then \
  echo "ERROR: Supabase credentials missing! Build failed." && exit 1; \
  fi

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

# Stage 2: Production stage
FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
