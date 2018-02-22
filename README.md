heroku-cli-connect-apps
=======================



[![Version](https://img.shields.io/npm/v/heroku-cli-connect-apps.svg)](https://npmjs.org/package/heroku-cli-connect-apps)
[![CircleCI](https://circleci.com/gh/baelter/heroku-cli-connect-apps/tree/master.svg?style=shield)](https://circleci.com/gh/baelter/heroku-cli-connect-apps/tree/master)
[![Appveyor CI](https://ci.appveyor.com/api/projects/status/github/baelter/heroku-cli-connect-apps?branch=master&svg=true)](https://ci.appveyor.com/project/heroku/heroku-cli-connect-apps/branch/master)
[![Codecov](https://codecov.io/gh/baelter/heroku-cli-connect-apps/branch/master/graph/badge.svg)](https://codecov.io/gh/baelter/heroku-cli-connect-apps)
[![Greenkeeper](https://badges.greenkeeper.io/baelter/heroku-cli-connect-apps.svg)](https://greenkeeper.io/)
[![Known Vulnerabilities](https://snyk.io/test/github/baelter/heroku-cli-connect-apps/badge.svg)](https://snyk.io/test/github/baelter/heroku-cli-connect-apps)
[![Downloads/week](https://img.shields.io/npm/dw/heroku-cli-connect-apps.svg)](https://npmjs.org/package/heroku-cli-connect-apps)
[![License](https://img.shields.io/npm/l/heroku-cli-connect-apps.svg)](https://github.com/baelter/heroku-cli-connect-apps/blob/master/package.json)

<!-- toc -->
* [Install](#install)
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
<!-- install -->
# Install

with yarn:
```
$ yarn global add heroku-cli-connect-apps
```

or with npm:
```
$ npm install -g heroku-cli-connect-apps
```
<!-- installstop -->
<!-- usage -->
# Usage

```sh-session
$ heroku COMMAND
running command...
$ heroku (-v|--version|version)
heroku-cli-connect-apps/1.0.0 (darwin-x64) node-v8.6.0
$ heroku --help [COMMAND]
USAGE
  $ heroku COMMAND
...
```
<!-- usagestop -->
<!-- commands -->
# Commands

* [heroku connect:apps](#connectapps)
* [heroku connect:list](#connectlist)
## connect:apps

Link apps

```
USAGE
  $ heroku connect:apps
```

_See code: [src/commands/connect/apps.js](https://github.com/84codes/heroku-cli-connect-apps/blob/v1.0.0/src/commands/connect/apps.js)_

## connect:list

List linked apps

```
USAGE
  $ heroku connect:list
```

_See code: [src/commands/connect/list.js](https://github.com/84codes/heroku-cli-connect-apps/blob/v1.0.0/src/commands/connect/list.js)_
<!-- commandsstop -->
