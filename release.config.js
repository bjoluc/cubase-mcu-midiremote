const config = require("@bjoluc/semantic-release-config-npm");

for (const plugin of config.plugins) {
  // Reconfigure the GitHub plugin's `assets` option
  if (Array.isArray(plugin) && plugin[0] === "@semantic-release/github") {
    plugin[1].assets = "dist/**/*.js";
  }
}

module.exports = config;
