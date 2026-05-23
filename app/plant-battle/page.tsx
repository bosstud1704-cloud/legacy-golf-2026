'use client';

import Sidebar from '@/components/Sidebar';
import { loadPlantBattleResults, loadPlantScores, drawPlantBattlePlayers, getHoleParValues } from '@/lib/storage';
import { useState, useEffect } from 'react';
import { PlantBattleResult, Plant } from '@/lib/types';
import { Swords, Trophy, RefreshCw } from 'lucide-react';

export default function PlantBattlePage() {
  const [selectedHole, setSelectedHole] = useState(1);
  const [lastResult, setLastResult] = useState<PlantBattleResult | null>(null);
  const [plantScores, setPlantScores] = useState({ SR: 0, BP: 0, GW: 0 });
  const [history, setHistory] = useState<PlantBattleResult[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [animatingSR, setAnimatingSR] = useState('');
  const [animatingBP, setAnimatingBP] = useState('');
  const [animatingGW, setAnimatingGW] = useState('');
  const [holePars, setHolePars] = useState<number[]>([]);
  const [drawnPlayers, setDrawnPlayers] = useState<{ SR: string | null; BP: string | null; GW: string | null }>({ SR: null, BP: null, GW: null });
  const [revealedScores, setRevealedScores] = useState<{ SR: boolean; BP: boolean; GW: boolean }>({ SR: false, BP: false, GW: false });
  const [animatingPlant, setAnimatingPlant] = useState<Plant | null>(null);
  const [allPlayers, setAllPlayers] = useState<{ SR: string[]; BP: string[]; GW: string[] }>({ SR: [], BP: [], GW: [] });
  const [highlightedPlayer, setHighlightedPlayer] = useState<{ plant: Plant | null; index: number }>({ plant: null, index: -1 });

  useEffect(() => {
    const loadData = async () => {
      const loadedScores = await loadPlantScores();
      const loadedHistory = await loadPlantBattleResults();
      const loadedPars = await getHoleParValues();
      const { loadPlayers } = await import('@/lib/storage');
      const players = await loadPlayers();
      
      setPlantScores(loadedScores);
      setHistory(loadedHistory);
      setHolePars(loadedPars);
      
      // Group players by plant
      const grouped = { SR: [], BP: [], GW: [] } as { SR: string[]; BP: string[]; GW: string[] };
      players.forEach((p: any) => {
        if (p.plant === 'SR') grouped.SR.push(p.name);
        if (p.plant === 'BP') grouped.BP.push(p.name);
        if (p.plant === 'GW') grouped.GW.push(p.name);
      });
      setAllPlayers(grouped);
    };
    loadData();
  }, []);

  const handleDrawPlayer = async (plant: Plant) => {
    if (isDrawing || animatingPlant) return;
    
    const plantPlayers = allPlayers[plant];

    if (plantPlayers.length === 0) {
      alert(`Need at least one player from ${plant}!`);
      return;
    }

    // Pre-determine the winner BEFORE animation starts
    const selectedPlayerIndex = Math.floor(Math.random() * plantPlayers.length);
    const selectedPlayer = plantPlayers[selectedPlayerIndex];

    setAnimatingPlant(plant);
    setIsDrawing(true);

    // Roulette animation - highlight players sequentially, designed to land on the selected player
    let currentIndex = 0;
    const totalDuration = 3500; // 3.5 seconds
    const intervalTime = 100;
    const totalIterations = totalDuration / intervalTime;
    let iterations = 0;

    const animate = setInterval(() => {
      setHighlightedPlayer({ plant, index: currentIndex });
      currentIndex = (currentIndex + 1) % plantPlayers.length;
      iterations++;

      if (iterations >= totalIterations) {
        clearInterval(animate);
        // Ensure we land exactly on the pre-selected player
        setHighlightedPlayer({ plant, index: selectedPlayerIndex });
        
        switch (plant) {
          case 'SR':
            setDrawnPlayers(prev => ({ ...prev, SR: selectedPlayer }));
            setAnimatingSR(selectedPlayer);
            break;
          case 'BP':
            setDrawnPlayers(prev => ({ ...prev, BP: selectedPlayer }));
            setAnimatingBP(selectedPlayer);
            break;
          case 'GW':
            setDrawnPlayers(prev => ({ ...prev, GW: selectedPlayer }));
            setAnimatingGW(selectedPlayer);
            break;
        }
        
        setAnimatingPlant(null);
        setIsDrawing(false);
        
        // Auto-calculate battle if all 3 players are drawn
        if (drawnPlayers.SR && drawnPlayers.BP && drawnPlayers.GW) {
          setTimeout(async () => {
            const result = await drawPlantBattlePlayers(selectedHole, drawnPlayers.SR || undefined, drawnPlayers.BP || undefined, drawnPlayers.GW || undefined);
            setLastResult(result);
            const loadedScores = await loadPlantScores();
            const loadedHistory = await loadPlantBattleResults();
            setPlantScores(loadedScores);
            setHistory(loadedHistory);
          }, 500);
        }
      }
    }, intervalTime);
  };

  const handleRevealScore = (plant: Plant) => {
    setRevealedScores(prev => ({ ...prev, [plant]: true }));
  };

  const handleResetBattle = () => {
    setDrawnPlayers({ SR: null, BP: null, GW: null });
    setRevealedScores({ SR: false, BP: false, GW: false });
    setLastResult(null);
    setAnimatingSR('');
    setAnimatingBP('');
    setAnimatingGW('');
    setHighlightedPlayer({ plant: null, index: -1 });
  };

  const getPlantColor = (plant: Plant) => {
    switch (plant) {
      case 'SR': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'BP': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'GW': return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  };

  const getWinnerBadge = (winner: Plant | null) => {
    if (!winner) return '';
    switch (winner) {
      case 'SR': return 'bg-blue-600 text-white';
      case 'BP': return 'bg-purple-600 text-white';
      case 'GW': return 'bg-amber-600 text-white';
    }
  };

  const getWinnerDisplay = () => {
    if (!lastResult) return null;
    
    const scores: { [key in Plant]: number } = { SR: 999, BP: 999, GW: 999 };
    if (lastResult.srPlayer) scores.SR = lastResult.srPlayer.scores[selectedHole - 1];
    if (lastResult.bpPlayer) scores.BP = lastResult.bpPlayer.scores[selectedHole - 1];
    if (lastResult.gwPlayer) scores.GW = lastResult.gwPlayer.scores[selectedHole - 1];
    
    const minScore = Math.min(scores.SR, scores.BP, scores.GW);
    const winners: Plant[] = [];
    if (scores.SR === minScore && lastResult.srPlayer) winners.push('SR');
    if (scores.BP === minScore && lastResult.bpPlayer) winners.push('BP');
    if (scores.GW === minScore && lastResult.gwPlayer) winners.push('GW');
    
    if (winners.length > 1) {
      return { type: 'tie', winners, score: minScore };
    }
    return { type: 'single', winner: lastResult.winner, score: minScore };
  };

  const currentPar = holePars[selectedHole - 1] || 4;

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900">Plant vs Plant Battle</h1>
            <p className="text-gray-600 mt-2">Hole-by-hole minigame - Random players compete for plant glory</p>
          </div>

          {/* Plant Scoreboard */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {(['SR', 'BP', 'GW'] as Plant[]).map((plant) => (
              <div
                key={plant}
                className={`bg-white rounded-xl border border-gray-200 p-6 ${getPlantColor(plant)}`}
              >
                <div className="text-center">
                  <p className="text-sm opacity-70 uppercase tracking-wide font-semibold">{plant} Plant</p>
                  <p className="text-5xl font-bold mt-2">{plantScores[plant]}</p>
                  <p className="text-sm opacity-70 mt-1">Holes Won</p>
                </div>
              </div>
            ))}
          </div>

          {/* Hole Selection and Draw */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Hole</label>
                <select
                  value={selectedHole}
                  onChange={(e) => {
                    setSelectedHole(parseInt(e.target.value));
                    handleResetBattle();
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 text-lg font-semibold"
                >
                  {Array.from({ length: 18 }, (_, i) => i + 1).map((hole) => (
                    <option key={hole} value={hole}>
                      Hole {hole} (Par {holePars[hole - 1]})
                    </option>
                  ))}
                </select>
              </div>
              <div className="bg-gray-100 px-4 py-3 rounded-lg">
                <p className="text-sm text-gray-500">Par</p>
                <p className="text-2xl font-bold text-gray-900">{currentPar}</p>
              </div>
              <button
                onClick={handleResetBattle}
                disabled={isDrawing}
                className="flex items-center gap-2 px-8 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className="w-5 h-5" />
                Reset Battle
              </button>
            </div>
          </div>

          {/* Player Pools */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Player Pools</h3>
            <div className="grid grid-cols-3 gap-6">
              {(['SR', 'BP', 'GW'] as Plant[]).map((plant) => (
                <div key={plant} className={`rounded-lg p-4 ${getPlantColor(plant)}`}>
                  <h4 className="text-sm font-semibold mb-3 text-center">{plant} Players</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {allPlayers[plant].map((player, index) => (
                      <div
                        key={player}
                        className={`text-center px-2 py-2 rounded border-2 text-sm font-medium transition-all ${
                          highlightedPlayer.plant === plant && highlightedPlayer.index === index
                            ? 'border-gray-900 bg-gray-900 text-white scale-110'
                            : 'border-gray-200 bg-white'
                        }`}
                      >
                        {player}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Battle Arena */}
          <div className="bg-white rounded-xl border border-gray-200 p-8 mb-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Hole {selectedHole}</h2>
              <p className="text-gray-600">Par {currentPar}</p>
            </div>

            <div className="grid grid-cols-3 gap-6">
              {(['SR', 'BP', 'GW'] as Plant[]).map((plant) => {
                const player = plant === 'SR' ? lastResult?.srPlayer : plant === 'BP' ? lastResult?.bpPlayer : lastResult?.gwPlayer;
                const animatingName = plant === 'SR' ? animatingSR : plant === 'BP' ? animatingBP : animatingGW;
                const drawnPlayerName = drawnPlayers[plant];
                const isWinner = lastResult?.winner === plant;
                const winnerDisplay = getWinnerDisplay();
                const isTied = winnerDisplay?.type === 'tie' && winnerDisplay.winners?.includes(plant);

                return (
                  <div
                    key={plant}
                    className={`bg-gray-50 rounded-xl border-2 p-6 ${(isWinner || isTied) ? 'border-amber-400' : 'border-gray-200'}`}
                  >
                    <div className="text-center">
                      {(isWinner || isTied) && !isDrawing && lastResult && (
                        <div className="inline-flex items-center justify-center mb-2">
                          <Trophy className="w-6 h-6 text-amber-600" />
                        </div>
                      )}
                      <p className="text-2xl font-bold text-gray-900">{plant}</p>
                      <p className={`text-lg font-semibold mt-2 ${animatingPlant === plant ? 'animate-pulse' : ''}`}>
                        {animatingPlant === plant ? animatingName : (drawnPlayerName || '-')}
                      </p>
                      {drawnPlayerName && !animatingPlant && (
                        <>
                          {!revealedScores[plant] ? (
                            <button
                              onClick={() => handleRevealScore(plant)}
                              className="mt-3 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold text-sm"
                            >
                              Reveal Score
                            </button>
                          ) : (
                            <>
                              <p className="text-4xl font-bold mt-3 text-gray-900">
                                {player?.scores[selectedHole - 1] || 0}
                              </p>
                              <p className="text-sm text-gray-500 mt-1">strokes</p>
                            </>
                          )}
                        </>
                      )}
                      <button
                        onClick={() => handleDrawPlayer(plant)}
                        disabled={isDrawing || animatingPlant !== null || drawnPlayerName !== null}
                        className="mt-3 text-xs px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {drawnPlayerName ? 'Drawn' : 'Draw Player'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {lastResult && !isDrawing && (
              <div className="mt-6 text-center">
                {(() => {
                  const winnerDisplay = getWinnerDisplay();
                  if (winnerDisplay?.type === 'tie' && winnerDisplay.winners) {
                    return (
                      <span className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-lg bg-gray-600 text-white">
                        <Trophy className="w-5 h-5" />
                        Tie! {winnerDisplay.winners.join(' & ')} tied with {winnerDisplay.score} strokes
                      </span>
                    );
                  }
                  return (
                    <span className={`inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-lg ${getWinnerBadge(lastResult.winner)}`}>
                      <Trophy className="w-5 h-5" />
                      {lastResult.winner} Wins Hole {selectedHole}!
                    </span>
                  );
                })()}
              </div>
            )}
          </div>

          {/* Battle History */}
          {history.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="bg-gray-900 text-white px-6 py-4">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <RefreshCw className="w-6 h-6" />
                  Battle History
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Hole</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-700">SR Player</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-700">SR Score</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-700">BP Player</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-700">BP Score</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-700">GW Player</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-700">GW Score</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-700">Winner</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.slice().reverse().map((result, index) => (
                      <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="px-4 py-3 font-semibold">{result.hole}</td>
                        <td className="px-4 py-3 text-center">{result.srPlayer?.name || '-'}</td>
                        <td className="px-4 py-3 text-center font-bold">{result.srPlayer?.scores[result.hole - 1] || '-'}</td>
                        <td className="px-4 py-3 text-center">{result.bpPlayer?.name || '-'}</td>
                        <td className="px-4 py-3 text-center font-bold">{result.bpPlayer?.scores[result.hole - 1] || '-'}</td>
                        <td className="px-4 py-3 text-center">{result.gwPlayer?.name || '-'}</td>
                        <td className="px-4 py-3 text-center font-bold">{result.gwPlayer?.scores[result.hole - 1] || '-'}</td>
                        <td className="px-4 py-3 text-center">
                          {result.winner ? (
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${getWinnerBadge(result.winner)}`}>
                              {result.winner}
                            </span>
                          ) : (
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-600 text-white">
                              Tie
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
