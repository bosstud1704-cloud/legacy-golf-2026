'use client';

import Sidebar from '@/components/Sidebar';
import { loadPlayers, addPlayer, updatePlayerScore, deletePlayer, getHoleParValues, updateHolePar } from '@/lib/storage';
import { useState, useEffect, useMemo } from 'react';
import { Plant } from '@/lib/types';
import { Plus, Trash2, ArrowUpDown, Filter, Settings } from 'lucide-react';

export default function PlayersPage() {
  const [players, setPlayers] = useState<any[]>([]);
  const [holePars, setHolePars] = useState<number[]>([]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerPlant, setNewPlayerPlant] = useState<Plant>('SR');
  const [newPlayerDeclaredScore, setNewPlayerDeclaredScore] = useState('');
  const [showCourseSetup, setShowCourseSetup] = useState(false);
  
  // Sorting and filtering
  const [sortField, setSortField] = useState<'name' | 'plant' | 'declaredScore' | 'totalScore'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filterPlant, setFilterPlant] = useState<'all' | Plant>('all');
  const [filterName, setFilterName] = useState('');

  useEffect(() => {
    const loadData = async () => {
      const loadedPlayers = await loadPlayers();
      const loadedPars = await getHoleParValues();
      setPlayers(loadedPlayers);
      setHolePars(loadedPars);
    };
    loadData();
  }, []);

  const handleAddPlayer = async () => {
    if (!newPlayerName.trim() || !newPlayerDeclaredScore) return;

    await addPlayer(newPlayerName.trim(), newPlayerPlant, parseInt(newPlayerDeclaredScore));
    const loadedPlayers = await loadPlayers();
    setPlayers(loadedPlayers);
    setNewPlayerName('');
    setNewPlayerDeclaredScore('');
  };

  const handleUpdateScore = async (playerId: string, holeIndex: number, score: string) => {
    const numScore = parseInt(score) || 0;
    await updatePlayerScore(playerId, holeIndex, numScore);
    const loadedPlayers = await loadPlayers();
    setPlayers(loadedPlayers);
  };

  const handleDeletePlayer = async (playerId: string) => {
    if (confirm('Are you sure you want to delete this player?')) {
      await deletePlayer(playerId);
      const loadedPlayers = await loadPlayers();
      setPlayers(loadedPlayers);
    }
  };

  const handleUpdatePar = async (holeIndex: number, par: string) => {
    const numPar = parseInt(par) || 3;
    await updateHolePar(holeIndex, numPar);
    const loadedPars = await getHoleParValues();
    setHolePars(loadedPars);
  };

  // Filtered and sorted players
  const filteredAndSortedPlayers = useMemo(() => {
    let filtered = players;

    // Filter by plant
    if (filterPlant !== 'all') {
      filtered = filtered.filter((p: any) => p.plant === filterPlant);
    }

    // Filter by name
    if (filterName) {
      filtered = filtered.filter((p: any) => 
        p.name.toLowerCase().includes(filterName.toLowerCase())
      );
    }

    // Sort
    filtered = [...filtered].sort((a: any, b: any) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'plant':
          comparison = a.plant.localeCompare(b.plant);
          break;
        case 'declaredScore':
          comparison = a.declaredScore - b.declaredScore;
          break;
        case 'totalScore':
          comparison = a.scores.reduce((sum: number, s: number) => sum + s, 0) - b.scores.reduce((sum: number, s: number) => sum + s, 0);
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [players, filterPlant, filterName, sortField, sortDirection]);

  const handleSort = (field: 'name' | 'plant' | 'declaredScore' | 'totalScore') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getPlantColor = (plant: Plant) => {
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
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900">Players & Scores</h1>
            <p className="text-gray-600 mt-2">Manage players and enter hole-by-hole scores</p>
          </div>

          {/* Course Setup Toggle */}
          <button
            onClick={() => setShowCourseSetup(!showCourseSetup)}
            className="mb-6 flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Settings className="w-4 h-4 text-gray-600" />
            <span className="text-gray-700 font-medium">{showCourseSetup ? 'Hide' : 'Show'} Course Setup</span>
          </button>

          {/* Course Setup Section */}
          {showCourseSetup && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Course Setup - Hole Par Values</h2>
              <div className="grid grid-cols-9 gap-2 mb-4">
                <p className="col-span-9 text-sm text-gray-500 mb-2">OUT (Holes 1-9)</p>
                {holePars.slice(0, 9).map((par, i) => (
                  <div key={i} className="text-center">
                    <label className="block text-xs text-gray-500 mb-1">Hole {i + 1}</label>
                    <input
                      type="number"
                      min="3"
                      max="5"
                      value={par}
                      onChange={(e) => handleUpdatePar(i, e.target.value)}
                      className="w-full px-2 py-1 text-center border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gray-400"
                    />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-9 gap-2">
                <p className="col-span-9 text-sm text-gray-500 mb-2">IN (Holes 10-18)</p>
                {holePars.slice(9).map((par, i) => (
                  <div key={i + 9} className="text-center">
                    <label className="block text-xs text-gray-500 mb-1">Hole {i + 10}</label>
                    <input
                      type="number"
                      min="3"
                      max="5"
                      value={par}
                      onChange={(e) => handleUpdatePar(i + 9, e.target.value)}
                      className="w-full px-2 py-1 text-center border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gray-400"
                    />
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">Total Par: <span className="font-bold">{holePars.reduce((sum, par) => sum + par, 0)}</span></p>
              </div>
            </div>
          )}

          {/* Add Player Form */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Add New Player</h2>
            <div className="flex flex-wrap gap-4">
              <input
                type="text"
                placeholder="Player Name"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                className="flex-1 min-w-[200px] px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
              />
              <select
                value={newPlayerPlant}
                onChange={(e) => setNewPlayerPlant(e.target.value as Plant)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
              >
                <option value="SR">SR</option>
                <option value="BP">BP</option>
                <option value="GW">GW</option>
              </select>
              <input
                type="number"
                placeholder="Declared Score"
                value={newPlayerDeclaredScore}
                onChange={(e) => setNewPlayerDeclaredScore(e.target.value)}
                className="w-40 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
              />
              <button
                onClick={handleAddPlayer}
                className="flex items-center gap-2 px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Player
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Filters:</span>
              </div>
              <select
                value={filterPlant}
                onChange={(e) => setFilterPlant(e.target.value as 'all' | Plant)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm"
              >
                <option value="all">All Plants</option>
                <option value="SR">SR</option>
                <option value="BP">BP</option>
                <option value="GW">GW</option>
              </select>
              <input
                type="text"
                placeholder="Search by name..."
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm"
              />
            </div>
          </div>

          {/* Player Data Table */}
          {filteredAndSortedPlayers.length > 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th 
                        className="px-4 py-3 text-left font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('name')}
                      >
                        <div className="flex items-center gap-1">
                          Player
                          <ArrowUpDown className="w-4 h-4 text-gray-400" />
                        </div>
                      </th>
                      <th 
                        className="px-4 py-3 text-center font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('plant')}
                      >
                        <div className="flex items-center justify-center gap-1">
                          Plant
                          <ArrowUpDown className="w-4 h-4 text-gray-400" />
                        </div>
                      </th>
                      <th 
                        className="px-4 py-3 text-center font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('declaredScore')}
                      >
                        <div className="flex items-center justify-center gap-1">
                          Declared
                          <ArrowUpDown className="w-4 h-4 text-gray-400" />
                        </div>
                      </th>
                      <th className="px-2 py-3 text-center font-semibold text-gray-700 border-l border-gray-200">1</th>
                      <th className="px-2 py-3 text-center font-semibold text-gray-700">2</th>
                      <th className="px-2 py-3 text-center font-semibold text-gray-700">3</th>
                      <th className="px-2 py-3 text-center font-semibold text-gray-700">4</th>
                      <th className="px-2 py-3 text-center font-semibold text-gray-700">5</th>
                      <th className="px-2 py-3 text-center font-semibold text-gray-700">6</th>
                      <th className="px-2 py-3 text-center font-semibold text-gray-700">7</th>
                      <th className="px-2 py-3 text-center font-semibold text-gray-700">8</th>
                      <th className="px-2 py-3 text-center font-semibold text-gray-700">9</th>
                      <th className="px-2 py-3 text-center font-semibold text-gray-700 border-l border-gray-200">10</th>
                      <th className="px-2 py-3 text-center font-semibold text-gray-700">11</th>
                      <th className="px-2 py-3 text-center font-semibold text-gray-700">12</th>
                      <th className="px-2 py-3 text-center font-semibold text-gray-700">13</th>
                      <th className="px-2 py-3 text-center font-semibold text-gray-700">14</th>
                      <th className="px-2 py-3 text-center font-semibold text-gray-700">15</th>
                      <th className="px-2 py-3 text-center font-semibold text-gray-700">16</th>
                      <th className="px-2 py-3 text-center font-semibold text-gray-700">17</th>
                      <th className="px-2 py-3 text-center font-semibold text-gray-700">18</th>
                      <th 
                        className="px-4 py-3 text-center font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('totalScore')}
                      >
                        <div className="flex items-center justify-center gap-1">
                          Total
                          <ArrowUpDown className="w-4 h-4 text-gray-400" />
                        </div>
                      </th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-700">Actions</th>
                    </tr>
                    <tr className="bg-gray-100 text-gray-600 text-sm">
                      <th className="px-4 py-2 text-left">Par</th>
                      <th></th>
                      <th></th>
                      {holePars.map((par, i) => (
                        <th key={i} className={`px-2 py-2 text-center ${i === 0 || i === 9 ? 'border-l border-gray-300' : ''}`}>
                          {par}
                        </th>
                      ))}
                      <th className="px-4 py-2 text-center">{holePars.reduce((sum, par) => sum + par, 0)}</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAndSortedPlayers.map((player) => (
                      <tr key={player.id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{player.name}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getPlantColor(player.plant)}`}>
                            {player.plant}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center font-semibold text-gray-700">{player.declaredScore}</td>
                        {player.scores.map((score: number, i: number) => (
                          <td key={i} className={`px-2 py-3 text-center ${i === 0 || i === 9 ? 'border-l border-gray-200' : ''}`}>
                            <input
                              type="number"
                              min="1"
                              max="10"
                              value={score || ''}
                              onChange={(e) => handleUpdateScore(player.id, i, e.target.value)}
                              className="w-10 px-1 py-1 text-center border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gray-400"
                            />
                          </td>
                        ))}
                        <td className="px-4 py-3 text-center font-bold text-gray-900">
                          {player.scores.reduce((sum: number, s: number) => sum + s, 0)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleDeletePlayer(player.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <p className="text-gray-500 text-lg">
                {players.length === 0 ? 'No players added yet. Add your first player above!' : 'No players match your filters.'}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
