import {AuthChecker, ForbiddenError, ResolverData, UnauthorizedError} from 'type-graphql'
import {IContext, IUserContext} from './types'

export type logicOperator = 'or' | 'and'

export type functionRole = (
  authContext: ResolverData,
  user?: IAccessTokenUser,
) => boolean | Promise<boolean>

export type stringRole = string

type role = stringRole | functionRole | logicOperator

export interface IAccessTokenUser {
  email: string
  roles: stringRole[]
}

async function checkRole(
  resolverData: ResolverData,
  decode: IAccessTokenUser,
  role: string | functionRole,
  options: {negativePrefix?: string} = {},
): Promise<boolean> {
  if(typeof role === 'string'){
    const {negativePrefix = '!'} = options
    const prefix = role.slice(0, 1)
    const negative = prefix === negativePrefix
    const myRole = negative ? role.slice(1) : role
    const result = Boolean(
      decode.roles.find((value) => {
        return value === myRole
      }),
    )
    if(negative){
      return Promise.resolve(!result)
    }
    return Promise.resolve(result)
  }

  if(typeof role === 'function'){
    // eslint-disable-next-line no-return-await
    return await role(resolverData, decode)
  }

  throw new Error('role must be function or string')
}

function isLogicOperator(value: any): boolean {
  return value === 'or' || value === 'and'
}

function logicalMarge(results: Array<boolean | logicOperator>): boolean {
  let previousResult: boolean = true
  let logicOperator: logicOperator | null = null
  for(let result of results){
    if(isLogicOperator(result)){
      logicOperator = result as logicOperator
    }else if(logicOperator){
      if(logicOperator === 'or'){
        if(previousResult){
          // 더 이상 루프가 필요 없음
          return true
        }
        previousResult = result as boolean
      }else if(logicOperator === 'and'){
        if(!previousResult){
          return false
        }
        previousResult = result as boolean
      }
      logicOperator = null
    }else{
      if(!previousResult){
        return false
      }
      previousResult = result as boolean
    }
  }
  return previousResult
}

async function checkRoles(
  resolverData: ResolverData,
  decode: IAccessTokenUser,
  roles: role[] | stringRole | functionRole,
): Promise<boolean> {
  if(!Array.isArray(roles)){
    return checkRole(resolverData, decode, roles)
  }

  const resultTable: Array<Promise<boolean | logicOperator>> = []

  for(let role of roles){
    if(role === 'or' || role === 'and'){
      resultTable.push(Promise.resolve(role as logicOperator))
    }else if(typeof role === 'string' || typeof role === 'function'){
      resultTable.push(checkRole(resolverData, decode, role))
    }else if(Array.isArray(role)){
      resultTable.push(checkRoles(resolverData, decode, role))
    }
  }

  const results: Array<boolean | logicOperator> = await Promise.all(resultTable)

  return logicalMarge(results)
}

export default function authCheckerFactory<
  C extends IContext = IContext,
  U extends IUserContext = IUserContext
>(): AuthChecker<C, role> {
  return async (_: ResolverData<C>, roles: role[]) => {
    let decode: any
    const {accessToken, jwt} = _.context
    if(accessToken){
      try{
        decode = await jwt.verify(accessToken)
      }catch(e){
        throw e
      }
    }else{
      throw new UnauthorizedError()
    }
    if(!decode || typeof decode === 'string'){
      return false
    }

    if(typeof decode === 'object' && !decode.roles){
      return false
    }

    // collecting function roles and string roles
    if(!(await checkRoles(_, decode, roles))){
      throw new ForbiddenError()
    }

    // save user data
    _.context.user = decode

    return true
  }
}
