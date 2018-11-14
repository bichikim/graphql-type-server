import requireAll from 'require-all'
import appRootPath from 'app-root-path'
import * as _ from 'lodash'
import Mongoose, {Model, Schema} from 'mongoose'
import {Request} from 'express'

let __modules: any[]
let __mongooseSchemas: {[key: string]: any}


export function getAccessToken(req: Request, accessTokenName: string = 'access-token'): string {
  let accessToken: any = req.headers && req.headers[accessTokenName]
  if(typeof accessToken === 'string'){
    return accessToken
  }
  return req.cookies && req.cookies[accessToken]
}

export function getAllMongooseSchemas(_path: string) {
  if(__mongooseSchemas){
    return __mongooseSchemas
  }
  __mongooseSchemas = getAllTs(_path)
  return __mongooseSchemas
}

export function getAllResolvers(_path: string): any[]{
  if(__modules){
    return __modules
  }
  __modules = _.values(getAllTs(_path))
  return __modules
}

export function getAllTs(_path: string): {[key: string]: any} {
  return requireAll({
    dirname: appRootPath.resolve(_path),
    filter: /^(?!.*\.spec\.ts$).*\.ts$/,
    map: (name) => {
      return name
    },
    resolve: (_module: any) => {
      return _module.default || _module
    }
  })
}
export function installMongooseSchema(schemas){
  const installedKeys = Object.keys(Mongoose.models)
  const schemaKeys = Object.keys(schemas)
  const willInstallKeys = _.xor(
    installedKeys, schemaKeys,
  )
  willInstallKeys.forEach((name) => {
    Mongoose.model(name, schemas[name])
  })
  return Mongoose.models
}
export function timeout(timeout: number){
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve()
    }, timeout)
  })
}

