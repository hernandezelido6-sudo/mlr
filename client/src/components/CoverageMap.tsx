import { ExternalLink, MapPin, Route, Send } from "lucide-react";
import { useState } from "react";

export const coverageRoutes = [
  { id: "la", origin: "Las Vegas, NV", destination: "Los Angeles, CA", distance: "270 mi", time: "4 h aprox.", path: "M322 253 C268 252 229 284 174 320", marker: { x: 174, y: 320 }, label: { x: 112, y: 349 } },
  { id: "phx", origin: "Las Vegas, NV", destination: "Phoenix, AZ", distance: "300 mi", time: "4 h 30 min aprox.", path: "M322 253 C372 278 426 309 465 354", marker: { x: 465, y: 354 }, label: { x: 442, y: 384 } },
  { id: "slc", origin: "Las Vegas, NV", destination: "Salt Lake City, UT", distance: "420 mi", time: "6 h aprox.", path: "M322 253 C350 205 384 164 425 119", marker: { x: 425, y: 119 }, label: { x: 397, y: 90 } },
  { id: "den", origin: "Las Vegas, NV", destination: "Denver, CO", distance: "750 mi", time: "11 h aprox.", path: "M322 253 C436 234 531 224 625 205", marker: { x: 625, y: 205 }, label: { x: 603, y: 176 } },
] as const;

export function buildDirectionsUrl(origin: string, destination: string) {
  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=driving`;
}

export function CoverageMap() {
  const [selectedId, setSelectedId] = useState<(typeof coverageRoutes)[number]["id"]>("la");
  const selected = coverageRoutes.find(route => route.id === selectedId) ?? coverageRoutes[0];
  const directionsUrl = buildDirectionsUrl(selected.origin, selected.destination);

  return (
    <div className="coverage-map-shell">
      <div className="coverage-map-canvas route-visual" aria-label="Mapa visual de rutas orientativas desde Las Vegas">
        <svg viewBox="0 0 760 480" role="img" aria-labelledby="route-map-title route-map-description">
          <title id="route-map-title">Rutas orientativas desde Las Vegas</title>
          <desc id="route-map-description">Mapa visual interactivo que permite seleccionar recorridos orientativos desde Las Vegas hacia Los Angeles, Phoenix, Salt Lake City y Denver.</desc>
          <defs>
            <pattern id="route-grid" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M32 0H0V32" fill="none" stroke="#143040" strokeWidth=".6" opacity=".14" /></pattern>
            <filter id="route-glow"><feGaussianBlur stdDeviation="5" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          </defs>
          <rect width="760" height="480" fill="#dce4db" />
          <rect width="760" height="480" fill="url(#route-grid)" />
          <path d="M89 100 L174 68 L248 103 L315 79 L407 105 L484 79 L595 113 L679 190 L652 262 L696 324 L643 404 L532 418 L441 393 L351 422 L264 384 L194 402 L121 355 L94 273 Z" fill="#ccd8cf" stroke="#8fa59a" strokeWidth="1.5" />
          <path d="M185 122 L237 186 L315 178 L376 244 L445 220 L529 282 L652 262" fill="none" stroke="#a1b4a9" strokeWidth="1" strokeDasharray="5 8" opacity=".72" />
          {coverageRoutes.map(route => <path key={route.id} d={route.path} fill="none" stroke={route.id === selectedId ? "#F26B38" : "#789388"} strokeOpacity={route.id === selectedId ? 1 : .45} strokeWidth={route.id === selectedId ? 5 : 2} strokeLinecap="round" filter={route.id === selectedId ? "url(#route-glow)" : undefined} />)}
          <circle cx="322" cy="253" r="12" fill="#142733" stroke="#F26B38" strokeWidth="5" />
          <text x="343" y="248" fill="#142733" fontSize="15" fontFamily="Manrope, sans-serif" fontWeight="800">LAS VEGAS</text>
          <text x="343" y="269" fill="#62736b" fontSize="11" fontFamily="Manrope, sans-serif">Punto de partida</text>
          {coverageRoutes.map(route => (
            <g key={route.id} className="route-node" role="button" tabIndex={0} aria-pressed={route.id === selectedId} aria-label={`Seleccionar ruta a ${route.destination}`} onClick={() => setSelectedId(route.id)} onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelectedId(route.id); } }}>
              <circle cx={route.marker.x} cy={route.marker.y} r={route.id === selectedId ? 10 : 7} fill={route.id === selectedId ? "#F26B38" : "#143040"} stroke="#f3f0e8" strokeWidth="3" />
              <text x={route.label.x} y={route.label.y} fill="#142733" fontSize="12" fontFamily="Manrope, sans-serif" fontWeight="800">{route.destination.split(",")[0].toUpperCase()}</text>
            </g>
          ))}
          <text x="39" y="448" fill="#61766b" fontSize="10" fontFamily="Manrope, sans-serif" letterSpacing="1.7">RUTAS ORIENTATIVAS · DISPONIBILIDAD A CONFIRMAR</text>
        </svg>
        <div className="map-origin-badge"><MapPin size={14} /> Salida: Las Vegas, NV</div>
      </div>
      <div className="route-planner">
        <div className="route-planner-title"><Route size={18} /><span>ELIGE UNA RUTA</span></div>
        <div className="route-options" aria-label="Rutas orientativas">
          {coverageRoutes.map(route => <button type="button" key={route.id} className={route.id === selectedId ? "route-option selected" : "route-option"} onClick={() => setSelectedId(route.id)}><span>{route.destination.split(",")[0]}</span><small>{route.distance}</small></button>)}
        </div>
        <div className="route-summary"><span>TRAYECTO SELECCIONADO</span><strong>{selected.origin} → {selected.destination}</strong><p>{selected.distance} · {selected.time}</p></div>
        <a className="route-external-link" href={directionsUrl} target="_blank" rel="noopener noreferrer">Abrir en Google Maps <ExternalLink size={13} /></a>
        <a className="route-whatsapp-link" href="#cotizar"><Send size={14} /> Solicitar esta ruta</a>
      </div>
    </div>
  );
}
