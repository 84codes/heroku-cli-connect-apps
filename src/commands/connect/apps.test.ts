import ConnectApps from './apps';
import {} from 'jest'

test('raise if duplicate apps', () => {
  expect(() => {
    new ConnectApps().validateApps(['staging-cloudamqp-api', 'staging-cloudamqp-api-pr-1'])
  }).toThrow()
})

test('return null if valid apps', () => {
  expect(new ConnectApps().validateApps(['staging-cloudamqp-api', 'staging-cloudamqp-customer'])).toBeFalsy()
})

test('converts app names to keys', () => {
  expect(ConnectApps.appNameToKey('staging-cloudamqp-shared-moni')).toBe('shared-moni')
})
