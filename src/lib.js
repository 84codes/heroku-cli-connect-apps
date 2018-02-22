module.exports = {
  connectMap: {
    customer: {
      api: [{CUSTOMER_URL: 'https://${HEROKU_APP_NAME}.herokuapp.com'},
        {SSO_SALT_CLOUDAMQP: '${SSO_SALT}'}],
    },
    api: {
      customer: [{API_URL: 'https://${HEROKU_APP_NAME}.herokuapp.com'}],
      machines: ['CLOUDAMQP_URL'],
      worker: ['ELEPHANTSQL_URL', 'CLOUDAMQP_URL'],
      'ssh-monitor': ['ELEPHANTSQL_URL', 'CLOUDAMQP_URL'],
      alarms: ['ELEPHANTSQL_URL', 'CLOUDAMQP_URL'],
      admin: [{API_URL: 'https://${HEROKU_APP_NAME}.herokuapp.com'}, 'ELEPHANTSQL_URL'],
      'shared-monitor': ['ELEPHANTSQL_URL', 'CLOUDAMQP_URL'],
      stream: ['SESSION_SECRET'],
    },
  },

}
