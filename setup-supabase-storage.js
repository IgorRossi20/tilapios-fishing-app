// Script para configurar o Supabase Storage
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://swpmqihrmqxeriwmfein.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3cG1xaWhybXF4ZXJpd21mZWluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1MDcwMjcsImV4cCI6MjA2NzA4MzAyN30.6s75ykNzZIM9-ZWu6ySAIwZ6jRntRfnsIx5XC0865Pc'

const supabase = createClient(supabaseUrl, supabaseKey)

async function setupStorage() {
  try {
    console.log('🔧 Configurando Supabase Storage...')
    
    // Verificar bucket existente
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      console.error('❌ Erro ao listar buckets:', listError)
      return
    }
    
    console.log('📦 Buckets existentes:', buckets?.map(b => b.name) || [])
    
    const bucketName = 'capturas'
    const bucketExists = buckets?.some(bucket => bucket.name === bucketName)
    
    if (bucketExists) {
      console.log(`✅ Bucket "${bucketName}" encontrado!`)
    } else {
      console.log(`❌ Bucket "${bucketName}" não encontrado!`)
      return
    }
    
    // Testar upload
    console.log('🧪 Testando upload...')
    const testFile = new Blob(['teste'], { type: 'text/plain' })
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('capturas')
      .upload(`test-${Date.now()}.txt`, testFile)
    
    if (uploadError) {
      console.error('❌ Erro no teste de upload:', uploadError)
      console.log('⚠️  Você precisa configurar as políticas de acesso no bucket!')
    } else {
      console.log('✅ Upload funcionando!')
      
      // Limpar arquivo de teste
      await supabase.storage.from('capturas').remove([uploadData.path])
    }
    
    console.log('🎉 Configuração do Supabase Storage concluída!')
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

setupStorage()