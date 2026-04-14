const { performance } = require('perf_hooks');

const selectedCount = 5000;

const selectedArray = Array.from({ length: selectedCount }, (_, i) => `prod-${i * 2}`);

const productToToggle = `prod-1000`; // exists

// Benchmark toggle function
let start = performance.now();
for (let i = 0; i < 1000; i++) {
  // original
  selectedArray.includes(productToToggle) ? selectedArray.filter(id => id !== productToToggle) : [...selectedArray, productToToggle];
}
let end = performance.now();
const originalToggleTime = (end - start) / 1000;

start = performance.now();
for (let i = 0; i < 1000; i++) {
  // optimized: convert to Set then array
  const set = new Set(selectedArray);
  if (set.has(productToToggle)) {
    set.delete(productToToggle);
  } else {
    set.add(productToToggle);
  }
  Array.from(set);
}
end = performance.now();
const newToggleTime = (end - start) / 1000;

console.log(`Original toggle time: ${originalToggleTime.toFixed(4)} ms`);
console.log(`Optimized toggle time: ${newToggleTime.toFixed(4)} ms`);
