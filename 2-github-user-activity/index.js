import { readdir, stat } from 'node:fs/promises'
import { join } from 'node:path'


// 1. Recuperar la carpeta a listar
const githubUsername = process.argv[2] ?? '.'