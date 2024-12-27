## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run start-back`

    Ejecuta el backend del proyecto

### `npm run start-api`

    Ejecuta la api del proyecto

### `npm run start`

    Ejecuta el prompt del proyecto

### `npm run start-app`

    Ejecuta el proyecto entero

# Eliminar la carpeta node_modules y package-lock.json y Reinstalar las dependencias

    rm -rf node_modules package-lock.json
    npm install

## Exportar tu clave api

    export OPENAI_API_KEY="tu_clave_api"

## Crear directorio output

    Crea un directorio output y dale permisos

    mkdir output
    chmod -R 755 output
