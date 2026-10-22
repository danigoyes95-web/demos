# Puesta en producción · Carlos Silva

1. **Supabase** → SQL Editor → pega y ejecuta `schema.sql`.
2. **Settings → API → Exposed schemas**: agrega `carlos`.
3. **Authentication → Providers → Email**: desactiva *Allow new users to sign up* (solo entra Carlos) y activa la protección de contraseñas filtradas.
4. **Authentication → Users → Add user**: crea el usuario de Carlos (correo + contraseña fuerte, confirmado).
5. En el SQL Editor, hazlo coach (cambia el correo):
   `insert into carlos.coaches select id from auth.users where email = 'CORREO_DE_CARLOS';`
6. **Settings → API**: copia *Project URL* y la clave **anon** (nunca la `service_role`) en `config.js` → `supabase: { url, anonKey, schema: 'carlos' }`.
7. **Authentication → URL Configuration**: Site URL = dirección donde se publica.
8. Copias de seguridad: el plan gratis de Supabase no las hace diarias; usa plan Pro o exporta los datos cada semana (panel → Datos → Descargar copia).

Con `url` vacío la app corre en modo demo (datos de ejemplo en el navegador).
