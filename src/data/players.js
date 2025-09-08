// Sistema de jogadores para Fantasy Football - Similar ao Cartola FC

export const positions = {
  GOL: 'Goleiro',
  LAT: 'Lateral',
  ZAG: 'Zagueiro',
  MEI: 'Meia',
  ATA: 'Atacante'
}

export const teams = {
  FLA: { name: 'Flamengo', color: '#E60026' },
  PAL: { name: 'Palmeiras', color: '#006B3D' },
  COR: { name: 'Corinthians', color: '#000000' },
  SAO: { name: 'São Paulo', color: '#FF0000' },
  GRE: { name: 'Grêmio', color: '#0066CC' },
  INT: { name: 'Internacional', color: '#CC0000' },
  FLU: { name: 'Fluminense', color: '#7A2E2E' },
  BOT: { name: 'Botafogo', color: '#000000' },
  ATM: { name: 'Atlético-MG', color: '#000000' },
  SAN: { name: 'Santos', color: '#000000' },
  VAS: { name: 'Vasco', color: '#000000' },
  BAH: { name: 'Bahia', color: '#0066CC' }
}

// Função para calcular pontuação baseada nas estatísticas
export const calculatePoints = (stats, position) => {
  let points = 0
  
  // Pontos base por posição
  if (stats.minutesPlayed >= 60) {
    points += position === 'GOL' ? 7 : 5
  }
  
  // Gols
  if (position === 'GOL') {
    points += stats.goals * 12
  } else if (position === 'ZAG' || position === 'LAT') {
    points += stats.goals * 9
  } else if (position === 'MEI') {
    points += stats.goals * 6
  } else if (position === 'ATA') {
    points += stats.goals * 5
  }
  
  // Assistências
  points += stats.assists * 4
  
  // Defesas (goleiro)
  if (position === 'GOL') {
    points += stats.saves * 1.2
    points += stats.penaltySaves * 7
  }
  
  // Cartões
  points -= stats.yellowCards * 1
  points -= stats.redCards * 5
  
  // Gols contra
  points -= stats.ownGoals * 6
  
  // Pênaltis perdidos
  points -= stats.penaltyMisses * 4
  
  return Math.round(points * 100) / 100
}

// Base de dados de jogadores
export const players = [
  // Goleiros
  {
    id: 'gol_001',
    name: 'Alisson',
    team: 'FLA',
    position: 'GOL',
    price: 8.5,
    photo: '/players/alisson.jpg',
    stats: {
      goals: 0,
      assists: 1,
      saves: 45,
      penaltySaves: 2,
      yellowCards: 1,
      redCards: 0,
      ownGoals: 0,
      penaltyMisses: 0,
      minutesPlayed: 810
    },
    lastRoundPoints: 8.4,
    totalPoints: 67.2,
    averagePoints: 7.5
  },
  {
    id: 'gol_002',
    name: 'Weverton',
    team: 'PAL',
    position: 'GOL',
    price: 7.8,
    photo: '/players/weverton.jpg',
    stats: {
      goals: 0,
      assists: 0,
      saves: 38,
      penaltySaves: 1,
      yellowCards: 2,
      redCards: 0,
      ownGoals: 0,
      penaltyMisses: 0,
      minutesPlayed: 720
    },
    lastRoundPoints: 6.2,
    totalPoints: 58.6,
    averagePoints: 6.5
  },
  
  // Zagueiros
  {
    id: 'zag_001',
    name: 'Thiago Silva',
    team: 'FLU',
    position: 'ZAG',
    price: 6.2,
    photo: '/players/thiago_silva.jpg',
    stats: {
      goals: 2,
      assists: 1,
      saves: 0,
      penaltySaves: 0,
      yellowCards: 3,
      redCards: 0,
      ownGoals: 0,
      penaltyMisses: 0,
      minutesPlayed: 765
    },
    lastRoundPoints: 7.8,
    totalPoints: 62.4,
    averagePoints: 6.9
  },
  {
    id: 'zag_002',
    name: 'Gustavo Gómez',
    team: 'PAL',
    position: 'ZAG',
    price: 5.8,
    photo: '/players/gomez.jpg',
    stats: {
      goals: 3,
      assists: 0,
      saves: 0,
      penaltySaves: 0,
      yellowCards: 4,
      redCards: 1,
      ownGoals: 0,
      penaltyMisses: 0,
      minutesPlayed: 720
    },
    lastRoundPoints: 5.2,
    totalPoints: 54.8,
    averagePoints: 6.1
  },
  
  // Laterais
  {
    id: 'lat_001',
    name: 'Marcelo',
    team: 'FLU',
    position: 'LAT',
    price: 4.5,
    photo: '/players/marcelo.jpg',
    stats: {
      goals: 1,
      assists: 4,
      saves: 0,
      penaltySaves: 0,
      yellowCards: 2,
      redCards: 0,
      ownGoals: 0,
      penaltyMisses: 0,
      minutesPlayed: 630
    },
    lastRoundPoints: 9.2,
    totalPoints: 48.6,
    averagePoints: 5.4
  },
  {
    id: 'lat_002',
    name: 'Marcos Rocha',
    team: 'PAL',
    position: 'LAT',
    price: 4.2,
    photo: '/players/marcos_rocha.jpg',
    stats: {
      goals: 0,
      assists: 3,
      saves: 0,
      penaltySaves: 0,
      yellowCards: 3,
      redCards: 0,
      ownGoals: 1,
      penaltyMisses: 0,
      minutesPlayed: 675
    },
    lastRoundPoints: 3.8,
    totalPoints: 41.2,
    averagePoints: 4.6
  },
  
  // Meias
  {
    id: 'mei_001',
    name: 'Arrascaeta',
    team: 'FLA',
    position: 'MEI',
    price: 9.2,
    photo: '/players/arrascaeta.jpg',
    stats: {
      goals: 6,
      assists: 8,
      saves: 0,
      penaltySaves: 0,
      yellowCards: 2,
      redCards: 0,
      ownGoals: 0,
      penaltyMisses: 1,
      minutesPlayed: 810
    },
    lastRoundPoints: 12.4,
    totalPoints: 89.6,
    averagePoints: 10.0
  },
  {
    id: 'mei_002',
    name: 'Raphael Veiga',
    team: 'PAL',
    position: 'MEI',
    price: 8.8,
    photo: '/players/veiga.jpg',
    stats: {
      goals: 5,
      assists: 6,
      saves: 0,
      penaltySaves: 0,
      yellowCards: 3,
      redCards: 0,
      ownGoals: 0,
      penaltyMisses: 0,
      minutesPlayed: 720
    },
    lastRoundPoints: 8.6,
    totalPoints: 76.8,
    averagePoints: 8.5
  },
  
  // Atacantes
  {
    id: 'ata_001',
    name: 'Gabigol',
    team: 'FLA',
    position: 'ATA',
    price: 12.5,
    photo: '/players/gabigol.jpg',
    stats: {
      goals: 12,
      assists: 3,
      saves: 0,
      penaltySaves: 0,
      yellowCards: 1,
      redCards: 0,
      ownGoals: 0,
      penaltyMisses: 2,
      minutesPlayed: 765
    },
    lastRoundPoints: 15.2,
    totalPoints: 108.4,
    averagePoints: 12.0
  },
  {
    id: 'ata_002',
    name: 'Endrick',
    team: 'PAL',
    position: 'ATA',
    price: 11.8,
    photo: '/players/endrick.jpg',
    stats: {
      goals: 10,
      assists: 2,
      saves: 0,
      penaltySaves: 0,
      yellowCards: 2,
      redCards: 0,
      ownGoals: 0,
      penaltyMisses: 1,
      minutesPlayed: 630
    },
    lastRoundPoints: 11.8,
    totalPoints: 94.6,
    averagePoints: 10.5
  }
]

// Função para buscar jogadores por posição
export const getPlayersByPosition = (position) => {
  return players.filter(player => player.position === position)
}

// Função para buscar jogador por ID
export const getPlayerById = (id) => {
  return players.find(player => player.id === id)
}

// Função para buscar jogadores por time
export const getPlayersByTeam = (team) => {
  return players.filter(player => player.team === team)
}

// Função para atualizar pontuação de um jogador
export const updatePlayerStats = (playerId, newStats) => {
  const playerIndex = players.findIndex(player => player.id === playerId)
  if (playerIndex !== -1) {
    players[playerIndex].stats = { ...players[playerIndex].stats, ...newStats }
    players[playerIndex].lastRoundPoints = calculatePoints(players[playerIndex].stats, players[playerIndex].position)
  }
}