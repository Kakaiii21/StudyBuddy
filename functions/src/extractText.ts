import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'

export async function extractText(
  buffer: Buffer,
  fileType: string
): Promise<string> {
  const ext = fileType.toLowerCase()

  // ── TXT ───────────────────────────────────────────────────────────────────
  if (ext === 'txt') {
    return buffer.toString('utf-8')
  }

  // ── PDF ───────────────────────────────────────────────────────────────────
  // pdf-parse blocks subpath imports in newer versions.
  // officeparser handles PDF natively since v4, so we use it here too.
  if (ext === 'pdf') {
    return parseWithOfficeParser(buffer, ext)
  }

  // ── DOCX / DOC ────────────────────────────────────────────────────────────
  if (ext === 'docx' || ext === 'doc') {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mammoth = require('mammoth') as {
      extractRawText: (opts: { buffer: Buffer }) => Promise<{ value: string }>
    }
    const result = await mammoth.extractRawText({ buffer })
    return String(result?.value ?? '')
  }

  // ── PPTX / PPT ────────────────────────────────────────────────────────────
  if (ext === 'pptx' || ext === 'ppt') {
    return parseWithOfficeParser(buffer, ext)
  }

  throw new Error(`Unsupported file type: ${ext}`)
}

/**
 * Handles PPTX, PPT, and PDF using officeparser.
 * Compatible with both:
 *   v4 and below: parseOfficeAsync(buffer, config) → Promise<string>
 *   v5+:          parseOffice(buffer, config)      → Promise<AST>  (call .toText())
 *
 * officeparser v4+ accepts a Buffer directly — no temp file needed.
 */
async function parseWithOfficeParser(buffer: Buffer, ext: string): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const officeParser = require('officeparser')

  const config = {
    newlineDelimiter: '\n',
    ignoreNotes: false,
    outputErrorToConsole: false,
  }

  // ── v5+: parseOffice returns an AST object with .toText() ─────────────────
  if (typeof officeParser.parseOffice === 'function') {
    try {
      const ast = await officeParser.parseOffice(buffer, config)
      // v5 AST has .toText(); v4 parseOffice returns a plain string
      if (ast && typeof ast.toText === 'function') {
        return String(ast.toText())
      }
      return String(ast ?? '')
    } catch (err) {
      throw new Error(`officeparser (parseOffice) failed for .${ext}: ${(err as Error).message}`)
    }
  }

  // ── v3 and below fallback: parseOfficeAsync ───────────────────────────────
  // Very old versions don't support Buffer input, so write to tmp file
  if (typeof officeParser.parseOfficeAsync === 'function') {
    const tmpPath = path.join(os.tmpdir(), `upload_${Date.now()}.${ext}`)
    fs.writeFileSync(tmpPath, buffer)
    const cleanup = () => { try { fs.unlinkSync(tmpPath) } catch (_) { /* ignore */ } }
    try {
      const text = await officeParser.parseOfficeAsync(tmpPath, config)
      cleanup()
      return String(text ?? '')
    } catch (err) {
      cleanup()
      throw new Error(`officeparser (parseOfficeAsync) failed for .${ext}: ${(err as Error).message}`)
    }
  }

  throw new Error('officeparser: no compatible parse function found. Run: npm install officeparser@latest')
}