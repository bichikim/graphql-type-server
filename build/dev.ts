import dotEnv from 'dotEnv'
import {GraphqlServer} from '../src'

dotEnv.config()

const server = new GraphqlServer()
server.start({
  mongoDB: {
    url: process.env.MONGODB_URL
  }
}).then(() => {
  console.log('server is running')
})