"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const apps_1 = require("./apps");
test('raise if duplicate apps', () => {
    expect(() => {
        new apps_1.default().validateApps(['staging-cloudamqp-api', 'staging-cloudamqp-api-pr-1']);
    }).toThrow();
});
test('return null if valid apps', () => {
    expect(new apps_1.default().validateApps(['staging-cloudamqp-api', 'staging-cloudamqp-customer'])).toBeFalsy();
});
