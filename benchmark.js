const { performance } = require('perf_hooks');

const productCount = 10000;
const selectedCount = 5000;

const products = Array.from({ length: productCount }, (_, i) => ({ id: `prod-${i}` }));
const selectedArray = Array.from({ length: selectedCount }, (_, i) => `prod-${i * 2}`);
const selectedSet = new Set(selectedArray);

// Benchmark 1: Render time (checking membership for all products)
let start = performance.now();
for (let i = 0; i < products.length; i++) {
  selectedArray.includes(products[i].id);
}
let end = performance.now();
const arrayRenderTime = end - start;

start = performance.now();
for (let i = 0; i < products.length; i++) {
  selectedSet.has(products[i].id);
}
end = performance.now();
const setRenderTime = end - start;

// Benchmark 2: Toggle a product
const productToToggle = `prod-1000`; // exists

start = performance.now();
let newArray;
for (let i = 0; i < 100; i++) {
  newArray = selectedArray.includes(productToToggle)
    ? selectedArray.filter(id => id !== productToToggle)
    : [...selectedArray, productToToggle];
}
end = performance.now();
const arrayToggleTime = (end - start) / 100;

start = performance.now();
let newSet;
for (let i = 0; i < 100; i++) {
  newSet = new Set(selectedSet);
  if (newSet.has(productToToggle)) {
    newSet.delete(productToToggle);
  } else {
    newSet.add(productToToggle);
  }
}
end = performance.now();
const setToggleTime = (end - start) / 100;

console.log(`Render time (10k products, 5k selected):`);
console.log(`  Array.includes(): ${arrayRenderTime.toFixed(4)} ms`);
console.log(`  Set.has(): ${setRenderTime.toFixed(4)} ms`);
console.log(`Toggle time (5k selected):`);
console.log(`  Array filter/spread: ${arrayToggleTime.toFixed(4)} ms`);
console.log(`  Set delete/add: ${setToggleTime.toFixed(4)} ms`);
