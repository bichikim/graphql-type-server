/* eslint-disable typescript/no-namespace,typescript/interface-name-prefix */
// tslint:disable: interface-name no-trading-space no-namespace
declare var process: NodeJS.Process
declare var global: NodeJS.Global
declare var console: Console
// declare global types should be here
declare namespace NodeJS {
  export interface ProcessEnv {
    CORS_ORIGIN?: string
    HOST?: string
    JWT_KEY?: string
    LOG?: string
    LOG_SCREEN?: string
    LOG_FILE?: string
    MONGODB_URL?: string
    PORT?: string
    SHUTDOWN_TIMEOUT?: string
    TLS_KEY?: string
    TLS_CERT?: string
  }

  // noinspection JSUnusedGlobalSymbols
  export interface Global {
    TypeGraphQLMetadataStorage?: any
  }
}
