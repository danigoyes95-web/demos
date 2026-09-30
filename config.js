// Números de WhatsApp de la demo. Solo se editan aquí.
const DEMO = {
  cliente: 'Dentiident',
  waCliente: '593963911885',   // WhatsApp de Dentiident (0963911885)
  waAgencia: '593XXXXXXXXX'    // CAMBIAR: tu WhatsApp, 593 + número sin el 0 inicial
};
function wa(numero, texto) {
  return `https://wa.me/${String(numero).replace(/\D/g, '')}?text=${encodeURIComponent(texto)}`;
}
