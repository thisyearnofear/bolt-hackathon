# Storacha Production Setup Guide

This guide will help you set up Storacha for production use in your Hackathon Bolt application.

## Automated Setup

We've created a helper script that automates the Storacha setup process. Run:

```bash
npm run setup-storacha
```

The script will guide you through:

1. Creating a Storacha space (or using an existing one)
2. Creating a signing key for authentication
3. Creating a delegation proof
4. Updating your environment variables
5. Testing the setup with a sample upload

## Manual Setup

If you prefer to manually set up Storacha, follow these steps:

### 1. Install the w3cli

```bash
npm install -g @web3-storage/w3cli
```

### 2. Create a Storacha Space

```bash
w3 space create HackathonBolt
```

This will guide you through the creation process and set your new space as the active one.

### 3. Create a Signing Key

```bash
w3 key create --json
```

Save the output, which contains:

- `did`: The public identifier for the signing key
- `key`: The private signing key (keep this secure)

### 4. Create a Delegation Proof

Using the `did` from the previous step:

```bash
w3 delegation create did:key:YOUR_KEY_DID -c space/blob/add -c space/index/add -c filecoin/offer -c upload/add --base64
```

Save the output, which is your delegation proof.

### 5. Update Environment Variables

Add the following variables to your `.env.local` file:

```
STORACHA_SPACE_DID=did:key:YOUR_SPACE_DID
STORACHA_PRIVATE_KEY=YOUR_PRIVATE_KEY
STORACHA_PROOF=YOUR_DELEGATION_PROOF
```

### 6. Deploy to Netlify

When deploying to Netlify, add the same environment variables in your Netlify site settings.

## Verifying the Setup

To verify that your Storacha setup is working:

1. Run the Netlify dev server:

   ```bash
   npm run netlify
   ```

2. In your application, test the storage functionality:
   - Navigate to the StorachaConfig component
   - Ensure it detects your private credentials
   - Test the connection

## Troubleshooting

If you encounter issues:

1. **Cannot upload files**:

   - Verify your space DID, private key, and proof are correct
   - Check that your space has the required capabilities delegated

2. **Permission errors**:

   - Make sure you've properly delegated capabilities in the proof
   - Verify that the space is registered and properly provisioned

3. **Temporary spaces created despite environment variables**:
   - Check if the environment variables are properly set and accessible
   - Restart your dev server to reload the environment

## For Production

In production:

1. Always use a properly provisioned space (not temporary ones)
2. Properly secure your private key in environment variables
3. Store the delegation proof in environment variables
4. Never hard-code these values in your source code

For additional support, refer to the [Storacha documentation](https://docs.web3.storage/).
