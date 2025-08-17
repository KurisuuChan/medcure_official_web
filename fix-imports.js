const fs = require("fs");

// Files to fix
const files = [
  "src/services/productService.js",
  "src/services/salesService.js",
  "src/services/settingsService.js",
  "src/services/archivedService.js",
];

files.forEach((filePath) => {
  try {
    let content = fs.readFileSync(filePath, "utf8");

    // Replace all variations of isMockMode() with await shouldUseMockAPI()
    content = content.replace(
      /if \(isMockMode\(\)\)/g,
      "if (await shouldUseMockAPI())"
    );
    content = content.replace(
      /    if \(isMockMode\(\)\)/g,
      "    if (await shouldUseMockAPI())"
    );

    fs.writeFileSync(filePath, content, "utf8");
    console.log(`✅ Fixed ${filePath}`);
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
  }
});

console.log("🎉 All files processed!");
console.log("Now checking for any remaining issues...");

// Verify fixes
files.forEach((filePath) => {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    const matches = content.match(/isMockMode\(\)/g);
    if (matches) {
      console.log(
        `⚠️  ${filePath} still has ${matches.length} isMockMode() calls`
      );
    } else {
      console.log(`✅ ${filePath} - all isMockMode() calls fixed`);
    }
  } catch (error) {
    console.error(`❌ Error checking ${filePath}:`, error.message);
  }
});
