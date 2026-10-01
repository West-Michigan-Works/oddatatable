const { jestConfig } = require('@salesforce/sfdx-lwc-jest/config');

module.exports = {
  ...jestConfig,
  moduleNameMapper: {
    // odDatatable is replaced by a stand-in so wrapper tests don't render the full table
    '^c/odDatatable$': '<rootDir>/jest-mocks/c/odDatatable/odDatatable',
    '^lightning/refresh$': '<rootDir>/jest-mocks/lightning/refresh',
    // CSS-only module the resolver can't find by name
    '^c/odDatatableCSSLibrary$': '<rootDir>/force-app/main/default/lwc/odDatatableCSSLibrary/odDatatableCSSLibrary.css',
  },
  modulePathIgnorePatterns: ['<rootDir>/.localdevserver'],
};
