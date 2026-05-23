import { TournamentState, Player, Plant, HonestJohnResult, PlantBattleResult, LuckyDrawWinner } from './types';
import { supabase } from './supabaseClient';

const DEFAULT_HOLE_PARS = [4, 4, 3, 4, 5, 4, 3, 4, 4, 4, 4, 5, 3, 4, 4, 3, 5, 4];

export const HOLE_PAR_VALUES = DEFAULT_HOLE_PARS;

export const getHoleParValues = async (): Promise<number[]> => {
  const { data, error } = await supabase
    .from('course_setup')
    .select('hole_pars')
    .eq('id', 1)
    .maybeSingle();
  
  if (error || !data) {
    // If no data exists, insert default values
    await supabase.from('course_setup').insert({
      id: 1,
      hole_pars: DEFAULT_HOLE_PARS,
    });
    return DEFAULT_HOLE_PARS;
  }
  
  return data.hole_pars;
};

export const getTotalPar = async () => {
  const pars = await getHoleParValues();
  return pars.reduce((sum, par) => sum + par, 0);
};

export const loadPlayers = async (): Promise<Player[]> => {
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .order('created_at', { ascending: true });
  
  if (error) {
    console.error('Error loading players:', error);
    return [];
  }
  
  return data.map(p => ({
    id: p.id,
    name: p.name,
    plant: p.plant as Plant,
    declaredScore: p.declared_score,
    scores: p.scores,
  }));
};

export const loadHonestJohnResults = async (): Promise<HonestJohnResult[]> => {
  const { data, error } = await supabase
    .from('honest_john_results')
    .select('*')
    .order('calculated_at', { ascending: false });
  
  if (error) {
    console.error('Error loading honest john results:', error);
    return [];
  }
  
  return data.map(r => ({
    playerId: r.player_id,
    playerName: r.player_name,
    plant: r.plant as Plant,
    declaredScore: r.declared_score,
    actualScore: r.actual_score,
    adjustmentHoles: r.adjustment_holes,
    adjustedGrossScore: r.adjusted_gross_score,
    difference: r.difference,
  }));
};

export const loadPlantBattleResults = async (): Promise<PlantBattleResult[]> => {
  const { data, error } = await supabase
    .from('plant_battle_results')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error loading plant battle results:', error);
    return [];
  }
  
  return data.map(r => ({
    hole: r.hole,
    srPlayer: r.sr_player_id ? {
      id: r.sr_player_id,
      name: r.sr_player_name || '',
      plant: 'SR' as Plant,
      declaredScore: 0,
      scores: [r.sr_score || 0],
    } : null,
    bpPlayer: r.bp_player_id ? {
      id: r.bp_player_id,
      name: r.bp_player_name || '',
      plant: 'BP' as Plant,
      declaredScore: 0,
      scores: [r.bp_score || 0],
    } : null,
    gwPlayer: r.gw_player_id ? {
      id: r.gw_player_id,
      name: r.gw_player_name || '',
      plant: 'GW' as Plant,
      declaredScore: 0,
      scores: [r.gw_score || 0],
    } : null,
    winner: r.winner as Plant | null,
  }));
};

export const loadPlantScores = async (): Promise<{ SR: number; BP: number; GW: number }> => {
  const { data, error } = await supabase
    .from('plant_scores')
    .select('*')
    .eq('id', 1)
    .maybeSingle();
  
  if (error || !data) {
    // If no data exists, insert default values
    await supabase.from('plant_scores').insert({
      id: 1,
      sr_score: 0,
      bp_score: 0,
      gw_score: 0,
    });
    return { SR: 0, BP: 0, GW: 0 };
  }
  
  return {
    SR: data.sr_score,
    BP: data.bp_score,
    GW: data.gw_score,
  };
};

export const loadLuckyDrawWinners = async (): Promise<LuckyDrawWinner[]> => {
  const { data, error } = await supabase
    .from('lucky_draw_winners')
    .select('*')
    .order('timestamp', { ascending: false });
  
  if (error) {
    console.error('Error loading lucky draw winners:', error);
    return [];
  }
  
  return data.map(w => ({
    id: w.id,
    playerName: w.player_name,
    plant: w.plant as Plant,
    timestamp: new Date(w.timestamp).getTime(),
  }));
};

export const loadLuckyDrawPool = async (): Promise<string[]> => {
  const players = await loadPlayers();
  const { data: winners } = await supabase
    .from('lucky_draw_winners')
    .select('player_id');
  
  const winnerIds = new Set(winners?.map(w => w.player_id) || []);
  return players.filter(p => !winnerIds.has(p.id)).map(p => p.id);
};

export const addPlayer = async (name: string, plant: Plant, declaredScore: number): Promise<Player> => {
  const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
  const scores = new Array(18).fill(0);
  
  const { error } = await supabase
    .from('players')
    .insert({
      id,
      name,
      plant,
      declared_score: declaredScore,
      scores,
    });
  
  if (error) {
    console.error('Error adding player:', error);
    throw error;
  }
  
  return {
    id,
    name,
    plant,
    declaredScore,
    scores,
  };
};

export const updatePlayerScore = async (playerId: string, holeIndex: number, score: number): Promise<void> => {
  const { data: player } = await supabase
    .from('players')
    .select('scores')
    .eq('id', playerId)
    .single();
  
  if (!player) {
    console.error('Player not found');
    return;
  }
  
  const newScores = [...player.scores];
  newScores[holeIndex] = score;
  
  const { error } = await supabase
    .from('players')
    .update({ scores: newScores })
    .eq('id', playerId);
  
  if (error) {
    console.error('Error updating player score:', error);
  }
};

export const deletePlayer = async (playerId: string): Promise<void> => {
  console.log('Starting deletion of player:', playerId);
  
  // Step 1: Delete associated records from honest_john_results
  console.log('Step 1: Deleting from honest_john_results...');
  const { error: hjError } = await supabase
    .from('honest_john_results')
    .delete()
    .eq('player_id', playerId);
  
  if (hjError) {
    console.error('Error deleting from honest_john_results:', hjError);
  } else {
    console.log('Successfully deleted from honest_john_results');
  }
  
  // Step 2: Delete associated records from plant_battle_results (where player appears as any of the plant players)
  console.log('Step 2: Deleting from plant_battle_results...');
  const { error: pbError } = await supabase
    .from('plant_battle_results')
    .delete()
    .or(`sr_player_id.eq.${playerId},bp_player_id.eq.${playerId},gw_player_id.eq.${playerId}`);
  
  if (pbError) {
    console.error('Error deleting from plant_battle_results:', pbError);
  } else {
    console.log('Successfully deleted from plant_battle_results');
  }
  
  // Step 3: Delete associated records from lucky_draw_winners
  console.log('Step 3: Deleting from lucky_draw_winners...');
  const { error: ldError } = await supabase
    .from('lucky_draw_winners')
    .delete()
    .eq('player_id', playerId);
  
  if (ldError) {
    console.error('Error deleting from lucky_draw_winners:', ldError);
  } else {
    console.log('Successfully deleted from lucky_draw_winners');
  }
  
  // Step 4: Now delete the player
  console.log('Step 4: Deleting player...');
  const { error } = await supabase
    .from('players')
    .delete()
    .eq('id', playerId);
  
  if (error) {
    console.error('Error deleting player:', error);
    throw error;
  }
  
  console.log('Successfully deleted player:', playerId);
};

export const calculateHonestJohn = async (adjustmentHoles: number[]): Promise<HonestJohnResult[]> => {
  const players = await loadPlayers();
  const holePars = await getHoleParValues();
  
  const results: HonestJohnResult[] = players.map(player => {
    const actualScore = player.scores.reduce((sum, score) => sum + score, 0);
    
    let adjustedScore = 0;
    for (let i = 0; i < 18; i++) {
      const holeNumber = i + 1;
      if (adjustmentHoles.includes(holeNumber)) {
        adjustedScore += holePars[i];
      } else {
        adjustedScore += player.scores[i];
      }
    }
    
    const difference = Math.abs(adjustedScore - player.declaredScore);
    
    return {
      playerId: player.id,
      playerName: player.name,
      plant: player.plant,
      declaredScore: player.declaredScore,
      actualScore,
      adjustmentHoles,
      adjustedGrossScore: adjustedScore,
      difference,
    };
  });
  
  results.sort((a, b) => a.difference - b.difference);
  
  // Clear previous results and insert new ones
  await supabase.from('honest_john_results').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  
  for (const result of results) {
    await supabase.from('honest_john_results').insert({
      player_id: result.playerId,
      player_name: result.playerName,
      plant: result.plant,
      declared_score: result.declaredScore,
      actual_score: result.actualScore,
      adjustment_holes: result.adjustmentHoles,
      adjusted_gross_score: result.adjustedGrossScore,
      difference: result.difference,
    });
  }
  
  return results;
};

export const drawPlantBattlePlayers = async (hole: number, srPlayerName?: string, bpPlayerName?: string, gwPlayerName?: string): Promise<PlantBattleResult> => {
  const players = await loadPlayers();
  
  const srPlayers = players.filter(p => p.plant === 'SR');
  const bpPlayers = players.filter(p => p.plant === 'BP');
  const gwPlayers = players.filter(p => p.plant === 'GW');
  
  const srPlayer = srPlayerName ? srPlayers.find(p => p.name === srPlayerName) || null : (srPlayers.length > 0 ? shuffleArray(srPlayers)[0] : null);
  const bpPlayer = bpPlayerName ? bpPlayers.find(p => p.name === bpPlayerName) || null : (bpPlayers.length > 0 ? shuffleArray(bpPlayers)[0] : null);
  const gwPlayer = gwPlayerName ? gwPlayers.find(p => p.name === gwPlayerName) || null : (gwPlayers.length > 0 ? shuffleArray(gwPlayers)[0] : null);
  
  let winner: Plant | null = null;
  const scores: { [key in Plant]: number } = { SR: 999, BP: 999, GW: 999 };
  
  if (srPlayer) scores.SR = srPlayer.scores[hole - 1];
  if (bpPlayer) scores.BP = bpPlayer.scores[hole - 1];
  if (gwPlayer) scores.GW = gwPlayer.scores[hole - 1];
  
  const minScore = Math.min(scores.SR, scores.BP, scores.GW);
  
  // Handle ties - if multiple plants have the same minimum score, it's a tie
  const winners: Plant[] = [];
  if (scores.SR === minScore && srPlayer) winners.push('SR');
  if (scores.BP === minScore && bpPlayer) winners.push('BP');
  if (scores.GW === minScore && gwPlayer) winners.push('GW');
  
  // If there's a single winner, set it. If tie, winner remains null
  if (winners.length === 1) {
    winner = winners[0];
  }
  
  const result: PlantBattleResult = {
    hole,
    srPlayer,
    bpPlayer,
    gwPlayer,
    winner,
  };
  
  // Insert battle result
  await supabase.from('plant_battle_results').insert({
    hole,
    sr_player_id: srPlayer?.id,
    sr_player_name: srPlayer?.name,
    sr_score: srPlayer?.scores[hole - 1],
    bp_player_id: bpPlayer?.id,
    bp_player_name: bpPlayer?.name,
    bp_score: bpPlayer?.scores[hole - 1],
    gw_player_id: gwPlayer?.id,
    gw_player_name: gwPlayer?.name,
    gw_score: gwPlayer?.scores[hole - 1],
    winner,
  });
  
  // Update plant scores only if there's a single winner (no tie)
  if (winner) {
    const { data: currentScores } = await supabase
      .from('plant_scores')
      .select('*')
      .eq('id', 1)
      .maybeSingle();
    
    if (currentScores) {
      const updates: any = {};
      if (winner === 'SR') updates.sr_score = currentScores.sr_score + 1;
      if (winner === 'BP') updates.bp_score = currentScores.bp_score + 1;
      if (winner === 'GW') updates.gw_score = currentScores.gw_score + 1;
      
      await supabase.from('plant_scores').update(updates).eq('id', 1);
    } else {
      // Initialize plant scores if not exists
      const updates: any = { sr_score: 0, bp_score: 0, gw_score: 0 };
      if (winner === 'SR') updates.sr_score = 1;
      if (winner === 'BP') updates.bp_score = 1;
      if (winner === 'GW') updates.gw_score = 1;
      
      await supabase.from('plant_scores').insert({
        id: 1,
        ...updates,
      });
    }
  }
  
  return result;
};

export const drawLuckyWinner = async (): Promise<LuckyDrawWinner | null> => {
  const pool = await loadLuckyDrawPool();
  
  if (pool.length === 0) {
    return null;
  }
  
  const winnerId = shuffleArray(pool)[0];
  const players = await loadPlayers();
  const player = players.find(p => p.id === winnerId);
  
  if (!player) {
    return null;
  }
  
  const winner: LuckyDrawWinner = {
    id: crypto.randomUUID(),
    playerName: player.name,
    plant: player.plant,
    timestamp: Date.now(),
  };
  
  await supabase.from('lucky_draw_winners').insert({
    id: winner.id,
    player_id: winnerId,
    player_name: winner.playerName,
    plant: winner.plant,
    timestamp: new Date(winner.timestamp).toISOString(),
  });
  
  return winner;
};

export const updateHolePar = async (holeIndex: number, par: number): Promise<void> => {
  const { data: current } = await supabase
    .from('course_setup')
    .select('hole_pars')
    .eq('id', 1)
    .maybeSingle();
  
  if (!current) {
    // If no data exists, insert with default values first
    const newPars = [...DEFAULT_HOLE_PARS];
    newPars[holeIndex] = par;
    await supabase.from('course_setup').insert({
      id: 1,
      hole_pars: newPars,
    });
    return;
  }
  
  const newPars = [...current.hole_pars];
  newPars[holeIndex] = par;
  
  const { error } = await supabase
    .from('course_setup')
    .update({ hole_pars: newPars })
    .eq('id', 1);
  
  if (error) {
    console.error('Error updating hole par:', error);
  }
};

export const resetTournament = async (): Promise<void> => {
  await supabase.from('players').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('honest_john_results').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('plant_battle_results').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('lucky_draw_winners').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  
  // Reset plant scores - use upsert to handle empty table
  const { error: scoresError } = await supabase
    .from('plant_scores')
    .upsert({ id: 1, sr_score: 0, bp_score: 0, gw_score: 0 }, { onConflict: 'id' });
  
  if (scoresError) {
    console.error('Error resetting plant scores:', scoresError);
  }
  
  // Reset course setup - use upsert to handle empty table
  const { error: setupError } = await supabase
    .from('course_setup')
    .upsert({ id: 1, hole_pars: DEFAULT_HOLE_PARS }, { onConflict: 'id' });
  
  if (setupError) {
    console.error('Error resetting course setup:', setupError);
  }
};

// Helper function to shuffle array
const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};
