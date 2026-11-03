import { defineConfig, devices } from "@playwright/test";

const gl = { launchOptions: { args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] } };

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 180_000,
  expect: { timeout: 90_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: { baseURL: "http://localhost:4173" },
  webServer: {
    command: "npm run build && npm run preview -- --port 4173 --strictPort",
    url: "http://localhost:4173",
    reuseExistingServer: true,
    timeout: 120_000,
  },
  projects: [
    { name: "mobile", use: { ...devices["Pixel 7"], ...gl } },
    { name: "desktop", use: { viewport: { width: 1440, height: 900 }, ...gl } },
  ],
});
