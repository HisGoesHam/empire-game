import { useState, useEffect, useRef } from 'react'
import { ref, set, onValue, off } from 'firebase/database'
import { db } from './firebase.js'

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
    showList: false,
  }
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [screen,     setScreen]     = useState('home')
  const [room,       setRoom]       = useState(null)
  const [myName, setMyName] = useState(() => localStorage.getItem('empire_name') || '')
  const [isGM,   setIsGM]   = useState(() => localStorage.getItem('empire_isGM') === 'true')
  const [inputName,  setInputName]  = useState('')
  const [inputCode,  setInputCode]  = useState('')
  const [inputNick,  setInputNick]  = useState('')
  const [error,      setError]      = useState('')
  const [loading,    setLoading]    = useState(false)
  const unsubRef = useRef(null)

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
  useEffect(() => {
  const savedCode = localStorage.getItem('empire_code')
  const savedName = localStorage.getItem('empire_name')
  if (savedCode && savedName) subscribeToRoom(savedCode)
}, [])


  // ── Derive screen from room state ──────────────────────────────────────────
  useEffect(() => {
    if (!room || !myName) return
    if (room.phase === 'lobby')     { setScreen('lobby');    return }
    if (room.phase === 'nicknames') {
      setScreen(room.nicknames?.[myName] ? 'waiting' : 'nickname')
      return
    }
    if (room.phase === 'reading' || room.phase === 'game') {
      setScreen(room.gm === myName ? 'gm' : 'waiting')
    }
  }, [room, myName, isGM])

  // ── Actions ────────────────────────────────────────────────────────────────
  async function createRoom() {
    const name = inputName.trim()
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
    subscribeToRoom(code)
    setLoading(false)
  }

  async function joinRoom() {
    const name = inputName.trim()
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
    await saveRoom(room.code, { ...room, phase: 'reading', showList: true })
  }

  async function toggleList() {
    await saveRoom(room.code, { ...room, showList: !room.showList })
  }

  async function startGame() {
    await saveRoom(room.code, { ...room, phase: 'game', showList: false })
  }

  async function endGame() {
    const fresh = makeRoom(room.code, room.gm)
    fresh.players = room.players
    await saveRoom(room.code, fresh)
  }

  const allSubmitted = room?.players?.length > 0 &&
    room.players.every(p => room.nicknames?.[p.name])

  // ── Nickname list (shuffled deterministically by room code) ───────────────
  function getSortedNicknames() {
    const nicks = Object.values(room?.nicknames || {})
    return [...nicks].sort((a, b) => {
      const h = s => [...(room.code + s)].reduce((n, ch) => n + ch.charCodeAt(0), 0)
      return h(a) - h(b)
    })
  }

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
      <div style={{ textAlign: 'center', padding: '40px 20px 10px' }}>
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
                value={inputName} onChange={setInputName}
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
                <Input value={inputName} onChange={setInputName} placeholder="Your name…" />
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

        {/* ── WAITING ──────────────────────────────────────────────────── */}
        {screen === 'waiting' && room && (
          <>
            <Divider label="Awaiting the Court" />
            <Card style={{ textAlign: 'center' }}>
              {room.phase === 'nicknames' && (
                <>
                  <div style={{ fontSize: 36, marginBottom: 12 }}>⏳</div>
                  <div style={{ fontFamily: "'Cinzel', serif", color: c.gold, fontSize: '1.1rem', marginBottom: 8 }}>
                    Nickname submitted!
                  </div>
                  <p style={{ color: c.silver, fontSize: '0.95rem', lineHeight: 1.6 }}>
                    Waiting for everyone else…
                  </p>
                  <div style={{ marginTop: 18, display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                    {(room.players || []).map(p => {
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
                </>
              )}
              {(room.phase === 'reading' || room.phase === 'game') && (
                <>
                  <div style={{ fontSize: 36, marginBottom: 12, animation: 'crownFloat 2.5s ease-in-out infinite' }}>♛</div>
                  <div style={{ fontFamily: "'Cinzel', serif", color: c.gold, fontSize: '1.05rem', marginBottom: 8 }}>
                    {room.phase === 'reading' ? 'The Gamemaster is reading the nicknames aloud…' : 'The game is underway!'}
                  </div>
                  <p style={{ color: c.silver, fontSize: '0.95rem', fontStyle: 'italic' }}>
                    Listen carefully — the rest is played in person!
                  </p>
                </>
              )}
            </Card>
          </>
        )}

        {/* ── GM SCREEN ────────────────────────────────────────────────── */}
        {screen === 'gm' && room && (
          <>
            <Divider label={room.phase === 'reading' ? "Gamemaster's Scroll" : 'The Game'} />

            {/* Nickname list toggle */}
            <Card>
              <CardTitle>📜 Nickname List</CardTitle>
              <p style={{ color: c.silver, fontSize: '0.92rem', marginBottom: 18, lineHeight: 1.6 }}>
                {room.phase === 'reading'
                  ? 'Reveal to read aloud. Hide before passing the device back.'
                  : 'Reveal if the group votes for a re-read.'}
              </p>
              <Btn onClick={toggleList} fullWidth variant={room.showList ? 'crimson' : 'gold'}>
                {room.showList ? '🙈  Hide the List' : '📜  Reveal the List'}
              </Btn>

              {room.showList && (
                <div style={{
                  marginTop: 18,
                  background: 'rgba(0,0,0,0.35)',
                  border: `1px solid ${c.border}`,
                  borderRadius: 4,
                  padding: 16,
                  animation: 'fadeUp 0.3s ease',
                }}>
                  {getSortedNicknames().map((n, i, arr) => (
                    <div key={n} style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '9px 0',
                      borderBottom: i < arr.length - 1 ? '1px solid rgba(201,168,76,0.1)' : 'none',
                      fontSize: '1.05rem',
                      color: c.cream,
                    }}>
                      <span style={{ fontFamily: "'Cinzel', serif", fontSize: '0.7rem', color: c.goldDim, minWidth: 22 }}>
                        {i + 1}.
                      </span>
                      {n}
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Private name → nickname reference */}
            <Card>
              <CardTitle>🔒 Secret Reference — Only You See This</CardTitle>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(room.players || []).map(p => (
                  <div key={p.name} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '8px 12px',
                    background: 'rgba(0,0,0,0.25)',
                    borderRadius: 3,
                    border: `1px solid ${c.border}`,
                  }}>
                    <span style={{ color: p.isGM ? c.gold : c.cream, fontSize: '0.95rem' }}>
                      {p.isGM ? '♛ ' : ''}{p.name}
                    </span>
                    <span style={{ color: c.silver, fontStyle: 'italic', fontSize: '0.92rem' }}>
                      {room.nicknames?.[p.name] ?? <span style={{ opacity: 0.35 }}>pending…</span>}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            <div style={{ display: 'flex', gap: 10 }}>
              {room.phase === 'reading' && allSubmitted && (
                <Btn onClick={startGame} style={{ flex: 1 }}>
                  Nicknames Read — Start Game ⚔
                </Btn>
              )}
              {room.phase === 'reading' && !allSubmitted && (
                <p style={{ color: c.silver, fontStyle: 'italic', fontSize: '0.9rem' }}>
                  Waiting for all nicknames before you can start…
                </p>
              )}
              {room.phase === 'game' && (
                <Btn onClick={endGame} variant="ghost" style={{ flex: 1 }}>
                  End Game / Play Again
                </Btn>
              )}
            </div>
          </>
        )}

      </div>
    </div>
  )
}
