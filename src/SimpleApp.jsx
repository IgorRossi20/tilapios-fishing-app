import React from 'react'

function SimpleApp() {
  return (
    <div style={{
      padding: '20px',
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f0f0f0',
      minHeight: '100vh'
    }}>
      <h1 style={{ color: '#333' }}>🎣 Tilapios - Teste Simples</h1>
      <p style={{ color: '#666' }}>Se você está vendo esta mensagem, o React está funcionando!</p>
      
      <div style={{
        backgroundColor: 'white',
        padding: '15px',
        borderRadius: '8px',
        marginTop: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h2>Status dos Testes:</h2>
        <ul>
          <li>✅ React carregado</li>
          <li>✅ CSS funcionando</li>
          <li>✅ Componente renderizado</li>
        </ul>
      </div>

      <div style={{
        backgroundColor: '#e8f5e8',
        padding: '15px',
        borderRadius: '8px',
        marginTop: '20px',
        border: '1px solid #4caf50'
      }}>
        <h3>Próximos passos:</h3>
        <p>Agora vamos testar os contextos do Firebase um por vez.</p>
      </div>
    </div>
  )
}

export default SimpleApp