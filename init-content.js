#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("====== Storacha Content Initialization ======");
console.log(
  "This script will initialize your Storacha space with basic content"
);

// Create temporary content files
const tmpDir = path.join(__dirname, "tmp-content");
if (!fs.existsSync(tmpDir)) {
  fs.mkdirSync(tmpDir, { recursive: true });
}

// Create basic content for each category
const categories = ["prize", "sponsor", "judge", "contestant"];

categories.forEach((category) => {
  console.log(`Creating initial content for ${category} category...`);

  const content = {
    name: `${category}-content`,
    description: `Initial ${category} content`,
    items: [],
    timestamp: new Date().toISOString(),
    category: category,
  };

  // Add some sample items based on category
  if (category === "prize") {
    content.items = [
      {
        id: "prize1",
        name: "Grand Prize",
        amount: "$5,000",
        description: "Best overall project",
      },
      {
        id: "prize2",
        name: "Innovation Award",
        amount: "$2,500",
        description: "Most innovative solution",
      },
    ];
  } else if (category === "sponsor") {
    content.items = [
      {
        id: "sponsor1",
        name: "Acme Corp",
        tier: "Gold",
        website: "https://example.com",
        description: "Leading technology provider",
      },
    ];
  } else if (category === "judge") {
    content.items = [
      {
        id: "judge1",
        name: "Jane Smith",
        expertise: ["AI", "Blockchain"],
        description: "Industry expert with 10+ years experience",
      },
    ];
  } else if (category === "contestant") {
    content.items = [
      {
        id: "team1",
        name: "Team Alpha",
        members: 3,
        project: "Project X",
        description: "An innovative solution for...",
      },
    ];
  }

  // Write to file
  const filePath = path.join(tmpDir, `content-${category}.json`);
  fs.writeFileSync(filePath, JSON.stringify(content, null, 2));

  // Upload to Storacha using w3cli
  try {
    console.log(`Uploading ${category} content to Storacha...`);
    const result = execSync(
      `w3 up "${filePath}" --name "content-${category}" --no-wrap --json`
    ).toString();
    const resultObj = JSON.parse(result);
    const cid = resultObj.root["/"];
    console.log(`✅ ${category} content uploaded with CID: ${cid}`);

    // Store mapping in a simple database for the app
    // This creates a mapping.json file that your app can use to find content
    const mappingFile = path.join(__dirname, "content-mapping.json");
    let mapping = {};

    if (fs.existsSync(mappingFile)) {
      mapping = JSON.parse(fs.readFileSync(mappingFile, "utf8"));
    }

    mapping[`content-${category}`] = cid;
    fs.writeFileSync(mappingFile, JSON.stringify(mapping, null, 2));
  } catch (error) {
    console.error(`Error uploading ${category} content:`, error.message);
  }
});

// Create a knowledge sources index
console.log("Creating knowledge sources index...");
const knowledgeSources = {
  sources: categories.map((category) => ({
    url: `content-${category}`,
    category: category,
    description: `${category} knowledge base`,
    id: `kb-${category}`,
    status: "uploaded",
  })),
  timestamp: new Date().toISOString(),
};

const knowledgeSourcesPath = path.join(tmpDir, "knowledge-sources.json");
fs.writeFileSync(
  knowledgeSourcesPath,
  JSON.stringify(knowledgeSources, null, 2)
);

// Upload knowledge sources
try {
  console.log("Uploading knowledge sources index...");
  const result = execSync(
    `w3 up "${knowledgeSourcesPath}" --name "knowledge-sources" --no-wrap --json`
  ).toString();
  const resultObj = JSON.parse(result);
  const cid = resultObj.root["/"];
  console.log(`✅ Knowledge sources uploaded with CID: ${cid}`);

  // Add to mapping
  const mappingFile = path.join(__dirname, "content-mapping.json");
  let mapping = {};

  if (fs.existsSync(mappingFile)) {
    mapping = JSON.parse(fs.readFileSync(mappingFile, "utf8"));
  }

  mapping["knowledge-sources"] = cid;
  fs.writeFileSync(mappingFile, JSON.stringify(mapping, null, 2));
} catch (error) {
  console.error("Error uploading knowledge sources:", error.message);
}

console.log("\n====== Content Initialization Complete ======");
console.log(
  "✅ Your Storacha space now has initial content for all categories."
);
console.log("✅ Content mappings saved to content-mapping.json");
console.log("You can now restart your application to use real content.");
