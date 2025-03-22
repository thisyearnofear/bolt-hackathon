# Storacha Integration Troubleshooting Guide

This guide covers common issues and solutions when working with Storacha in Hackathon Bolt.

## Common Issues

### Content Not Loading

#### Symptoms:

- "Could not resolve content ID" messages in console
- 500 errors when trying to download content
- Content manager showing empty content or falling back to sample data

#### Solutions:

1. **Check content mapping**:

   - Verify content-mapping.json is in the public directory
   - Ensure it contains mappings for all content IDs (content-prize, content-sponsor, etc.)
   - Content mapping should be properly loaded in localStorage

2. **Reinitialize content**:

   ```bash
   npm run init-content
   ```

3. **Check Netlify functions are running**:

   ```bash
   npm run netlify
   ```

4. **Test direct API access**:

   ```bash
   # Test ping function
   curl -X POST http://localhost:8888/.netlify/functions/storacha-client \
     -H "Content-Type: application/json" \
     -d '{"action":"ping", "data":{"spaceDid":"YOUR_SPACE_DID"}}'

   # Test download function with a CID
   curl -X POST http://localhost:8888/.netlify/functions/storacha-client \
     -H "Content-Type: application/json" \
     -d '{"action":"download", "data":{"spaceDid":"YOUR_SPACE_DID", "cid":"SOME_CID"}}'
   ```

5. **Check browser console for details**:
   - Look for "StorachaNetlifyClient" log messages
   - Check for content loading/parsing errors

### Connection Issues

#### Symptoms:

- "Connection test failed" messages
- Failed initialization of StorachaNetlifyClient
- API requests returning 400 Bad Request

#### Solutions:

1. **Verify environment variables**:

   - Check .env.local contains STORACHA_SPACE_DID, STORACHA_PRIVATE_KEY and STORACHA_PROOF
   - Run the setup script if needed:

   ```bash
   npm run setup-storacha
   ```

2. **Check Netlify development server**:

   - Make sure it's running on port 8888
   - Restart it if there are issues:

   ```bash
   cd .. && killall node && cd hackathon-bolt && npm run netlify
   ```

3. **Use the diagnostic tool**:
   - Go to Admin -> Diagnostics
   - Run a full diagnostic check
   - Review recommendations

### Content Format Issues

#### Symptoms:

- "Invalid content format" errors
- Content loads but doesn't display correctly
- JSON parsing errors

#### Solutions:

1. **Check content structure**:

   - Content should follow the expected structure with `items` array
   - Verify with direct API call:

   ```bash
   curl -X POST http://localhost:8888/.netlify/functions/storacha-client \
     -H "Content-Type: application/json" \
     -d '{"action":"download", "data":{"spaceDid":"YOUR_SPACE_DID", "cid":"CONTENT_CID"}}' | base64 -D
   ```

2. **Regenerate content**:

   - Delete and recreate content files:

   ```bash
   rm -rf tmp-content content-mapping.json
   npm run init-content
   ```

3. **Check browser handling**:
   - Content might be base64 encoded twice
   - Try adding additional decoding in ContentManager

## Advanced Troubleshooting

### Checking Raw Storage Content

To directly view content on IPFS:

```
https://w3s.link/ipfs/YOUR_CID
```

### Debugging the Netlify Function

Add extensive console logging:

```javascript
// In storacha-client.ts
console.log("Input data:", JSON.stringify(data));
console.log("Client state:", client ? "initialized" : "null");

// Add try/catch with detailed error reporting
try {
  // Your code
} catch (error) {
  console.error("Operation failed:", error);
  console.error("Error stack:", error.stack);
  // Format and return error
}
```

### Resetting the Environment

If all else fails, you can reset your entire Storacha setup:

```bash
# Create backup of current files
mkdir -p backup
cp .env.local backup/
cp content-mapping.json backup/

# Re-run the setup
npm run setup-storacha
npm run init-content

# Restart Netlify
npm run netlify
```

## Support Resources

- [Storacha Documentation](https://docs.web3.storage/)
- [w3cli GitHub Repository](https://github.com/web3-storage/w3cli)
- [Netlify Functions Documentation](https://docs.netlify.com/functions/overview/)
