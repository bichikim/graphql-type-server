import 'reflect-metadata'
import {ApolloServer} from 'apollo-server-express'
import express, {Express} from 'express'
import {IGraphqlServerOptions, IContext, IUserContext, IAnyMemberObject} from './types'
import * as typeGraphql from 'type-graphql'
import * as path from 'path'
import * as utils from './utils'
import authCheckerFactory from './auth-chekcer-factory'
import contextJwtFactory from './context-jwt-factory'
import Mongoose from 'mongoose'
import formatErrorFactory from './format-error'
import {Server} from 'http'
const DEFAULT_PORT = 4000
const DEFAULT_GRAPHQL_RESOLVERS = 'resolvers'
const DEFAULT_GRAPHQL_SCHEMA_FILE_PATH = 'schema.gql'
const DEFAULT_MONGODB_SCHEMAS = 'schema.gql'
const DEFAULT_AUTH_ACCESS_TOKEN_NAME = 'access-token-name'

export default class GraphqlServer<
  C extends IAnyMemberObject,
  U extends IAnyMemberObject,
  > {
  express?: Express
  apollo?: ApolloServer
  server?: Server
  async start(options: IGraphqlServerOptions<C> = {}){
    const {
      root = 'src',
      context = {},
      graphql: {
        resolvers: graphqlResolvers
          = DEFAULT_GRAPHQL_RESOLVERS,
        emitSchemaFilePath: graphqlSchemaFilePath
          = DEFAULT_GRAPHQL_SCHEMA_FILE_PATH,
        playground: graphqlPlayground = Boolean(process.env.dev)
      } = {},
      mongoDB: {
        schemas: mongoDBSchemas
          = DEFAULT_MONGODB_SCHEMAS,
        url: mongoDBUrl
          = null,
      } = {},
      auth: {accessTokenName: authAccessTokenName
        = DEFAULT_AUTH_ACCESS_TOKEN_NAME} = {},
      error: errorOptions,
      jwt: jwtOptions,
      port = DEFAULT_PORT
    } = options

    this.express = express()

    const schema = await typeGraphql.buildSchema({
      resolvers: utils.getAllResolvers(path.join(root, graphqlResolvers)),
      emitSchemaFile: path.resolve(__dirname, graphqlSchemaFilePath),
      authChecker: authCheckerFactory<IContext<C>, IUserContext<U>>(),
    })

    if(mongoDBUrl){
      utils.installMongooseSchema(utils.getAllMongooseSchemas(path.join(root, mongoDBSchemas)))
      await Mongoose.connect(mongoDBUrl)
    }

    this.apollo = new ApolloServer({
      schema, playground: graphqlPlayground,
      formatError: formatErrorFactory(errorOptions),
      context: ({request}): IContext => {
        return {
          ...context,
          accessToken: utils.getAccessToken(request, authAccessTokenName),
          jwt: contextJwtFactory(jwtOptions),
        }
      },
    })

    this.apollo.applyMiddleware({app: this.express})

    this.server = await this._listen(port)
  }

  private _listen(port: number): Promise<Server>{
    return new Promise((resolve, reject) => {
      if(!this.express){
        return reject()
      }
      const server = this.express.listen(port, () => {
        resolve(server)
      })
    })
  }

  private _close(): Promise<void>{
    return new Promise<void>((resolve, reject) => {
      if(!this.server){
        return reject()
      }
      this.server.close(() => {
        resolve()
      })
    })
  }

  async stop(timeout?: number): Promise<void>{
    if(!this.server){
      return Promise.resolve()
    }
    if(timeout){
      await utils.timeout(timeout)
    }
    await this._close()
  }
}
