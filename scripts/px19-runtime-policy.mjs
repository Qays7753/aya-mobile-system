import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const packageJson = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const tsconfig = JSON.parse(fs.readFileSync(path.join(root, "tsconfig.json"), "utf8"));

const envExamplePath = path.join(root, ".env.example");
const envExample = fs.existsSync(envExamplePath) ? fs.readFileSync(envExamplePath, "utf8") : "";
const outputDir = path.join(root, "output", "release");
const outputPath = path.join(outputDir, "px19-runtime-policy.json");

const requiredEnvKeys = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "CRON_SECRET"
];

const report = {
  checked_at: new Date().toISOString(),
  runtime_policy: {
    node: packageJson.engines?.node ?? null,
    npm: packageJson.engines?.npm ?? null,
    next: packageJson.dependencies?.next ?? null,
    react: packageJson.dependencies?.react ?? null,
    react_dom: packageJson.dependencies?.["react-dom"] ?? null,
    xlsx: packageJson.dependencies?.xlsx ?? null,
    typescript: packageJson.devDependencies?.typescript ?? null
  },
  compatibility: {
    babel_fallback_enabled: fs.existsSync(path.join(root, ".babelrc")),
    skip_lib_check: Boolean(tsconfig.compilerOptions?.skipLibCheck)
  },
  env_policy: {
    env_example_exists: fs.existsSync(envExamplePath),
    required_keys_present: requiredEnvKeys.filter((key) => envExample.includes(`${key}=`)),
    missing_keys: requiredEnvKeys.filter((key) => !envExample.includes(`${key}=`))
  },
  decisions: {
    dependency_updates: "policy-first",
    babel_compatibility: fs.existsSync(path.join(root, ".babelrc")) ? "adopted" : "not-adopted",
    skip_lib_check: tsconfig.compilerOptions?.skipLibCheck ? "retained-with-policy" : "strict"
  }
};

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
