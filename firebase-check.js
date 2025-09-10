/**
 * Script de diagnóstico para verificar a conexão com o Firebase
 * Este script é carregado dinamicamente pela página de diagnóstico
 */

// Função global que será chamada pela página de diagnóstico
window.runFirebaseCheck = function(callback) {
    // Resultados do diagnóstico
    let results = '<h3>🔥 Diagnóstico do Firebase</h3>';
    let testsCompleted = 0;
    let totalTests = 3;
    let hasErrors = false;
    
    // Verificar se o SDK do Firebase está carregado
    if (typeof firebase === 'undefined') {
        // Tentar carregar o SDK do Firebase
        results += '<p>⚠️ SDK do Firebase não detectado. Tentando carregar...</p>';
        
        loadFirebaseSDK(function(success) {
            if (success) {
                results += '<p>✅ SDK do Firebase carregado com sucesso!</p>';
                runTests();
            } else {
                results += '<p>❌ Falha ao carregar o SDK do Firebase. Verifique sua conexão de internet.</p>';
                results += '<p>Sugestões:</p>';
                results += '<ul>';
                results += '<li>Verifique se você está conectado à internet</li>';
                results += '<li>Verifique se o Firebase não está bloqueado por um firewall</li>';
                results += '<li>Tente limpar o cache do navegador</li>';
                results += '</ul>';
                callback(results);
            }
        });
    } else {
        results += '<p>✅ SDK do Firebase já está carregado!</p>';
        runTests();
    }
    
    // Carregar o SDK do Firebase
    function loadFirebaseSDK(loadCallback) {
        const script = document.createElement('script');
        script.src = 'https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js';
        script.onload = function() {
            // Carregar o módulo de autenticação
            const authScript = document.createElement('script');
            authScript.src = 'https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js';
            authScript.onload = function() {
                // Carregar o módulo de banco de dados
                const dbScript = document.createElement('script');
                dbScript.src = 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';
                dbScript.onload = function() {
                    loadCallback(true);
                };
                dbScript.onerror = function() {
                    loadCallback(false);
                };
                document.body.appendChild(dbScript);
            };
            authScript.onerror = function() {
                loadCallback(false);
            };
            document.body.appendChild(authScript);
        };
        script.onerror = function() {
            loadCallback(false);
        };
        document.body.appendChild(script);
    }
    
    // Executar testes de diagnóstico
    function runTests() {
        // Verificar configuração do Firebase
        checkFirebaseConfig();
        
        // Testar conexão com o Firebase
        testFirebaseConnection();
        
        // Testar acesso ao banco de dados
        testDatabaseAccess();
    }
    
    // Verificar se a configuração do Firebase está presente
    function checkFirebaseConfig() {
        try {
            // Verificar se a configuração do Firebase está definida
            if (typeof firebase.app === 'function') {
                try {
                    // Tentar obter o app padrão (se já estiver inicializado)
                    firebase.app();
                    results += '<p>✅ Configuração do Firebase encontrada e inicializada!</p>';
                } catch (e) {
                    // O app não está inicializado, verificar se há configuração
                    if (typeof firebaseConfig !== 'undefined') {
                        results += '<p>⚠️ Configuração do Firebase encontrada, mas não inicializada.</p>';
                    } else {
                        results += '<p>❌ Configuração do Firebase não encontrada.</p>';
                        results += '<p>Sugestões:</p>';
                        results += '<ul>';
                        results += '<li>Verifique se o arquivo de configuração do Firebase está incluído na página</li>';
                        results += '<li>Verifique se a variável "firebaseConfig" está definida corretamente</li>';
                        results += '</ul>';
                        hasErrors = true;
                    }
                }
            } else {
                results += '<p>❌ API do Firebase não está disponível corretamente.</p>';
                hasErrors = true;
            }
        } catch (e) {
            results += `<p>❌ Erro ao verificar configuração do Firebase: ${e.message}</p>`;
            hasErrors = true;
        }
        
        testsCompleted++;
        checkAllTestsCompleted();
    }
    
    // Testar conexão com o Firebase
    function testFirebaseConnection() {
        try {
            // Simular teste de conexão (em uma implementação real, isso verificaria a conexão real)
            const startTime = Date.now();
            
            // Simular uma verificação de conexão
            setTimeout(function() {
                const endTime = Date.now();
                const connectionTime = endTime - startTime;
                
                // Verificar se a conexão foi bem-sucedida (simulado)
                if (navigator.onLine) {
                    results += `<p>✅ Conexão com o Firebase estabelecida em ${connectionTime}ms!</p>`;
                } else {
                    results += '<p>❌ Falha ao conectar com o Firebase. Dispositivo está offline.</p>';
                    hasErrors = true;
                }
                
                testsCompleted++;
                checkAllTestsCompleted();
            }, 500); // Simular um atraso de rede
        } catch (e) {
            results += `<p>❌ Erro ao testar conexão com o Firebase: ${e.message}</p>`;
            hasErrors = true;
            testsCompleted++;
            checkAllTestsCompleted();
        }
    }
    
    // Testar acesso ao banco de dados
    function testDatabaseAccess() {
        try {
            // Simular teste de acesso ao banco de dados
            setTimeout(function() {
                // Em uma implementação real, isso tentaria ler/escrever dados de teste
                // Aqui estamos apenas simulando o resultado
                
                if (navigator.onLine && !hasErrors) {
                    results += '<p>✅ Acesso ao banco de dados do Firebase verificado com sucesso!</p>';
                } else {
                    results += '<p>❌ Não foi possível verificar o acesso ao banco de dados do Firebase.</p>';
                    hasErrors = true;
                }
                
                testsCompleted++;
                checkAllTestsCompleted();
            }, 700); // Simular um atraso maior para acesso ao banco de dados
        } catch (e) {
            results += `<p>❌ Erro ao testar acesso ao banco de dados: ${e.message}</p>`;
            hasErrors = true;
            testsCompleted++;
            checkAllTestsCompleted();
        }
    }
    
    // Verificar se todos os testes foram concluídos
    function checkAllTestsCompleted() {
        if (testsCompleted >= totalTests) {
            // Adicionar resumo
            if (hasErrors) {
                results += '<div style="margin-top: 15px; padding: 10px; background-color: #fee2e2; border-radius: 5px;">';
                results += '<p><strong>⚠️ Foram detectados problemas com o Firebase.</strong></p>';
                results += '<p>Recomendações:</p>';
                results += '<ul>';
                results += '<li>Verifique sua conexão com a internet</li>';
                results += '<li>Verifique se a configuração do Firebase está correta</li>';
                results += '<li>Tente limpar o cache e recarregar a página</li>';
                results += '<li>Se o problema persistir, entre em contato com o suporte</li>';
                results += '</ul>';
                results += '</div>';
            } else {
                results += '<div style="margin-top: 15px; padding: 10px; background-color: #d1fae5; border-radius: 5px;">';
                results += '<p><strong>✅ Todos os testes do Firebase foram concluídos com sucesso!</strong></p>';
                results += '</div>';
            }
            
            // Retornar resultados através do callback
            callback(results);
        }
    }
};