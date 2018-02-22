// jshint ignore: start

const inquirer = require('inquirer')
const {Command} = require('@heroku-cli/command')
const cli = require('heroku-cli-util')
const lib = require('../../lib')

class ConnectApps extends Command {
  static appNameToKey(name) {
    return name.replace(/-pr-\d+$/, '').split('-').slice(2).join('-')
  }

  static fetchWithAppName(appName, map) {
    let appKey = this.appNameToKey(appName) // Can be truncated, e.g. shared-mon  (itor)
    let connectKeys = Object.keys(map).filter(key => {
      return key.startsWith(appKey)
    })

    if (connectKeys.length > 1) {
      throw new Error('Ambiguous app name ' + appName)
    }
    let connectKey = connectKeys[0]
    return map[connectKey]
  }

  static connectomeReplace(value, config) {
    return value.replace(/\$\{(\w*)\}/, (_match, p1) => {
      return config[p1]
    })
  }

  static validateApps(apps) {
    let validateApps = apps.map(app => {
      return ConnectApps.appNameToKey(app)
    })
    if (new Set(validateApps).size !== validateApps.length) {
      throw new Error('Duplicate apps selected: ' + apps)
    }
  }

  async getAppData(apps) {
    cli.action.start('Loading configs')
    const results = []
    for (let app of apps) {
      results.push(this.heroku.get('/apps/' + app + '/config-vars').then(r => {
        return [app, r.body]
      }))
    }
    const appData = (await Promise.all(results)).reduce((memo, [key, value]) => {
      memo[key] = value
      return memo
    }, {})
    cli.action.done()
    return appData
  }

  async run() {
    try {
      let questions = []
      let choices = []
      let apps = await this.getApps()
      let count = apps.review.length + apps.staging.length
      if (count <= 1) {
        cli.log('Not enough apps available: ' + count)
        return
      }
      choices.push(new inquirer.Separator('--- Review apps ---'))
      choices = choices.concat(apps.review)
      choices.push(new inquirer.Separator('--- Staging apps ---'))
      choices = choices.concat(apps.staging)
      questions.push({
        name: 'apps',
        type: 'checkbox',
        message: 'Choose apps to connect:',
        choices: choices,
        default: [],
      })

      let answers = await inquirer.prompt(questions)
      this.connectApps(answers.apps)
    } catch (e) {
      cli.log(e)
    }
  }

  async connectApps(apps) {
    ConnectApps.validateApps(apps)
    let appData = await this.getAppData(apps)
    let results = []
    for (let app in appData) {
      if (Object.prototype.hasOwnProperty.call(appData, app)) {
        let config = appData[app]
        let appName = config.HEROKU_PARENT_APP_NAME || app
        let connectome = ConnectApps.fetchWithAppName(appName, lib.connectMap)
        for (let remoteApp in appData) {
          if (Object.prototype.hasOwnProperty.call(appData, remoteApp)) {
            let configPatch = {}
            let remoteAppName = appData[remoteApp].HEROKU_PARENT_APP_NAME || remoteApp
            let remoteConfig = ConnectApps.fetchWithAppName(remoteAppName, connectome) || []
            remoteConfig.forEach(env => {
              if (typeof env === 'string') {
                configPatch[env] = config[env]
              }
              if (typeof env === 'object') {
                Object.keys(env).forEach(evar => {
                  configPatch[evar] = ConnectApps.connectomeReplace(env[evar], config)
                })
              }
            })
            results.push(this.patchConfig(remoteApp, configPatch))
          }
        }
      }
    }
    await Promise.all(results)
  }

  async patchConfig(remoteApp, configPatch) {
    if (Object.keys(configPatch).length > 0) {
      let varsStr = Object.keys(configPatch).reduce((memo, key) => {
        return memo + key + '=' + configPatch[key] + ' '
      }, '')
      cli.log('Setting config for ' + remoteApp + ': ' + varsStr)
      return this.heroku.patch('/apps/' + remoteApp + '/config-vars', {
        body: configPatch,
      })
    }
  }

  async getApps() {
    let review = []
    let staging = []
    cli.action.start('Loading apps')
    let response = await this.heroku.get('/apps')
    cli.action.done()
    response.body.forEach(app => {
      if (/-pr-/.test(app.name)) {
        review.push(app.name)
      } else if (app.name.startsWith('staging')) {
        staging.push(app.name)
      }
    })
    return {review, staging}
  }
}

ConnectApps.description = 'Link apps'

module.exports = ConnectApps
