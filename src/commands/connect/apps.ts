import { Command } from 'cli-engine-heroku'
import { cli } from 'cli-ux'
import * as inquirer from 'inquirer'
export default class ConnectApps extends Command {
  static topic = 'connect'
  static command = 'apps'
  static description = 'Link apps'
  static connectMap = {
    customer: {
      api: [{ CUSTOMER_URL: 'https://${HEROKU_APP_NAME}.herokuapp.com' },
            { SSO_SALT_CLOUDAMQP: "${SSO_SALT}" }],
    },
    api: {
      customer: [{ API_URL: 'https://${HEROKU_APP_NAME}.herokuapp.com' }],
      machines: ['CLOUDAMQP_URL'],
      worker: ['ELEPHANTSQL_URL', 'CLOUDAMQP_URL'],
      'ssh-monitor': ['ELEPHANTSQL_URL', 'CLOUDAMQP_URL'],
      alarms: ['ELEPHANTSQL_URL', 'CLOUDAMQP_URL'],
      admin: [{ API_URL: 'https://${HEROKU_APP_NAME}.herokuapp.com' }, 'ELEPHANTSQL_URL'],
      stream: ['ELEPHANTSQL_URL', 'CLOUDAMQP_URL', 'SESSION_SECRET'],
    },
  }

  static appNameToKey(name: string) {
    return name
      .replace(/-pr-\d+$/, '')
      .split('-')
      .slice(2)
      .join('')
  }

  static connectomeReplace(value :string, config: object) {
    return value.replace(/\$\{(\w*)\}/, (_match, p1) => {
      return config[p1]
    })
  }

  validateApps(apps) {
    let validateApps = apps.map(app => {
      return ConnectApps.appNameToKey(app)
    })
    if (new Set(validateApps).size !== validateApps.length) {
      throw 'Duplicate apps selected: ' + apps
    }
  }

  async run() {
    try {
      let questions: inquirer.Question[] = []
      let choices: inquirer.ChoiceType[] = []
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
      this.connectApps(answers['apps'])
    } catch (e) {
      console.log(e)
    }
  }

  async connectApps(apps: string[]) {
    let appData = {}
    this.validateApps(apps)
    for (let app of apps) {
      appData[app] = (await this.heroku.get('/apps/' + app + '/config-vars')).body
    }
    for (let app in appData) {
      let config = appData[app]
      let appName = config['HEROKU_PARENT_APP_NAME'] || app
      let connectome = ConnectApps.connectMap[ConnectApps.appNameToKey(appName)]
      for (let remoteApp in appData) {
        let configPatch = {}
        let remoteAppName = appData[remoteApp]['HEROKU_PARENT_APP_NAME'] || app
        let remoteConfig = connectome[ConnectApps.appNameToKey(remoteAppName)] || []
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
        if (Object.keys(configPatch).length > 0) {
          let varsStr = Object.keys(configPatch).reduce((memo, key) => {
            return memo + key + '=' + configPatch[key] + ' '
          }, '')
          cli.log('Setting config for ' + remoteApp + ': ' + varsStr)
          await this.heroku.patch('/apps/' + remoteApp + '/config-vars', {
            body: configPatch,
          })
        }
      }
    }
  }

  async getApps() {
    let review: inquirer.ChoiceType[] = []
    let staging: inquirer.ChoiceType[] = []
    cli.action.start('Loading apps')
    let response = await this.heroku.get('/apps')
    cli.action.stop()
    response.body.forEach(app => {
      if (/-pr-/.test(app.name)) {
        review.push(app.name)
      } else if (/^staging/.test(app.name)) {
        staging.push(app.name)
      }
    })
    return { review, staging }
  }
}
