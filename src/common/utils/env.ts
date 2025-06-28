import cloneDeep from 'lodash.clonedeep'

const env = cloneDeep(import.meta.env)

Object.entries(env).forEach(([key, value]) => {
  if (value === 'true' || value === 'false') {
    env[key] = value === 'true'
  } else if (/^\d+$/.test(value)) {
    env[key] = Number(value)
  } else if (value === 'null') {
    env[key] = null
  } else if (value === 'undefined') {
    env[key] = undefined
  }
})

export { env }

export default env
