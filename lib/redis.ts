import { Redis } from "@upstash/redis";

// Подключи Redis-хранилище в Vercel (Storage → Marketplace → Redis, от Upstash) —
// переменные окружения подставятся автоматически под одним из этих имён.
const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;

export const redis = url && token ? new Redis({ url, token }) : null;
