import crypto from "node:crypto";
import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");
const keyFor = (id) => "token:" + id;

/**
 * Issue a single-use token that expires after ttlSeconds.
 * 
 * @param {Object} payload - The data to store in the token (e.g., { userId: 42, purpose: "reset" })
 * @param {number} ttlSeconds - Time to live in seconds
 * @returns {Promise<string>} The tokenId string to hand to the user
 * 
 * TODO: Implement this function
 * 1. Generate a random id with crypto.randomBytes(16).toString("hex")
 * 2. Serialize the payload to JSON
 * 3. Store it atomically with SET ... EX ttlSeconds NX
 * 4. Return the tokenId
 */
export async function issueToken(payload, ttlSeconds) {
  // TODO: Fill this in
  throw new Error("issueToken not implemented");
}

/**
 * Consume a token exactly once.
 * 
 * @param {string} tokenId - The token id to consume
 * @returns {Promise<Object>} Result object:
 *   - { ok: true, payload } if token was valid
 *   - { ok: false, reason: "invalid" } if token missing/expired/already consumed
 * 
 * TODO: Implement this function
 * 1. Use GETDEL to read and delete in one atomic command
 * 2. If the token doesn't exist, return { ok: false, reason: "invalid" }
 * 3. Parse the JSON value and return { ok: true, payload }
 */
export async function consumeToken(tokenId) {
  // TODO: Fill this in
  throw new Error("consumeToken not implemented");
}

// Export redis for cleanup in tests
export { redis };
