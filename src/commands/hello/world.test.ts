import HelloWorld from './world'

test('it says hello to the world', async () => {
  const { stdout } = await HelloWorld.mock()
  expect(stdout).toEqual('hello world!\n')
})

test('it says hello to jeff', async () => {
  const { stdout } = await HelloWorld.mock('--name', 'jeff')
  expect(stdout).toEqual('hello jeff!\n')
})
