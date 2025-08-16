// Test script for POS system functionality
import {
  validatePOSCart,
  calculatePOSTotals,
} from "./src/services/posService.js";

// Test cart validation
const testCart = [
  {
    id: 1,
    name: "Test Product",
    selling_price: 10.5,
    quantity: 5,
    total_stock: 100,
    packaging: {
      boxes_sold: 0,
      sheets_sold: 1,
      pieces_sold: 5,
    },
  },
];

console.log("🧪 Testing POS functionality...");

// Test cart validation
const validation = validatePOSCart(testCart);
console.log("✅ Cart validation:", validation);

// Test total calculations
const totals = calculatePOSTotals(testCart, 10, false);
console.log("💰 Total calculations:", totals);

// Test with PWD/Senior discount
const totalsWithDiscount = calculatePOSTotals(testCart, 5, true);
console.log("🎫 Totals with PWD/Senior discount:", totalsWithDiscount);

console.log("🎯 POS system test completed!");
