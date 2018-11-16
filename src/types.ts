import {ApolloError} from 'apollo-server'
import {SignOptions, VerifyOptions} from 'src/jwt'

export interface IAnyMemberObject {
  [key: string]: any
}

export interface IApolloError extends ApolloError{
  originalError: Error
}

export interface IContextBase<U extends IAnyMemberObject>{
  accessToken?: string
  user?: IUserContext<U>
  jwt: IJwtContext
}
export interface IErrorCodeItem {
  message: string
  code: string
}

export interface IJwtOptions {
  key?: string
  expiresIn?: number | string
  refreshExpiresIn?: number | string
  signOptions?: SignOptions
  verifyOptions?: VerifyOptions
}

export interface IErrorOptions {
  forbidden?: IErrorCodeItem
  unauthorized?: IErrorCodeItem
  tokenExpired?: IErrorCodeItem
  noJwtKey?: IErrorCodeItem
  failArgumentValidation?: IErrorCodeItem
}

export interface IFileOptions {
  path: string
}

export interface IFormattedErrorObject {
  message: string
  locations: any
  path: any
  code: string
  [key: string]: any
}

export interface IGraphqlOptions {
  resolvers?: string
  emitSchemaFilePath?: string
  playground?: boolean
}

export interface IAuthOptions {
  accessTokenName?: string
}

export interface IGraphqlServerOptions<
  C extends IAnyMemberObject
  > {
  root?: string
  context?: C
  graphql?: IGraphqlOptions
  mongoDB?: IMongoDBOptions
  auth?: IAuthOptions
  jwt?: IJwtOptions
  log?: ILogOptions
  error?: IErrorOptions
  port?: number
}

export interface IJwtContext {
  sign: (payload: object | string, expiresIn?: number | string) => Promise<accessToken>
  verify: (accessToken: accessToken) => Promise<object | string>
  refresh: (
    accessToken: string,
    refreshAccessToken: string,
    expiresIn?: number | string,
  ) => Promise<accessToken>
}

export interface ILogOptions {
  interval?: number
  file?: IFileOptions
  screen?: boolean
}

export interface IMongoDBOptions {
  schemas?: string
  url?: string
}
export interface IUserContextBase {
  roles: string[]
}

export type accessToken = string

export type IContext<
  C extends IAnyMemberObject = IAnyMemberObject,
  U extends IAnyMemberObject = IAnyMemberObject,
  > = C & IContextBase<U>

export type IUserContext<
  U extends IAnyMemberObject = IAnyMemberObject
  > = U & IUserContextBase
