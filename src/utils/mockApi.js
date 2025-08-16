// Mock API layer so we can demonstrate professional structure without backend

const SAMPLE = [
  {
    id: 1,
    name: "Paracetamol 500mg",
    category: "Analgesic",
    quantity: 120,
    cost_price: 3.5,
  },
  {
    id: 2,
    name: "Vitamin C 1000mg",
    category: "Supplement",
    quantity: 6,
    cost_price: 5.0,
  },
  {
    id: 3,
    name: "Amoxicillin 500mg",
    category: "Antibiotic",
    quantity: 0,
    cost_price: 7.75,
  },
  {
    id: 4,
    name: "Cetirizine 10mg",
    category: "Antihistamine",
    quantity: 44,
    cost_price: 2.1,
  },
  {
    id: 5,
    name: "Hydrogen Peroxide",
    category: "First Aid",
    quantity: 9,
    cost_price: 15.25,
  },
];

export async function mockFetchProducts() {
  // Simulate latency
  await new Promise((r) => setTimeout(r, 300));
  // Return deep copy to avoid accidental mutation in callers
  return SAMPLE.map((p) => ({ ...p }));
}
