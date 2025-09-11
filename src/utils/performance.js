// Utilitários de performance para otimização do app
import { useState, useEffect } from 'react'

/**
 * Hook personalizado para debouncing de valores
 * @param {any} value - Valor a ser debounced
 * @param {number} delay - Delay em millisegundos
 * @returns {any} Valor debounced
 */
export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

/**
 * Função para throttling de eventos
 * @param {Function} func - Função a ser throttled
 * @param {number} limit - Limite em millisegundos
 * @returns {Function} Função throttled
 */
export const throttle = (func, limit) => {
  let inThrottle
  return function() {
    const args = arguments
    const context = this
    if (!inThrottle) {
      func.apply(context, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

/**
 * Função para debouncing de eventos
 * @param {Function} func - Função a ser debounced
 * @param {number} wait - Tempo de espera em millisegundos
 * @param {boolean} immediate - Se deve executar imediatamente
 * @returns {Function} Função debounced
 */
export const debounce = (func, wait, immediate) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      timeout = null
      if (!immediate) func(...args)
    }
    const callNow = immediate && !timeout
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
    if (callNow) func(...args)
  }
}

/**
 * Hook para intersection observer (lazy loading)
 * @param {Object} options - Opções do intersection observer
 * @returns {Array} [ref, isIntersecting]
 */
export const useIntersectionObserver = (options = {}) => {
  const [isIntersecting, setIsIntersecting] = useState(false)
  const [ref, setRef] = useState(null)

  useEffect(() => {
    if (!ref) return

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting)
    }, {
      threshold: 0.1,
      rootMargin: '50px',
      ...options
    })

    observer.observe(ref)

    return () => {
      observer.disconnect()
    }
  }, [ref, options])

  return [setRef, isIntersecting]
}

/**
 * Hook para virtual scrolling
 * @param {Array} items - Lista de itens
 * @param {number} itemHeight - Altura de cada item
 * @param {number} containerHeight - Altura do container
 * @returns {Object} Dados para virtual scrolling
 */
export const useVirtualScroll = (items, itemHeight, containerHeight) => {
  const [scrollTop, setScrollTop] = useState(0)
  
  const visibleCount = Math.ceil(containerHeight / itemHeight)
  const startIndex = Math.floor(scrollTop / itemHeight)
  const endIndex = Math.min(startIndex + visibleCount + 1, items.length)
  
  const visibleItems = items.slice(startIndex, endIndex)
  const offsetY = startIndex * itemHeight
  
  return {
    visibleItems,
    offsetY,
    totalHeight: items.length * itemHeight,
    onScroll: (e) => setScrollTop(e.target.scrollTop)
  }
}

/**
 * Função para preload de imagens
 * @param {string} src - URL da imagem
 * @returns {Promise} Promise que resolve quando a imagem carrega
 */
export const preloadImage = (src) => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

/**
 * Hook para cache de dados
 * @param {string} key - Chave do cache
 * @param {Function} fetcher - Função para buscar dados
 * @param {number} ttl - Time to live em millisegundos
 * @returns {Object} Dados do cache
 */
export const useCache = (key, fetcher, ttl = 5 * 60 * 1000) => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const cachedData = localStorage.getItem(`cache_${key}`)
    const cachedTime = localStorage.getItem(`cache_time_${key}`)
    
    if (cachedData && cachedTime) {
      const age = Date.now() - parseInt(cachedTime)
      if (age < ttl) {
        setData(JSON.parse(cachedData))
        setLoading(false)
        return
      }
    }

    const fetchData = async () => {
      try {
        setLoading(true)
        const result = await fetcher()
        setData(result)
        localStorage.setItem(`cache_${key}`, JSON.stringify(result))
        localStorage.setItem(`cache_time_${key}`, Date.now().toString())
        setError(null)
      } catch (err) {
        setError(err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [key, fetcher, ttl])

  return { data, loading, error }
}

/**
 * Função para otimizar re-renders
 * @param {Function} fn - Função a ser memoizada
 * @param {Array} deps - Dependências
 * @returns {Function} Função memoizada
 */
export const memoize = (fn, deps = []) => {
  const cache = new Map()
  
  return (...args) => {
    const key = JSON.stringify([...args, ...deps])
    
    if (cache.has(key)) {
      return cache.get(key)
    }
    
    const result = fn(...args)
    cache.set(key, result)
    
    // Limitar tamanho do cache
    if (cache.size > 100) {
      const firstKey = cache.keys().next().value
      cache.delete(firstKey)
    }
    
    return result
  }
}

/**
 * Hook para detectar dispositivos móveis
 * @returns {boolean} Se é dispositivo móvel
 */
export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth <= 768)
    }

    checkDevice()
    window.addEventListener('resize', checkDevice)

    return () => window.removeEventListener('resize', checkDevice)
  }, [])

  return isMobile
}

/**
 * Hook para detectar conexão lenta
 * @returns {boolean} Se a conexão é lenta
 */
export const useSlowConnection = () => {
  const [isSlowConnection, setIsSlowConnection] = useState(false)

  useEffect(() => {
    if ('connection' in navigator) {
      const connection = navigator.connection
      const checkConnection = () => {
        setIsSlowConnection(
          connection.effectiveType === 'slow-2g' || 
          connection.effectiveType === '2g' ||
          connection.downlink < 1
        )
      }

      checkConnection()
      connection.addEventListener('change', checkConnection)

      return () => connection.removeEventListener('change', checkConnection)
    }
  }, [])

  return isSlowConnection
}