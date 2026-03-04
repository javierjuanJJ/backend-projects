import Image from "next/image";

export default function Home() {
  return (
    <div className="contenedor-pestanas">
        <div className="pestanas">
            <button className="pestana" data-tab="1">Primera Pestaña</button>
            <button className="pestana" data-tab="2">Segunda Pestaña</button>
            <button className="pestana" data-tab="3">Tercera Pestaña</button>
            <button className="pestana" data-tab="4">Cuarta Pestaña</button>
        </div>
        <div className="contenido">
            <div id="contenido-1" className="tab-content activo">Contenido de la Primera Pestaña</div>
            <div id="contenido-2" className="tab-content">Contenido de la Segunda Pestaña</div>
            <div id="contenido-3" className="tab-content">Contenido de la Tercera Pestaña</div>
            <div id="contenido-4" className="tab-content">Contenido de la Cuarta Pestaña</div>
        </div>
    </div>
  );
}
