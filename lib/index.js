"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const cli_engine_heroku_1 = require("cli-engine-heroku");
exports.topic = {
    name: 'connect',
    description: 'Connect review apps',
};
exports.commands = cli_engine_heroku_1.getCommands(path.join(__dirname, 'commands'));
