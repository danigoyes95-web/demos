# Puesta en producción · Carlos Silva

1. **Supabase** → SQL Editor → pega y ejecuta `schema.sql` (una sola vez).
2. **Settings → API → Exposed schemas**: agrega `carlos`.
3. **Authentication → Providers → Email**: deja *Allow new users to sign up* **activado** (los clientes crean su cuenta). Sin el código que da Carlos, una cuenta nueva no ve nada. Activa *Confirm email* y la protección de contraseñas filtradas. Recomendado: activar CAPTCHA (Authentication → Attack Protection) para evitar cuentas basura.
4. **Authentication → Users → Add user**: crea el usuario de Carlos (correo + contraseña fuerte, confirmado).
5. En el SQL Editor, hazlo coach (cambia el correo):
   `insert into carlos.coaches select id from auth.users where email = 'CORREO_DE_CARLOS';`
6. **Settings → API**: copia *Project URL* y la clave **anon** (nunca la `service_role`) en `config.js` → `supabase: { url, anonKey, schema: 'carlos' }`.
7. **Authentication → URL Configuration**: Site URL = dirección donde se publica (para el correo de "olvidé mi clave").
8. Copias de seguridad: el plan gratis de Supabase no las hace diarias; usa plan Pro o descarga la copia desde el panel (Datos) cada semana.

## Cómo funciona el acceso del cliente
Carlos, en el panel del cliente → *PDF y acceso* → **Generar código de invitación** y lo envía por WhatsApp.
El cliente abre `cliente.html`, **crea su cuenta** (correo + clave propia), pega el código y queda vinculado. El código es de un solo uso.
El cliente solo puede: ver su plan, marcar ejercicios/comidas y reportar peso/esfuerzo. Carlos ve ese avance en el panel.
Si el cliente cambia de celular, entra con su correo; si olvida la clave, la recupera por correo. *Quitar acceso* lo desvincula.

Con `url` vacío la app corre en modo demo (datos de ejemplo en el navegador).
