// api/middleware/jwt-check.cjs
// Ten plik możesz dodać na początku uruchamiania serwera

/**
 * Funkcja sprawdzająca poprawność konfiguracji JWT_SECRET
 * Należy ją uruchomić przy starcie aplikacji
 */
function checkJWTSecret() {
    const secret = process.env.JWT_SECRET;
    
    if (!secret) {
      console.error('UWAGA: Nie znaleziono JWT_SECRET w zmiennych środowiskowych!');
      console.error('Generowanie tokenów JWT nie będzie działać poprawnie.');
      console.error('Upewnij się, że plik .env zawiera zmienną JWT_SECRET.');
      
      // Możesz zastąpić proces.exit(1) komunikatem ostrzegawczym, jeśli nie chcesz zatrzymywać serwera
      // process.exit(1); 
      return false;
    }
    
    if (secret.length < 32) {
      console.warn('OSTRZEŻENIE: JWT_SECRET jest zbyt krótki (mniej niż 32 znaki).');
      console.warn('Dla zapewnienia bezpieczeństwa, użyj dłuższego i bardziej złożonego klucza.');
      return false;
    }
    
    console.log('JWT_SECRET jest poprawnie skonfigurowany.');
    return true;
  }
  
  module.exports = checkJWTSecret;