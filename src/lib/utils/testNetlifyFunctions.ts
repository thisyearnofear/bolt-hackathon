/**
 * Utility functions to test the Netlify functions from the browser
 */

// Determine the appropriate API base URL based on the environment
const getApiBaseUrl = () => {
  // In development, always use the Netlify dev server URL
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:8888/.netlify/functions";
  }

  // In production, functions are accessed via the /api path due to redirects
  return "/api";
};

/**
 * Test the Storacha client function
 */
export async function testStorachaFunction() {
  try {
    console.log("Testing Storacha client Netlify function...");

    // Create test data
    const testData = {
      id: "test-" + Date.now(),
      message: "Hello from the test function!",
      timestamp: new Date().toISOString(),
    };

    // Convert to base64 for transmission
    const blob = new Blob([JSON.stringify(testData)], {
      type: "application/json",
    });
    const base64Content = await blobToBase64(blob);

    // Get the appropriate API URL
    const apiUrl = `${getApiBaseUrl()}/storacha-client`;
    console.log(`Using API URL: ${apiUrl}`);

    // Call the function with upload action
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "upload",
        data: {
          content: base64Content,
          filename: `test-${Date.now()}.json`,
          contentType: "application/json",
        },
      }),
    });

    // Check the response
    if (!response.ok) {
      throw new Error(`Function call failed with status: ${response.status}`);
    }

    const result = await response.json();
    console.log("Function test result:", result);

    if (result.success) {
      console.log("✅ Storacha client function is working correctly!");
      console.log("CID:", result.cid);
      console.log("URL:", result.url);
      return result;
    } else {
      console.error("❌ Function returned success: false");
      console.error("Error:", result.error);
      return null;
    }
  } catch (error) {
    console.error("❌ Error testing Storacha client function:", error);
    return null;
  }
}

/**
 * Test downloading content from a CID
 */
export async function testDownloadFromCid(cid: string) {
  try {
    console.log(`Testing download from CID: ${cid}`);

    // Get the appropriate API URL
    const apiUrl = `${getApiBaseUrl()}/storacha-client`;

    // Call the function with download action
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "download",
        data: { cid },
      }),
    });

    // Check the response
    if (!response.ok) {
      throw new Error(`Download failed with status: ${response.status}`);
    }

    const result = await response.json();
    console.log("Download result:", result);

    if (result.success) {
      console.log("✅ Download successful!");
      console.log("Content:", result.content);
      return result.content;
    } else {
      console.error("❌ Download returned success: false");
      console.error("Error:", result.error);
      return null;
    }
  } catch (error) {
    console.error("❌ Error testing download:", error);
    return null;
  }
}

/**
 * Test listing uploads in the current space
 */
export async function testListUploads() {
  try {
    console.log("Testing list uploads function...");

    // Get the appropriate API URL
    const apiUrl = `${getApiBaseUrl()}/storacha-client`;

    // Call the function with list action
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "list",
        data: { size: 5 },
      }),
    });

    // Check the response
    if (!response.ok) {
      throw new Error(`List operation failed with status: ${response.status}`);
    }

    const result = await response.json();
    console.log("List result:", result);

    if (result.success) {
      console.log("✅ List operation successful!");
      console.log(`Found ${result.uploads?.length || 0} uploads`);
      return result.uploads;
    } else {
      console.error("❌ List operation returned success: false");
      console.error("Error:", result.error);
      return null;
    }
  } catch (error) {
    console.error("❌ Error testing list operation:", error);
    return null;
  }
}

/**
 * Helper to convert blob to base64
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(",")[1];
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
