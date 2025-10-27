import React from 'react';
import { GameState } from '../types';

interface MessageDisplayProps {
  gameState: GameState;
}

const MessageDisplay: React.FC<MessageDisplayProps> = ({ gameState }) => {
  const getMessage = () => {
    switch (gameState) {
      case GameState.Setup:
        return {
          title: "Configure your game",
          subtitle: "Select your options and press start.",
          color: "text-gray-300"
        };
      case GameState.GetReady:
        return {
          title: "Get Ready...",
          subtitle: "Lights will turn on one by one.",
          color: "text-yellow-400"
        };
      case GameState.Waiting:
        return {
          title: "...",
          subtitle: "Wait for it...",
          color: "text-orange-400"
        };
      case GameState.React:
        return {
          title: "GO!",
          subtitle: "Click Now!",
          color: "text-green-400 shadow-glow-green"
        };
      case GameState.TooSoon:
        return {
          title: "Jump Start!",
          subtitle: "You clicked too soon.",
          color: "text-red-500"
        };
      case GameState.Result:
        return {
          title: "",
          subtitle: "",
          color: "text-gray-400"
        };
      default:
        return { title: "", subtitle: "", color: "" };
    }
  };

  const message = getMessage();

  if (!message.title) return null;

  return (
    <div className={`text-center transition-opacity duration-300 ${message.title ? 'opacity-100' : 'opacity-0'}`}>
      <p className={`text-5xl md:text-6xl font-bold font-orbitron ${message.color}`}>{message.title}</p>
      {message.subtitle && <p className="text-xl text-gray-400 mt-2">{message.subtitle}</p>}
    </div>
  );
};

export default MessageDisplay;