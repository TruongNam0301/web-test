module.exports = {
  apps: [
    {
      name: "web-test",
      cwd: "/home/test/repos/web-test",
      script: ".next/standalone/server.js",
      exec_mode: "cluster",
      instances: 1,
      env_file: "/home/test/repos/web-test/.env",
    },
  ],
};
