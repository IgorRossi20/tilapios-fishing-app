// Utilitário para compressão de imagens
// Garante que todas as imagens sejam reduzidas para no máximo 5MB

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB em bytes
const MAX_WIDTH = 1920; // Largura máxima
const MAX_HEIGHT = 1080; // Altura máxima
const QUALITY_STEP = 0.1; // Redução da qualidade por iteração
const MIN_QUALITY = 0.3; // Qualidade mínima

/**
 * Comprime uma imagem para garantir que não exceda 5MB
 * @param {File} file - Arquivo de imagem original
 * @param {number} maxSizeBytes - Tamanho máximo em bytes (padrão: 5MB)
 * @returns {Promise<File>} - Arquivo comprimido
 */
export const compressImage = async (file, maxSizeBytes = MAX_FILE_SIZE) => {
  return new Promise((resolve, reject) => {
    // Verificar se é uma imagem
    if (!file.type.startsWith('image/')) {
      reject(new Error('Arquivo deve ser uma imagem'));
      return;
    }

    // Se já está dentro do limite, retornar o arquivo original
    if (file.size <= maxSizeBytes) {
      console.log('✅ Imagem já está dentro do limite de tamanho:', formatFileSize(file.size));
      resolve(file);
      return;
    }

    console.log('📏 Tamanho original:', formatFileSize(file.size));
    console.log('🎯 Tamanho alvo:', formatFileSize(maxSizeBytes));

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      try {
        // Calcular novas dimensões mantendo proporção
        const { width, height } = calculateDimensions(img.width, img.height);
        
        canvas.width = width;
        canvas.height = height;

        console.log(`📐 Redimensionando de ${img.width}x${img.height} para ${width}x${height}`);

        // Desenhar imagem redimensionada
        ctx.drawImage(img, 0, 0, width, height);

        // Otimização: Calcular qualidade inicial com base na taxa de compressão necessária
        const initialQuality = Math.max(MIN_QUALITY, Math.min(0.9, maxSizeBytes / file.size));
        console.log(`📉 Qualidade inicial estimada: ${Math.round(initialQuality * 100)}%`);

        // Tentar comprimir com a qualidade estimada
        compressWithQuality(canvas, file.name, file.type, maxSizeBytes, initialQuality)
          .then(resolve)
          .catch(reject);

      } catch (error) {
        reject(new Error('Erro ao processar imagem: ' + error.message));
      }
    };

    img.onerror = () => {
      reject(new Error('Erro ao carregar imagem'));
    };

    // Carregar imagem
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target.result;
    };
    reader.onerror = () => {
      reject(new Error('Erro ao ler arquivo'));
    };
    reader.readAsDataURL(file);
  });
};

/**
 * Calcula novas dimensões mantendo proporção
 */
const calculateDimensions = (originalWidth, originalHeight) => {
  let { width, height } = { width: originalWidth, height: originalHeight };

  // Reduzir se exceder dimensões máximas
  if (width > MAX_WIDTH) {
    height = (height * MAX_WIDTH) / width;
    width = MAX_WIDTH;
  }

  if (height > MAX_HEIGHT) {
    width = (width * MAX_HEIGHT) / height;
    height = MAX_HEIGHT;
  }

  return {
    width: Math.round(width),
    height: Math.round(height)
  };
};

/**
 * Comprime com qualidade variável até atingir tamanho desejado
 */
const compressWithQuality = async (canvas, fileName, mimeType, maxSizeBytes, initialQuality = 0.9) => {
  let quality = initialQuality;
  let attempts = 0;
  const maxAttempts = 5; // Reduzir o número de tentativas

  // Garantir que o tipo MIME seja suportado para compressão
  const outputMimeType = mimeType === 'image/png' ? 'image/jpeg' : mimeType;

  while (attempts < maxAttempts) {
    const blob = await new Promise(resolve => {
      canvas.toBlob(resolve, outputMimeType, quality);
    });

    console.log(`🔄 Tentativa ${attempts + 1}: Qualidade ${Math.round(quality * 100)}%, Tamanho: ${formatFileSize(blob.size)}`);

    if (blob.size <= maxSizeBytes || quality <= MIN_QUALITY) {
      // Criar arquivo com nome apropriado
      const extension = outputMimeType === 'image/jpeg' ? '.jpg' : getExtensionFromMimeType(outputMimeType);
      const finalFileName = fileName.replace(/\.[^/.]+$/, '') + extension;
      
      const compressedFile = new File([blob], finalFileName, {
        type: outputMimeType,
        lastModified: Date.now()
      });

      console.log('✅ Compressão concluída:', formatFileSize(compressedFile.size));
      return compressedFile;
    }

    quality -= QUALITY_STEP;
    attempts++;
  }

  throw new Error('Não foi possível comprimir a imagem para o tamanho desejado');
};

/**
 * Obtém extensão do arquivo baseada no MIME type
 */
const getExtensionFromMimeType = (mimeType) => {
  const extensions = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/gif': '.gif'
  };
  return extensions[mimeType] || '.jpg';
};

/**
 * Formata tamanho do arquivo para exibição
 */
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Valida se o arquivo é uma imagem suportada
 */
export const validateImageFile = (file) => {
  const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  if (!file) {
    throw new Error('Nenhum arquivo selecionado');
  }
  
  if (!supportedTypes.includes(file.type)) {
    throw new Error('Tipo de arquivo não suportado. Use JPEG, PNG ou WebP');
  }
  
  // Limite máximo de 50MB para arquivo original (antes da compressão)
  const maxOriginalSize = 50 * 1024 * 1024;
  if (file.size > maxOriginalSize) {
    throw new Error('Arquivo muito grande. Máximo: 50MB');
  }
  
  return true;
};

export default {
  compressImage,
  validateImageFile,
  MAX_FILE_SIZE
};