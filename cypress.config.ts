import { defineConfig } from "cypress";

export default defineConfig({
  video: false,
  screenshotOnRunFailure: false,
  allowCypressEnv: false,
  component: {
    specPattern: "tests/**/*.cy.{js,jsx,ts,tsx}",
    supportFile: false,
    indexHtmlFile: "tests/support/component-index.html",
    devServer: {
      framework: "next",
      bundler: "webpack",
    },
  },
  e2e: {
    specPattern: [],
  },
});
