#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import readline from "readline";
import { fileURLToPath } from "url";

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query) =>
  new Promise((resolve) => rl.question(query, resolve));

async function main() {
  console.log("\n======= Storacha Setup Guide =======\n");
  console.log(
    "This script will guide you through setting up Storacha for production use."
  );

  // Check if w3cli is installed
  try {
    execSync("w3 --version", { stdio: "ignore" });
    console.log("✅ w3cli is installed");
  } catch (error) {
    console.log("❌ w3cli is not installed");
    console.log("Installing w3cli globally...");
    try {
      execSync("npm install -g @web3-storage/w3cli", { stdio: "inherit" });
      console.log("✅ w3cli has been installed");
    } catch (installError) {
      console.error("Failed to install w3cli:", installError.message);
      console.error(
        "Please install it manually with: npm install -g @web3-storage/w3cli"
      );
      process.exit(1);
    }
  }

  // Create a space if needed
  console.log("\n---- Step 1: Create a Storacha Space ----");
  console.log("You need to create a space to store your files.");

  let useExisting = await question(
    "Do you already have a Storacha space? (y/n): "
  );

  let spaceDID;
  if (useExisting.toLowerCase() === "y") {
    // List existing spaces
    try {
      console.log("\nListing your existing spaces...");
      execSync("w3 space ls", { stdio: "inherit" });

      spaceDID = await question(
        "\nEnter the DID of the space you want to use: "
      );
      if (!spaceDID.startsWith("did:key:")) {
        console.error('Invalid DID format. It should start with "did:key:"');
        process.exit(1);
      }
      console.log(`Using space: ${spaceDID}`);

      // Set as current space
      execSync(`w3 space use ${spaceDID}`, { stdio: "inherit" });
    } catch (error) {
      console.error("Error accessing spaces:", error.message);
      console.log("You might need to login or create a space first.");
      const createNew = await question(
        "Would you like to create a new space instead? (y/n): "
      );
      if (createNew.toLowerCase() !== "y") {
        process.exit(1);
      }
      useExisting = "n";
    }
  }

  if (useExisting.toLowerCase() === "n") {
    const spaceName = await question(
      'Enter a name for your new space (e.g., "HackathonBolt"): '
    );
    try {
      console.log(`\nCreating space "${spaceName}"...`);
      execSync(`w3 space create "${spaceName}"`, { stdio: "inherit" });

      // Get the DID from the output
      const spaces = execSync("w3 space ls").toString();
      const activeSpaceMatch = spaces.match(/\* (did:key:[a-zA-Z0-9]+) /);

      if (activeSpaceMatch && activeSpaceMatch[1]) {
        spaceDID = activeSpaceMatch[1];
        console.log(`Created space with DID: ${spaceDID}`);
      } else {
        console.error("Failed to extract DID from newly created space");
        process.exit(1);
      }
    } catch (error) {
      console.error("Error creating space:", error.message);
      process.exit(1);
    }
  }

  // Create signing key for CI/CD
  console.log("\n---- Step 2: Create a Signing Key ----");
  console.log("Creating a new signing key for CI/CD or server usage...");

  let keyData;
  try {
    keyData = execSync("w3 key create --json").toString();
    console.log("✅ Signing key created successfully");

    // Parse the JSON output
    const keyObj = JSON.parse(keyData);
    console.log(`Key DID: ${keyObj.did}`);
    console.log(`Secret Key: ${keyObj.key.substring(0, 8)}... (hidden)`);
  } catch (error) {
    console.error("Error creating signing key:", error.message);
    process.exit(1);
  }

  // Create a delegation proof
  console.log("\n---- Step 3: Create a Delegation Proof ----");
  console.log("Creating a delegation proof for the signing key...");

  let proof;
  try {
    const keyObj = JSON.parse(keyData);
    const audience = keyObj.did;

    proof = execSync(
      `w3 delegation create ${audience} -c space/blob/add -c space/index/add -c filecoin/offer -c upload/add --base64`
    )
      .toString()
      .trim();
    console.log("✅ Delegation proof created successfully");
  } catch (error) {
    console.error("Error creating delegation proof:", error.message);
    process.exit(1);
  }

  // Update .env file
  console.log("\n---- Step 4: Update Environment Variables ----");
  console.log("Updating .env.local file with Storacha configuration...");

  try {
    // Read the .env.local file
    const envPath = path.join(process.cwd(), ".env.local");
    let envContent = fs.readFileSync(envPath, "utf8");

    // Update or add the Storacha variables
    const keyObj = JSON.parse(keyData);

    // Check if variables already exist and update them
    if (envContent.includes("STORACHA_SPACE_DID=")) {
      envContent = envContent.replace(
        /STORACHA_SPACE_DID=.*/g,
        `STORACHA_SPACE_DID=${spaceDID}`
      );
    } else {
      envContent += `\nSTORACHA_SPACE_DID=${spaceDID}`;
    }

    if (envContent.includes("STORACHA_PRIVATE_KEY=")) {
      envContent = envContent.replace(
        /STORACHA_PRIVATE_KEY=.*/g,
        `STORACHA_PRIVATE_KEY=${keyObj.key}`
      );
    } else {
      envContent += `\nSTORACHA_PRIVATE_KEY=${keyObj.key}`;
    }

    if (envContent.includes("STORACHA_PROOF=")) {
      envContent = envContent.replace(
        /STORACHA_PROOF=.*/g,
        `STORACHA_PROOF=${proof}`
      );
    } else {
      envContent += `\nSTORACHA_PROOF=${proof}`;
    }

    // Write the updated content back to the file
    fs.writeFileSync(envPath, envContent);
    console.log("✅ .env.local file updated successfully");
  } catch (error) {
    console.error("Error updating .env.local file:", error.message);
    console.log(
      "You will need to manually add the following variables to your .env.local file:"
    );
    console.log(`STORACHA_SPACE_DID=${spaceDID}`);
    console.log(`STORACHA_PRIVATE_KEY=${JSON.parse(keyData).key}`);
    console.log(`STORACHA_PROOF=${proof}`);
  }

  // Test the setup
  console.log("\n---- Step 5: Test the Setup ----");
  console.log("Testing the Storacha setup by uploading a test file...");

  try {
    // Create a test file
    const testFilePath = path.join(process.cwd(), "storacha-test.txt");
    fs.writeFileSync(
      testFilePath,
      `Test file created at ${new Date().toISOString()}`
    );

    // Upload the test file
    console.log("Uploading test file...");
    const uploadResult = execSync(`w3 up "${testFilePath}" --json`).toString();

    // Parse the JSON output to get the CID
    const resultObj = JSON.parse(uploadResult);
    const cid = resultObj.root["/"];

    console.log(`✅ Test file uploaded successfully with CID: ${cid}`);
    console.log(`You can view it at: https://${cid}.ipfs.w3s.link`);

    // Clean up the test file
    fs.unlinkSync(testFilePath);
  } catch (error) {
    console.error("Error testing Storacha setup:", error.message);
    console.log("Please check your Storacha configuration and try again.");
  }

  // Print instructions for adding to env file
  console.log("\n---- Final Steps ----");
  console.log(
    "Your Storacha space is now properly set up and ready for production use."
  );
  console.log(
    "The necessary environment variables have been added to your .env.local file."
  );
  console.log("\nFor production deployment on Netlify:");
  console.log("1. Go to your Netlify site settings");
  console.log('2. Navigate to "Environment variables"');
  console.log("3. Add the following environment variables:");
  console.log(`   - STORACHA_SPACE_DID: ${spaceDID}`);
  console.log("   - STORACHA_PRIVATE_KEY: (The private key from step 2)");
  console.log("   - STORACHA_PROOF: (The delegation proof from step 3)");

  console.log(
    "\nYou should now restart your Netlify dev server to apply these changes."
  );

  rl.close();
}

main().catch((error) => {
  console.error("An unexpected error occurred:", error);
  process.exit(1);
});
