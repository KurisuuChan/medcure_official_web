import { isMockMode, mockFetchProducts } from "./src/utils/mockApi.js";

console.log("=== Testing Mock API ===");
console.log("Mock Mode:", isMockMode());

if (isMockMode()) {
  console.log("Testing mock products fetch...");
  mockFetchProducts()
    .then((result) => {
      console.log("Mock products result:", result);
    })
    .catch((error) => {
      console.error("Mock API error:", error);
    });
} else {
  console.log("Mock mode is disabled");
}
