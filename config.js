// Números de WhatsApp de la demo. Solo se editan aquí.
const DEMO = {
  cliente: 'Dentiident',
  waCliente: '593963911885',   // WhatsApp de Dentiident (0963911885)
  waAgencia: '593983139928'    // WhatsApp de la agencia
};
function wa(numero, texto) {
  return `https://wa.me/${String(numero).replace(/\D/g, '')}?text=${encodeURIComponent(texto)}`;
}
