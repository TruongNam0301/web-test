/* eslint-disable @typescript-eslint/no-require-imports */
const path = require("path");
const dotenv = require("dotenv");

const loadEnv = () => {
  const envPath = path.resolve(__dirname, `.env`);
  const result = dotenv.config({ path: envPath });
  console.log("envPath", envPath);
  return result.parsed || {};
};

module.exports = {
  apps: [
    {
      name: "web-test",
      script: "server.js",
      exec_mode: "cluster",
      instances: 1,
      env: loadEnv(),
    },
  ],
};
