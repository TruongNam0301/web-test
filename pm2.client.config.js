module.exports = {
  apps: [
    {
      name: "web-test",
      cwd: "/home/test/repos/web-test",
      script: "node .next/standalone/server.js",
      exec_mode: "cluster",
      instances: "1",
      env_file: ".env",
      env: {
        PORT: 3000,
      },
    },
  ],
};
