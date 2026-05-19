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

  useEffect(() => {
    const loadData = async () => {
      const loadedScores = await loadPlantScores();
      const loadedHistory = await loadPlantBattleResults();
      const loadedPars = await getHoleParValues();
      setPlantScores(loadedScores);
      setHistory(loadedHistory);
      setHolePars(loadedPars);
    };
    loadData();
  }, []);

  const handleDrawPlayers = async () => {
    const { loadPlayers } = await import('@/lib/storage');
    const players = await loadPlayers();
    const srPlayers = players.filter((p: any) => p.plant === 'SR');
    const bpPlayers = players.filter((p: any) => p.plant === 'BP');
    const gwPlayers = players.filter((p: any) => p.plant === 'GW');

    if (srPlayers.length === 0 || bpPlayers.length === 0 || gwPlayers.length === 0) {
      alert('Need at least one player from each plant!');
      return;
    }

    setIsDrawing(true);
    setLastResult(null);

    // Slot machine animation
    let iterations = 0;
    const maxIterations = 25;

    const animate = setInterval(() => {
      setAnimatingSR(srPlayers[Math.floor(Math.random() * srPlayers.length)].name);
      setAnimatingBP(bpPlayers[Math.floor(Math.random() * bpPlayers.length)].name);
      setAnimatingGW(gwPlayers[Math.floor(Math.random() * gwPlayers.length)].name);
      iterations++;

      if (iterations >= maxIterations) {
        clearInterval(animate);
      }
    }, 100);

    // Wait for animation to complete, then draw
    setTimeout(async () => {
      const result = await drawPlantBattlePlayers(selectedHole);
      setLastResult(result);
      const loadedScores = await loadPlantScores();
      const loadedHistory = await loadPlantBattleResults();
      setPlantScores(loadedScores);
      setHistory(loadedHistory);
      setAnimatingSR(result.srPlayer?.name || '');
      setAnimatingBP(result.bpPlayer?.name || '');
      setAnimatingGW(result.gwPlayer?.name || '');
      setIsDrawing(false);
    }, maxIterations * 100);
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
                  onChange={(e) => setSelectedHole(parseInt(e.target.value))}
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
                onClick={handleDrawPlayers}
                disabled={isDrawing}
                className="flex items-center gap-2 px-8 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Swords className={`w-5 h-5 ${isDrawing ? 'animate-spin' : ''}`} />
                {isDrawing ? 'Drawing...' : 'Draw Players'}
              </button>
            </div>
          </div>

          {/* Battle Results with Animation */}
          {(lastResult || isDrawing) && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Swords className="w-6 h-6 text-gray-600" />
                Hole {selectedHole} Battle Results
              </h3>
              
              <div className="grid grid-cols-3 gap-4">
                {(['SR', 'BP', 'GW'] as Plant[]).map((plant) => {
                  const player = lastResult?.[`${plant.toLowerCase()}Player` as keyof PlantBattleResult] as any;
                  const isWinner = lastResult?.winner === plant;
                  const animatingName = plant === 'SR' ? animatingSR : plant === 'BP' ? animatingBP : animatingGW;
                  
                  return (
                    <div
                      key={plant}
                      className={`border-2 rounded-xl p-4 ${isWinner ? 'border-amber-500 bg-amber-50' : getPlantColor(plant)}`}
                    >
                      <div className="text-center">
                        {isWinner && !isDrawing && (
                          <div className="inline-flex items-center justify-center mb-2">
                            <Trophy className="w-6 h-6 text-amber-600" />
                          </div>
                        )}
                        <p className="text-2xl font-bold text-gray-900">{plant}</p>
                        <p className={`text-lg font-semibold mt-2 ${isDrawing ? 'animate-pulse' : ''}`}>
                          {isDrawing ? animatingName : (player?.name || '-')}
                        </p>
                        {!isDrawing && player && (
                          <>
                            <p className="text-4xl font-bold mt-3 text-gray-900">
                              {player.scores[selectedHole - 1] || 0}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">strokes</p>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {lastResult?.winner && !isDrawing && (
                <div className="mt-6 text-center">
                  <span className={`inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-lg ${getWinnerBadge(lastResult.winner)}`}>
                    <Trophy className="w-5 h-5" />
                    {lastResult.winner} Wins Hole {selectedHole}!
                  </span>
                </div>
              )}
            </div>
          )}

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
                          ) : '-'}
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
