import fs from "fs";
import path from "path";

const CONFIG_FILE = path.join(process.cwd(), "lib", "last-api.json");

export function getLastUsedApi(): "gemini" | "groq" {
  // Ensure the directory exists
  const dir = path.dirname(CONFIG_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Check if config file exists
  if (fs.existsSync(CONFIG_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));
      if (data && (data.lastUsedApi === "gemini" || data.lastUsedApi === "groq")) {
        // Also sync to process.env
        process.env.LAST_USED_API = data.lastUsedApi;
        return data.lastUsedApi;
      }
    } catch (e) {
      console.error("Failed to read last-api config file", e);
    }
  }

  // Fallback to process.env or default
  const envVal = process.env.LAST_USED_API;
  if (envVal === "groq" || envVal === "gemini") {
    return envVal;
  }

  return "gemini";
}

export function setLastUsedApi(api: "gemini" | "groq") {
  const dir = path.dirname(CONFIG_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  try {
    fs.writeFileSync(
      CONFIG_FILE,
      JSON.stringify({ lastUsedApi: api, timestamp: new Date().toISOString() }, null, 2),
      "utf-8"
    );
    // Sync to process.env
    process.env.LAST_USED_API = api;
  } catch (e) {
    console.error("Failed to write last-api config file", e);
  }
}
