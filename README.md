# RDR Seguridad Privada — Landing

Landing page dinámica para RDR Seguridad Privada. Astro + islas de React, scroll suave con Lenis, animaciones con GSAP y una escena 3D en el hero con three.js. Formulario de contacto con validación, guardado de consultas en MongoDB Atlas y notificación por correo vía Resend.

## Stack

- **Astro** — estructura del sitio, SSR bajo demanda para la API del formulario.
- **React** (`client:load` / `client:visible`) — formulario de contacto y escena 3D del radar.
- **Lenis** + **GSAP/ScrollTrigger** — scroll suave y animaciones de entrada por sección.
- **three.js** — escena 3D del radar en el hero.
- **MongoDB Atlas** (tier M0) — guarda cada consulta recibida. No se pausa por inactividad.
- **Resend** — envía el correo de notificación por cada consulta.
- **Vercel** — hosting y funciones serverless para `/api/contact`.

## Desarrollo local

```sh
npm install
cp .env.example .env   # completar con credenciales reales
npm run dev
```

El sitio queda en `http://localhost:4321`. Sin `MONGODB_URI` configurada, el formulario va a fallar al enviar (es esperable en un entorno sin base de datos).

## Configurar MongoDB Atlas (base de datos que no se pausa)

1. Crear cuenta gratuita en [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas).
2. Crear un cluster **M0 (free tier)** — este tier no se suspende por inactividad (a diferencia de otros proveedores serverless).
3. En **Database Access**, crear un usuario con contraseña.
4. En **Network Access**, agregar `0.0.0.0/0` (o las IPs salientes de Vercel) para permitir conexiones desde las funciones serverless.
5. Copiar el connection string ("Connect" → "Drivers") y pegarlo en `MONGODB_URI`.
6. Las consultas quedan en la base `rdr_seguridad`, colección `consultas`. Se pueden ver directamente desde la pestaña **Collections** del cluster en Atlas.

## Configurar Resend (envío de mails)

1. Crear cuenta en [resend.com](https://resend.com).
2. Generar una API key y ponerla en `RESEND_API_KEY`.
3. Para producción, verificar el dominio propio (o el dominio corporativo una vez armado) en **Domains** de Resend y usarlo en `CONTACT_FROM_EMAIL`. Mientras tanto se puede usar `onboarding@resend.dev` como remitente de prueba.
4. `CONTACT_TO_EMAIL` es la casilla que recibe cada consulta (por defecto `Rdr.seguridadprivada@gmail.com`).

## Deploy en Vercel

1. Subir este proyecto a un repositorio de git (GitHub/GitLab).
2. Importarlo en [vercel.com](https://vercel.com) — Vercel detecta Astro automáticamente.
3. Cargar las variables de entorno (`MONGODB_URI`, `MONGODB_DB_NAME`, `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL`) en **Project Settings → Environment Variables**.
4. Deploy. El dominio propio se puede apuntar después desde **Project Settings → Domains**.

## Estructura

```
src/
├── components/       # secciones de la landing + ContactForm y RadarScene (islas React)
├── layouts/Layout.astro
├── lib/               # schema de validación (zod), conexión a Mongo
├── pages/
│   ├── index.astro
│   └── api/contact.ts # endpoint del formulario
└── styles/global.css
```

## Comandos

| Comando           | Acción                                       |
| :----------------- | :-------------------------------------------- |
| `npm install`       | Instala dependencias                          |
| `npm run dev`       | Servidor local en `localhost:4321`            |
| `npm run build`     | Build de producción a `./dist/`               |
| `npm run preview`   | Previsualiza el build localmente              |
