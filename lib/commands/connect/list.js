"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cli_engine_heroku_1 = require("cli-engine-heroku");
const cli_ux_1 = require("cli-ux");
const apps_1 = require("./apps");
class ConnectList extends cli_engine_heroku_1.Command {
    async run() {
        try {
            let apps = await this.getApps();
            let appData = {};
            cli_ux_1.cli.action.start('Loading configs');
            for (let app of apps) {
                appData[app] = (await this.heroku.get('/apps/' + app + '/config-vars')).body;
            }
            cli_ux_1.cli.action.stop();
            for (let app in appData) {
                let config = appData[app];
                let connections = [];
                let appName = config['HEROKU_PARENT_APP_NAME'] || app;
                let connectome = apps_1.default.fetchWithAppName(appName, apps_1.default.connectMap);
                if (connectome == null) {
                    continue;
                }
                for (let candidateApp in appData) {
                    let candidateConfig = appData[candidateApp];
                    let candidateAppName = candidateConfig['HEROKU_PARENT_APP_NAME'] || candidateApp;
                    let candidateConnectome = apps_1.default.fetchWithAppName(candidateAppName, connectome);
                    if (candidateApp == app || candidateConnectome == null) {
                        continue;
                    }
                    candidateConnectome.forEach(env => {
                        if (typeof env === 'string') {
                            if (candidateConfig[env] === config[env]) {
                                connections[candidateApp] = connections[candidateApp] || [];
                                let connection = { from: app, to: candidateApp, env, value: config[env] };
                                connections.push(connection);
                            }
                        }
                        if (typeof env === 'object') {
                            Object.keys(env).forEach(evar => {
                                let value = apps_1.default.connectomeReplace(env[evar], config);
                                if (value === candidateConfig[evar]) {
                                    connections[candidateApp] = connections[candidateApp] || [];
                                    let connection = { from: app, to: candidateApp, env: evar, value };
                                    connections.push(connection);
                                }
                            });
                        }
                    });
                }
                this.printConnections(app, connections);
            }
        }
        catch (e) {
            console.log(e);
        }
    }
    printConnections(app, connections) {
        if (connections.length > 0) {
            let currTo;
            for (let connection of connections) {
                if (currTo === connection.to) {
                    let tab = new Array(app.length + connection.to.length + 9).join(' ');
                    console.log(tab + connection.env + '=' + connection.value);
                }
                else {
                    currTo = connection.to;
                    console.log(app + ' -> ' + connection.to + ' by ' + connection.env + '=' + connection.value);
                }
            }
        }
    }
    async getApps() {
        let apps = [];
        cli_ux_1.cli.action.start('Loading apps');
        let response = await this.heroku.get('/apps');
        cli_ux_1.cli.action.stop();
        response.body.forEach(app => {
            if (/-pr-/.test(app.name) || /^staging/.test(app.name)) {
                apps.push(app.name);
            }
        });
        return apps;
    }
}
ConnectList.topic = 'connect';
ConnectList.command = 'list';
ConnectList.description = 'List linked apps';
exports.default = ConnectList;
