"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cli_engine_heroku_1 = require("cli-engine-heroku");
const cli_ux_1 = require("cli-ux");
const inquirer = require("inquirer");
class ConnectApps extends cli_engine_heroku_1.Command {
    async run() {
        try {
            let questions = [];
            let choices = [];
            let apps = await this.getApps();
            let count = apps.review.length + apps.staging.length;
            if (count <= 1) {
                cli_ux_1.cli.log('Not enough apps available: ' + count);
                return;
            }
            choices.push(new inquirer.Separator("--- Review apps ---"));
            choices = choices.concat(apps.review);
            choices.push(new inquirer.Separator("--- Staging apps ---"));
            choices = choices.concat(apps.staging);
            questions.push({
                name: 'apps',
                type: 'checkbox',
                message: 'Choose apps to connect:',
                choices: choices,
                default: []
            });
            let answers = await inquirer.prompt(questions);
            this.connectApps(answers['apps']);
        }
        catch (e) {
            console.log(e);
        }
    }
    validateApps(apps) {
        let validateApps = apps.map(app => {
            return this.appNameToKey(app);
        });
        console.log(validateApps);
        if ((new Set(validateApps)).size !== validateApps.length) {
            throw 'Duplicate apps selected';
        }
    }
    async connectApps(apps) {
        let appData = {};
        this.validateApps(apps);
        for (let app of apps) {
            appData[app] = (await this.heroku.get('/apps/' + app + '/config-vars')).body;
        }
        for (let app in appData) {
            let config = appData[app];
            let appName = config['HEROKU_PARENT_APP_NAME'] || app;
            let connectome = ConnectApps.connectMap[this.appNameToKey(appName)];
            for (let remoteApp in appData) {
                let configPatch = {};
                let remoteAppName = appData[remoteApp]['HEROKU_PARENT_APP_NAME'] || app;
                let remoteConfig = connectome[this.appNameToKey(remoteAppName)] || [];
                remoteConfig
                    .forEach(env => {
                    if (typeof (env) === 'string') {
                        configPatch[env] = config[env];
                    }
                    if (typeof (env) === 'object') {
                        Object.keys(env).forEach(evar => {
                            configPatch[evar] = env[evar].replace(/\$\{(\w*)\}/, (_match, p1) => {
                                return config[p1];
                            });
                        });
                    }
                });
                if (Object.keys(configPatch).length > 0) {
                    let varsStr = Object.keys(configPatch).reduce((memo, key) => {
                        return memo + key + "=" + configPatch[key] + " ";
                    }, "");
                    cli_ux_1.cli.log('Setting config for ' + remoteApp + ': ' + varsStr);
                    await this.heroku.patch('/apps/' + remoteApp + '/config-vars', {
                        body: configPatch
                    });
                }
            }
        }
    }
    appNameToKey(name) {
        return name.replace(/-pr-\d+$/, '').split('-').slice(2).join('');
    }
    async getApps() {
        let review = [];
        let staging = [];
        cli_ux_1.cli.action.start('Loading apps');
        let response = await this.heroku.get('/apps');
        cli_ux_1.cli.action.stop();
        response.body.forEach(app => {
            if (/-pr-/.test(app.name)) {
                review.push(app.name);
            }
            else if (/^staging/.test(app.name)) {
                staging.push(app.name);
            }
        });
        return { review, staging };
    }
}
ConnectApps.topic = 'connect';
ConnectApps.command = 'apps';
ConnectApps.description = 'Link apps';
ConnectApps.connectMap = {
    "customer": {
        "api": [{ "CUSTOMER_URL": "https://${HEROKU_APP_NAME}.herokuapp.com" }]
    },
    "api": {
        "customer": [{ "API_URL": "https://${HEROKU_APP_NAME}.herokuapp.com" }],
        "machines": ["CLOUDAMQP_URL"],
        "worker": ["ELEPHANTSQL_URL", "CLOUDAMQP_URL"],
        "ssh-monitor": ["ELEPHANTSQL_URL", "CLOUDAMQP_URL"],
        "alarms": ["ELEPHANTSQL_URL", "CLOUDAMQP_URL"],
        "admin": [
            { "API_URL": "https://${HEROKU_APP_NAME}.herokuapp.com" },
            "ELEPHANTSQL_URL"
        ],
        "stream": ["ELEPHANTSQL_URL", "CLOUDAMQP_URL"]
    }
};
exports.default = ConnectApps;
