import { envUtil } from '@common/utils'
console.log('环境变量:', envUtil)

const { MODE } = envUtil
export const IS_DEV = MODE === 'development'

export default {
  IS_DEV
}
