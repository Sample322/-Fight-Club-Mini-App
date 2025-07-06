import React from 'react';
import { useParams } from 'react-router-dom';
import BattleField from '../components/Game/BattleField';

const GamePage = () => {
  const { gameId } = useParams();
  
  return <BattleField gameId={gameId} />;
};

export default GamePage;