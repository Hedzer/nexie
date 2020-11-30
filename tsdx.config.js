const commonjs = require('rollup-plugin-commonjs');
const resolve = require('rollup-plugin-node-resolve');

// Not transpiled with TypeScript or Babel, so use plain Es6/Node.js!
module.exports = {
    // This function will run for each entry/format/env combination
    rollup(config, options) {
        config.external = (id) => false;
        config.plugins.push(
            commonjs({ include: 'node_modules/**/*' }),
            resolve(),
        );
        return config; // always return a config.
    },
};