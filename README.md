### Scripts para ejecuciones

### `npm run start-back`

    Ejecuta el backend del proyecto

### `npm run start-api`

    Ejecuta la api del proyecto

### `npm run start`

    Ejecuta el frontend del proyecto

### `npm run start-app`

    Ejecuta el proyecto entero

## SIGUE LOS SIGUIENTES PASOS

### Eliminar la carpeta node_modules y package-lock.json y Reinstalar las dependencias

    rm -rf node_modules package-lock.json
    npm install

### Exportar tu clave api

    export OPENAI_API_KEY="tu_clave_api"

### Crear directorio output

    Crea un directorio output y dale permisos

    mkdir output
    chmod -R 755 output

### en caso de querer ejecutarlo en una maquina en producción, para entorno local dejarlo como está.

    cambiar en /backend/app.js

    // origin: 'http://localhost:3000',
    origin: '\*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
