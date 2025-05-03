import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Read CHANGELOG.md
const changelogPath = path.resolve(__dirname, '../CHANGELOG.md')
const changelogContent = fs.readFileSync(changelogPath, 'utf-8')

// Extract the latest version
const versionMatch = changelogContent.match(/## \[([0-9]+\.[0-9]+\.[0-9]+)\]/)
if (!versionMatch) {
  console.error('Could not find a valid version in CHANGELOG.md')
  process.exit(1)
}
const latestVersion = versionMatch[1]
console.log(`Latest version from changelog: ${latestVersion}`)

// Update package.json
const packageJsonPath = path.resolve(__dirname, '../package.json')
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
packageJson.version = latestVersion
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf-8')
console.log(`Updated package.json to version ${latestVersion}`)

// Update constants.ts
const constantsPath = path.resolve(__dirname, '../src/data/constants.ts') // Adjust path as needed
let constantsContent = fs.readFileSync(constantsPath, 'utf-8')
constantsContent = constantsContent.replace(
  /export const VERSION = '[^']+'/,
  `export const VERSION = '${latestVersion}'`
)
fs.writeFileSync(constantsPath, constantsContent, 'utf-8')
console.log(`Updated constants.ts to version ${latestVersion}`)
