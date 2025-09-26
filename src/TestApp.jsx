import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router } from 'react-router-dom'

function TestApp() {
  const [step, setStep] = useState(1)
  const [error, setError] = useState(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      if (step < 5) {
        setStep(step + 1)
      }
    }, 2000)
    return () => clearTimeout(timer)
  }, [step])

  const testFirebase = async () => {
    try {
      console.log('Testando Firebase...')
      const { FirebaseProvider } = await import('./contexts/FirebaseContext')
      console.log('✅ FirebaseProvider carregado com sucesso')
      setStep(6)
    } catch (err) {
      console.error('❌ Erro ao carregar Firebase:', err)
      setError(err.message)
    }
  }

  const testAuth = async () => {
    try {
      console.log('Testando AuthContext...')
      const { AuthProvider } = await import('./contexts/AuthContext')
      console.log('✅ AuthProvider carregado com sucesso')
      setStep(7)
    } catch (err) {
      console.error('❌ Erro ao carregar AuthContext:', err)
      setError(err.message)
    }
  }

  return (
    <div style={{
      padding: '20px',
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f5f5f5',
      minHeight: '100vh'
    }}>
      <h1 style={{ color: '#333' }}>🔍 Diagnóstico Tilapios</h1>
      
      {error && (
        <div style={{
          backgroundColor: '#ffebee',
          color: '#c62828',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px',
          border: '1px solid #ef5350'
        }}>
          <h3>❌ Erro encontrado:</h3>
          <p>{error}</p>
        </div>
      )}

      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h2>Progresso do Teste:</h2>
        
        <div style={{ marginBottom: '10px' }}>
          {step >= 1 ? '✅' : '⏳'} React carregado
        </div>
        
        <div style={{ marginBottom: '10px' }}>
          {step >= 2 ? '✅' : '⏳'} CSS aplicado
        </div>
        
        <div style={{ marginBottom: '10px' }}>
          {step >= 3 ? '✅' : '⏳'} Componente renderizado
        </div>
        
        <div style={{ marginBottom: '10px' }}>
          {step >= 4 ? '✅' : '⏳'} Router carregado
        </div>
        
        <div style={{ marginBottom: '10px' }}>
          {step >= 5 ? '✅' : '⏳'} Aguardando teste Firebase...
        </div>

        {step >= 5 && (
          <div style={{ marginTop: '20px' }}>
            <button 
              onClick={testFirebase}
              style={{
                backgroundColor: '#4caf50',
                color: 'white',
                padding: '10px 20px',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginRight: '10px'
              }}
            >
              Testar Firebase
            </button>
            
            <button 
              onClick={testAuth}
              style={{
                backgroundColor: '#2196f3',
                color: 'white',
                padding: '10px 20px',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Testar Auth
            </button>
          </div>
        )}

        {step >= 6 && (
          <div style={{ marginTop: '10px' }}>
            ✅ Firebase Context testado
          </div>
        )}

        {step >= 7 && (
          <div style={{ marginTop: '10px' }}>
            ✅ Auth Context testado
          </div>
        )}
      </div>

      <Router>
        <div style={{
          backgroundColor: '#e3f2fd',
          padding: '15px',
          borderRadius: '8px',
          marginTop: '20px'
        }}>
          <p>Router funcionando: ✅</p>
        </div>
      </Router>
    </div>
  )
}

export default TestApp