import fs from "fs";
import path from "path";

// Function to read a JSON file (like package.json)
function readJsonFile(filePath: string) {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, "utf8"));
    }
  } catch (e) {}
  return null;
}

// Function to find all package.json files in the cwd (recursive)
function findAllPackageJsonFiles(dir: string) {
  const result: string[] = [];
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      result.push(...findAllPackageJsonFiles(fullPath)); // Recurse into directories
    } else if (file === "package.json") {
      result.push(fullPath);
    }
  }
  return result;
}

// Main function
function generateReferences(inputPackageJsonPath: string, scope: string) {
  // 1. Read the package.json that was passed
  const inputPackageJson = readJsonFile(inputPackageJsonPath);
  if (!inputPackageJson) {
    console.error(`Error: No package.json found at ${inputPackageJsonPath}`);
    return;
  }

  // 2. Filter dependencies that match the given scope
  const allDependencies = {
    ...inputPackageJson.dependencies,
    ...inputPackageJson.devDependencies,
  };
  const scopedDependencies = Object.keys(allDependencies).filter(dep =>
    dep.startsWith(scope)
  );

  // 3. Find all package.json files in the current working directory (cwd)
  const cwd = process.cwd();
  const packageJsonFiles = findAllPackageJsonFiles(cwd);

  const validPackageJsonFiles: string[] = [];
  // 4. Create a lookup map of package names to their paths
  const packageJsonMap: Record<string, string> = {};
  for (const pkgJsonPath of packageJsonFiles) {
    const pkgJson = readJsonFile(pkgJsonPath);
    if (pkgJson && pkgJson.name) {
      if (
        pkgJson.name.startsWith(scope) &&
        pkgJsonPath.indexOf("node_modules") === -1
      ) {
        validPackageJsonFiles.push(pkgJsonPath);
      }
      packageJsonMap[pkgJson.name] = pkgJsonPath;
    }
  }

  fs.writeFileSync(
    "packageJsonFiles.json",
    JSON.stringify(validPackageJsonFiles, null, 2)
  );

  // 5. Match the scoped dependencies with the lookup map and construct references
  const references: {path: string}[] = [];
  for (const scopedDep of scopedDependencies) {
    const matchedPkgJsonPath = packageJsonMap[scopedDep];
    if (matchedPkgJsonPath) {
      const tsconfigPath = path.join(
        path.dirname(matchedPkgJsonPath),
        "tsconfig.json"
      );
      if (fs.existsSync(tsconfigPath)) {
        references.push({
          path: path.relative(
            path.dirname(inputPackageJsonPath),
            path.dirname(matchedPkgJsonPath)
          ),
        });
      }
    }
  }

  // 6. Output the references for the package.json that was passed in
  console.log(JSON.stringify({ references }, null, 2));
}

// Usage example
const inputPackageJsonPath = process.argv[2]; // Pass package.json path as the first argument
const scope = "@msteams"; // Your custom scope

if (!inputPackageJsonPath) {
  console.error("Error: Please provide the path to the package.json");
  process.exit(1);
}

// Call the main function
generateReferences(inputPackageJsonPath, scope);
