import { createClient } from "redis";
import { Repository } from "redis-om";
import { countrySchema } from "../schemas/countrySchema.js";

var isReady = false;

const redis = createClient({
    url: process.env.REDIS_URL || "redis://redis.dev.svc.cluster.local:6379",
    pingInterval: 1000,
    legacyMode: false
});

const countryRepository = new Repository(countrySchema, redis);

redis.on('error', async (err) => {
    isReady = false;
    redis.disconnect();
    console.log(err);
}).on('connect', async () => {
    isReady = true;
    console.log('Redis connected');
}).on('end', async () => {
    isReady = false;
    redis.disconnect();
    console.log('Redis disconnected');
})

await redis.connect();

export const RedisConnection = {
    isReady,
    redis,
    countryRepository
}