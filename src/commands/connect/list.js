// jshint ignore: start

const {Command} = require('@heroku-cli/command')
const ConnectApps = require('./apps')
const cli = require('heroku-cli-util')
const lib = require('../../lib')

class ConnectList extends Command {
  async run() {
    try {
      let apps = await this.getApps()
      cli.log(apps.join(', '))
      let appData = await this.getAppData(apps)
      for (let app in appData) {
        if (Object.prototype.hasOwnProperty.call(appData, app)) {
          let config = appData[app]
          let connections = this.findConntections(app, config, appData)
          this.printConnections(app, connections)
        }
      }
    } catch (e) {
      cli.log(e)
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

  printConnections(app, connections) {
    if (connections.length > 0) {
      let currTo
      for (let connection of connections) {
        if (currTo === connection.to) {
          let tab = new Array(app.length + connection.to.length + 9).join(' ')
          cli.log(tab + connection.env + '=' + connection.value)
        } else {
          currTo = connection.to
          cli.log(app + ' -> ' + connection.to + ' by ' + connection.env + '=' + connection.value)
        }
      }
    }
  }

  findConntections(app, config, appData) {
    let connections = []
    let appName = config.HEROKU_PARENT_APP_NAME || app
    let connectome = ConnectApps.fetchWithAppName(appName, lib.connectMap)
    if (connectome === undefined || connectome === null) {
      return connections
    }
    for (let candidateApp in appData) {
      if (Object.prototype.hasOwnProperty.call(appData, candidateApp)) {
        let candidateConfig = appData[candidateApp]
        let candidateAppName = candidateConfig.HEROKU_PARENT_APP_NAME || candidateApp
        let candidateConnectome = ConnectApps.fetchWithAppName(candidateAppName, connectome)
        if (candidateApp === app || candidateConnectome === null || candidateConnectome === undefined) {
          continue
        }
        candidateConnectome.forEach(env => {
          if (typeof env === 'string') {
            if (candidateConfig[env] === config[env]) {
              let connection = {from: app, to: candidateApp, env, value: config[env]}
              connections.push(connection)
            }
          }
          if (typeof env === 'object') {
            Object.keys(env).forEach(evar => {
              let value = ConnectApps.connectomeReplace(env[evar], config)
              if (value === candidateConfig[evar]) {
                let connection = {from: app, to: candidateApp, env: evar, value}
                connections.push(connection)
              }
            })
          }
        })
      }
    }
    return connections
  }

  async getApps() {
    let apps = []
    cli.action.start('Loading apps')
    let response = await this.heroku.get('/apps')
    cli.action.done()
    response.body.forEach(app => {
      if (/-pr-/.test(app.name) || app.name.startsWith('staging')) {
        apps.push(app.name)
      }
    })
    return apps
  }
}

ConnectList.description = 'List linked apps'

module.exports = ConnectList
