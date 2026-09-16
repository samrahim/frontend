#!/usr/bin/env node
/**
 * GraphQL Codegen Watcher
 *
 * Watches GraphQL operation files and automatically regenerates types
 * when any changes are detected.
 */

const { watch } = require("@parcel/watcher");
const { execSync } = require("child_process");
const path = require("path");

// Get the project root (parent directory of scripts/)
const projectRoot = path.join(__dirname, "..");
const watchDir = path.join(projectRoot, "src", "graphql");
const operationsDir = path.join(watchDir, "operations");

console.log("🔍 Watching GraphQL files for changes...");
console.log(`📁 Watching: ${operationsDir}`);
console.log(
  "📝 Operations: fragments.graphql, students.graphql, teachers.graphql, groups.graphql",
);
console.log("");
console.log("Press Ctrl+C to stop watching.\n");

let isGenerating = false;

watch(watchDir, async (err, events) => {
  if (err) {
    console.error("❌ Watch error:", err);
    return;
  }

  // Filter for GraphQL operation files
  const relevantEvents = events.filter(
    (event) =>
      event.path.includes("operations") &&
      (event.path.endsWith(".graphql") ||
        event.path.includes("schema.graphql")),
  );

  if (relevantEvents.length === 0) return;

  // Prevent multiple simultaneous generations
  if (isGenerating) {
    console.log("⏳ Generation already in progress, queueing...");
    return;
  }

  isGenerating = true;

  try {
    console.log(`\n📝 Changed files detected:`);
    relevantEvents.forEach((event) => {
      const relativePath = path.relative(watchDir, event.path);
      const action =
        event.type === "update"
          ? "📝 Modified"
          : event.type === "create"
            ? "✨ Created"
            : "🗑️  Deleted";
      console.log(`   ${action}: ${relativePath}`);
    });

    console.log("\n⚙️  Regenerating types...");
    execSync("npm run codegen", {
      stdio: "inherit",
      cwd: projectRoot,
    });

    console.log("✅ Types regenerated successfully!\n");
  } catch (error) {
    console.error("❌ Codegen failed:", error.message);
  } finally {
    isGenerating = false;
  }
});
