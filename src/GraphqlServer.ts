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
import appRootPath from 'app-root-path'
import consola from 'consola'
import {GraphQLUpload} from 'graphql-upload'
const DEFAULT_PORT = 4000
const DEFAULT_GRAPHQL_RESOLVERS = 'graphql'
const DEFAULT_GRAPHQL_SCHEMA_FILE_PATH = 'schema.gql'
const DEFAULT_MONGODB_SCHEMAS = 'mongodb'
const DEFAULT_AUTH_ACCESS_TOKEN_NAME = 'access-token-name'

export default class GraphqlServer<
  C extends IAnyMemberObject,
  U extends IAnyMemberObject,
  > {
  private _express?: Express
  private _apollo?: ApolloServer
  private _server?: Server
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

    this._express = express()

    const schemasPath = path.join(root, mongoDBSchemas)
    const schemas = utils.getAllMongooseSchemas(schemasPath)
    if(schemas && Object.keys(schemas).length > 0){
      utils.installMongooseSchema(schemas)
    }else{
      consola.warn(`There is no mongoDB schemas ${schemasPath}`)
    }

    if(mongoDBUrl){
      try{
        await Mongoose.connect(mongoDBUrl)
      }catch{
        consola.error(`There is no MongoDB "${mongoDBUrl}"`)
      }
    }else{
      consola.warn(`There is no mongoDB Url`)
    }

    const resolversPath = path.join(root, graphqlResolvers)
    const resolvers = utils.getAllResolvers(resolversPath)

    if(resolvers && resolvers.length > 0){
      const schema = await typeGraphql.buildSchema({
        resolvers,
        emitSchemaFile: appRootPath.resolve(graphqlSchemaFilePath),
        authChecker: authCheckerFactory<IContext<C>, IUserContext<U>>(),
      })


      this._apollo = new ApolloServer({
        resolvers: {Upload: GraphQLUpload},
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

      this._apollo.applyMiddleware({app: this._express})
    }else{
      consola.warn(`There is no graphql resolvers "${resolversPath}"`)
    }

    this._server = await this._listen(port)
  }

  private _listen(port: number): Promise<Server>{
    return new Promise((resolve, reject) => {
      if(!this._express){
        return reject()
      }
      const server = this._express.listen(port, () => {
        resolve(server)
      })
    })
  }

  private _close(): Promise<void>{
    return new Promise<void>((resolve, reject) => {
      if(!this._server){
        return reject()
      }
      this._server.close(() => {
        resolve()
      })
    })
  }

  async stop(timeout?: number): Promise<void>{
    if(!this._server){
      return Promise.resolve()
    }
    if(timeout){
      await utils.timeout(timeout)
    }
    await this._close()
  }
}
