let mapa = L.map('map').setView([5.5, -73.0], 8);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapa);


let archivoSeleccionado = null;

document.getElementById('archivoExcel').addEventListener('change', (e) => {
    archivoSeleccionado = e.target.files[0];
});

document.getElementById('btnCargar').addEventListener('click', async () => {
    if (!archivoSeleccionado) {
        alert("Por favor selecciona un archivo Excel primero.");
        return;
    }

    const formData = new FormData();
    formData.append('archivo', archivoSeleccionado);

    const resp = await fetch('/subir_excel', {
        method: 'POST',
        body: formData
    });

    eventos = await resp.json();
    actualizarFiltros();
    let bounds = geojsonLayer.getBounds();
    mapa.fitBounds(bounds);
    mapa.invalidateSize();  
    dibujarMapa();
});

function actualizarFiltros() {
    // Extrae valores únicos para filtros
    const meses = [...new Set(eventos.map(ev => ev.Mes))].sort();
    const tipos = [...new Set(eventos.map(ev => ev.TipoEvento))].sort();
    const lineas = [...new Set(eventos.map(ev => ev.Línea))].sort();
    const sublineas = [...new Set(eventos.map(ev => ev.Sublinea))].sort();
    const municipios = [...new Set(eventos.map(ev => ev.Municipio))].sort();
    const dias = [...new Set(eventos.map(ev => ev.Día))].sort((a,b) => a-b);

    function llenarSelect(id, lista) {
        const sel = document.getElementById(id);
        sel.innerHTML = `<option value="">Todos</option>`;
        lista.forEach(val => sel.innerHTML += `<option>${val}</option>`);
    }

    llenarSelect('mesFiltro', meses);
    llenarSelect('tipoFiltro', tipos);
    llenarSelect('lineaFiltro', lineas);
    llenarSelect('sublineaFiltro', sublineas);
    llenarSelect('municipioFiltro', municipios);
    llenarSelect('diaFiltro', dias);
}

let geojsonLayer;

function dibujarMapa() {
    if (geojsonLayer) mapa.removeLayer(geojsonLayer);

    geojsonLayer = L.geoJSON(boyacaData, {
        onEachFeature: function (feature, layer) {
            layer.bindPopup(`<strong>${feature.properties.name}</strong>`);
            layer.on('click', () => {
                mostrarEventos(feature.properties.name);
            });
        }
    }).addTo(mapa);

    mapa.invalidateSize();
}


function mostrarEventos(municipio) {
    const filtroMes = document.getElementById('mesFiltro').value;
    const filtroTipo = document.getElementById('tipoFiltro').value;
    const filtroLinea = document.getElementById('lineaFiltro').value;
    const filtroSub = document.getElementById('sublineaFiltro').value;
    const filtroDia = document.getElementById('diaFiltro').value;

    let filtrados = eventos.filter(ev =>
        (!filtroMes || ev.Mes === filtroMes) &&
        (!filtroTipo || ev.TipoEvento === filtroTipo) &&
        (!filtroLinea || ev.Línea === filtroLinea) &&
        (!filtroSub || ev.Sublinea === filtroSub) &&
        (!filtroDia || ev.Día == filtroDia) &&
        (!municipio || ev.Municipio === municipio)
    );

    const contenedor = document.getElementById('eventos');
    contenedor.innerHTML = `<h3>Eventos en ${municipio}</h3><ul>` +
        filtrados.map(e => `<li>${e.Fecha?.split("T")[0]} - ${e.NombreEvento}</li>`).join("") +
        `</ul>`;
}
