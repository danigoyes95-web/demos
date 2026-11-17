import Jornada from './Jornada.jsx';
import Mapa from './Mapa.jsx';
import Brujula from './Brujula.jsx';
import Registro from './Registro.jsx';
import Cierre from './Cierre.jsx';
export default function Operario({ route }) {
  const [a, id] = route.parts;
  if (a === 'mapa') return <Mapa id={id} />;
  if (a === 'brujula') return <Brujula id={id} />;
  if (a === 'registro') return <Registro id={id} />;
  if (a === 'cierre') return <Cierre />;
  return <Jornada />;
}
