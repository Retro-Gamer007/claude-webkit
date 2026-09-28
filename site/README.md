# Transportes Hermanos Ordaz

Página para clientes + panel para los choferes.

| Ruta | Quién la usa | Qué hace |
|------|--------------|----------|
| `/` | Clientes | Servicios, viajes largos, los 4 hermanos con su WhatsApp y el formulario **Pedir viaje**, que toma la ubicación por GPS |
| `/choferes` | Los 4 hermanos | Viajes en espera en tiempo real, alerta con sonido, **Aceptar viaje** (solo uno se lo queda) y botones de Google Maps, Waze, WhatsApp y llamada |

## Correr en local

```bash
npm install
npm run dev
```

Sin configurar nada, la app arranca en **modo demo**. Los pedidos se guardan en el navegador, así que puedes abrir `/` en una pestaña y `/choferes` en otra para probar todo el flujo.

## Conectar la base de datos real (Supabase, gratis)

1. Crea una cuenta y un proyecto en <https://supabase.com>.
2. En **SQL Editor**, pega todo el contenido de `supabase/schema.sql` y dale **Run**.
3. En **Authentication → Users → Add user**, crea un usuario por hermano (correo + contraseña, con "Auto Confirm User").
4. Vuelve al SQL Editor y corre los `insert into public.drivers ...` que están al final de `schema.sql`, cambiando los correos.
5. En **Authentication → Sign In / Providers**, desactiva **Allow new users to sign up**. Así nadie más puede crearse una cuenta.
6. Copia `.env.example` a `.env.local` y pega la URL y la *anon key* (Project Settings → API).
   En Vercel, agrega esas mismas dos variables en Settings → Environment Variables.

## Instalar el panel en el celular de cada hermano

Abre `https://<tu-dominio>/choferes` en el teléfono:
- **Android (Chrome):** menú ⋮ → *Agregar a la pantalla principal*.
- **iPhone (Safari):** botón compartir → *Agregar a inicio*.

Al entrar, toca **"Activar el sonido de viajes nuevos"**. El navegador no deja sonar alertas si no tocas algo primero.

> La alerta suena mientras el panel esté abierto (aunque sea en segundo plano). Si quieren notificaciones con la app cerrada, el siguiente paso es agregar Web Push.

## Cambiar nombres y teléfonos

Todo está en `src/lib/config.ts`. Si cambias un nombre, cámbialo también en la tabla `drivers` de Supabase.
