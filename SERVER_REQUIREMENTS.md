# Requisitos del Servidor para el Sistema de Bingo

## Eventos que el Frontend Envía al Servidor

### 1. `playerWon`
Cuando un jugador completa una fila, columna o diagonal, el frontend envía:
```javascript
socket.emit('playerWon', {
  clientId: string,
  playerName: string,
  victoryType: 'row' | 'column' | 'diagonal'
});
```

**El servidor debe:**
1. **Detener inmediatamente la generación de números** (si hay un intervalo corriendo, debe cancelarlo)
2. **Cambiar el estado del juego a "detenido"** (`isGameRunning = false`)
3. **Enviar `playerWon` a TODOS los clientes conectados** (broadcast) con:
   ```javascript
   io.emit('playerWon', {
     winnerName: string,  // Nombre del ganador
     victoryType: 'row' | 'column' | 'diagonal',
     clientId: string     // ID del ganador
   });
   ```
4. **Enviar `victoryConfirmed` solo al ganador** para confirmar su victoria:
   ```javascript
   socket.to(winnerClientId).emit('victoryConfirmed', {
     winnerName: string,
     victoryType: 'row' | 'column' | 'diagonal'
   });
   ```

### 2. `setPlayerName`
Cuando un jugador establece su nombre:
```javascript
socket.emit('setPlayerName', {
  clientId: string,
  playerName: string
});
```

**El servidor debe:**
- Guardar el nombre del jugador asociado a su `clientId`
- Usar este nombre cuando se notifique la victoria

## Flujo Completo de Victoria

1. **Jugador gana** → Frontend envía `playerWon`
2. **Servidor recibe `playerWon`**:
   - Detiene generación de números
   - Marca juego como terminado
   - Guarda información del ganador
3. **Servidor notifica a todos**:
   - `io.emit('playerWon', {...})` → Todos los jugadores reciben notificación
   - `socket.to(winnerId).emit('victoryConfirmed', {...})` → Solo el ganador recibe confirmación
4. **Frontend de todos los jugadores**:
   - Detiene el juego localmente
   - Muestra modal con nombre del ganador
   - Permite revisar cartón

## Prevención de Múltiples Victorias

El servidor debe:
- Aceptar solo la primera victoria válida
- Ignorar eventos `playerWon` si el juego ya terminó
- Verificar que el juego esté corriendo antes de procesar la victoria

## Ejemplo de Implementación del Servidor

```javascript
// Cuando se recibe playerWon
socket.on('playerWon', (data) => {
  // Verificar que el juego esté corriendo
  if (!gameState.isGameRunning) {
    return; // Ignorar si el juego ya terminó
  }
  
  // Detener generación de números
  if (numberGenerationInterval) {
    clearInterval(numberGenerationInterval);
    numberGenerationInterval = null;
  }
  
  // Marcar juego como terminado
  gameState.isGameRunning = false;
  gameState.winner = {
    clientId: data.clientId,
    playerName: data.playerName,
    victoryType: data.victoryType
  };
  
  // Notificar a TODOS los jugadores
  io.emit('playerWon', {
    winnerName: data.playerName,
    victoryType: data.victoryType,
    clientId: data.clientId
  });
  
  // Confirmar victoria solo al ganador
  socket.emit('victoryConfirmed', {
    winnerName: data.playerName,
    victoryType: data.victoryType
  });
});
```

## Notas Importantes

- El servidor **NO debe** seguir generando números después de que alguien gane
- El evento `playerWon` debe ser broadcast a **TODOS** los clientes, no solo al ganador
- El servidor debe validar que el juego esté corriendo antes de aceptar victorias
- Una vez que alguien gana, el servidor debe rechazar nuevas victorias hasta que se reinicie el juego

