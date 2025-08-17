import { readFileSync, writeFileSync } from "fs";

// Files to fix
const files = [
  "src/services/productService.js",
  "src/services/salesService.js",
  "src/services/settingsService.js",
  "src/services/archivedService.js",
];

files.forEach((filePath) => {
  try {
    let content = readFileSync(filePath, "utf8");

    // Replace all variations of isMockMode() with await isMockMode()
    content = content.replace(
      /if \(isMockMode\(\)\)/g,
      "if (await isMockMode())"
    );
    content = content.replace(
      /    if \(isMockMode\(\)\)/g,
      "    if (await isMockMode())"
    );

    writeFileSync(filePath, content, "utf8");
    console.log(`✅ Fixed ${filePath}`);
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
  }
});

console.log("🎉 All files processed!");
