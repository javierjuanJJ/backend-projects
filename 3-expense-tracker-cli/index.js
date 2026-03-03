import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join, basename, extname } from 'node:path'
import { readdir, stat } from 'node:fs/promises'