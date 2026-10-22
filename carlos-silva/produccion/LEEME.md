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

## Fotos del check-in
`schema.sql` crea el bucket privado `fotos` (solo JPEG, máx. 5 MB) y sus reglas: cada cliente solo sube y ve su propia carpeta; Carlos ve todas. No hay que configurar nada más en Storage. Las fotos se reducen en el celular antes de subirse.

## Avisos
- **Mensualidad:** Carlos fija la fecha de vencimiento en el perfil del cliente (botón *Renovar +30 días*). El cliente ve un aviso en su portal desde 7 días antes; Carlos lo ve en el Resumen con un botón de WhatsApp.
- **Check-in del sábado:** desde el viernes 18:00 el portal avisa *"Mañana es tu check-in"* y el Resumen de Carlos lista quién falta, con botón de WhatsApp para recordar.
- Los avisos aparecen al abrir el portal y, si el cliente los activa, como notificación del navegador. **Un aviso que llegue al celular con la app cerrada** requiere notificaciones push (instalar el portal como app + un servicio programado en Supabase); no está incluido todavía.

Con `url` vacío la app corre en modo demo (datos de ejemplo en el navegador).
