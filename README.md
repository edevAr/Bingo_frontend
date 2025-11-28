# 🎲 Frontend - Juego de Bingo Digital

Frontend moderno y responsive para el juego de Bingo digital, construido con **React + TypeScript + Vite + PWA**.

## 🚀 Características

- ✅ **PWA (Progressive Web App)**: Instalable en móviles y tablets
- ✅ **Responsive Design**: Funciona perfectamente en celulares, tablets y desktop
- ✅ **Tiempo Real**: Conexión WebSocket con Socket.IO
- ✅ **TypeScript**: Código type-safe
- ✅ **Tailwind CSS**: Diseño moderno y responsive
- ✅ **Zustand**: Estado global ligero y eficiente
- ✅ **Vite**: Build tool súper rápido

## 📦 Requisitos

- Node.js 18.0 o superior
- npm o yarn

## 🔧 Instalación

1. **Instalar dependencias**:
```bash
npm install
```

2. **Configurar variables de entorno** (opcional):
```bash
cp .env.example .env
# Editar .env con la URL de tu servidor
```

3. **Ejecutar en modo desarrollo**:
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

## 🏗️ Build para Producción

```bash
npm run build
```

Los archivos compilados estarán en la carpeta `dist/`.

## 📱 Instalación como PWA

### En Android:
1. Abre la aplicación en Chrome
2. Toca el menú (3 puntos)
3. Selecciona "Agregar a pantalla de inicio"
4. La app se instalará como una app nativa

### En iOS:
1. Abre la aplicación en Safari
2. Toca el botón de compartir
3. Selecciona "Agregar a pantalla de inicio"
4. La app se instalará como una app nativa

### En Desktop:
1. Abre la aplicación en Chrome/Edge
2. Busca el ícono de instalación en la barra de direcciones
3. Haz clic en "Instalar"

## 🎮 Uso

1. **Conectar**: La aplicación se conecta automáticamente al servidor
2. **Iniciar Juego**: Haz clic en "Iniciar Juego" para comenzar
3. **Marcar Números**: Haz clic en los números generados para marcarlos
4. **Ver Estado**: Observa el número actual y los números generados

## 🏗️ Estructura del Proyecto

```
Frontend/
├── src/
│   ├── components/       # Componentes React
│   │   ├── BingoBoard.tsx
│   │   ├── CurrentNumber.tsx
│   │   ├── GameControls.tsx
│   │   ├── GeneratedNumbers.tsx
│   │   └── ConnectionStatus.tsx
│   ├── hooks/            # Custom hooks
│   │   └── useSocket.ts
│   ├── store/            # Estado global (Zustand)
│   │   └── bingoStore.ts
│   ├── App.tsx           # Componente principal
│   ├── main.tsx          # Punto de entrada
│   └── index.css         # Estilos globales
├── public/               # Archivos estáticos
├── index.html            # HTML principal
├── vite.config.ts        # Configuración de Vite
├── tailwind.config.js    # Configuración de Tailwind
└── package.json          # Dependencias
```

## 🎨 Componentes

### BingoBoard
Tablero principal del juego con números del 1 al 75, organizados en columnas B-I-N-G-O.

### CurrentNumber
Muestra el número actual generado por el servidor.

### GameControls
Controles para iniciar, detener y reiniciar el juego.

### GeneratedNumbers
Lista de todos los números generados hasta el momento.

### ConnectionStatus
Indicador visual del estado de conexión con el servidor.

## 🔌 Integración con Backend

La aplicación se conecta automáticamente al servidor Socket.IO configurado en `VITE_SOCKET_URL` (por defecto: `http://localhost:3000`).

### Eventos que escucha:
- `connected`: Estado inicial al conectar
- `newNumber`: Nuevo número generado
- `gameStarted`: Juego iniciado
- `gameStopped`: Juego detenido
- `gameReset`: Juego reiniciado
- `clientConnected`: Nuevo cliente conectado
- `clientDisconnected`: Cliente desconectado
- `status`: Estado del juego

### Eventos que emite:
- `startGame`: Iniciar juego
- `stopGame`: Detener juego
- `resetGame`: Reiniciar juego
- `getStatus`: Solicitar estado

## 🎨 Personalización

### Colores
Edita `tailwind.config.js` para cambiar los colores del tema.

### Estilos
Los estilos están en `src/index.css` usando Tailwind CSS.

### Configuración PWA
Edita `vite.config.ts` en la sección `VitePWA` para personalizar el manifest.

## 🚀 Despliegue

### Vercel (Recomendado)
```bash
npm install -g vercel
vercel
```

### Netlify
```bash
npm install -g netlify-cli
netlify deploy --prod
```

### GitHub Pages
```bash
npm run build
# Subir la carpeta dist/ a GitHub Pages
```

## 📱 Responsive Design

La aplicación está optimizada para:
- 📱 **Móviles**: 320px - 640px
- 📱 **Tablets**: 641px - 1024px
- 💻 **Desktop**: 1025px+

## 🔧 Scripts Disponibles

- `npm run dev`: Inicia servidor de desarrollo
- `npm run build`: Compila para producción
- `npm run preview`: Previsualiza el build de producción
- `npm run lint`: Ejecuta el linter

## 📝 Notas

- La PWA funciona offline después de la primera carga
- Los números se sincronizan en tiempo real con todos los jugadores
- El diseño es completamente responsive
- Optimizado para rendimiento y carga rápida

## 🆘 Troubleshooting

### No se conecta al servidor
- Verifica que el backend esté corriendo
- Revisa la variable `VITE_SOCKET_URL` en `.env`
- Verifica la consola del navegador para errores

### La PWA no se instala
- Asegúrate de usar HTTPS en producción
- Verifica que el manifest esté correctamente configurado
- En iOS, solo funciona desde Safari

## 📄 Licencia

ISC


# Bingo_frontend
