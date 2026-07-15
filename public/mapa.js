// mapa.js

// 0) Asegúrate de haber cargado en tu HTML:
//    1) leaflet.css + leaflet.js
//    2) boyaca_low.js  (define `boyacaData`)
//    3) este mapa.js

// 1) Inicializa el mapa y base layer
const map = L.map('map').setView([5.6, -73.4], 8);
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  subdomains: 'abcd',
  maxZoom: 20
}).addTo(map);

// 2) Capa para marcadores de eventos
const eventosLayer = L.layerGroup().addTo(map);

// 3) Referencias a selects y tabla
const mesSelect       = document.getElementById('f-mes');
const provSelect      = document.getElementById('f-provincia');
const municipioSelect = document.getElementById('f-municipio');
const tablaBody       = document.querySelector('#tabla-eventos tbody');

// 4) Carga la capa de municipios con estilo dinámico
const municipiosLayer = L.geoJSON(boyacaData, {
  style: (feature) => {
    const codigo = municipioSelect.value;
    if (codigo && feature.properties.id === codigo) {
      return {
        color: '#070C4F',
        weight: 3,
        fillColor: '#004E89',
        fillOpacity: 0.5
      };
    }
    return { color: '#296A3D', weight: 1, fillOpacity: 0.1 };
  },
  onEachFeature: (feature, layer) => {
    layer.bindPopup(`<strong>${feature.properties.name}</strong>`)
         .on('click', () => {
           municipioSelect.value = feature.properties.id;
           fetchAndDraw();
         });
  }
}).addTo(map);

// 5) Agrega opciones a los filtros y dibuja eventos
fetch('/api/municipios')
  .then(r => r.json())
  .then(muns => {

    municipioSelect.innerHTML = ''; 
    provSelect.innerHTML = ''; 
    if (!municipioSelect.querySelector('option[value=""]')) {
    municipioSelect.append(new Option('— Todos —', ''));
    }

    if (!provSelect.querySelector('option[value=""]')) {
    provSelect.append(new Option('— Todas —', ''));
    }

    // 👇 Agregar "Todos" en ambos
    //provSelect.append(new Option('— Todas —', ''));
    //municipioSelect.append(new Option('— Todos —', ''));

    // Provincias
    Array.from(new Set(muns.map(x => x.provincia)))
      .forEach(p => provSelect.append(new Option(p, p)));

    // Municipios
    muns.forEach(x =>
      municipioSelect.append(new Option(x.municipio, x.codigo_dane))
    );

  
    cargarEventos();
  });

// 6) Carga eventos y llena el select de meses
function cargarEventos() {
  fetch('/api/eventos')
    .then(r => r.json())
    .then(all => {
      Array.from(new Set(all.map(e => e.mes)))
        .forEach(m => {
          if (![...mesSelect.options].some(o => o.value === m))
            mesSelect.append(new Option(m, m));
        });
      fetchAndDraw();
    });
}

// 7) Escuchar cambios de filtros
[mesSelect, provSelect, municipioSelect].forEach(select =>
  select.addEventListener('change', fetchAndDraw)
);

//new clean
document.getElementById('btn-limpiar').addEventListener('click', () => {
  mesSelect.value = '';
  provSelect.value = '';
  municipioSelect.value = '';
  fetchAndDraw();
});


// 8) Función principal para dibujar eventos
function fetchAndDraw() {
  const params = new URLSearchParams();
  if (mesSelect.value)       params.set('mes', mesSelect.value);
  if (provSelect.value)      params.set('provincia', provSelect.value);
  if (municipioSelect.value) params.set('codigo_dane', municipioSelect.value);

  fetch('/api/eventos?' + params)
    .then(r => r.json())
    .then(data => {
      eventosLayer.clearLayers();
      tablaBody.innerHTML = '';

      data.forEach(e => {
        // Marcador
        if (e.lat && e.lon) {
          L.marker([e.lat, e.lon])
            .bindPopup(`
              <div class="popup">
                <h4>${e.nombre_evento}</h4>
                <div><strong>Fecha:</strong> ${e.Fecha || e.fecha || '—'}</div>
                <div><strong>Tipo:</strong> ${e.tipo_evento || '—'}</div>
                <div><strong>Municipio:</strong> ${e.municipio || '—'}</div>
              </div>
            `)
            .addTo(eventosLayer);
        }

        // Tabla
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${e.Fecha || e.fecha || '—'}</td>
          <td>${e.nombre_evento}</td>
          <td>${e.tipo_evento || '—'}</td>
          <td>${e.linea_subcategoria || '—'}</td>
          <td>${e.municipio || '—'}</td>
        `;
        tablaBody.append(tr);
      });

      // Actualiza estilo de municipios
      municipiosLayer.setStyle(municipiosLayer.options.style);
    });
}













