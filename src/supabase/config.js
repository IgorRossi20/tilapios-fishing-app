// Configuração do Supabase
import { createClient } from '@supabase/supabase-js'

// URL e chave anônima do Supabase (serão configuradas via variáveis de ambiente)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Verificar se as variáveis estão configuradas corretamente
const isValidUrl = (url) => {
  try {
    return url && 
           typeof url === 'string' && 
           url.trim() !== '' &&
           url.startsWith('http') && 
           !url.includes('your_supabase') &&
           !url.includes('YOUR_SUPABASE') &&
           !url.includes('undefined')
  } catch {
    return false
  }
}

const isValidKey = (key) => {
  try {
    return key && 
           typeof key === 'string' && 
           key.trim() !== '' &&
           key.length > 10 && 
           !key.includes('your_supabase') &&
           !key.includes('YOUR_SUPABASE') &&
           !key.includes('undefined')
  } catch {
    return false
  }
}

const isSupabaseProperlyConfigured = isValidUrl(supabaseUrl) && isValidKey(supabaseAnonKey)

// Log detalhado para debug
console.log('🔍 Verificação do Supabase:', {
  hasUrl: !!supabaseUrl,
  hasKey: !!supabaseAnonKey,
  urlValid: isValidUrl(supabaseUrl),
  keyValid: isValidKey(supabaseAnonKey),
  configured: isSupabaseProperlyConfigured
})

if (!isSupabaseProperlyConfigured) {
  console.warn('⚠️ Variáveis do Supabase não configuradas corretamente. Storage de imagens não funcionará.')
  console.warn('📝 Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env')
  if (supabaseUrl) console.warn('URL atual:', supabaseUrl)
  if (supabaseAnonKey) console.warn('Key atual:', supabaseAnonKey?.substring(0, 20) + '...')
}

// Criar cliente do Supabase apenas se estiver configurado corretamente
let supabase = null
try {
  if (isSupabaseProperlyConfigured) {
    supabase = createClient(supabaseUrl, supabaseAnonKey)
    console.log('✅ Cliente Supabase criado com sucesso')
  } else {
    console.log('⚠️ Cliente Supabase não criado - configuração inválida')
  }
} catch (error) {
  console.error('❌ Erro ao criar cliente Supabase:', error)
  supabase = null
}

export { supabase }

// Configurações do Storage
export const STORAGE_CONFIG = {
  BUCKET_NAME: 'fishing-images', // Nome do bucket para imagens de pesca
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  FOLDER_CATCHES: 'catches', // Pasta para imagens de capturas
}

// Função para verificar se o Supabase está configurado
export const isSupabaseConfigured = () => {
  return isSupabaseProperlyConfigured && supabase !== null
}

// Função para fazer upload de imagem
export const uploadImageToSupabase = async (file, userId, folder = STORAGE_CONFIG.FOLDER_CATCHES) => {
  try {
    console.log('📤 Iniciando upload para Supabase:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      userId,
      folder
    })

    // Verificar se está configurado
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase não está configurado')
    }

    // Validações
    if (!file || file.size === 0) {
      throw new Error('Arquivo inválido')
    }

    if (file.size > STORAGE_CONFIG.MAX_FILE_SIZE) {
      throw new Error('Arquivo muito grande. Máximo: 5MB')
    }

    if (!STORAGE_CONFIG.ALLOWED_TYPES.includes(file.type)) {
      throw new Error('Tipo de arquivo não permitido. Use: JPEG, PNG ou WebP')
    }

    if (!userId) {
      throw new Error('ID do usuário é obrigatório')
    }

    // Criar nome único para o arquivo
    const timestamp = Date.now()
    const fileExtension = file.name.split('.').pop()
    const fileName = `${folder}/${userId}/${timestamp}.${fileExtension}`

    console.log('📁 Caminho do arquivo:', fileName)

    // Fazer upload
    const { data, error } = await supabase.storage
      .from(STORAGE_CONFIG.BUCKET_NAME)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('❌ Erro no upload:', error)
      throw error
    }

    console.log('✅ Upload concluído:', data)

    // Obter URL pública
    const { data: urlData } = supabase.storage
      .from(STORAGE_CONFIG.BUCKET_NAME)
      .getPublicUrl(fileName)

    if (!urlData?.publicUrl) {
      throw new Error('Erro ao obter URL pública da imagem')
    }

    console.log('🔗 URL pública:', urlData.publicUrl)
    return urlData.publicUrl

  } catch (error) {
    console.error('❌ Erro no upload para Supabase:', error)
    throw error
  }
}

// Função para deletar imagem
export const deleteImageFromSupabase = async (imagePath) => {
  try {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase não está configurado')
    }

    const { error } = await supabase.storage
      .from(STORAGE_CONFIG.BUCKET_NAME)
      .remove([imagePath])

    if (error) {
      console.error('❌ Erro ao deletar imagem:', error)
      throw error
    }

    console.log('✅ Imagem deletada com sucesso')
    return true

  } catch (error) {
    console.error('❌ Erro ao deletar imagem:', error)
    throw error
  }
}

// Exportar apenas se configurado, caso contrário exportar um objeto mock
export default isSupabaseProperlyConfigured ? supabase : {
  storage: {
    from: () => ({
      upload: () => Promise.reject(new Error('Supabase não configurado')),
      remove: () => Promise.reject(new Error('Supabase não configurado')),
      getPublicUrl: () => ({ data: { publicUrl: null } })
    })
  }
}