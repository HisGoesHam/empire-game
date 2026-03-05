import { useState, useEffect, useRef } from 'react'
import { ref, set, onValue, off } from 'firebase/database'
import { db } from './firebase.js'

const STALE_MS = 30 * 60 * 1000 // 30 min — saved session treated as stale

// ── Google Fonts ──────────────────────────────────────────────────────────────
const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;900&family=Crimson+Pro:ital,wght@0,300;0,400;0,600;1,300;1,400&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      background: #0a0f1a;
      color: #e8dfc8;
      font-family: 'Crimson Pro', Georgia, serif;
      min-height: 100vh;
    }

    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-track { background: rgba(255,255,255,0.03); }
    ::-webkit-scrollbar-thumb { background: #7a5c2e; border-radius: 2px; }

    input { font-family: 'Crimson Pro', Georgia, serif; }

    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(16px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes crownFloat {
      0%,100% { transform: translateY(0px); }
      50%      { transform: translateY(-8px); }
    }
    @keyframes shimmer {
      0%   { background-position: -200% center; }
      100% { background-position:  200% center; }
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `}</style>
)

// ── Design tokens ─────────────────────────────────────────────────────────────
const c = {
  bg:         '#0a0f1a',
  bgCard:     'rgba(18,26,42,0.95)',
  bgInput:    'rgba(6,10,18,0.8)',
  gold:       '#c9a84c',
  goldBrt:    '#e8c96e',
  goldDim:    '#7a5c2e',
  cream:      '#e8dfc8',
  silver:     '#8fa0b0',
  crimson:    '#8b1a2f',
  crimsonBrt: '#c0253f',
  border:     'rgba(201,168,76,0.22)',
  green:      'rgba(80,200,100,0.18)',
  greenBrd:   'rgba(80,200,100,0.45)',
}

// ── Primitives ────────────────────────────────────────────────────────────────
const Card = ({ children, style }) => (
  <div style={{
    background: c.bgCard,
    border: `1px solid ${c.border}`,
    borderRadius: 6,
    padding: '24px 28px',
    marginBottom: 18,
    boxShadow: '0 6px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(201,168,76,0.08)',
    animation: 'fadeUp 0.4s ease',
    ...style,
  }}>{children}</div>
)

const CardTitle = ({ children }) => (
  <div style={{
    fontFamily: "'Cinzel', serif",
    fontSize: '0.7rem',
    letterSpacing: '0.22em',
    color: c.gold,
    textTransform: 'uppercase',
    marginBottom: 16,
  }}>{children}</div>
)

const Btn = ({ children, onClick, variant = 'gold', disabled, fullWidth, style }) => {
  const [hov, setHov] = useState(false)
  const variants = {
    gold: {
      background: hov
        ? `linear-gradient(135deg, ${c.gold}, ${c.goldBrt}, ${c.gold})`
        : `linear-gradient(135deg, ${c.goldDim}, ${c.gold}, ${c.goldDim})`,
      color: '#0a0f1a',
      boxShadow: hov ? '0 4px 22px rgba(201,168,76,0.45)' : '0 2px 12px rgba(201,168,76,0.25)',
      border: 'none',
    },
    crimson: {
      background: hov
        ? `linear-gradient(135deg, ${c.crimsonBrt}, #d44, ${c.crimsonBrt})`
        : `linear-gradient(135deg, ${c.crimson}, ${c.crimsonBrt}, ${c.crimson})`,
      color: c.cream,
      border: 'none',
    },
    ghost: {
      background: 'transparent',
      border: `1px solid ${hov ? c.gold : c.border}`,
      color: hov ? c.gold : c.silver,
    },
  }
  return (
    <button
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        fontFamily: "'Cinzel', serif",
        fontSize: '0.72rem',
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        borderRadius: 3,
        padding: '11px 26px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.38 : 1,
        transition: 'all 0.18s',
        transform: hov && !disabled ? 'translateY(-1px)' : 'none',
        width: fullWidth ? '100%' : undefined,
        ...variants[variant],
        ...style,
      }}
    >{children}</button>
  )
}

const Input = ({ value, onChange, placeholder, onKeyDown, autoFocus, maxLength }) => (
  <input
    value={value}
    onChange={e => onChange(e.target.value)}
    onKeyDown={onKeyDown}
    placeholder={placeholder}
    autoFocus={autoFocus}
    maxLength={maxLength}
    style={{
      width: '100%',
      background: c.bgInput,
      border: `1px solid ${c.border}`,
      borderRadius: 3,
      color: c.cream,
      fontSize: '1rem',
      padding: '10px 14px',
      outline: 'none',
    }}
    onFocus={e => (e.target.style.borderColor = c.gold)}
    onBlur={e => (e.target.style.borderColor = c.border)}
  />
)

const Divider = ({ label }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '22px 0' }}>
    <div style={{ flex: 1, height: 1, background: `linear-gradient(to right, transparent, ${c.goldDim})` }} />
    <span style={{ color: c.gold, fontSize: '0.8rem', fontFamily: "'Cinzel', serif", letterSpacing: '0.1em' }}>{label}</span>
    <div style={{ flex: 1, height: 1, background: `linear-gradient(to left, transparent, ${c.goldDim})` }} />
  </div>
)

const Spinner = () => (
  <span style={{
    display: 'inline-block',
    width: 14, height: 14,
    border: `2px solid ${c.goldDim}`,
    borderTopColor: c.gold,
    borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
    verticalAlign: 'middle',
    marginRight: 6,
  }} />
)

// ── Firebase helpers ──────────────────────────────────────────────────────────
function roomRef(code) {
  return ref(db, `rooms/${code}`)
}

async function saveRoom(code, data) {
  await set(roomRef(code), data)
}

function genCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

function makeRoom(code, gmName) {
  return {
    code,
    gm: gmName,
    phase: 'lobby',
    players: [{ name: gmName, isGM: true }],
    nicknames: {},
    eliminated: {},
  }
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [screen,     setScreen]     = useState('home')
  const [room,       setRoom]       = useState(null)
  const [myName, setMyName] = useState('')
  const [isGM,   setIsGM]   = useState(false)
  const [inputCreateName, setInputCreateName] = useState('')
  const [inputJoinName,   setInputJoinName]   = useState('')
  const [inputCode,       setInputCode]       = useState('')
  const [inputNick,  setInputNick]  = useState('')
  const [error,      setError]      = useState('')
  const [loading,    setLoading]    = useState(false)
  const unsubRef = useRef(null)

  // ── Exit room ──────────────────────────────────────────────────────────────
  function exitRoom() {
    if (unsubRef.current) { unsubRef.current(); unsubRef.current = null }
    localStorage.removeItem('empire_code')
    localStorage.removeItem('empire_name')
    localStorage.removeItem('empire_isGM')
    localStorage.removeItem('empire_lastActive')
    setRoom(null); setMyName(''); setIsGM(false)
    setInputCreateName(''); setInputJoinName(''); setInputCode(''); setInputNick('')
    setError(''); setScreen('home')
  }

  // ── Real-time listener ─────────────────────────────────────────────────────
  function subscribeToRoom(code) {
    if (unsubRef.current) unsubRef.current()
    const r = roomRef(code)
    const handler = onValue(r, snap => {
      const data = snap.val()
      if (data) setRoom(data)
    })
    unsubRef.current = () => off(r, 'value', handler)
  }

  useEffect(() => () => unsubRef.current?.(), [])

  // ── Always start fresh on load/refresh ────────────────────────────────────
  useEffect(() => {
    localStorage.removeItem('empire_code')
    localStorage.removeItem('empire_name')
    localStorage.removeItem('empire_isGM')
    localStorage.removeItem('empire_lastActive')
  }, [])

  // ── Reset to home when user returns to tab after being away too long ───────
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) return
      const lastActive = localStorage.getItem('empire_lastActive')
      const isStale    = !lastActive || (Date.now() - Number(lastActive)) > STALE_MS
      if (isStale) {
        localStorage.removeItem('empire_code')
        localStorage.removeItem('empire_name')
        localStorage.removeItem('empire_isGM')
        localStorage.removeItem('empire_lastActive')
        if (unsubRef.current) { unsubRef.current(); unsubRef.current = null }
        setRoom(null); setMyName(''); setIsGM(false); setScreen('home')
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [])


  // ── Derive screen from room state ──────────────────────────────────────────
  useEffect(() => {
    if (!room || !myName) return
    if (room.phase === 'lobby')     { setScreen('lobby');    return }
    if (room.phase === 'nicknames') {
    if (room.gm === myName) { setScreen('gm'); return }
      setScreen(room.nicknames?.[myName] ? 'waiting' : 'nickname')
    return
    }
    if (room.phase === 'reading' || room.phase === 'game') {
      setScreen('game')
    }
  }, [room, myName, isGM])

  // ── Actions ────────────────────────────────────────────────────────────────
  // ── Keep lastActive fresh while user is in a room ─────────────────────────
  useEffect(() => {
    if (screen === 'home') return
    localStorage.setItem('empire_lastActive', Date.now().toString())
    const id = setInterval(() => {
      localStorage.setItem('empire_lastActive', Date.now().toString())
    }, 60_000)
    return () => clearInterval(id)
  }, [screen])

  async function createRoom() {
    const name = inputCreateName.trim()
    if (!name) { setError('Enter your name'); return }
    setLoading(true); setError('')
    const code = genCode()
    const r = makeRoom(code, name)
    await saveRoom(code, r)
    setMyName(name)
    setIsGM(true)
    localStorage.setItem('empire_name', name)
    localStorage.setItem('empire_code', code)
    localStorage.setItem('empire_isGM', 'true')
    localStorage.setItem('empire_lastActive', Date.now().toString())
    subscribeToRoom(code)
    setLoading(false)
  }

  async function joinRoom() {
    const name = inputJoinName.trim()
    const code = inputCode.trim().toUpperCase()
    if (!name || !code) { setError('Enter your name and a room code'); return }
    setLoading(true); setError('')

    // Read once to validate
    const snap = await new Promise(resolve => {
      const r = roomRef(code)
      onValue(r, s => { off(r); resolve(s) }, { onlyOnce: true })
    })

    const data = snap.val()
    if (!data)                    { setError('Room not found — check the code'); setLoading(false); return }
    if (data.phase !== 'lobby')   { setError('This game has already started');   setLoading(false); return }
    const nameTaken = (data.players || []).some(p => p.name.toLowerCase() === name.toLowerCase())
    if (nameTaken)                { setError('That name is already taken');       setLoading(false); return }

    const updated = { ...data, players: [...(data.players || []), { name, isGM: false }] }
    await saveRoom(code, updated)
    setMyName(name)
    setIsGM(false)
    localStorage.setItem('empire_name', name)
    localStorage.setItem('empire_code', code)
    localStorage.setItem('empire_isGM', 'false')
    localStorage.setItem('empire_lastActive', Date.now().toString())
    subscribeToRoom(code)
    setLoading(false)
  }

  async function startNicknamePhase() {
    if (!room || room.players.length < 3) { setError('Need at least 3 players'); return }
    await saveRoom(room.code, { ...room, phase: 'nicknames' })
  }

  async function submitNickname() {
    const nick = inputNick.trim()
    if (!nick) { setError('Enter a nickname'); return }
    const updated = { ...room, nicknames: { ...(room.nicknames || {}), [myName]: nick } }
    await saveRoom(room.code, updated)
    setInputNick('')
  }

  async function startReading() {
    await saveRoom(room.code, { ...room, phase: 'reading' })
  }

  async function startGame() {
    await saveRoom(room.code, { ...room, phase: 'game' })
  }

  async function toggleEliminated(playerName) {
    const eliminated = { ...(room.eliminated || {}) }
    if (eliminated[playerName]) {
      delete eliminated[playerName]
    } else {
      eliminated[playerName] = true
    }
    await saveRoom(room.code, { ...room, eliminated })
  }

  async function endGame() {
    const fresh = makeRoom(room.code, room.gm)
    fresh.players = room.players
    await saveRoom(room.code, fresh)
  }

  const nonGMPlayers = (room?.players || []).filter(p => p.name !== room?.gm)
  const allSubmitted = nonGMPlayers.length > 0 &&
    nonGMPlayers.every(p => room.nicknames?.[p.name])

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: '100vh',
      background: `
        radial-gradient(ellipse at 25% 15%, rgba(201,168,76,0.07) 0%, transparent 55%),
        radial-gradient(ellipse at 80% 85%, rgba(139,26,47,0.07) 0%, transparent 55%),
        #0a0f1a`,
      paddingBottom: 48,
    }}>
      <GlobalStyle />

      {/* Header */}
      <div style={{ position: 'relative', textAlign: 'center', padding: '40px 20px 10px' }}>
        {screen === 'rules' && (
          <button
            onClick={() => setScreen('home')}
            title="Back to Home"
            style={{
              position: 'absolute',
              top: 20, left: 18,
              background: 'transparent',
              border: `1px solid ${c.border}`,
              borderRadius: 3,
              color: c.silver,
              fontFamily: "'Cinzel', serif",
              fontSize: '0.65rem',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              padding: '7px 14px',
              cursor: 'pointer',
              transition: 'all 0.18s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = c.gold; e.currentTarget.style.color = c.gold }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = c.border; e.currentTarget.style.color = c.silver }}
          >
            ← Back
          </button>
        )}
        {screen !== 'home' && screen !== 'rules' && (
          <button
            onClick={exitRoom}
            title="Exit room and return to Home"
            style={{
              position: 'absolute',
              top: 20, right: 18,
              background: 'transparent',
              border: `1px solid ${c.border}`,
              borderRadius: 3,
              color: c.silver,
              fontFamily: "'Cinzel', serif",
              fontSize: '0.65rem',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              padding: '7px 14px',
              cursor: 'pointer',
              transition: 'all 0.18s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = c.gold; e.currentTarget.style.color = c.gold }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = c.border; e.currentTarget.style.color = c.silver }}
          >
            ✕ Exit Room
          </button>
        )}
        <div style={{ fontSize: 44, animation: 'crownFloat 3s ease-in-out infinite' }}>♛</div>
        <div style={{
          fontFamily: "'Cinzel', serif",
          fontSize: 'clamp(2.2rem, 8vw, 3.6rem)',
          fontWeight: 900,
          letterSpacing: '0.18em',
          lineHeight: 1,
          background: `linear-gradient(135deg, ${c.goldDim}, ${c.gold}, ${c.goldBrt}, ${c.gold}, ${c.goldDim})`,
          backgroundSize: '200% auto',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          animation: 'shimmer 4s linear infinite',
        }}>EMPIRE</div>
        <div style={{ fontFamily: "'Crimson Pro', serif", fontStyle: 'italic', color: c.silver, fontSize: '0.95rem', marginTop: 6 }}>
          A Game of Nicknames &amp; Conquest
        </div>
      </div>

      <div style={{ maxWidth: 520, margin: '0 auto', padding: '0 18px' }}>

        {/* ── HOME ─────────────────────────────────────────────────────── */}
        {screen === 'home' && (
          <>
            <Divider label="Choose Your Path" />
            <Card>
              <CardTitle>♛ Create a Room</CardTitle>
              <p style={{ color: c.silver, fontSize: '0.95rem', marginBottom: 16, lineHeight: 1.6 }}>
                You'll be the Gamemaster. A room code will be generated to share with your players.
              </p>
              <Input
                value={inputCreateName} onChange={setInputCreateName}
                placeholder="Your name…"
                onKeyDown={e => e.key === 'Enter' && createRoom()}
              />
              {error && <div style={{ color: '#ff8888', fontSize: '0.85rem', marginTop: 6 }}>{error}</div>}
              <div style={{ marginTop: 14 }}>
                <Btn onClick={createRoom} disabled={loading} fullWidth>
                  {loading ? <><Spinner />Creating…</> : 'Create Room'}
                </Btn>
              </div>
            </Card>

            <Card>
              <CardTitle>⚔ Join a Room</CardTitle>
              <p style={{ color: c.silver, fontSize: '0.95rem', marginBottom: 16, lineHeight: 1.6 }}>
                Enter the code your Gamemaster shared.
              </p>
              <div style={{ marginBottom: 10 }}>
                <Input value={inputJoinName} onChange={setInputJoinName} placeholder="Your name…" />
              </div>
              <Input
                value={inputCode}
                onChange={v => setInputCode(v.toUpperCase())}
                placeholder="Room code (e.g. XK4TZ)…"
                maxLength={5}
                onKeyDown={e => e.key === 'Enter' && joinRoom()}
              />
              {error && <div style={{ color: '#ff8888', fontSize: '0.85rem', marginTop: 6 }}>{error}</div>}
              <div style={{ marginTop: 14 }}>
                <Btn onClick={joinRoom} disabled={loading} variant="ghost" fullWidth>
                  {loading ? <><Spinner />Joining…</> : 'Join Room'}
                </Btn>
              </div>
            </Card>

            <div style={{ textAlign: 'center', marginTop: 4 }}>
              <button
                onClick={() => setScreen('rules')}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: c.silver, fontFamily: "'Cinzel', serif",
                  fontSize: '0.7rem', letterSpacing: '0.14em',
                  textTransform: 'uppercase', textDecoration: 'underline',
                  textDecorationColor: c.goldDim, padding: '6px 0',
                }}
              >
                How to Play
              </button>
            </div>
          </>
        )}

        {/* ── RULES ────────────────────────────────────────────────────── */}
        {screen === 'rules' && (
          <>
            <Divider label="How to Play" />
            <Card>
              <CardTitle>📜 The Rules</CardTitle>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {[
                  { n: '1', text: 'One player creates a room and becomes the Gamemaster (GM). The GM shares the room code with everyone else.' },
                  { n: '2', text: 'All other players join using the room code and enter their real name.' },
                  { n: '3', text: 'Once everyone has joined, the GM starts the game. Each player secretly submits a nickname for themselves.' },
                  { n: '4', text: 'Only the GM can see which real name belongs to which nickname. Players must figure out who is who.' },
                  { n: '5', text: 'Players are eliminated as the game progresses. The GM marks eliminations on their screen and all players see who is still in.' },
                ].map(({ n, text }) => (
                  <div key={n} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                    <div style={{
                      flexShrink: 0,
                      width: 26, height: 26,
                      borderRadius: '50%',
                      border: `1px solid ${c.goldDim}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: "'Cinzel', serif",
                      fontSize: '0.7rem',
                      color: c.gold,
                    }}>{n}</div>
                    <p style={{ color: c.cream, fontSize: '0.97rem', lineHeight: 1.65, margin: 0 }}>{text}</p>
                  </div>
                ))}
              </div>
            </Card>
          </>
        )}

        {/* ── LOBBY ────────────────────────────────────────────────────── */}
        {screen === 'lobby' && room && (
          <>
            <Divider label="The Court Assembles" />
            <Card>
              <CardTitle>Room Code</CardTitle>
              <div style={{
                fontFamily: "'Cinzel', serif",
                fontSize: 'clamp(2.4rem, 10vw, 3.4rem)',
                letterSpacing: '0.35em',
                textAlign: 'center',
                padding: '14px 0',
                background: `linear-gradient(135deg, ${c.goldDim}, ${c.gold}, ${c.goldBrt}, ${c.gold}, ${c.goldDim})`,
                backgroundSize: '200% auto',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                animation: 'shimmer 3s linear infinite',
              }}>{room.code}</div>
              <p style={{ color: c.silver, fontSize: '0.88rem', textAlign: 'center', fontStyle: 'italic' }}>
                Everyone opens this same page and taps "Join a Room"
              </p>
            </Card>

            <Card>
              <CardTitle>⚜ Players in the Court ({room.players?.length ?? 0})</CardTitle>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {(room.players || []).map(p => (
                  <div key={p.name} style={{
                    background: 'rgba(201,168,76,0.08)',
                    border: `1px solid ${c.border}`,
                    borderRadius: 3,
                    padding: '5px 13px',
                    fontSize: '0.92rem',
                    color: p.isGM ? c.gold : c.cream,
                    display: 'flex', alignItems: 'center', gap: 7,
                  }}>
                    {p.isGM ? '♛ ' : ''}{p.name}
                    {p.name === myName && <span style={{ color: c.silver, fontSize: '0.75rem' }}>(you)</span>}
                  </div>
                ))}
              </div>
              {!isGM && (
                <p style={{ color: c.silver, fontSize: '0.88rem', marginTop: 14, fontStyle: 'italic' }}>
                  Waiting for the Gamemaster to begin…
                </p>
              )}
            </Card>

            {isGM && (
              <>
                {error && <div style={{ color: '#ff8888', fontSize: '0.85rem', marginBottom: 10 }}>{error}</div>}
                <Btn onClick={startNicknamePhase} fullWidth>
                  Begin — Collect Nicknames ♛
                </Btn>
              </>
            )}
          </>
        )}

        {/* ── NICKNAME ENTRY ───────────────────────────────────────────── */}
        {screen === 'nickname' && room && (
          <>
            <Divider label="Your Secret Nickname" />
            <Card>
              <CardTitle>🖊 Submit in Secret</CardTitle>
              <p style={{ color: c.silver, fontSize: '0.95rem', marginBottom: 18, lineHeight: 1.65 }}>
                Choose a nickname that represents you. Only the Gamemaster will see who submitted what.
              </p>
              <Input
                value={inputNick}
                onChange={setInputNick}
                placeholder="e.g. The Shadow, Captain Chaos…"
                autoFocus
                onKeyDown={e => e.key === 'Enter' && submitNickname()}
              />
              {error && <div style={{ color: '#ff8888', fontSize: '0.85rem', marginTop: 6 }}>{error}</div>}
              <div style={{ marginTop: 16 }}>
                <Btn onClick={submitNickname} fullWidth>Submit Nickname</Btn>
              </div>
            </Card>
          </>
        )}

        {/* ── WAITING (nickname phase only) ────────────────────────────── */}
        {screen === 'waiting' && room && (
          <>
            <Divider label="Awaiting the Court" />
            <Card style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>⏳</div>
              <div style={{ fontFamily: "'Cinzel', serif", color: c.gold, fontSize: '1.1rem', marginBottom: 8 }}>
                Nickname submitted!
              </div>
              <p style={{ color: c.silver, fontSize: '0.95rem', lineHeight: 1.6 }}>
                Waiting for everyone else…
              </p>
              <div style={{ marginTop: 18, display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                {nonGMPlayers.map(p => {
                  const done = !!room.nicknames?.[p.name]
                  return (
                    <div key={p.name} style={{
                      padding: '5px 13px', borderRadius: 3,
                      border: `1px solid ${done ? c.greenBrd : c.border}`,
                      background: done ? c.green : 'transparent',
                      fontSize: '0.88rem',
                      color: done ? '#90ee90' : c.silver,
                    }}>
                      {done ? '✓' : '○'} {p.name}
                    </div>
                  )
                })}
              </div>
            </Card>
          </>
        )}

        {/* ── GM SCREEN (nickname collection phase) ────────────────────── */}
        {screen === 'gm' && room && (
          <>
            <Divider label="Collecting Nicknames" />
            <Card style={{ padding: '16px 20px' }}>
              <CardTitle>📜 Players & Nicknames — only you see this</CardTitle>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {nonGMPlayers.map(p => {
                  const nick = room.nicknames?.[p.name]
                  return (
                    <div key={p.name} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '10px 14px',
                      background: nick ? 'rgba(80,200,100,0.07)' : 'rgba(0,0,0,0.25)',
                      borderRadius: 4,
                      border: `1px solid ${nick ? c.greenBrd : c.border}`,
                      transition: 'all 0.25s',
                    }}>
                      <span style={{ color: c.cream, fontSize: '1rem' }}>{p.name}</span>
                      <span style={{
                        color: nick ? '#90ee90' : c.silver,
                        fontStyle: 'italic',
                        fontSize: '0.95rem',
                        opacity: nick ? 1 : 0.4,
                      }}>
                        {nick || '…'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </Card>
            {allSubmitted
              ? <Btn onClick={startGame} fullWidth>Everyone's in — Start Game ⚔</Btn>
              : <p style={{ color: c.silver, fontStyle: 'italic', fontSize: '0.9rem', textAlign: 'center', marginTop: 8 }}>
                  Waiting for everyone to submit their nickname…
                </p>
            }
          </>
        )}

        {/* ── GAME SCREEN (all players see this) ───────────────────────── */}
        {screen === 'game' && room && (
          <>
            <Divider label="The Empire" />
            <Card style={{ padding: '16px 20px' }}>
              <CardTitle>⚔ Players — tap to eliminate</CardTitle>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {nonGMPlayers.map(p => {
                  const isOut = !!room.eliminated?.[p.name]
                  return (
                    <div
                      key={p.name}
                      onClick={() => toggleEliminated(p.name)}
                      style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '11px 14px',
                        background: isOut ? 'rgba(0,0,0,0.12)' : 'rgba(0,0,0,0.28)',
                        borderRadius: 4,
                        border: `1px solid ${isOut ? 'rgba(201,168,76,0.07)' : c.border}`,
                        cursor: 'pointer',
                        opacity: isOut ? 0.32 : 1,
                        transition: 'opacity 0.2s',
                        userSelect: 'none',
                      }}
                    >
                      <span style={{
                        color: c.cream,
                        fontSize: '1rem',
                        textDecoration: isOut ? 'line-through' : 'none',
                      }}>{p.name}</span>
                      <span style={{
                        color: c.silver,
                        fontStyle: 'italic',
                        fontSize: '0.95rem',
                        textDecoration: isOut ? 'line-through' : 'none',
                      }}>{room.gm === myName ? room.nicknames?.[p.name] : null}</span>
                    </div>
                  )
                })}
              </div>
            </Card>
            {room.gm === myName && (
              <Btn onClick={endGame} variant="ghost" fullWidth>New Game</Btn>
            )}
          </>
        )}

      </div>
    </div>
  )
}
