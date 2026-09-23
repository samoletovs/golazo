import { useRef, useState } from 'react'

export function useSquadSave() {
  const busy = useRef(false)
  const acknowledged = useRef(new Set<string>())
  const [saving, setSaving] = useState(false)
  const [confirmed, setConfirmed] = useState(0)
  const [total, setTotal] = useState(0)
  const [failed, setFailed] = useState(false)
  function reset() {
    if (busy.current) return
    acknowledged.current.clear()
    setConfirmed(0)
    setTotal(0)
    setFailed(false)
  }

  async function submit(targetIds: string[], send: (teamId: string) => Promise<void>): Promise<boolean> {
    if (busy.current) return false
    const targets = [...new Set(targetIds)]
    if (!targets.length) throw new Error('A squad save requires at least one target')
    busy.current = true
    setSaving(true)
    setFailed(false)
    setTotal(targets.length)
    if (acknowledged.current.size === 0) setConfirmed(0)
    try {
      for (const id of targets) {
        if (acknowledged.current.has(id)) continue
        await send(id)
        acknowledged.current.add(id)
        setConfirmed(acknowledged.current.size)
      }
      acknowledged.current.clear()
      return true
    } catch (cause) {
      console.error('Squad operation was not fully confirmed:', cause)
      setFailed(true)
      return false
    } finally {
      busy.current = false
      setSaving(false)
    }
  }
  return { submit, saving, confirmed, total, failed, reset }
}
