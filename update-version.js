// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require("fs")
if (!process.argv[2]) {
  console.log("No version specified")
  process.exit(1)
}
fs.cpSync("package.json", "package.json.bak")

const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"))

packageJson.version = process.argv[2]

fs.writeFileSync("package.json", JSON.stringify(packageJson, null, 2))
