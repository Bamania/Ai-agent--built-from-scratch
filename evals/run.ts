import 'dotenv/config'
import { join, resolve, dirname } from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import { readdir } from 'fs/promises'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const main = async () => {
  const evalName = process.argv[2]
  const experimentsDir = join(__dirname, 'experiments')

  try {
    if (evalName) {
      const evalPath = resolve(join(experimentsDir, `${evalName}.eval.ts`))
      const fileURL = pathToFileURL(evalPath).href
      await import(fileURL)
    } else {
      const files = await readdir(experimentsDir)
      const evalFiles = files.filter((file) => file.endsWith('.eval.ts'))

      for (const evalFile of evalFiles) {
        const evalPath = resolve(join(experimentsDir, evalFile))
        const fileURL = pathToFileURL(evalPath).href
        await import(fileURL)
      }
    }
  } catch (error) {
    console.error(
      `Failed to run eval${evalName ? ` '${evalName}'` : 's'}:`,
      error
    )
    process.exit(1)
  }
}

main()
