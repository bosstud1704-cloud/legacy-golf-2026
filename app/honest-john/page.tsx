'use client';

import Sidebar from '@/components/Sidebar';
import { loadHonestJohnResults, calculateHonestJohn, getHoleParValues } from '@/lib/storage';
import { useState, useEffect } from 'react';
import { HonestJohnResult } from '@/lib/types';
import { Shuffle, Trophy, TrendingUp } from 'lucide-react';

export default function HonestJohnPage() {
  const [results, setResults] = useState<HonestJohnResult[]>([]);
  const [hasCalculated, setHasCalculated] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawnOutHoles, setDrawnOutHoles] = useState<number[]>([]);
  const [drawnInHoles, setDrawnInHoles] = useState<number[]>([]);
  const [animatingOutHole1, setAnimatingOutHole1] = useState(0);
  const [animatingOutHole2, setAnimatingOutHole2] = useState(0);
  const [animatingInHole1, setAnimatingInHole1] = useState(0);
  const [animatingInHole2, setAnimatingInHole2] = useState(0);
  const [holePars, setHolePars] = useState<number[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const loadedResults = await loadHonestJohnResults();
      const loadedPars = await getHoleParValues();
      setResults(loadedResults);
      setHasCalculated(loadedResults.length > 0);
      setHolePars(loadedPars);
    };
    loadData();
  }, []);

  const handleDrawHoles = async () => {
    if (isDrawing) return;
    setIsDrawing(true);
    setDrawnOutHoles([]);
    setDrawnInHoles([]);

    // Animate OUT holes (1-9)
    const outHoles = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    const selectedOutHoles = [...outHoles].sort(() => Math.random() - 0.5).slice(0, 2);
    
    // Slot machine animation for OUT holes
    let iterations = 0;
    const maxIterations = 20;
    
    const animateOut = setInterval(() => {
      setAnimatingOutHole1(outHoles[Math.floor(Math.random() * outHoles.length)]);
      setAnimatingOutHole2(outHoles[Math.floor(Math.random() * outHoles.length)]);
      iterations++;
      
      if (iterations >= maxIterations) {
        clearInterval(animateOut);
        setDrawnOutHoles(selectedOutHoles);
        setAnimatingOutHole1(selectedOutHoles[0]);
        setAnimatingOutHole2(selectedOutHoles[1]);
        
        // Start IN holes animation after OUT completes
        setTimeout(() => {
          const inHoles = [10, 11, 12, 13, 14, 15, 16, 17, 18];
          const selectedInHoles = [...inHoles].sort(() => Math.random() - 0.5).slice(0, 2);
          
          let inIterations = 0;
          const animateIn = setInterval(() => {
            setAnimatingInHole1(inHoles[Math.floor(Math.random() * inHoles.length)]);
            setAnimatingInHole2(inHoles[Math.floor(Math.random() * inHoles.length)]);
            inIterations++;
            
            if (inIterations >= maxIterations) {
              clearInterval(animateIn);
              setDrawnInHoles(selectedInHoles);
              setAnimatingInHole1(selectedInHoles[0]);
              setAnimatingInHole2(selectedInHoles[1]);
              setIsDrawing(false);
            }
          }, 100);
        }, 500);
      }
    }, 100);
  };

  const handleCalculate = async () => {
    const adjustmentHoles = [...drawnOutHoles, ...drawnInHoles].sort((a, b) => a - b);
    const newResults = await calculateHonestJohn(adjustmentHoles);
    setResults(newResults);
    setHasCalculated(true);
  };

  const getPlantColor = (plant: string) => {
    switch (plant) {
      case 'SR': return 'bg-blue-50 text-blue-700';
      case 'BP': return 'bg-purple-50 text-purple-700';
      case 'GW': return 'bg-amber-50 text-amber-700';
    }
  };

  const getRankBadge = (index: number) => {
    if (index === 0) return 'bg-gray-900 text-white';
    if (index === 1) return 'bg-gray-400 text-white';
    if (index === 2) return 'bg-amber-600 text-white';
    return 'bg-gray-200 text-gray-700';
  };

  const adjustmentHoles = [...drawnOutHoles, ...drawnInHoles].sort((a, b) => a - b);

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900">Honest John Calculator</h1>
            <p className="text-gray-600 mt-2">Hybrid Peoria System - Closest to declared score wins</p>
          </div>

          {/* Hole Drawing Section */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Draw Adjustment Holes</h2>
            <p className="text-gray-600 mb-6">
              Randomly select 2 holes from OUT (1-9) and 2 holes from IN (10-18) for adjustment
            </p>
            
            <div className="grid grid-cols-2 gap-6 mb-6">
              {/* OUT Holes */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">OUT (Holes 1-9)</h3>
                <div className="flex gap-4">
                  <div className="flex-1 bg-white border-2 border-gray-200 rounded-lg p-4 text-center">
                    <p className="text-xs text-gray-500 mb-1">Hole 1</p>
                    <p className={`text-4xl font-bold ${isDrawing ? 'text-gray-900' : 'text-gray-400'}`}>
                      {isDrawing ? animatingOutHole1 : (drawnOutHoles[0] || '-')}
                    </p>
                  </div>
                  <div className="flex-1 bg-white border-2 border-gray-200 rounded-lg p-4 text-center">
                    <p className="text-xs text-gray-500 mb-1">Hole 2</p>
                    <p className={`text-4xl font-bold ${isDrawing ? 'text-gray-900' : 'text-gray-400'}`}>
                      {isDrawing ? animatingOutHole2 : (drawnOutHoles[1] || '-')}
                    </p>
                  </div>
                </div>
              </div>

              {/* IN Holes */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">IN (Holes 10-18)</h3>
                <div className="flex gap-4">
                  <div className="flex-1 bg-white border-2 border-gray-200 rounded-lg p-4 text-center">
                    <p className="text-xs text-gray-500 mb-1">Hole 1</p>
                    <p className={`text-4xl font-bold ${isDrawing ? 'text-gray-900' : 'text-gray-400'}`}>
                      {isDrawing ? animatingInHole1 : (drawnInHoles[0] || '-')}
                    </p>
                  </div>
                  <div className="flex-1 bg-white border-2 border-gray-200 rounded-lg p-4 text-center">
                    <p className="text-xs text-gray-500 mb-1">Hole 2</p>
                    <p className={`text-4xl font-bold ${isDrawing ? 'text-gray-900' : 'text-gray-400'}`}>
                      {isDrawing ? animatingInHole2 : (drawnInHoles[1] || '-')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleDrawHoles}
              disabled={isDrawing || adjustmentHoles.length === 4}
              className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Shuffle className={`w-5 h-5 ${isDrawing ? 'animate-spin' : ''}`} />
              {isDrawing ? 'Drawing...' : adjustmentHoles.length === 4 ? 'Holes Drawn' : 'Draw Holes'}
            </button>
          </div>

          {/* Calculate Button */}
          {adjustmentHoles.length === 4 && !hasCalculated && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Calculate Honest John Results</h2>
                  <p className="text-gray-600 mt-1">
                    Adjustment holes: {adjustmentHoles.join(', ')}
                  </p>
                </div>
                <button
                  onClick={handleCalculate}
                  className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-semibold"
                >
                  <Trophy className="w-5 h-5" />
                  Calculate Results
                </button>
              </div>
            </div>
          )}

          {hasCalculated && results.length > 0 ? (
            <>
              {/* Adjustment Holes Display */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Trophy className="w-6 h-6 text-gray-600" />
                  Adjustment Holes
                </h3>
                <div className="flex flex-wrap gap-3">
                  {results[0]?.adjustmentHoles.map((hole) => (
                    <div key={hole} className="bg-gray-100 px-4 py-2 rounded-lg">
                      <span className="font-bold text-lg text-gray-900">Hole {hole}</span>
                      <span className="ml-2 text-sm text-gray-600">(Par {holePars[hole - 1]})</span>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-sm text-gray-600">
                  These holes will use par value instead of actual score for calculation
                </p>
              </div>

              {/* Leaderboard */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="bg-gray-900 text-white px-6 py-4">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <Trophy className="w-6 h-6" />
                    Leaderboard
                  </h3>
                  <p className="text-gray-300 text-sm mt-1">Ranked by absolute difference from declared score</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Rank</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Player</th>
                        <th className="px-4 py-3 text-center font-semibold text-gray-700">Plant</th>
                        <th className="px-4 py-3 text-center font-semibold text-gray-700">Declared</th>
                        <th className="px-4 py-3 text-center font-semibold text-gray-700">Actual</th>
                        <th className="px-4 py-3 text-center font-semibold text-gray-700">Adjusted</th>
                        <th className="px-4 py-3 text-center font-semibold text-gray-700 bg-gray-100">Difference</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((result, index) => (
                        <tr
                          key={result.playerId}
                          className={`border-b border-gray-200 ${index === 0 ? 'bg-amber-50' : 'hover:bg-gray-50'}`}
                        >
                          <td className="px-4 py-4">
                            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold ${getRankBadge(index)}`}>
                              {index + 1}
                            </span>
                          </td>
                          <td className="px-4 py-4 font-medium text-gray-900">{result.playerName}</td>
                          <td className="px-4 py-4 text-center">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPlantColor(result.plant)}`}>
                              {result.plant}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center font-semibold text-gray-700">{result.declaredScore}</td>
                          <td className="px-4 py-4 text-center text-gray-600">{result.actualScore}</td>
                          <td className="px-4 py-4 text-center font-semibold text-gray-900">{result.adjustedGrossScore}</td>
                          <td className="px-4 py-4 text-center">
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full font-bold ${
                              result.difference === 0
                                ? 'bg-gray-900 text-white'
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              <TrendingUp className="w-4 h-4" />
                              {result.difference}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Winner Announcement */}
              {results.length > 0 && (
                <div className="mt-8 bg-gray-900 rounded-xl border border-gray-200 p-8 text-white text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full mb-4">
                    <Trophy className="w-8 h-8 text-gray-900" />
                  </div>
                  <h2 className="text-3xl font-bold mb-2">🏆 Honest John Winner</h2>
                  <p className="text-2xl font-semibold text-amber-300">{results[0].playerName}</p>
                  <p className="text-gray-300 mt-2">
                    {results[0].plant} • Difference: {results[0].difference}
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <Shuffle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">
                {adjustmentHoles.length < 4 ? 'Draw adjustment holes first, then calculate results.' : 'Click "Calculate Results" to run the Honest John calculation'}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
