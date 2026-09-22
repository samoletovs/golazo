// @vitest-environment node
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const workflow = readFileSync(new URL('../.github/workflows/ci-cd.yml', import.meta.url), 'utf8')
const quality = workflow.split('  quality:')[1].split('  deploy:')[0]
const deployment = workflow.split('  deploy:')[1].split('  close_pull_request:')[0]

function checkoutRef(job: string): string | undefined {
  return job.split('- uses: actions/checkout@v5')[1]?.split(/\r?\n {6}- /)[0]?.match(/^\s*ref:\s*(.+)$/m)?.[1]
}

describe('same-source design verification and nondeploying manual validation', () => {
  it('tests and deploys the same event merge tree with full history for evidence checks', () => {
    expect(quality).toContain('fetch-depth: 0')
    expect(checkoutRef(quality)).toBe('${{ github.sha }}')
    expect(checkoutRef(deployment)).toBe(checkoutRef(quality))
  })
  it('enforces reviewed-source ancestry on PRs rather than pretending squash ancestry survives', () => {
    expect(quality).toMatch(/name: Require source-bound evidence for UI changes\s+if: github\.event_name == 'pull_request'/)
    expect(quality).toContain('DESIGN_BASE_SHA: ${{ github.event.pull_request.base.sha }}')
    expect(quality).toContain('python scripts/check-design-pr.py --repo . --base "$DESIGN_BASE_SHA"')
  })
  it('reruns the gate on evidence-only PR updates and executes its regression suite', () => {
    expect(workflow.split('  pull_request:')[1].split('concurrency:')[0]).not.toContain('paths-ignore')
    expect(quality).toContain('run: python tests/test_design_gate.py')
    expect(quality).not.toContain('continue-on-error')
  })
  it('allows a manually dispatched quality build while excluding manual events from deployment', () => {
    expect(workflow).toContain('  workflow_dispatch:')
    expect(quality).toContain("github.event_name == 'workflow_dispatch'")
    const condition = deployment.split('    if: >-')[1].split('    runs-on:')[0]
    expect(condition).toContain("github.event_name == 'push' || (github.event_name == 'pull_request'")
    expect(condition).not.toContain('workflow_dispatch')
    expect(workflow).not.toContain('cron:')
  })
  it('stamps the exact build revision and keeps the API in deployment', () => {
    expect(quality).toContain('printf \'%s\\n\' "$GITHUB_SHA" > dist/source-revision.txt')
    expect(quality).toContain('name: golazo-preview-${{ github.sha }}')
    expect(quality).toContain("steps.validation_build.outcome == 'success'")
    expect(deployment).toContain('api_location: "api"')
    expect(deployment).toContain('skip_app_build: true')
    expect(deployment).toContain("node-version: '22'")
    expect(quality).toContain("node-version: '22'")
  })
})
