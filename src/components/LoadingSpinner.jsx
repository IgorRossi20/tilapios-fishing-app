import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ message = 'Carregando...' }) => {
  return (
    <div className="loading-overlay">
      <div className="loading-container">
        <div className="fish-spinner">
          <svg
            width="60"
            height="60"
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="spinning-fish"
            aria-label="Carregando"
          >
            {/* Corpo do peixe simplificado */}
            <ellipse
              cx="50"
              cy="50"
              rx="25"
              ry="15"
              fill="#0ea5e9"
            />
            
            {/* Cauda */}
            <path
              d="M25 50 L10 40 L15 50 L10 60 Z"
              fill="#0284c7"
            />
            
            {/* Olho */}
            <circle
              cx="60"
              cy="45"
              r="3"
              fill="white"
            />
            <circle
              cx="61"
              cy="44"
              r="1.5"
              fill="#0284c7"
            />
          </svg>
        </div>
        <div className="loading-text">
          <h3>{message}</h3>
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