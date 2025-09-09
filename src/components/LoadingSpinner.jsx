import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = () => {
  return (
    <div className="loading-overlay">
      <div className="loading-container">
        <div className="fish-spinner">
          <svg
            width="80"
            height="80"
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="spinning-fish"
          >
            {/* Corpo do peixe */}
            <ellipse
              cx="50"
              cy="50"
              rx="25"
              ry="15"
              fill="#0ea5e9"
              stroke="#0284c7"
              strokeWidth="2"
            />
            
            {/* Cauda */}
            <path
              d="M25 50 L10 40 L15 50 L10 60 Z"
              fill="#0ea5e9"
              stroke="#0284c7"
              strokeWidth="2"
            />
            
            {/* Barbatana dorsal */}
            <path
              d="M45 35 L50 25 L55 35"
              fill="none"
              stroke="#0284c7"
              strokeWidth="2"
              strokeLinecap="round"
            />
            
            {/* Barbatana ventral */}
            <path
              d="M45 65 L50 75 L55 65"
              fill="none"
              stroke="#0284c7"
              strokeWidth="2"
              strokeLinecap="round"
            />
            
            {/* Olho */}
            <circle
              cx="60"
              cy="45"
              r="4"
              fill="white"
              stroke="#0284c7"
              strokeWidth="1"
            />
            <circle
              cx="62"
              cy="43"
              r="2"
              fill="#0284c7"
            />
            
            {/* Escamas decorativas */}
            <circle cx="45" cy="45" r="2" fill="#38bdf8" opacity="0.7" />
            <circle cx="55" cy="50" r="2" fill="#38bdf8" opacity="0.7" />
            <circle cx="50" cy="55" r="2" fill="#38bdf8" opacity="0.7" />
          </svg>
        </div>
        <div className="loading-text">
          <h3>Carregando...</h3>
          <div className="loading-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner;