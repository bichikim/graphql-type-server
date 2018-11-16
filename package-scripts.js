const {series} = require('nps-utils')
const PROJECT_FILES = [
  'src/**/*.vue',
  'src/**/*.vue',
]

const nps = (...commands) => {
  return `nps ${commands.join(' ')}`
}

const node = (filePath = '') => {
  return `node ${filePath}`
}

const mocha = (...commands) => {
  return `mocha ${commands.join(' ')}`
}

const mochaNyc = (...commands) => {
  return `nps ${mocha(...commands)}`
}

const runAll = (...commands) => {
  const fixedCommends = commands.map((value) => {
    return `"${value}"`
  })
  return `npm-run-all -p ${fixedCommends.join(' ')}`
}

const prettier = (...commends) => {
  return `prettier-eslint ${PROJECT_FILES.join(' ')}`
}

const tsNodeDev = (...commends) => {
  return `ts-node-dev ${[
    '--respawn',
    '--transpileOnly',
    '--project tsconfig.dev.json',
  ].join(' ')} ${commends.join(' ')} build/dev.ts`
}

const typeDoc = (...command) => {
  return `typedoc --media ./media -out ./type-docs ${command.join(' ')} ./src ./types`
}

const eslint = (...commends) => {
  return `eslint${commends.join(' ')} . --ext .js --ext .ts`
}

const tslint = (...commends) => {
  return `tslint${commends.join(' ')} src/**/*.ts lib/**/*.ts`
}

const echo = (message) => {
  return `echo ${message}`
}

module.exports = {
  scripts: {
    default: nps('dev'),
    dev: tsNodeDev(),
    build: {
      default: node('build/prod.js'),
    },
    doc: typeDoc(),
    lint: {
      default: series(nps('lint.tslint'), nps('lint.eslint')),
      tslint: {
        default: tslint(),
        fix: tslint('--fix')
      },
      eslint: {
        default: eslint(),
        fix: eslint('--fix')
      }
    },
    reformat: {
      default: prettier()
    },
    mocha: {
      default: mocha(),
      coverage: mochaNyc(),
    },
    deploy: echo('no deploy')
  }
}

