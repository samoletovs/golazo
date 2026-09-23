import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import ts from 'typescript'
import { PAGES, primaryNavigation } from '../src/academy/navigation'

const root = path.resolve(import.meta.dirname, '..')
function importedSources(): Map<string, string> {
  const sources = new Map<string, string>()
  function visit(file: string) {
    if (sources.has(file)) return
    const text = fs.readFileSync(file, 'utf8')
    sources.set(file, text)
    const ast = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
    const imports: string[] = []
    function walk(node: ts.Node) {
      if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) imports.push(node.moduleSpecifier.text)
      if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword && node.arguments[0] && ts.isStringLiteral(node.arguments[0])) imports.push(node.arguments[0].text)
      ts.forEachChild(node, walk)
    }
    walk(ast)
    for (const name of imports.filter(item => item.startsWith('.'))) {
      const base = path.resolve(path.dirname(file), name)
      const target = [base + '.tsx', base + '.ts', path.join(base, 'index.tsx'), path.join(base, 'index.ts')].find(candidate => fs.existsSync(candidate))
      if (target) visit(target)
    }
  }
  visit(path.join(root, 'src', 'App.tsx'))
  return sources
}

describe('complete Academy shell contract', () => {
  it('keeps every declared destination rendered and the five player workspaces navigable', () => {
    const app = fs.readFileSync(path.join(root, 'src', 'App.tsx'), 'utf8')
    expect(primaryNavigation('player').map(item => item.page)).toEqual(['dashboard', 'log', 'progress', 'learn', 'profile'])
    for (const page of PAGES) expect(app, `${page} must not be an unwired destination`).toContain(`page === '${page}'`)
    expect(app).toContain('<AcademyShell')
    expect(app).not.toMatch(/import.*(?:BottomNav|XpBar|Clubhouse)/)
  })

  it('does not retain a narrow legacy shell or legacy stylesheet in any reachable component', () => {
    for (const [file, source] of importedSources()) {
      expect(source, path.relative(root, file)).not.toMatch(/className=["'`][^"'`]*\bapp-shell\b|import\s+['"][^'"]*clubhouse\.css/)
    }
    const css = fs.readFileSync(path.join(root, 'src', 'index.css'), 'utf8')
    expect(css).not.toContain('.app-shell')
    expect(css).not.toMatch(/transition:\s*all\b/)
    expect(css).toContain('prefers-reduced-motion')
  })

  it('applies the Academy page or introductory structure to every reachable page, not just Home', () => {
    const pages = [...importedSources()].filter(([file]) => file.startsWith(path.join(root, 'src', 'pages') + path.sep))
    expect(pages.length).toBeGreaterThan(15)
    for (const [file, source] of pages) expect(source, path.relative(root, file)).toMatch(/<AcademyPage\b|className="academy-welcome"/)
  })

  it('provides the new Academy vocabulary in all six existing locales', () => {
    const english: Record<string, string> = JSON.parse(fs.readFileSync(path.join(root, 'src', 'i18n', 'en.json'), 'utf8'))
    const keys = Object.keys(english).filter(key => key.startsWith('academy.') || key === 'nav.settings')
    for (const language of ['en', 'lv', 'ru', 'es', 'lt', 'et']) {
      const translated: Record<string, string> = JSON.parse(fs.readFileSync(path.join(root, 'src', 'i18n', `${language}.json`), 'utf8'))
      for (const key of keys) expect(translated[key], `${language}: ${key}`).toBeTruthy()
    }
  })
})
