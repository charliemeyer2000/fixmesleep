import repoConfig from "@repo/eslint-config";

export default [
  ...repoConfig,
  {
    files: ["src/**/*.{ts,tsx}"]
  }
];
