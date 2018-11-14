require('reflect-metadata')
const TEST_TS_CONFIG_FILE_NAME = 'tsconfig.test.json'
const moduleAlias = require('module-alias')
const {resolve} = require('path')
moduleAlias.addAlias('src', resolve(__dirname, '../src'))
moduleAlias.addAlias('lib', resolve(__dirname, '../lib'))
moduleAlias.addAlias('types', resolve(__dirname, '../types'))
moduleAlias(__dirname + '/../')

require('ts-node').register({project: TEST_TS_CONFIG_FILE_NAME})
