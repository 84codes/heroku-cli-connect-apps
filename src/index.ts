import * as path from 'path'
import { getCommands } from 'cli-engine-heroku'

export const topic = {
  name: 'hello',
  description: 'says hello (example plugin)',
}

export const commands = getCommands(path.join(__dirname, 'commands'))
