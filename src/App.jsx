import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Play, Pause, Volume2, Search, CheckCircle2, XCircle, Trophy, ExternalLink, Loader2 } from 'lucide-react';
import { searchTracks } from './services/spotify';

const DURATIONS = [0.5, 1.5, 3.0, 5.0, 8.0, 12.0];
const MAX_ATTEMPTS = 6;

export default function App() {
  const [targetSong, setTargetSong] = useState(null);
  const [currentAttempt, setCurrentAttempt] = useState(0);
  const [guesses, setGuesses] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameState, setGameState] = useState('PLAYING');
  const [currentTime, setCurrentTime] = useState(0);

  const audioRef = useRef(null);

  useEffect(() => {
    async function loadDailySong() {
      try {
        const tracks = await searchTracks('Reggae');
        if (tracks.length > 0) {
          setTargetSong(tracks[0]);
        }
      } catch (err) {
        console.error('Erro ao carregar música do Spotify:', err);
      }
    }
    loadDailySong();
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim().length > 1) {
        setIsSearching(true);
        const results = await searchTracks(searchQuery);
        setSearchResults(results);
        setIsSearching(false);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handlePlay = () => {
    if (!audioRef.current || !targetSong) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    const maxAllowedTime = gameState === 'PLAYING' ? DURATIONS[currentAttempt] : audioRef.current.duration;
    audioRef.current.currentTime = 0;
    audioRef.current.play();
    setIsPlaying(true);

    const interval = setInterval(() => {
      if (audioRef.current.currentTime >= maxAllowedTime) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setIsPlaying(false);
        clearInterval(interval);
      } else {
        setCurrentTime(audioRef.current.currentTime);
      }
    }, 50);
  };

  const handleGuess = (song) => {
    if (gameState !== 'PLAYING') return;

    const isCorrect = song.id === targetSong.id;
    const newGuesses = [...guesses, { song, isCorrect, skipped: false }];
    setGuesses(newGuesses);
    setSearchQuery('');
    setSearchResults([]);

    if (isCorrect) {
      setGameState('WON');
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    } else if (newGuesses.length >= MAX_ATTEMPTS) {
      setGameState('LOST');
    } else {
      setCurrentAttempt((prev) => prev + 1);
    }
  };

  const handleSkip = () => {
    if (gameState !== 'PLAYING') return;

    const newGuesses = [...guesses, { song: null, isCorrect: false, skipped: true }];
    setGuesses(newGuesses);

    if (newGuesses.length >= MAX_ATTEMPTS) {
      setGameState('LOST');
    } else {
      setCurrentAttempt((prev) => prev + 1);
    }
  };

  if (!targetSong) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400 mb-2" />
        <p className="text-sm">Conectando ao Spotify...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-between p-4 max-w-md mx-auto font-sans">
      <audio ref={audioRef} src={targetSong.audioUrl} />

      <header className="w-full border-b border-slate-800 pb-4 text-center">
        <h1 className="text-3xl font-black tracking-wider text-emerald-400">LESSSONG</h1>
        <p className="text-xs text-slate-400 mt-1">Powered by Spotify API</p>
      </header>

      <main className="w-full my-auto space-y-4">
        <div className="space-y-2">
          {Array.from({ length: MAX_ATTEMPTS }).map((_, idx) => {
            const guess = guesses[idx];
            return (
              <div
                key={idx}
                className={`h-12 rounded-lg border px-3 flex items-center justify-between text-sm transition-all ${
                  guess
                    ? guess.isCorrect
                      ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200'
                      : 'bg-red-950/40 border-red-800/60 text-red-200'
                    : idx === currentAttempt && gameState === 'PLAYING'
                    ? 'border-emerald-500/50 bg-slate-900'
                    : 'border-slate-800 bg-slate-900/40 text-slate-600'
                }`}
              >
                {guess ? (
                  guess.skipped ? (
                    <span className="italic text-slate-500">Pulado</span>
                  ) : (
                    <span className="font-medium truncate">
                      {guess.song.artist} - {guess.song.title}
                    </span>
                  )
                ) : (
                  <span className="text-xs text-slate-600">
                    Tentativa {idx + 1} ({DURATIONS[idx]}s)
                  </span>
                )}

                {guess &&
                  (guess.isCorrect ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-400 shrink-0" />
                  ))}
              </div>
            );
          })}
        </div>

        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-3">
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-400 h-full transition-all duration-75"
              style={{
                width: `${Math.min(
                  (currentTime /
                    (gameState === 'PLAYING' ? DURATIONS[currentAttempt] : audioRef.current?.duration || 1)) *
                    100,
                  100
                )}%`,
              }}
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400">
              {currentTime.toFixed(1)}s / {gameState === 'PLAYING' ? `${DURATIONS[currentAttempt]}s` : '30s'}
            </span>
            <button
              onClick={handlePlay}
              className="p-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-full transition transform active:scale-95 shadow-lg shadow-emerald-500/20"
            >
              {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-0.5" />}
            </button>
            <Volume2 className="w-5 h-5 text-slate-500" />
          </div>
        </div>

        {gameState === 'PLAYING' && (
          <div className="relative space-y-2">
            <div className="relative">
              {isSearching ? (
                <Loader2 className="w-5 h-5 absolute left-3 top-3.5 text-slate-400 animate-spin" />
              ) : (
                <Search className="w-5 h-5 absolute left-3 top-3.5 text-slate-400" />
              )}
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Busque música ou artista no Spotify..."
                className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-emerald-500 text-slate-100 placeholder-slate-500"
              />
            </div>

            {searchResults.length > 0 && (
              <div className="absolute z-10 w-full bg-slate-900 border border-slate-800 rounded-lg max-h-52 overflow-y-auto shadow-2xl divide-y divide-slate-800/50">
                {searchResults.map((song) => (
                  <button
                    key={song.id}
                    onClick={() => handleGuess(song)}
                    className="w-full px-3 py-2 text-left hover:bg-slate-800 transition text-sm flex items-center gap-3"
                  >
                    <img src={song.coverUrl} alt="" className="w-8 h-8 rounded object-cover shrink-0" />
                    <div className="truncate">
                      <p className="font-medium text-slate-200 truncate">{song.title}</p>
                      <p className="text-xs text-slate-400 truncate">{song.artist}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={handleSkip}
              className="w-full py-2.5 bg-slate-800/60 hover:bg-slate-800 text-slate-300 rounded-lg text-sm font-medium transition"
            >
              Pular (+{DURATIONS[currentAttempt + 1] ? DURATIONS[currentAttempt + 1] - DURATIONS[currentAttempt] : 0}s)
            </button>
          </div>
        )}

        {gameState !== 'PLAYING' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center space-y-3">
            <div className="flex items-center justify-center gap-2">
              {gameState === 'WON' ? (
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <Trophy className="w-5 h-5" /> Você acertou!
                </span>
              ) : (
                <span className="text-red-400 font-bold">Fim de jogo! A música era:</span>
              )}
            </div>

            <div className="flex items-center gap-3 bg-slate-950 p-3 rounded-lg border border-slate-800 text-left">
              <img src={targetSong.coverUrl} alt={targetSong.title} className="w-16 h-16 rounded-md object-cover" />
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-slate-100 truncate">{targetSong.title}</h3>
                <p className="text-sm text-slate-400 truncate">{targetSong.artist}</p>
                <a
                  href={targetSong.externalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:underline mt-1"
                >
                  Ouvir no Spotify <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="w-full text-center text-xs text-slate-600 border-t border-slate-900 pt-3">
        Vibe Coded Project • Spotify Web API Integration
      </footer>
    </div>
  );
}
