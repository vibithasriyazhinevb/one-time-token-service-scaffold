# One-Time Token Service

A Redis-backed service for issuing and consuming single-use tokens. This service is used for password resets, magic links, email verification, and OTPs.

## Features

✅ **Unguessable tokens** - Generated with `crypto.randomBytes(16)`
✅ **Single-use guarantee** - Atomic `GETDEL` prevents race conditions  
✅ **Auto-expiring** - TTL ensures tokens clean themselves up
✅ **Type-safe results** - Explicit success/failure objects

## Setup

### Prerequisites
- Node.js 18+
- Redis running (local or Docker)

### Installation

```bash
# Clone your fork
git clone https://github.com/<your-username>/one-time-token-service-scaffold.git
cd one-time-token-service-scaffold

# Install dependencies
npm install

# Copy and configure .env
cp .env.example .env
# Edit .env and set REDIS_URL (e.g., redis://localhost:6379)
```

### Start Redis (if using Docker)

```bash
# Start Redis container
docker run -d -p 6379:6379 --name redis-m4 redis:latest

# Or if you have an existing container:
docker start redis-m4
```

## What to Build

You need to implement two functions in `token-service.js`:

### `issueToken(payload, ttlSeconds)`

Issues a single-use token.

**Steps:**
1. Generate random id: `crypto.randomBytes(16).toString("hex")` → 32 hex chars
2. Serialize payload: `JSON.stringify(payload)`
3. Store atomically: `redis.set(keyFor(tokenId), value, "EX", ttlSeconds, "NX")`
4. Return the tokenId string

**Key point:** Never split into `SET` then `EXPIRE` — use `SET ... EX` as ONE command.

### `consumeToken(tokenId)`

Consumes a token exactly once.

**Steps:**
1. Read and delete atomically: `redis.getdel(keyFor(tokenId))`
2. If null (missing/expired/consumed): return `{ ok: false, reason: "invalid" }`
3. If found: parse JSON and return `{ ok: true, payload }`

**Key point:** MUST use `GETDEL` — not GET then DEL (that has a race condition).

### Test (`test.js`)

Proves the service is single-use:

1. Issue one token
2. Fire 5 `consumeToken` calls simultaneously with `Promise.all`
3. Count how many returned `ok: true`
4. Assert exactly 1 won

## Run Tests

```bash
npm test
```

**Expected output:**
```
=== One-Time Token Service Test ===
Testing that a token can only be used once, even with concurrent consumers...

✓ Issued token: 9f2a7c1e4b8d0a6f3e5c9b1d7a4f2e8c

🚀 Firing 5 concurrent consumers at the same token...

Results:
  Consumer 1: ✓ SUCCESS - payload: { userId: 42, purpose: 'password-reset' }
  Consumer 2: ✗ FAILED - reason: invalid
  Consumer 3: ✗ FAILED - reason: invalid
  Consumer 4: ✗ FAILED - reason: invalid
  Consumer 5: ✗ FAILED - reason: invalid

📊 Winners: 1

✅ PASS: Token was single-use! Exactly one consumer won.
   This proves GETDEL is atomic and prevents race conditions.
```

## Why GETDEL?

Compare two approaches:

### ❌ WRONG: GET then DEL (2 commands)
```javascript
const value = await redis.get("token:" + id);     // step 1
if (!value) return { ok: false };
await redis.del("token:" + id);                   // step 2
return { ok: true, payload: JSON.parse(value) };
```

The gap between step 1 and step 2 is a **race condition**. Five concurrent calls can all GET before any DEL — so the token works 5 times. ❌

### ✅ CORRECT: GETDEL (1 atomic command)
```javascript
const value = await redis.getdel("token:" + id);  // read+delete in ONE step
if (value === null) return { ok: false, reason: "invalid" };
return { ok: true, payload: JSON.parse(value) };
```

Because Redis is single-threaded, **only one** consumer can read the value before it's deleted. Everyone else gets `null`. ✅ Exactly one winner, guaranteed.

## Submission

1. **Implement** `issueToken` and `consumeToken` in `token-service.js`
2. **Run** `npm test` and verify `winners: 1`
3. **Commit** your changes
4. **Push** to your branch
5. **Open a Pull Request** back to your fork
6. **Copy the test output** into the PR description as proof

### Rubric (10 marks)

| Criteria | Marks |
|----------|-------|
| `issueToken` generates random id + stores JSON with atomic SET ... EX | 2 |
| `consumeToken` uses GETDEL (atomic read+delete) | 3 |
| `consumeToken` returns typed result (`{ ok, payload }` / `{ ok: false, reason }`) | 2 |
| `test.js` fires 5 concurrent consumers with Promise.all and asserts exactly one wins | 2 |
| Evidence of passing run (winners: 1) in PR description | 1 |

## Debugging Tips

**Q: I'm getting "redis is not connected"**

A: Make sure Redis is running:
```bash
docker ps  # Check if redis container is running
# or
redis-cli ping  # Should print PONG
```

**Q: Test shows `winners: 5`**

A: You're using GET then DEL instead of GETDEL. Switch to:
```javascript
const value = await redis.getdel(keyFor(tokenId));
```

**Q: Token isn't storing correctly**

A: Make sure you're using `SET ... EX` atomically, not `SET` then `EXPIRE`:
```javascript
// ✅ CORRECT
await redis.set(keyFor(tokenId), value, "EX", ttlSeconds, "NX");

// ❌ WRONG (token might not expire)
await redis.set(keyFor(tokenId), value, "NX");
await redis.expire(keyFor(tokenId), ttlSeconds);
```

## References

- [Redis GETDEL](https://redis.io/commands/getdel/)
- [Node.js crypto.randomBytes](https://nodejs.org/api/crypto.html#crypto_crypto_randombytes_size_callback)
- [ioredis API](https://github.com/luin/ioredis)
- [OWASP Secure Token Design](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html#session-ids)
