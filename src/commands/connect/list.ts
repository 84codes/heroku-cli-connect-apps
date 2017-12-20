import { Command } from 'cli-engine-heroku'
import { cli } from 'cli-ux'
import ConnectApps from './apps';
export default class ConnectList extends Command {
  static topic = 'connect'
  static command = 'list'
  static description = 'List linked apps'

  async run() {
    try {
      let apps = await this.getApps()
      console.log(apps.join(', '))
      let appData = {}
      cli.action.start('Loading configs')
      for (let app of apps) {
        appData[app] = (await this.heroku.get('/apps/' + app + '/config-vars')).body
      }
      cli.action.stop()
      for (let app in appData) {
        let config = appData[app]
        let connections = []
        let appName = config['HEROKU_PARENT_APP_NAME'] || app
        let connectome = ConnectApps.fetchWithAppName(appName, ConnectApps.connectMap)
        if (connectome == null) {
          continue
        }
        for (let candidateApp in appData) {
          let candidateConfig = appData[candidateApp]
          let candidateAppName = candidateConfig['HEROKU_PARENT_APP_NAME'] || candidateApp
          let candidateConnectome = ConnectApps.fetchWithAppName(candidateAppName, connectome)
          if (candidateApp == app || candidateConnectome == null) {
            continue
          }
          candidateConnectome.forEach(env => {
            if (typeof env === 'string') {
              if (candidateConfig[env] === config[env]) {
                let connection = { from: app, to: candidateApp, env, value: config[env] }
                connections.push(connection)
              }
            }
            if (typeof env === 'object') {
              Object.keys(env).forEach(evar => {
                let value = ConnectApps.connectomeReplace(env[evar], config)
                if (value === candidateConfig[evar]) {
                  let connection = { from: app, to: candidateApp, env: evar, value }
                  connections.push(connection)
                }
              })
            }
          })
        }
        this.printConnections(app, connections)
      }
    } catch (e) {
      console.log(e)
    }
  }

  printConnections(app, connections) {
    if (connections.length > 0) {
      let currTo
      for (let connection of connections) {
        if (currTo === connection.to) {
          let tab = new Array(app.length + connection.to.length + 9).join(' ')
          console.log(tab + connection.env + '=' + connection.value)
        } else {
          currTo = connection.to
          console.log(app + ' -> ' + connection.to + ' by ' + connection.env + '=' + connection.value)
        }
      }
    }
  }

  async getApps() {
    let apps: string[] = []
    cli.action.start('Loading apps')
    let response = await this.heroku.get('/apps')
    cli.action.stop()
    response.body.forEach(app => {
      if (/-pr-/.test(app.name) || /^staging/.test(app.name)) {
        apps.push(app.name)
      }
    })
    return apps
  }
}
