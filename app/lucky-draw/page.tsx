'use client';

import Sidebar from '@/components/Sidebar';
import { loadLuckyDrawWinners, loadLuckyDrawPool, drawLuckyWinner } from '@/lib/storage';
import { useState, useEffect } from 'react';
import { LuckyDrawWinner } from '@/lib/types';
import { Gift, Sparkles, Trophy, RotateCcw } from 'lucide-react';

export default function LuckyDrawPage() {
  const [winners, setWinners] = useState<LuckyDrawWinner[]>([]);
  const [lastWinner, setLastWinner] = useState<LuckyDrawWinner | null>(null);
  const [poolSize, setPoolSize] = useState(0);
  const [isDrawing, setIsDrawing] = useState(false);
  const [allPlayers, setAllPlayers] = useState<string[]>([]);
  const [shuffledPlayers, setShuffledPlayers] = useState<string[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isShuffling, setIsShuffling] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const loadedWinners = await loadLuckyDrawWinners();
      const loadedPoolSize = await loadLuckyDrawPool();
      const { loadPlayers } = await import('@/lib/storage');
      const players = await loadPlayers();
      
      setWinners(loadedWinners);
      setPoolSize(loadedPoolSize.length);
      setAllPlayers(players.map((p: any) => p.name));
      setShuffledPlayers(players.map((p: any) => p.name));
    };
    loadData();
  }, []);

  const handleShuffle = () => {
    if (isShuffling) return;
    setIsShuffling(true);
    
    // Animate shuffle by rapidly changing the order
    let iterations = 0;
    const maxIterations = 15;
    
    const shuffle = setInterval(() => {
      const shuffled = [...shuffledPlayers].sort(() => Math.random() - 0.5);
      setShuffledPlayers(shuffled);
      iterations++;
      
      if (iterations >= maxIterations) {
        clearInterval(shuffle);
        setIsShuffling(false);
      }
    }, 100);
  };

  const handleDrawWinner = async () => {
    if (isDrawing || isShuffling) return;
    setIsDrawing(true);
    
    // Get the pool of eligible players (those who haven't won)
    const { loadPlayers } = await import('@/lib/storage');
    const players = await loadPlayers();
    const winnerIds = new Set(winners.map(w => w.id));
    const eligiblePlayers = players.filter((p: any) => !winnerIds.has(p.id));
    
    if (eligiblePlayers.length === 0) {
      alert('No eligible players in the pool!');
      setIsDrawing(false);
      return;
    }
    
    // Pre-determine the winner BEFORE animation starts
    const selectedWinner = eligiblePlayers[Math.floor(Math.random() * eligiblePlayers.length)];
    const selectedWinnerIndex = shuffledPlayers.indexOf(selectedWinner.name);
    
    if (selectedWinnerIndex === -1) {
      // Winner not in current shuffle, reshuffle to include them
      const newShuffled = [...allPlayers].sort(() => Math.random() - 0.5);
      setShuffledPlayers(newShuffled);
      const newIndex = newShuffled.indexOf(selectedWinner.name);
      
      // Roulette animation - highlight players sequentially, designed to land on selected winner
      let currentIndex = 0;
      const totalDuration = 3500; // 3.5 seconds
      const intervalTime = 100;
      const totalIterations = totalDuration / intervalTime;
      let iterations = 0;

      const animate = setInterval(() => {
        setHighlightedIndex(currentIndex);
        currentIndex = (currentIndex + 1) % newShuffled.length;
        iterations++;

        if (iterations >= totalIterations) {
          clearInterval(animate);
          // Ensure we land exactly on the pre-selected winner
          setHighlightedIndex(newIndex);
          
          // Record the actual winner in database
          setTimeout(async () => {
            const winner = await drawLuckyWinner();
            setLastWinner(winner);
            const loadedWinners = await loadLuckyDrawWinners();
            const loadedPoolSize = await loadLuckyDrawPool();
            setWinners(loadedWinners);
            setPoolSize(loadedPoolSize.length);
            setHighlightedIndex(-1);
            setIsDrawing(false);
          }, 500);
        }
      }, intervalTime);
    } else {
      // Roulette animation - highlight players sequentially, designed to land on selected winner
      let currentIndex = 0;
      const totalDuration = 3500; // 3.5 seconds
      const intervalTime = 100;
      const totalIterations = totalDuration / intervalTime;
      let iterations = 0;

      const animate = setInterval(() => {
        setHighlightedIndex(currentIndex);
        currentIndex = (currentIndex + 1) % shuffledPlayers.length;
        iterations++;

        if (iterations >= totalIterations) {
          clearInterval(animate);
          // Ensure we land exactly on the pre-selected winner
          setHighlightedIndex(selectedWinnerIndex);
          
          // Record the actual winner in database
          setTimeout(async () => {
            const winner = await drawLuckyWinner();
            setLastWinner(winner);
            const loadedWinners = await loadLuckyDrawWinners();
            const loadedPoolSize = await loadLuckyDrawPool();
            setWinners(loadedWinners);
            setPoolSize(loadedPoolSize.length);
            setHighlightedIndex(-1);
            setIsDrawing(false);
          }, 500);
        }
      }, intervalTime);
    }
  };

  const getPlantBadge = (plant: string) => {
    switch (plant) {
      case 'SR': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'BP': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'GW': return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  };

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-8 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900">Lucky Draw</h1>
            <p className="text-gray-600 mt-2">Raffle for tournament prizes - Each player can win only once!</p>
          </div>

          {/* Player Pool */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Player Pool</h2>
              <button
                onClick={handleShuffle}
                disabled={isShuffling || isDrawing}
                className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RotateCcw className={`w-4 h-4 ${isShuffling ? 'animate-spin' : ''}`} />
                Shuffle Players
              </button>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
              {shuffledPlayers.map((player, index) => {
                const hasWon = winners.some(w => w.playerName === player);
                return (
                  <div
                    key={player}
                    className={`text-center px-2 py-2 rounded border-2 text-sm font-medium transition-all ${
                      highlightedIndex === index
                        ? 'border-gray-900 bg-gray-900 text-white scale-110'
                        : hasWon
                        ? 'border-gray-200 bg-gray-100 text-gray-400 line-through'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    {player}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pool Status */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  {poolSize} player{poolSize !== 1 ? 's' : ''} eligible to win
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Total Winners</p>
                <p className="text-2xl font-bold text-gray-900">{winners.length}</p>
              </div>
            </div>
          </div>

          {/* Draw Button */}
          <div className="bg-gray-900 rounded-xl border border-gray-200 p-8 mb-8 text-center">
            {poolSize > 0 ? (
              <>
                <button
                  onClick={handleDrawWinner}
                  disabled={isDrawing}
                  className="inline-flex items-center gap-3 px-8 py-4 bg-white text-gray-900 rounded-xl hover:bg-gray-100 transition-colors font-bold text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDrawing ? (
                    <>
                      <RotateCcw className="w-6 h-6 animate-spin" />
                      Drawing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-6 h-6" />
                      Draw Winner
                    </>
                  )}
                </button>
                <p className="text-gray-300 mt-4 text-sm">
                  Click to randomly select a winner from the remaining pool
                </p>
              </>
            ) : (
              <div className="text-white">
                <Gift className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-xl font-semibold">All players have been drawn!</p>
                <p className="text-gray-300 mt-2">The raffle is complete.</p>
              </div>
            )}
          </div>

          {/* Latest Winner Display */}
          {lastWinner && (
            <div className="bg-white rounded-xl border border-gray-200 p-8 mb-8 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-4">
                <Trophy className="w-10 h-10 text-gray-600" />
              </div>
              <h2 className="text-3xl font-bold mb-2 text-gray-900">🎉 Latest Winner</h2>
              <p className="text-4xl font-bold mt-4 text-gray-900">{lastWinner.playerName}</p>
              <div className="flex items-center justify-center gap-3 mt-3">
                <span className={`px-4 py-2 rounded-full text-sm font-bold ${getPlantBadge(lastWinner.plant)}`}>
                  {lastWinner.plant}
                </span>
              </div>
              <p className="text-gray-500 mt-4 text-sm">
                {new Date(lastWinner.timestamp).toLocaleString()}
              </p>
            </div>
          )}

          {/* Winners List */}
          {winners.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="bg-gray-900 text-white px-6 py-4">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Trophy className="w-6 h-6" />
                  Lucky Draw Winners
                </h3>
                <p className="text-gray-300 text-sm mt-1">
                  {winners.length} winner{winners.length !== 1 ? 's' : ''} drawn so far
                </p>
              </div>
              <div className="divide-y divide-gray-200">
                {winners.slice().reverse().map((winner, index) => (
                  <div key={winner.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-900 font-bold text-lg">
                          {winners.length - index}
                        </div>
                        <div>
                          <p className="text-xl font-bold text-gray-900">{winner.playerName}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPlantBadge(winner.plant)}`}>
                              {winner.plant}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">
                          {new Date(winner.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {winners.length === 0 && !lastWinner && (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <Gift className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No winners yet. Draw your first winner above!</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
