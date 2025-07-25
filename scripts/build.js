// build.js
const { execSync } = require('child_process')
const os = require('os')

let platform
switch (os.platform()) {
  case 'win32':
    platform = 'win'
    break
  case 'darwin':
    platform = 'mac'
    break
  case 'linux':
    platform = 'linux'
    break
  default:
    throw new Error('Unsupported platform')
}

console.log(`📦 Building for ${platform}...`)

try {
  execSync('npm run build', { stdio: 'inherit' })
  execSync(`electron-builder --${platform}`, { stdio: 'inherit' })
  console.log('✅ Build completed!')
} catch (error) {
  console.error('❌ Build failed:', error)
  process.exit(1)
}
