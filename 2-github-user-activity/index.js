import { readdir, stat } from 'node:fs/promises'
import { join } from 'node:path'

const args = process.argv.slice(2) // Solo argumentos relevantes

if (args.length !== 1) {
    console.error('❌ Solo se puede poner un parametro')
    process.exit(1)
}

// 1. Recuperar la carpeta a listar
const githubUsername = args[0]


