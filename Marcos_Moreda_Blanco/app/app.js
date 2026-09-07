// Centrado inicial del mapa a nivel global
const map = L.map('mapa', { zoomControl: false }).setView([40, -10], 3);
L.control.zoom({ position: 'topright' }).addTo(map);

L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '© OpenStreetMap | © CartoDB | Web Semántica y Datos Enlazados'
}).addTo(map);

const endpointUrl = 'http://localhost:3030/estadios/query'; 

const sparqlQuery = `
    PREFIX fut: <http://futbol.linkeddata.es/ontology#>
    PREFIX schema: <http://schema.org/>
    PREFIX wdt: <http://www.wikidata.org/prop/direct/>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

    SELECT ?nombre ?capacidad ?ciudadURI ?confederacionNombre ?paisNombre ?coords
    WHERE {
      ?estadio a fut:Estadio ;
               schema:name ?nombre ;
               fut:capacidadTotal ?capacidad ;
               fut:ubicadoEnCiudad ?ciudadURI ;
               schema:addressCountry ?paisURI ;
               fut:perteneceAConfederacion ?confederacionURI .

      SERVICE <https://query.wikidata.org/sparql> {
          ?ciudadURI wdt:P625 ?coords .
          ?confederacionURI rdfs:label ?confederacionNombre .
          ?paisURI rdfs:label ?paisNombre .
          FILTER(LANG(?confederacionNombre) = "es")
          FILTER(LANG(?paisNombre) = "es")
      }
    }
`;

let todosLosMonumentos = []; 
let grupoMarcadores = L.layerGroup().addTo(map);
let graficoTarta = null; 

let textoBusquedaActual = "";
let categoriasSeleccionadas = new Set(); 
let rectanguloFiltroBounds = null; 
const paletaColores = ['#27ae60', '#2980b9', '#f39c12', '#8e44ad', '#c0392b', '#16a085'];

function aplicarFiltros() {
    let filtrados = todosLosMonumentos;

    if (rectanguloFiltroBounds) {
        filtrados = filtrados.filter(m => {
            return rectanguloFiltroBounds.contains([m.lat, m.lon]);
        });
    }

    if (textoBusquedaActual.length > 0) {
        filtrados = filtrados.filter(m => m.nombre.toLowerCase().includes(textoBusquedaActual));
    }

    if (categoriasSeleccionadas.size > 0) {
        filtrados = filtrados.filter(m => categoriasSeleccionadas.has(m.confederacion));
    }

    const selectorPais = document.getElementById('filtro-pais');
    if (selectorPais && selectorPais.value !== "") {
        filtrados = filtrados.filter(m => m.pais === selectorPais.value);
    }

    pintarMarcadores(filtrados);
    actualizarSugerencias(filtrados);
}

async function cargarMonumentos() {
    let offset = 0;
    const limite = 100; // Descargamos en bloques muy pequeños para no saturar
    let hayMasDatos = true;
    let resultadosBrutos = [];
    
    const textoTotal = document.getElementById('total-monumentos');
    textoTotal.innerHTML = "Conectando con Wikidata...";

    const esperar = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    try {
        while (hayMasDatos) {
            const queryPaginada = sparqlQuery + ` LIMIT ${limite} OFFSET ${offset}`;
            
            const response = await fetch(endpointUrl + '?query=' + encodeURIComponent(queryPaginada), { 
                headers: { 'Accept': 'application/sparql-results+json' } 
            });
            
            // Si Wikidata nos corta, lanzamos el error para salir del bucle, 
            // pero pasaremos al bloque catch donde dibujaremos lo rescatado.
            if (!response.ok) throw new Error("Corte de conexión por límite de Wikidata");
            
            const data = await response.json();
            const bloque = data.results.bindings;

            if (bloque.length === 0) {
                hayMasDatos = false; 
            } else {
                resultadosBrutos = resultadosBrutos.concat(bloque);
                offset += limite;
                
                textoTotal.innerHTML = `Descargando estadios... (${resultadosBrutos.length} listos)`;
                
                // 2.5 segundos de pausa real entre peticiones
                await esperar(2500); 
            }
        }
    } catch (error) { 
        console.warn("La descarga se detuvo antes de tiempo:", error);
        textoTotal.innerHTML = `Descarga parcial: ${resultadosBrutos.length} estadios.`;
    }

    if (resultadosBrutos.length > 0) {
        textoTotal.innerHTML = "Procesando coordenadas en el mapa...";
        
        todosLosMonumentos = resultadosBrutos.map(m => {
            const pointStr = m.coords ? m.coords.value : "";
            const match = pointStr.match(/Point\(([-0-9.]+) ([-0-9.]+)\)/);
            const lon = match ? parseFloat(match[1]) : 0;
            const lat = match ? parseFloat(match[2]) : 0;

            return {
                nombre: m.nombre ? m.nombre.value : "Desconocido",
                capacidad: m.capacidad ? parseInt(m.capacidad.value).toLocaleString('es-ES') : "0",
                confederacion: m.confederacionNombre ? m.confederacionNombre.value.split('/').pop() : "Sin Confed",
                pais: m.paisNombre ? m.paisNombre.value : "Desconocido",
                ciudadURL: m.ciudadURI ? m.ciudadURI.value : "#",
                lat: lat,
                lon: lon
            };
        }).filter(m => m.lat !== 0 && m.lon !== 0);

        generarCheckboxes(todosLosMonumentos);
        generarSelectorPaises(todosLosMonumentos);
        aplicarFiltros(); 
    } else {
        document.getElementById('contenedor-filtros').innerHTML = "<span style='color:red; font-size:12px;'>Error total de conexión. Wikidata no responde.</span>";
    }
}

function generarSelectorPaises(monumentos) {
    const selector = document.getElementById('filtro-pais');
    const paisesSet = new Set();
    
    // Extraemos todos los países únicos
    monumentos.forEach(m => paisesSet.add(m.pais));

    // Los ordenamos alfabéticamente y los añadimos al menú
    Array.from(paisesSet).sort().forEach(pais => {
        const option = document.createElement('option');
        option.value = pais;
        option.textContent = pais;
        selector.appendChild(option);
    });

    // Le decimos al menú que aplique los filtros cuando el usuario cambie el país
    selector.addEventListener('change', aplicarFiltros);
}

function generarCheckboxes(monumentos) {
    const contenedor = document.getElementById('contenedor-filtros');
    const tiposSet = new Set();
    
    monumentos.forEach(m => tiposSet.add(m.confederacion));

    let html = '';
    Array.from(tiposSet).sort().forEach(tipo => {
        html += `<label class="filtro-opcion"><input type="checkbox" value="${tipo}"> ${tipo}</label>`;
    });
    contenedor.innerHTML = html;

    contenedor.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        cb.addEventListener('change', function() {
            if (this.checked) categoriasSeleccionadas.add(this.value);
            else categoriasSeleccionadas.delete(this.value);
            aplicarFiltros(); 
        });
    });
}

function actualizarGraficoYLeyenda(monumentos) {
    document.getElementById('total-monumentos').innerHTML = `Total en vista: <b>${monumentos.length}</b> estadios`;

    const conteoTipos = {};
    monumentos.forEach(m => {
        conteoTipos[m.confederacion] = (conteoTipos[m.confederacion] || 0) + 1;
    });

    const etiquetas = Object.keys(conteoTipos).sort((a,b) => conteoTipos[b] - conteoTipos[a]);
    const valores = etiquetas.map(e => conteoTipos[e]);
    const colores = etiquetas.map((_, i) => paletaColores[i % paletaColores.length]);

    let leyendaHTML = '';
    etiquetas.forEach((etiqueta, index) => {
        leyendaHTML += `
            <div class="leyenda-item" title="${etiqueta}">
                <span class="leyenda-color" style="background-color: ${colores[index]}"></span>
                <span class="leyenda-texto">${etiqueta}</span>
                <span class="leyenda-valor">${valores[index]}</span>
            </div>`;
    });
    document.getElementById('leyenda-grafico').innerHTML = leyendaHTML;

    const ctx = document.getElementById('graficoCategorias').getContext('2d');
    if (graficoTarta) { graficoTarta.destroy(); }

    graficoTarta = new Chart(ctx, {
        type: 'doughnut', 
        data: { labels: etiquetas, datasets: [{ data: valores, backgroundColor: colores, borderWidth: 0 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, cutout: '60%' }
    });
}

function pintarMarcadores(monumentos) {
    grupoMarcadores.clearLayers(); 

    monumentos.forEach(monumento => {
        let popupHTML = `
            <div style="width: 200px; font-family: sans-serif;">
                <div class="popup-titulo">${monumento.nombre}</div>
                <p style="font-size: 13px; color: #444; margin: 10px 0;">
                    👥 <span class="etiqueta-capacidad">${monumento.capacidad} pax</span>
                </p>
                <p style="font-size: 13px; color: #666; margin: 0 0 10px 0;">
                    📍 <b>País:</b> ${monumento.pais}<br>
                    🌍 <b>Confederación:</b> ${monumento.confederacion}
                </p>
                <a href="${monumento.ciudadURL}" target="_blank" style="display: block; background: #2c3e50; color: white; text-align: center; padding: 8px; border-radius: 6px; text-decoration: none; font-size: 12px; font-weight: bold;">Ver Ciudad en LOD</a>
            </div>`;
        
        L.circleMarker([monumento.lat, monumento.lon], {
            radius: 6, fillColor: "#27ae60", color: "#fff", weight: 1, opacity: 1, fillOpacity: 0.8
        }).addTo(grupoMarcadores).bindPopup(popupHTML);
    });
    actualizarGraficoYLeyenda(monumentos);
}

// --- Lógica del selector espacial (Dibujar Cuadrado) ---
const btnDibujar = document.getElementById('btn-dibujar');
const btnBorrarDibujo = document.getElementById('btn-borrar-dibujo');
const textoAyuda = document.getElementById('texto-ayuda-dibujo');
const mapContainer = document.getElementById('mapa');

let isDrawing = false, startPoint = null, rectanguloCapa = null;

btnDibujar.addEventListener('click', () => {
    isDrawing = true;
    btnDibujar.classList.add('btn-activo');
    textoAyuda.style.display = 'block';
    map.dragging.disable(); 
    mapContainer.classList.add('cursor-dibujo');
    if (rectanguloCapa) { map.removeLayer(rectanguloCapa); rectanguloCapa = null; }
});

map.on('mousedown', (e) => {
    if (!isDrawing) return;
    startPoint = e.latlng;
    rectanguloCapa = L.rectangle([startPoint, startPoint], {
        color: "#27ae60", weight: 2, fillOpacity: 0.1, dashArray: "5, 5"
    }).addTo(map);
});

map.on('mousemove', (e) => {
    if (!isDrawing || !startPoint || !rectanguloCapa) return;
    rectanguloCapa.setBounds([startPoint, e.latlng]);
});

map.on('mouseup', (e) => {
    if (!isDrawing || !startPoint) return;
    isDrawing = false; startPoint = null;
    btnDibujar.classList.remove('btn-activo');
    textoAyuda.style.display = 'none';
    map.dragging.enable();
    mapContainer.classList.remove('cursor-dibujo');
    
    btnBorrarDibujo.disabled = false; btnBorrarDibujo.style.opacity = "1";
    rectanguloFiltroBounds = rectanguloCapa.getBounds();
    aplicarFiltros();
});

btnBorrarDibujo.addEventListener('click', () => {
    if (rectanguloCapa) map.removeLayer(rectanguloCapa);
    rectanguloCapa = null; rectanguloFiltroBounds = null;
    btnBorrarDibujo.disabled = true; btnBorrarDibujo.style.opacity = "0.5";
    aplicarFiltros();
});

// --- Lógica del buscador ---
const inputBuscador = document.getElementById('input-buscador');
const cajaSugerencias = document.getElementById('sugerencias');

inputBuscador.addEventListener('input', function(e) {
    textoBusquedaActual = e.target.value.toLowerCase();
    aplicarFiltros(); 
});

function actualizarSugerencias(monumentosFiltrados) {
    cajaSugerencias.innerHTML = ''; 
    if (textoBusquedaActual.length < 1) { cajaSugerencias.style.display = 'none'; return; }

    const top5 = monumentosFiltrados.slice(0, 5);
    if (top5.length > 0) {
        cajaSugerencias.style.display = 'block';
        top5.forEach(mon => {
            const div = document.createElement('div');
            div.className = 'sugerencia-item';
            div.textContent = mon.nombre;
            div.onclick = function() {
                inputBuscador.value = mon.nombre; 
                textoBusquedaActual = mon.nombre.toLowerCase();
                cajaSugerencias.style.display = 'none'; 
                aplicarFiltros(); 
                map.flyTo([mon.lat, mon.lon], 10);
            };
            cajaSugerencias.appendChild(div);
        });
    } else { cajaSugerencias.style.display = 'none'; }
}

document.addEventListener('click', e => {
    const buscador = document.getElementById('caja-buscador');
    if (buscador && !buscador.contains(e.target)) cajaSugerencias.style.display = 'none';
});

cargarMonumentos();