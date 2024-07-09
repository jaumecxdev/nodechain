/** @type {import('jest').Config} */
const {defaults} = require('jest-config');

const config = {
    verbose: true,
    bail: true,
    globalSetup: "./test/setup.js",
    globalTeardown: "./test/teardown.js"
    //testTimeout: 9999,
    //coverageDirectory: 'output/coverage/jest',
}

module.exports = config;
