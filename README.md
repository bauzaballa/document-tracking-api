# Gestión de Direcciones - API

API del gestion de direcciones

## Instalación

Instalar [Node.js](https://nodejs.org/) v18+ para ejecutarlo.

Instalar todas las dependencias

```sh
npm install
```

## Comandos

Para ejecutar en modo desarrollo

```sh
npm run dev
```

Para ejecutar en producción

```sh
npm start
```

Para hacer migraciones a la base de datos

crear una migración

```sh
npx sequelize-cli migration:generate --name name_file
```
```sh
npm run migrate
```

Deshacer la última migración

```sh
npm run migrate:rollback
```

Deshacer todas las migraciones

```sh
npm run migrate:rollback:all
```

Generar un archivo seeder

```sh
npx sequelize-cli seed:generate --name name_file
```

Para ejecutar los seeders creados

```sh
npm run seeders
```

Deshacer la última migración de seeders

```sh
npm run seeders:rollback
```

Deshacer todas las migraciones de seeders

```sh
npm run seeders:rollback:all
```

Para más comandos usando migraciones de [sequelize-cli (Ej. crear modelos, seeders, etc)](https://sequelize.org/docs/v6/other-topics/migrations/)

## Ramas

### main

Versión actual en producción

### dev

Version actual en test