document.addEventListener('DOMContentLoaded', () => {

    const tbody = document.getElementById('tabla-visitas-body');
    const thead = document.getElementById('tabla-thead');
    const tipoTabs = document.querySelectorAll('.tipo-tab');
    const filtroApiario = document.getElementById('filtro-apiario');
    const filtroFechaTipo = document.getElementById('filtro-fecha-tipo');
    const filtroAnio = document.getElementById('filtro-anio');
    const filtroMes = document.getElementById('filtro-mes');
    const filtroDia = document.getElementById('filtro-dia');
    const btnAplicar = document.getElementById('btn-aplicar-filtros');
    const pageSubtitle = document.getElementById('page-subtitle');

    let tipoActual = 'visitas'; // 'visitas' | 'cosechas' | 'mantenimiento'

    // ==========================================
    // CARGAR APIARIOS DESDE LA BASE DE DATOS
    // ==========================================
    function cargarApiarios() {
        fetch('/visitas/apiarios')
            .then(res => res.ok ? res.json() : [])
            .then(data => {
                data.forEach(a => {
                    const opt = document.createElement('option');
                    opt.value = a.id;
                    opt.textContent = a.nombre;
                    filtroApiario.appendChild(opt);
                });
            })
            .catch(() => {}); // silencioso si falla
    }

    // ==========================================
    // FECHA FILTER TOGGLE
    // ==========================================
    filtroFechaTipo.addEventListener('change', () => {
        filtroAnio.style.display = 'none';
        filtroMes.style.display = 'none';
        filtroDia.style.display = 'none';
        const val = filtroFechaTipo.value;
        if (val === 'anio') filtroAnio.style.display = '';
        else if (val === 'mes') filtroMes.style.display = '';
        else if (val === 'dia') filtroDia.style.display = '';
    });

    // ==========================================
    // CONSTRUIR QUERY PARAMS
    // ==========================================
    function construirParams() {
        const params = new URLSearchParams();
        if (filtroApiario.value) params.set('apiario_id', filtroApiario.value);

        const ft = filtroFechaTipo.value;
        if (ft === 'anio' && filtroAnio.value) params.set('fecha', filtroAnio.value);
        else if (ft === 'mes' && filtroMes.value) params.set('fecha', filtroMes.value);
        else if (ft === 'dia' && filtroDia.value) params.set('fecha', filtroDia.value);

        return params.toString();
    }

    // ==========================================
    // FETCH Y RENDER VISITAS
    // ==========================================
    function renderHeadersVisitas() {
        thead.innerHTML = '<tr>' +
            '<th>FECHA</th><th>COLMENA</th><th>APIARIO</th><th>APICULTOR</th>' +
            '<th>ESTADO COLONIA</th><th>REINA VISTA</th><th>NOTAS</th>' +
            '</tr>';
        pageSubtitle.textContent = 'Visitas de seguimiento al apiario';
    }

    function renderRowsVisitas(datos) {
        if (!datos.length) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-empty">No hay visitas para el período seleccionado.</td></tr>';
            return;
        }
        tbody.innerHTML = '';
        datos.forEach(v => {
            let badgeClase = '';
            const est = v.estado_colonia || '';
            if (est === 'Excelente' || est === 'Buena') badgeClase = 'excelente';
            else if (est === 'Regular') badgeClase = 'regular';
            else if (est === 'Crítico' || est === 'Mala') badgeClase = 'critico';

            const tr = document.createElement('tr');
            tr.innerHTML =
                '<td><span class="text-subtle">' + v.fecha + '</span></td>' +
                '<td class="text-primary-bold">' + (v.colmena || '—') + '</td>' +
                '<td><span class="text-subtle">' + (v.apiario || '—') + '</span></td>' +
                '<td>' + (v.apicultor || '—') + '</td>' +
                '<td><span class="badge-estado ' + badgeClase + '">' + est + '</span></td>' +
                '<td>' + (v.reina || '—') + '</td>' +
                '<td class="text-subtle" style="max-width:260px;">' + (v.notas || '—') + '</td>';
            tbody.appendChild(tr);
        });
    }

    // ==========================================
    // FETCH Y RENDER COSECHAS
    // ==========================================
    function renderHeadersCosechas() {
        thead.innerHTML = '<tr>' +
            '<th>FECHA</th><th>COLMENA</th><th>APIARIO</th><th>APICULTOR</th>' +
            '<th>KG MIEL</th><th>CALIDAD</th><th>VALIDADA CON PESO</th>' +
            '</tr>';
        pageSubtitle.textContent = 'Registros de cosecha de miel';
    }

    function renderRowsCosechas(datos) {
        if (!datos.length) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-empty">No hay cosechas para el período seleccionado.</td></tr>';
            return;
        }
        tbody.innerHTML = '';
        datos.forEach(v => {
            const validadaClass = v.validada === 'Sí' ? 'excelente' : 'regular';
            const tr = document.createElement('tr');
            tr.innerHTML =
                '<td><span class="text-subtle">' + v.fecha + '</span></td>' +
                '<td class="text-primary-bold">' + (v.colmena || '—') + '</td>' +
                '<td><span class="text-subtle">' + (v.apiario || '—') + '</span></td>' +
                '<td>' + (v.apicultor || '—') + '</td>' +
                '<td><strong>' + (v.kg_miel || '—') + '</strong> kg</td>' +
                '<td><span class="badge-cosecha">' + (v.calidad || '—') + '</span></td>' +
                '<td><span class="badge-estado ' + validadaClass + '">' + v.validada + '</span></td>';
            tbody.appendChild(tr);
        });
    }

    // ==========================================
    // FETCH Y RENDER MANTENIMIENTO
    // ==========================================
    function renderHeadersMantenimiento() {
        thead.innerHTML = '<tr>' +
            '<th>FECHA</th><th>COLMENA</th><th>APIARIO</th><th>TÉCNICO</th>' +
            '<th>TIPO DE EVENTO</th><th>DESCRIPCIÓN</th>' +
            '</tr>';
        pageSubtitle.textContent = 'Mantenimiento de hardware (módulos ESP32)';
    }

    function renderRowsMantenimiento(datos) {
        if (!datos.length) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-empty">No hay registros de mantenimiento para el período seleccionado.</td></tr>';
            return;
        }
        tbody.innerHTML = '';
        datos.forEach(v => {
            const tr = document.createElement('tr');
            tr.innerHTML =
                '<td><span class="text-subtle">' + v.fecha + '</span></td>' +
                '<td class="text-primary-bold">' + (v.colmena || '—') + '</td>' +
                '<td><span class="text-subtle">' + (v.apiario || '—') + '</span></td>' +
                '<td>' + (v.tecnico || '—') + '</td>' +
                '<td><span class="badge-mant">' + (v.tipo || '—') + '</span></td>' +
                '<td class="text-subtle" style="max-width:280px;">' + (v.descripcion || '—') + '</td>';
            tbody.appendChild(tr);
        });
    }

    // ==========================================
    // CARGAR DATOS SEGÚN TIPO ACTIVO
    // ==========================================
    function cargarDatos() {
        const params = construirParams();
        tbody.innerHTML = '<tr><td colspan="7" class="text-empty" style="opacity:0.6;">Cargando...</td></tr>';

        let url = '';
        if (tipoActual === 'visitas') {
            url = '/visitas' + (params ? '?' + params : '');
            renderHeadersVisitas();
            fetch(url)
                .then(r => r.ok ? r.json() : [])
                .then(d => renderRowsVisitas(d))
                .catch(() => { tbody.innerHTML = '<tr><td colspan="7" class="text-empty" style="color:#ef4444;">Error al cargar visitas.</td></tr>'; });

        } else if (tipoActual === 'cosechas') {
            url = '/visitas/cosechas' + (params ? '?' + params : '');
            renderHeadersCosechas();
            fetch(url)
                .then(r => r.ok ? r.json() : [])
                .then(d => renderRowsCosechas(d))
                .catch(() => { tbody.innerHTML = '<tr><td colspan="7" class="text-empty" style="color:#ef4444;">Error al cargar cosechas.</td></tr>'; });

        } else if (tipoActual === 'mantenimiento') {
            url = '/visitas/mantenimiento' + (params ? '?' + params : '');
            renderHeadersMantenimiento();
            fetch(url)
                .then(r => r.ok ? r.json() : [])
                .then(d => renderRowsMantenimiento(d))
                .catch(() => { tbody.innerHTML = '<tr><td colspan="6" class="text-empty" style="color:#ef4444;">Error al cargar mantenimientos.</td></tr>'; });
        }
    }

    // ==========================================
    // EVENTOS
    // ==========================================
    tipoTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tipoTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            tipoActual = tab.dataset.tipo;
            cargarDatos();
        });
    });

    btnAplicar.addEventListener('click', cargarDatos);

    // ==========================================
    // INICIO
    // ==========================================
    cargarApiarios();
    cargarDatos();
});