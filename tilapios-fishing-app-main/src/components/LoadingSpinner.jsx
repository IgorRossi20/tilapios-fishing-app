import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ message = 'Carregando...' }) => {
  return (
    <div className="loading-overlay">
      <div className="loading-container">
        <div className="simple-spinner"></div>
        <div className="loading-text">
          <h3>{message}</h3>
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner;