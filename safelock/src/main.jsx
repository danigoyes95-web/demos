import { render } from 'preact';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import './styles.css';
import App from './ui/App.jsx';
import { swState } from './js/sw-state.js';
import { registerSW } from 'virtual:pwa-register';

swState.update = registerSW({ immediate: true, onNeedRefresh() { swState.needRefresh = true; swState.listeners.forEach(f => f()); } });
render(<App />, document.getElementById('app'));
