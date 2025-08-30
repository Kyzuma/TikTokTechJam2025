import { useCallback, useEffect, useMemo, useState } from '@lynx-js/react'
import axios from 'axios'
import './App.css'

export default function App() {
  // -------- State
  const [apiResponse, setApiResponse] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [logs, setLogs] = useState([])
  const [clicks, setClicks] = useState(0)

  // -------- Platform → base URL
  const isAndroid =
    typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent)

  // ⬇️ Set this to the port your Flask app uses (8080 or 5001 etc.)
  const PORT = 8080
  const BASE = isAndroid
    ? `http://10.0.2.2:${PORT}`   // Android emulator → host
    : `http://127.0.0.1:${PORT}`  // Desktop/Web

  const API_URL = `${BASE}/moderation/users/1/risk`

  // -------- On-screen logger: mirror console.* to UI
  useEffect(() => {
    const cap = 300
    const push = (level, args) => {
      const line =
        `[${new Date().toLocaleTimeString()}] ${level}: ` +
        args.map(a => {
          try { return typeof a === 'string' ? a : JSON.stringify(a) }
          catch { return String(a) }
        }).join(' ')
      setLogs(prev => {
        const next = [...prev, line]
        if (next.length > cap) next.splice(0, next.length - cap)
        return next
      })
    }

    const orig = {
      log: console.log,
      info: console.info,
      warn: console.warn,
      error: console.error
    }
    console.log   = (...a) => { orig.log(...a);   push('LOG', a) }
    console.info  = (...a) => { orig.info(...a);  push('INFO', a) }
    console.warn  = (...a) => { orig.warn(...a);  push('WARN', a) }
    console.error = (...a) => { orig.error(...a); push('ERROR', a) }

    console.info('App mounted')
    console.info('Detected platform:', isAndroid ? 'Android (emulator)' : 'Desktop/Web')
    console.info('API Base URL:', BASE)

    return () => {
      console.log   = orig.log
      console.info  = orig.info
      console.warn  = orig.warn
      console.error = orig.error
    }
  }, [BASE, isAndroid])

  // -------- Axios with basic logging
  const api = useMemo(() => {
    const instance = axios.create({
      baseURL: BASE,
      timeout: 30000,
      validateStatus: s => s >= 200 && s < 300,
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }
    })
    instance.interceptors.request.use(cfg => {
      console.info('HTTP →', (cfg.method || 'get').toUpperCase(), cfg.baseURL + cfg.url)
      return cfg
    })
    instance.interceptors.response.use(
      res => { console.info('HTTP ←', res.status, res.config.url); return res },
      err => {
        const st = err?.response?.status
        console.error('HTTP ✖', st ?? 'NO_STATUS', err?.message || err)
        return Promise.reject(err)
      }
    )
    return instance
  }, [BASE])

  // -------- Click counter helper
  const inc = useCallback((label) => {
    setClicks(c => {
      const n = c + 1
      console.log(`Click #${n}${label ? ` (${label})` : ''}`)
      return n
    })
  }, [])

  // -------- Button handler: call risk API
  const callRiskApi = useCallback(async () => {
    if (loading) return
    setLoading(true); setError(null); setApiResponse(null)

    try {
      console.log('Calling Risk API…', API_URL)
      const res = await api.get('/moderation/users/1/risk')
      console.log('Risk API response:', res.data)
      setApiResponse(res.data)
    } catch (err) {
      const status = err?.response?.status
      const msg = err?.response?.data?.message || err?.message || 'Unknown error'
      const friendly =
        status ? `HTTP ${status}: ${msg}` :
        err?.code === 'ECONNABORTED' ? 'Timeout: server took too long to respond' :
        `Network error: ${msg}`
      setError(`${friendly}\n\nTried: ${API_URL}`)
    } finally {
      setLoading(false)
    }
  }, [api, API_URL, loading])

  return (
    <view>
      <view className='Background' />
      <view className='App'>
        {/* Header */}
        <view className='Banner'>
          <text className='Title'>Risk API Test</text>
          <text className='Subtitle'>{API_URL}</text>
        </view>

        {/* Actions */}
        <view className='TopButtons'>
          {/* Main call button */}
          <view
            onTap={() => { inc }}
            onClick={() => { inc:('risk'); callRiskApi() }}
            className={`Button Button--blue ${loading ? 'Button--disabled' : ''}`}
            style={{ backgroundColor: loading ? '#808080' : '#007AFF', marginBottom: '8px' }}
            role='button'
            // tabIndex={0}
            // onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && (inc('risk'), callRiskApi())}
          >
            <text className='ButtonText'>
              {loading ? 'Calling…' : 'GET /moderation/users/1/risk'}
            </text>
          </view>

          {/* Ping log button */}
          <view
            onTap={() => { inc('ping'); console.log('Ping: tap received') }}
            onClick={() => { inc('ping'); console.log('Ping: click received') }}
            className='Button Button--grey'
          >
            <text className='ButtonText'>Ping log</text>
          </view>

          {/* Reset counter */}
          <view
            onTap={() => { setClicks(0); console.log('Counter reset') }}
            onClick={() => { setClicks(0); console.log('Counter reset') }}
            className='Button'
            style={{ backgroundColor: '#444' }}
          >
            <text className='ButtonText'>Reset counter</text>
          </view>
        </view>

        {/* Counter display */}
        <view className='Card'>
          <text className='CardText monospace'>Clicks: {clicks}</text>
        </view>

        {/* Error */}
        {error && (
          <view className='Card Card--error'>
            <text className='CardText monospace'>{error}</text>
          </view>
        )}

        {/* Response */}
        {apiResponse && (
          <view className='Card'>
            <text className='CardText monospace'>
              {JSON.stringify(apiResponse, null, 2)}
            </text>
          </view>
        )}

        {/* On-screen logs */}
        <view className='Logs'>
          <text className='LogsText'>
            {logs.length ? logs.join('\n') : 'Logs will appear here…'}
          </text>
        </view>

        <text className='Hint'>
          Flask must be reachable at {BASE}. On Android emulator, host is 10.0.2.2.
        </text>
      </view>
    </view>
  )
}
