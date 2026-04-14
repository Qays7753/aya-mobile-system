const { performance } = require('perf_hooks');

const productCount = 10000;
const products = Array.from({ length: productCount }, (_, i) => ({ id: `prod-${i}`, name: `Product ${i}` }));

// Simulating the render loop where checked={selectedProductIds.includes(product.id)}
const selectedArray = Array.from({ length: 5000 }, (_, i) => `prod-${i * 2}`);
const selectedSet = new Set(selectedArray);

// Benchmark 1: Array.includes in render loop
let start = performance.now();
let checkCount = 0;
for (let i = 0; i < products.length; i++) {
  if (selectedArray.includes(products[i].id)) {
    checkCount++;
  }
}
let end = performance.now();
const arrayRenderTime = end - start;

// Benchmark 2: Set.has in render loop
start = performance.now();
let setCheckCount = 0;
for (let i = 0; i < products.length; i++) {
  if (selectedSet.has(products[i].id)) {
    setCheckCount++;
  }
}
end = performance.now();
const setRenderTime = end - start;

const improvement = arrayRenderTime / setRenderTime;

console.log(`Render time (10k products):`);
console.log(`  Array.includes(): ${arrayRenderTime.toFixed(4)} ms`);
console.log(`  Set.has(): ${setRenderTime.toFixed(4)} ms`);
console.log(`  Improvement: ${improvement.toFixed(2)}x`);
