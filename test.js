import { issueToken, consumeToken, redis } from "./token-service.js";

async function runTest() {
  try {
    console.log("\n=== One-Time Token Service Test ===");
    console.log("Testing that a token can only be used once, even with concurrent consumers...\n");

    // Step 1: Issue one token
    const payload = { userId: 42, purpose: "password-reset" };
    const ttlSeconds = 60;
    const tokenId = await issueToken(payload, ttlSeconds);
    console.log("✓ Issued token:", tokenId);

    // Step 2: Fire 5 consumers simultaneously
    console.log("\n🚀 Firing 5 concurrent consumers at the same token...");
    const results = await Promise.all([
      consumeToken(tokenId),
      consumeToken(tokenId),
      consumeToken(tokenId),
      consumeToken(tokenId),
      consumeToken(tokenId),
    ]);

    // Step 3: Check results
    const winners = results.filter((r) => r.ok).length;
    console.log("\nResults:");
    results.forEach((r, i) => {
      if (r.ok) {
        console.log(`  Consumer ${i + 1}: ✓ SUCCESS - payload:`, r.payload);
      } else {
        console.log(`  Consumer ${i + 1}: ✗ FAILED - reason: ${r.reason}`);
      }
    });

    console.log(`\n📊 Winners: ${winners}`);

    // Step 4: Assert exactly one won
    if (winners === 1) {
      console.log("\n✅ PASS: Token was single-use! Exactly one consumer won.");
      console.log("   This proves GETDEL is atomic and prevents race conditions.\n");
    } else {
      console.log(`\n❌ FAIL: Expected exactly 1 winner, got ${winners}!");
      console.log("   This indicates a race condition. Are you using GETDEL?");
      console.log("   (GET then DEL in two commands allows multiple wins.)\n");
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Test error:", error.message);
    process.exit(1);
  } finally {
    // Cleanup
    await redis.quit();
  }
}

runTest();
