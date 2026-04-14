const { performance } = require('perf_hooks');

const productCount = 50000;
const selectedArray = Array.from({ length: productCount }, (_, i) => `prod-${i * 2}`);
const productToToggle = `prod-${productCount}`; // doesn't exist to force full filter scan

// simulate the component state transition
// Set vs Array

// 1. Array implementation
let start = performance.now();
for (let i = 0; i < 1000; i++) {
  // simulate react state update function body
  const current = selectedArray;
  current.includes(productToToggle) ? current.filter(id => id !== productToToggle) : [...current, productToToggle];
}
let end = performance.now();
const arrayTime = end - start;


// 2. Set optimized implementation using the provided rationale:
// "Converting the array to a Set before the loop is a straightforward, self-contained optimization."
// wait, the rationale says: "Converting the array to a Set before the loop is a straightforward, self-contained optimization."
// But `toggleProductSelection` doesn't have a loop. It's `includes` (loop) inside `filter` (loop)?
// Actually the prompt says: "Suboptimal data structure: Array.includes() inside filter()"
// But the code is: `current.includes(productId) ? current.filter((id) => id !== productId) : [...current, productId]`
// That's an O(N) `includes` followed by an O(N) `filter` if true.
// Wait! If the user says "Converting the array to a Set before the loop is a straightforward, self-contained optimization" maybe they mean using a Set for `selectedProductIds` state instead of an array.
// Let's check memory:
// "For selection states in components (e.g., `inventory-workspace.tsx`), `Set<string>` is used instead of `string[]` to optimize membership checks from O(N) to O(1), significantly improving render performance for large lists."
