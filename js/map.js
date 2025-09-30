// Mapa Catastral Coto Brus - Configuración JavaScript

// Definir la proyección EPSG:8908 (CR05 / CRTM05)
proj4.defs('EPSG:8908', '+proj=tmerc +lat_0=0 +lon_0=-84 +k=0.9999 +x_0=500000 +y_0=0 +ellps=WGS84 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs');

// Registrar la proyección en OpenLayers
ol.proj.proj4.register(proj4);

// Definir la extensión aproximada de Costa Rica en EPSG:8908
const costaRicaExtent = [200000, 600000, 700000, 1200000];

// Mapeo de números de distrito a nombres para Coto Brus
const districtNames = {
    '1': 'San Vito',
    '2': 'Sabalito', 
    '3': 'Agua Buena',
    '4': 'Limoncito',
    '5': 'Pittier',
    '6': 'Gutierrez Braun'
};

// Función para obtener el nombre del distrito
function getDistrictName(districtNumber) {
    if (!districtNumber) return 'No disponible';
    const name = districtNames[districtNumber.toString()];
    return name ? `${name} (${districtNumber})` : `Distrito ${districtNumber}`;
}

// Coordenadas de San Vito, Coto Brus en EPSG:8908
// San Vito se encuentra aproximadamente en:
// Longitud: -82.970 Latitud: 8.818
// Transformadas a EPSG:8908
const sanVitoCoords = proj4('EPSG:4326', 'EPSG:8908', [-82.970, 8.818]);

// Función para crear el control de capas base
function createLayerSwitcher(map, baseLayers) {
    // Crear el contenedor principal del control
    const layerSwitcherContainer = document.createElement('div');
    layerSwitcherContainer.className = 'layer-switcher-container';
    layerSwitcherContainer.style.position = 'absolute';
    layerSwitcherContainer.style.bottom = '10px';
    layerSwitcherContainer.style.right = '10px';
    layerSwitcherContainer.style.zIndex = '1000';

    // Botón para colapsar/expandir
    const toggleButton = document.createElement('button');
    toggleButton.className = 'layer-toggle-btn';
    toggleButton.innerHTML = '🗺️';
    toggleButton.title = 'Capas Base';
    
    // Panel de capas (inicialmente oculto)
    const layerPanel = document.createElement('div');
    layerPanel.className = 'layer-panel';
    layerPanel.style.display = 'none';

    // Título del panel
    const title = document.createElement('div');
    title.className = 'layer-title';
    title.textContent = 'Capas Base';
    layerPanel.appendChild(title);

    // Crear radio buttons para cada capa base
    baseLayers.forEach((layer, index) => {
        const layerDiv = document.createElement('div');
        layerDiv.className = 'layer-option';

        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = 'baseLayer';
        radio.id = `layer-${index}`;
        radio.checked = layer.getVisible();
        
        const label = document.createElement('label');
        label.htmlFor = `layer-${index}`;
        label.textContent = layer.get('title');

        // Evento para cambiar la capa base
        radio.addEventListener('change', function() {
            if (this.checked) {
                baseLayers.forEach(baseLayer => {
                    baseLayer.setVisible(false);
                });
                layer.setVisible(true);
            }
        });

        layerDiv.appendChild(radio);
        layerDiv.appendChild(label);
        layerPanel.appendChild(layerDiv);
    });

    // Evento para mostrar/ocultar el panel
    let isExpanded = false;
    toggleButton.addEventListener('click', function() {
        isExpanded = !isExpanded;
        layerPanel.style.display = isExpanded ? 'block' : 'none';
        toggleButton.style.backgroundColor = isExpanded ? '#0066cc' : '#fff';
        toggleButton.style.color = isExpanded ? '#fff' : '#333';
    });

    // Ensamblar el control
    layerSwitcherContainer.appendChild(layerPanel);
    layerSwitcherContainer.appendChild(toggleButton);

    // Agregar el control al mapa
    document.body.appendChild(layerSwitcherContainer);
}

// Función para cargar la capa catastral con optimizaciones ULTRA anti-lag
function loadCatastralLayer(map) {
    // Crear la fuente de datos GeoJSON con optimizaciones MÁXIMAS
    const catastralSource = new ol.source.Vector({
        url: 'Data/catastral_completo.geojson',
        format: new ol.format.GeoJSON({
            dataProjection: 'EPSG:4326',
            featureProjection: 'EPSG:8908'
        }),
        // Estrategia ULTRA-optimizada con lazy loading MÁXIMO
        strategy: function(extent, resolution) {
            const zoom = map.getView().getZoomForResolution(resolution);
            
            // Sistema de carga escalonada ULTRA-AGRESIVA
            if (zoom < 12) {  // Aumentado de 11 a 12
                return []; // Absolutamente nada hasta zoom 12
            }
            
            if (zoom < 14) {  // Aumentado de 13 a 14
                // Carga MUY limitada - solo extent visible muy reducido
                const reducedExtent = [
                    extent[0] + (extent[2] - extent[0]) * 0.35,  // Aún más reducido
                    extent[1] + (extent[3] - extent[1]) * 0.35,
                    extent[2] - (extent[2] - extent[0]) * 0.35,
                    extent[3] - (extent[3] - extent[1]) * 0.35
                ];
                return [reducedExtent];
            }
            
            // Carga normal solo en zoom MUY cercano
            return [extent];
        },
        wrapX: false
    });

    // Estilo optimizado para las parcelas catastrales
    const catastralStyle = new ol.style.Style({
        stroke: new ol.style.Stroke({
            color: '#2E8B57',  // Verde oscuro para los bordes
            width: 1.5  // Reducido para mejor performance
        }),
        fill: new ol.style.Fill({
            color: 'rgba(46, 139, 87, 0.08)'  // Más transparente para mejor performance
        })
    });

    // Estilo para parcelas seleccionadas/hover - más visible
    const highlightStyle = new ol.style.Style({
        stroke: new ol.style.Stroke({
            color: '#FF6B35',  // Naranja para resaltar
            width: 3
        }),
        fill: new ol.style.Fill({
            color: 'rgba(255, 107, 53, 0.25)'
        })
    });

    // Estilo para finca seleccionada por búsqueda - amarillo
    const selectedFincaStyle = new ol.style.Style({
        stroke: new ol.style.Stroke({
            color: '#F1C40F',  // Amarillo dorado
            width: 4
        }),
        fill: new ol.style.Fill({
            color: 'rgba(241, 196, 15, 0.4)'  // Amarillo semi-transparente
        }),
        zIndex: 1000  // Asegurar que esté por encima
    });

    // Crear la capa catastral con optimizaciones avanzadas
    const catastralLayer = new ol.layer.Vector({
        name: 'catastral',
        source: catastralSource,
        style: function(feature, resolution) {
            // Verificar si esta es la finca seleccionada
            if (window.selectedFincaFeature && feature === window.selectedFincaFeature) {
                return window.selectedFincaStyle;
            }

            // Calcular el nivel de zoom basado en la resolución
            const zoom = map.getView().getZoomForResolution(resolution);
            
            // Aplicar filtro por distrito si está activo
            if (window.activeDistrictFilter && window.activeDistrictFilter !== 'all') {
                const featureDistrict = feature.get('PRM_DISTRITO') || feature.get('prm_distrito');
                if (featureDistrict !== window.activeDistrictFilter) {
                    return null; // No mostrar esta feature
                }
            }

            // Sistema de renderizado ULTRA-ESCALONADO
            if (zoom < 12) {  // Aumentado de 11 a 12
                // Absolutamente invisible hasta zoom más alto
                return null;
            } else if (zoom < 13) {  // Aumentado de 12 a 13
                // Solo puntos para representar parcelas (mantiene geometría original)
                const geometry = feature.getGeometry();
                const center = ol.extent.getCenter(geometry.getExtent());
                return new ol.style.Style({
                    image: new ol.style.Circle({
                        radius: 1.5,  // Ligeramente más grande para mejor visibilidad
                        fill: new ol.style.Fill({ color: '#2E8B57' }),
                        stroke: new ol.style.Stroke({ color: '#1a5d3a', width: 0.5 })
                    }),
                    geometry: new ol.geom.Point(center)  // Solo cambia visualización, no datos
                });
            } else if (zoom < 14) {  // Aumentado de 13 a 14
                // Bordes ultra-delgados (geometría original intacta)
                return new ol.style.Style({
                    stroke: new ol.style.Stroke({
                        color: '#2E8B57',
                        width: 0.3  // Ligeramente más grueso para visibilidad
                    }),
                    fill: null  // Sin relleno para mejor performance
                });
            } else if (zoom < 16) {  // Aumentado de 15 a 16
                // Bordes delgados, sin relleno
                return new ol.style.Style({
                    stroke: new ol.style.Stroke({
                        color: '#2E8B57',
                        width: 0.6
                    })
                });
            } else {
                // Estilo completo solo en zoom MUY cercano
                return catastralStyle;
            }
        },
        zIndex: 10,
        // Optimizaciones EXTREMAS de renderizado (SIN modificar geometrías originales)
        renderBuffer: 2,  // Reducido aún más para mínima carga
        updateWhileAnimating: false,
        updateWhileInteracting: false,
        // Zoom mínimo ULTRA-restrictivo
        minZoom: 12,  // Aumentado de 11 a 12
        maxZoom: 22,
        // Optimizaciones MÁXIMAS anti-lag que preservan datos originales
        declutter: false,  // Mejor performance sin alterar geometrías
        renderMode: 'image',  // Render como imagen para mejor performance
        // Throttling de renderizado ULTRA-agresivo
        renderOrder: null,  // Desactivar ordenamiento para mejor performance
        // Optimización de memoria CRÍTICA
        extent: costaRicaExtent,  // Limitar extensión
        // Configuración de feature loading optimizada
        useSpatialIndex: true,
        // NUEVA: Limitar features por tile para evitar sobrecarga
        maxFeatures: 100,  // Máximo 100 features por tile
        // NUEVA: Preload agresivo deshabilitado
        preload: 0
    });

    // Hacer la capa accesible globalmente
    window.catastralLayer = catastralLayer;
    window.catastralSource = catastralSource;
    window.selectedFincaFeature = null;  // Para tracking de finca seleccionada
    window.selectedFincaStyle = selectedFincaStyle;  // Estilo para finca seleccionada

    // Agregar la capa al mapa
    map.addLayer(catastralLayer);

    // OPTIMIZACIÓN CRÍTICA: Sistema de renderizado diferido inteligente
    let renderTimeout;
    let isRendering = false;
    
    // Interceptar cambios de vista para diferir renderizado
    map.getView().on('change:resolution', function() {
        if (renderTimeout) clearTimeout(renderTimeout);
        if (isRendering) return;
        
        renderTimeout = setTimeout(() => {
            isRendering = true;
            catastralLayer.changed();
            setTimeout(() => { isRendering = false; }, 500);
        }, 300); // Esperar 300ms antes de renderizar
    });

    // Optimización de viewport: Solo renderizar lo visible + pequeño buffer
    map.on('moveend', function() {
        const view = map.getView();
        const zoom = view.getZoom();
        
        // Si está en zoom bajo, limpiar features cargadas para liberar memoria
        if (zoom < 12) {
            catastralSource.clear();
        }
    });

    // OPTIMIZACIÓN CRÍTICA: Gestión inteligente de memoria
    let featureCache = new Map();
    let maxCacheSize = 1000; // Máximo 1000 features en memoria
    
    catastralSource.on('addfeature', function(event) {
        const feature = event.feature;
        const fincaId = feature.get('PRM_FINCA') || feature.get('prm_finca');
        
        // Gestión de caché para evitar sobrecarga de memoria
        if (featureCache.size > maxCacheSize) {
            // Limpiar las features más antiguas
            const oldestKey = featureCache.keys().next().value;
            featureCache.delete(oldestKey);
        }
        
        if (fincaId) {
            featureCache.set(fincaId, feature);
        }
    });

    // Limpieza automática de memoria cada 30 segundos
    setInterval(() => {
        const currentZoom = map.getView().getZoom();
        if (currentZoom < 12 && featureCache.size > 0) {
            featureCache.clear();
            console.log('Cache de features limpiado para optimizar memoria');
        }
    }, 30000);

    // Configurar interacciones optimizadas para la capa catastral
    setupOptimizedCatastralInteractions(map, catastralLayer, highlightStyle);

    // Crear controles de filtrado, búsqueda y toggle catastral
    createDistrictFilter(map, catastralSource);
    createFincaSearch(map, catastralSource);
    createCatastralToggle(map, catastralLayer);

    // Log para confirmar que se está cargando
    console.log('Cargando capa catastral optimizada desde: Data/catastral_completo.geojson');
}

// Función optimizada para configurar interacciones de la capa catastral
function setupOptimizedCatastralInteractions(map, catastralLayer, highlightStyle) {
    let selectedFeature = null;
    let popup = null;
    let hoverTimeout = null;

    // Crear overlay para el popup
    const popupElement = document.createElement('div');
    popupElement.className = 'catastral-popup';
    popupElement.id = 'catastral-popup';

    popup = new ol.Overlay({
        element: popupElement,
        positioning: 'bottom-center',
        stopEvent: false,
        offset: [0, -10]
    });
    map.addOverlay(popup);

    // Evento de hover ULTRA-optimizado con throttling máximo
    map.on('pointermove', function(evt) {
        if (evt.dragging) return;
        
        // Solo activar hover en zooms MUY cercanos
        const currentZoom = map.getView().getZoom();
        if (currentZoom < 15) {  // Aumentado de 14 a 15
            // Limpiar hover en zoom alejado
            if (selectedFeature) {
                selectedFeature.setStyle(undefined);
                selectedFeature = null;
            }
            map.getTargetElement().style.cursor = '';
            return;
        }

        // Limpiar timeout anterior
        if (hoverTimeout) {
            clearTimeout(hoverTimeout);
        }

        // Debounce EXTREMO para eliminar completamente el lag
        hoverTimeout = setTimeout(() => {
            const feature = map.forEachFeatureAtPixel(evt.pixel, function(feature, layer) {
                if (layer === catastralLayer) {
                    return feature;
                }
            }, {
                // Opciones para optimizar al máximo la detección
                hitTolerance: 1,  // Reducido para mejor performance
                checkWrapped: false,
                layerFilter: function(layer) {
                    return layer === catastralLayer;
                }
            });

            // Restaurar estilo de la feature anterior
            if (selectedFeature && selectedFeature !== feature && selectedFeature !== window.selectedFincaFeature) {
                selectedFeature.setStyle(undefined);
            }

            // Aplicar estilo de resaltado a la nueva feature (si no es la finca seleccionada)
            if (feature && feature !== selectedFeature && feature !== window.selectedFincaFeature) {
                feature.setStyle(highlightStyle);
                map.getTargetElement().style.cursor = 'pointer';
            } else if (!feature) {
                map.getTargetElement().style.cursor = '';
            }

            selectedFeature = feature;
        }, 200); // Aumentado a 200ms para máximo anti-lag
    });

    // Evento de click ultra-optimizado con deselección
    map.on('singleclick', function(evt) {
        // Solo permitir clicks en zoom cercano
        const currentZoom = map.getView().getZoom();
        if (currentZoom < 13) {
            return; // No procesar clicks en zoom alejado
        }

        const feature = map.forEachFeatureAtPixel(evt.pixel, function(feature, layer) {
            if (layer === catastralLayer) {
                return feature;
            }
        }, {
            hitTolerance: 3,
            checkWrapped: false
        });

        if (feature) {
            // Click en una finca - mostrar popup
            showOptimizedCatastralPopup(feature, evt.coordinate, popup);
        } else {
            // Click en área vacía - deseleccionar finca y cerrar popup
            if (window.selectedFincaFeature) {
                window.selectedFincaFeature.setStyle(undefined);
                window.selectedFincaFeature = null;
                console.log('Finca deseleccionada');
            }
            popup.setPosition(undefined);
        }
    });

    // Limpiar hover cuando se sale del mapa
    map.on('pointerleave', function() {
        if (selectedFeature) {
            selectedFeature.setStyle(undefined);
            selectedFeature = null;
        }
        map.getTargetElement().style.cursor = '';
    });
}

// Función optimizada para mostrar el popup con información catastral
function showOptimizedCatastralPopup(feature, coordinate, popup) {
    const properties = feature.getProperties();
    const geometry = feature.getGeometry();
    
    // Obtener el centroide de la parcela
    const extent = geometry.getExtent();
    const center = ol.extent.getCenter(extent);
    
    // Formatear coordenadas
    const centerX = center[0].toFixed(2);
    const centerY = center[1].toFixed(2);
    
    // Calcular área aproximada (para polígonos)
    let area = '';
    if (geometry.getType() === 'Polygon' || geometry.getType() === 'MultiPolygon') {
        const areaValue = geometry.getArea();
        area = `<div class="popup-area">📐 Área: ${(areaValue / 10000).toFixed(4)} ha</div>`;
    }

    // Buscar número de finca - PRIORIDAD A PRM_FINCA
    const fincaNumber = properties.PRM_FINCA || properties.prm_finca || 
                       properties.finca || properties.FINCA || properties.num_finca || 
                       properties.numero_finca || properties.id || properties.ID || 'No disponible';
    
    // Número de distrito - PRIORIDAD A PRM_DISTRITO
    const distritoNumber = properties.PRM_DISTRITO || properties.prm_distrito || 
                          properties.num_distrito || properties.codigo_distrito || 'No disponible';
    
    // Obtener nombre completo del distrito
    const distritoCompleto = getDistrictName(distritoNumber);
    
    // Otros campos
    const propietario = properties.propietario || properties.PROPIETARIO || 
                       properties.owner || properties.nombre || properties.NOMBRE || 'No disponible';

    const distrito = properties.distrito || properties.DISTRITO || 
                    properties.district || properties.DISTRICT || 'No disponible';

    const canton = properties.canton || properties.CANTON || 
                  properties.municipality || properties.MUNICIPALITY || 'Coto Brus';

    // Información adicional si está disponible
    const cedula = properties.cedula || properties.CEDULA || properties.cedula_catastral || '';
    const plano = properties.plano || properties.PLANO || properties.num_plano || '';

    // Crear contenido del popup optimizado
    const popupContent = `
        <div class="popup-header">
            <h3>🏠 Finca Catastral</h3>
            <button class="popup-close" onclick="document.getElementById('catastral-popup').style.display='none'">×</button>
        </div>
        <div class="popup-body">
            <div class="popup-finca">🔢 Finca N°: <strong>${fincaNumber}</strong></div>
            <div class="popup-distrito-num">🏘️ ${distritoCompleto}</div>
            
            <div class="popup-coords">
                <div class="coord-title">📍 Coordenadas del Centro:</div>
                <div class="coord-values">
                    <span>X (Este): ${centerX} m</span>
                    <span>Y (Norte): ${centerY} m</span>
                </div>
                <div class="coord-system">Sistema: EPSG:8908 (CRTM05)</div>
            </div>
            
            ${area}
            
            <div class="popup-location">
                <div class="popup-canton">🏛️ Cantón: ${canton}</div>
            </div>
            
            ${propietario !== 'No disponible' ? `<div class="popup-owner">👤 Propietario: ${propietario}</div>` : ''}
            
            ${cedula ? `<div class="popup-cedula">🆔 Cédula Catastral: ${cedula}</div>` : ''}
            ${plano ? `<div class="popup-plano">📋 Plano: ${plano}</div>` : ''}
        </div>
    `;

    const popupElement = document.getElementById('catastral-popup');
    popupElement.innerHTML = popupContent;
    popupElement.style.display = 'block';
    
    popup.setPosition(coordinate);

    // Log para debugging
    console.log('Propiedades de la finca:', {
        PRM_FINCA: properties.PRM_FINCA,
        todas_las_propiedades: Object.keys(properties)
    });
}

// Función para crear el filtro de distrito
function createDistrictFilter(map, catastralSource) {
    // Variable global para el filtro activo
    window.activeDistrictFilter = 'all';

    // Crear el contenedor del filtro
    const filterContainer = document.createElement('div');
    filterContainer.className = 'district-filter-container';
    filterContainer.style.position = 'absolute';
    filterContainer.style.top = '70px';
    filterContainer.style.right = '10px';
    filterContainer.style.zIndex = '1000';

    // Botón para abrir el filtro
    const filterButton = document.createElement('button');
    filterButton.className = 'filter-toggle-btn';
    filterButton.innerHTML = '🗂️';
    filterButton.title = 'Filtrar por Distrito';

    // Panel del filtro (inicialmente oculto)
    const filterPanel = document.createElement('div');
    filterPanel.className = 'filter-panel';
    filterPanel.style.display = 'none';

    // Título del panel
    const title = document.createElement('div');
    title.className = 'filter-title';
    title.textContent = 'Filtrar por Distrito';
    filterPanel.appendChild(title);

    // Select de distritos
    const districtSelect = document.createElement('select');
    districtSelect.className = 'district-select';
    districtSelect.innerHTML = '<option value="all">Cargando distritos...</option>';

    // Botón de aplicar filtro
    const applyButton = document.createElement('button');
    applyButton.className = 'apply-filter-btn';
    applyButton.textContent = 'Aplicar Filtro';

    filterPanel.appendChild(districtSelect);
    filterPanel.appendChild(applyButton);

    // Event listener para el botón toggle
    let isFilterExpanded = false;
    filterButton.addEventListener('click', function() {
        isFilterExpanded = !isFilterExpanded;
        filterPanel.style.display = isFilterExpanded ? 'block' : 'none';
        filterButton.style.backgroundColor = isFilterExpanded ? '#0066cc' : '#fff';
        filterButton.style.color = isFilterExpanded ? '#fff' : '#333';
    });

    // Cargar distritos únicos cuando la fuente esté lista
    catastralSource.once('change', function() {
        if (catastralSource.getState() === 'ready') {
            const districts = new Set();
            catastralSource.getFeatures().forEach(feature => {
                const district = feature.get('PRM_DISTRITO') || feature.get('prm_distrito');
                if (district) {
                    const districtNum = parseInt(district);
                    // Solo incluir distritos del 1 al 6
                    if (districtNum >= 1 && districtNum <= 6) {
                        districts.add(district);
                    }
                }
            });

            // Limpiar y llenar el select
            districtSelect.innerHTML = '<option value="all">Todos los Distritos</option>';
            Array.from(districts).sort((a, b) => parseInt(a) - parseInt(b)).forEach(district => {
                const option = document.createElement('option');
                option.value = district;
                option.textContent = getDistrictName(district);
                districtSelect.appendChild(option);
            });
        }
    });

    // Event listener para aplicar filtro
    applyButton.addEventListener('click', function() {
        window.activeDistrictFilter = districtSelect.value;
        window.catastralLayer.changed(); // Forzar re-renderizado
        
        // Cerrar panel
        isFilterExpanded = false;
        filterPanel.style.display = 'none';
        filterButton.style.backgroundColor = districtSelect.value === 'all' ? '#fff' : '#27ae60';
        filterButton.style.color = districtSelect.value === 'all' ? '#333' : '#fff';
        
        console.log('Filtro aplicado para distrito:', districtSelect.value);
    });

    // Ensamblar el control
    filterContainer.appendChild(filterPanel);
    filterContainer.appendChild(filterButton);

    // Agregar el control al mapa
    document.body.appendChild(filterContainer);
}

// Función para crear el buscador de fincas
function createFincaSearch(map, catastralSource) {
    // Crear el contenedor del buscador
    const searchContainer = document.createElement('div');
    searchContainer.className = 'finca-search-container';
    searchContainer.style.position = 'absolute';
    searchContainer.style.top = '125px';
    searchContainer.style.right = '10px';
    searchContainer.style.zIndex = '1000';

    // Botón para abrir el buscador
    const searchButton = document.createElement('button');
    searchButton.className = 'finca-search-btn';
    searchButton.innerHTML = '🔍'; 
    searchButton.title = 'Buscar Finca';

    // Panel de búsqueda (inicialmente oculto)
    const searchPanel = document.createElement('div');
    searchPanel.className = 'finca-search-panel';
    searchPanel.style.display = 'none';

    // Título del panel
    const title = document.createElement('div');
    title.className = 'search-title';
    title.textContent = 'Buscar Finca';
    searchPanel.appendChild(title);

    // Campo de búsqueda
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Número de finca...';
    searchInput.className = 'finca-input';

    // Botón de búsqueda
    const findButton = document.createElement('button');
    findButton.className = 'find-btn';
    findButton.textContent = 'Buscar Finca';

    // Resultado de la búsqueda
    const resultDiv = document.createElement('div');
    resultDiv.className = 'search-result';

    searchPanel.appendChild(searchInput);
    searchPanel.appendChild(findButton);
    searchPanel.appendChild(resultDiv);

    // Event listener para el botón toggle
    let isSearchExpanded = false;
    searchButton.addEventListener('click', function() {
        isSearchExpanded = !isSearchExpanded;
        searchPanel.style.display = isSearchExpanded ? 'block' : 'none';
        searchButton.style.backgroundColor = isSearchExpanded ? '#0066cc' : '#fff';
        searchButton.style.color = isSearchExpanded ? '#fff' : '#333';
        
        if (isSearchExpanded) {
            searchInput.focus();
        }
    });

    // Función de búsqueda
    function searchFinca() {
        const fincaNumber = searchInput.value.trim();
        if (!fincaNumber) {
            resultDiv.innerHTML = '<div class="error">Ingrese un número de finca</div>';
            return;
        }

        resultDiv.innerHTML = '<div class="searching">Buscando...</div>';

        // Buscar en las features cargadas
        const features = catastralSource.getFeatures();
        const foundFeature = features.find(feature => {
            const featureFinca = feature.get('PRM_FINCA') || feature.get('prm_finca');
            return featureFinca && featureFinca.toString() === fincaNumber;
        });

        if (foundFeature) {
            // Limpiar selección anterior
            if (window.selectedFincaFeature) {
                window.selectedFincaFeature.setStyle(undefined);
            }

            // Establecer nueva finca seleccionada
            window.selectedFincaFeature = foundFeature;
            
            // Aplicar estilo amarillo inmediatamente
            foundFeature.setStyle(window.selectedFincaStyle);
            
            // Centrar el mapa en la finca encontrada
            const geometry = foundFeature.getGeometry();
            const extent = geometry.getExtent();
            
            map.getView().fit(extent, {
                padding: [50, 50, 50, 50],
                duration: 1000,
                maxZoom: 18
            });

            // Mostrar información
            const center = ol.extent.getCenter(extent);
            setTimeout(() => {
                showOptimizedCatastralPopup(foundFeature, center, map.getOverlays().getArray()[0]);
            }, 1000);

            resultDiv.innerHTML = `<div class="success">✅ Finca ${fincaNumber} encontrada y resaltada</div>`;
            
            // Cerrar panel después de un momento
            setTimeout(() => {
                isSearchExpanded = false;
                searchPanel.style.display = 'none';
                searchButton.style.backgroundColor = '#fff';
                searchButton.style.color = '#333';
            }, 2000);
            
        } else {
            resultDiv.innerHTML = `<div class="error">❌ Finca ${fincaNumber} no encontrada</div>`;
        }
    }

    // Event listeners
    findButton.addEventListener('click', searchFinca);
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchFinca();
        }
    });

    // Ensamblar el control
    searchContainer.appendChild(searchPanel);
    searchContainer.appendChild(searchButton);

    // Agregar el control al mapa
    document.body.appendChild(searchContainer);
}

// Función para crear el buscador de coordenadas
function createCoordinateSearch(map) {
    // Crear el contenedor principal
    const searchContainer = document.createElement('div');
    searchContainer.className = 'coordinate-search-container';
    searchContainer.style.position = 'absolute';
    searchContainer.style.top = '10px';
    searchContainer.style.right = '10px';
    searchContainer.style.zIndex = '1000';

    // Botón para abrir el buscador
    const searchButton = document.createElement('button');
    searchButton.className = 'search-toggle-btn';
    searchButton.innerHTML = '📍';
    searchButton.title = 'Buscar por Coordenadas';

    // Panel de búsqueda (inicialmente oculto)
    const searchPanel = document.createElement('div');
    searchPanel.className = 'search-panel';
    searchPanel.style.display = 'none';

    // Título del panel
    const title = document.createElement('div');
    title.className = 'search-title';
    title.textContent = 'Buscar Coordenadas';
    searchPanel.appendChild(title);

    // Campos de entrada
    const coordForm = document.createElement('form');
    coordForm.className = 'coord-form';

    // Campo X (Este)
    const xLabel = document.createElement('label');
    xLabel.textContent = 'X (Este):';
    const xInput = document.createElement('input');
    xInput.type = 'number';
    xInput.placeholder = 'ej: 500000';
    xInput.step = 'any';
    xInput.className = 'coord-input';

    // Campo Y (Norte)
    const yLabel = document.createElement('label');
    yLabel.textContent = 'Y (Norte):';
    const yInput = document.createElement('input');
    yInput.type = 'number';
    yInput.placeholder = 'ej: 1000000';
    yInput.step = 'any';
    yInput.className = 'coord-input';

    // Botón de búsqueda
    const searchBtn = document.createElement('button');
    searchBtn.type = 'submit';
    searchBtn.textContent = 'Ir a Coordenadas';
    searchBtn.className = 'search-btn';

    // Ensamblar el formulario
    coordForm.appendChild(xLabel);
    coordForm.appendChild(xInput);
    coordForm.appendChild(yLabel);
    coordForm.appendChild(yInput);
    coordForm.appendChild(searchBtn);
    searchPanel.appendChild(coordForm);

    // Evento para mostrar/ocultar el panel
    let isSearchExpanded = false;
    searchButton.addEventListener('click', function() {
        isSearchExpanded = !isSearchExpanded;
        searchPanel.style.display = isSearchExpanded ? 'block' : 'none';
        searchButton.style.backgroundColor = isSearchExpanded ? '#0066cc' : '#fff';
        searchButton.style.color = isSearchExpanded ? '#fff' : '#333';
    });

    // Evento para buscar coordenadas
    coordForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const x = parseFloat(xInput.value);
        const y = parseFloat(yInput.value);

        if (!isNaN(x) && !isNaN(y)) {
            // Ir a las coordenadas especificadas
            map.getView().animate({
                center: [x, y],
                zoom: 16,
                duration: 1000
            });

            // Crear un marcador temporal
            createTemporaryMarker(map, [x, y]);

            // Cerrar el panel
            isSearchExpanded = false;
            searchPanel.style.display = 'none';
            searchButton.style.backgroundColor = '#fff';
            searchButton.style.color = '#333';
        } else {
            alert('Por favor ingrese coordenadas válidas');
        }
    });

    // Ensamblar el control
    searchContainer.appendChild(searchPanel);
    searchContainer.appendChild(searchButton);

    // Agregar el control al mapa
    document.body.appendChild(searchContainer);
}

// Función para crear un marcador temporal estilizado
function createTemporaryMarker(map, coordinates) {
    // Remover marcador anterior si existe
    const existingMarker = map.getLayers().getArray().find(layer => layer.get('name') === 'search-marker');
    if (existingMarker) {
        map.removeLayer(existingMarker);
    }

    // Crear feature del marcador principal
    const markerFeature = new ol.Feature({
        geometry: new ol.geom.Point(coordinates),
        type: 'main-marker'
    });

    // Crear feature del anillo exterior
    const ringFeature = new ol.Feature({
        geometry: new ol.geom.Point(coordinates),
        type: 'ring-marker'
    });

    // Estilo del marcador principal
    const mainMarkerStyle = new ol.style.Style({
        image: new ol.style.Circle({
            radius: 12,
            fill: new ol.style.Fill({ 
                color: 'rgba(255, 68, 68, 0.9)' 
            }),
            stroke: new ol.style.Stroke({ 
                color: '#ffffff', 
                width: 3 
            })
        }),
        zIndex: 100
    });

    // Estilo del anillo exterior (animado)
    const ringStyle = new ol.style.Style({
        image: new ol.style.Circle({
            radius: 25,
            fill: new ol.style.Fill({ 
                color: 'rgba(255, 68, 68, 0.2)' 
            }),
            stroke: new ol.style.Stroke({ 
                color: 'rgba(255, 68, 68, 0.6)', 
                width: 2 
            })
        }),
        zIndex: 50
    });

    // Crear nueva capa de marcador
    const markerLayer = new ol.layer.Vector({
        name: 'search-marker',
        source: new ol.source.Vector({
            features: [ringFeature, markerFeature]
        }),
        style: function(feature) {
            if (feature.get('type') === 'main-marker') {
                return mainMarkerStyle;
            } else if (feature.get('type') === 'ring-marker') {
                return ringStyle;
            }
        }
    });

    map.addLayer(markerLayer);

    // Animación de pulsación del anillo
    let radius = 25;
    let growing = false;
    const animationInterval = setInterval(() => {
        if (growing) {
            radius += 1;
            if (radius >= 35) growing = false;
        } else {
            radius -= 1;
            if (radius <= 20) growing = true;
        }
        
        const newRingStyle = new ol.style.Style({
            image: new ol.style.Circle({
                radius: radius,
                fill: new ol.style.Fill({ 
                    color: `rgba(255, 68, 68, ${0.3 - (radius - 20) * 0.01})` 
                }),
                stroke: new ol.style.Stroke({ 
                    color: `rgba(255, 68, 68, ${0.8 - (radius - 20) * 0.02})`, 
                    width: 2 
                })
            }),
            zIndex: 50
        });
        
        ringFeature.setStyle(newRingStyle);
    }, 100);

    // Crear tooltip con las coordenadas
    createCoordinateTooltip(map, coordinates);

    // Remover el marcador después de 8 segundos
    setTimeout(() => {
        clearInterval(animationInterval);
        map.removeLayer(markerLayer);
        removeCoordinateTooltip();
    }, 8000);
}

// Función para crear tooltip con coordenadas
function createCoordinateTooltip(map, coordinates) {
    // Remover tooltip anterior si existe
    removeCoordinateTooltip();

    const tooltip = document.createElement('div');
    tooltip.id = 'coordinate-tooltip';
    tooltip.className = 'coordinate-tooltip';
    tooltip.innerHTML = `
        <div class="tooltip-title">📍 Coordenadas</div>
        <div class="tooltip-coords">
            <span>X: ${coordinates[0].toFixed(2)}</span>
            <span>Y: ${coordinates[1].toFixed(2)}</span>
        </div>
        <div class="tooltip-system">EPSG:8908</div>
    `;

    // Obtener la posición en píxeles
    const pixel = map.getPixelFromCoordinate(coordinates);
    tooltip.style.left = (pixel[0] + 20) + 'px';
    tooltip.style.top = (pixel[1] - 80) + 'px';

    document.body.appendChild(tooltip);

    // Actualizar posición cuando se mueva el mapa
    map.on('postrender', updateTooltipPosition);

    function updateTooltipPosition() {
        const newPixel = map.getPixelFromCoordinate(coordinates);
        if (tooltip && newPixel) {
            tooltip.style.left = (newPixel[0] + 20) + 'px';
            tooltip.style.top = (newPixel[1] - 80) + 'px';
        }
    }
}

// Función para remover el tooltip
function removeCoordinateTooltip() {
    const existingTooltip = document.getElementById('coordinate-tooltip');
    if (existingTooltip) {
        existingTooltip.remove();
    }
}

// Configuración del mapa
document.addEventListener('DOMContentLoaded', function() {
    // Definir las capas base
    const osmLayer = new ol.layer.Tile({
        title: 'OpenStreetMap',
        type: 'base',
        visible: true,
        source: new ol.source.OSM()
    });

    const satelliteLayer = new ol.layer.Tile({
        title: 'Satelital',
        type: 'base',
        visible: false,
        source: new ol.source.XYZ({
            url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            attributions: 'Tiles © Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
        })
    });

    const hybridLayer = new ol.layer.Group({
        title: 'Híbrido',
        type: 'base',
        visible: false,
        layers: [
            new ol.layer.Tile({
                source: new ol.source.XYZ({
                    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
                    attributions: 'Tiles © Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                })
            }),
            new ol.layer.Tile({
                source: new ol.source.XYZ({
                    url: 'https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
                    attributions: 'Labels © Esri'
                })
            })
        ]
    });

    // Crear el mapa
    const map = new ol.Map({
        target: 'map',
        layers: [osmLayer, satelliteLayer, hybridLayer],
        view: new ol.View({
            projection: 'EPSG:8908',
            center: sanVitoCoords,
            zoom: 12,
            minZoom: 7,    // Zoom mínimo para mantener la vista de la región
            maxZoom: 22,   // Zoom máximo para detalles catastrales
            extent: costaRicaExtent,
            constrainResolution: true  // Mantiene niveles de zoom enteros
        }),
        controls: [
            // Controles por defecto
            new ol.control.Zoom(),
            new ol.control.Attribution(),
            // Control de escala
            new ol.control.ScaleLine({
                units: 'metric',
                bar: true,
                steps: 4,
                text: true,
                minWidth: 140
            })
        ]
    });

    // Cargar capa catastral desde GeoJSON
    loadCatastralLayer(map);

    // Las interacciones básicas ya están incluidas por defecto en OpenLayers v8
    // Solo necesitamos agregar el control de capas base y el buscador
    createLayerSwitcher(map, [osmLayer, satelliteLayer, hybridLayer]);
    createCoordinateSearch(map);

    // Función para agregar capas catastrales (placeholder para futuras implementaciones)
    function addCatastralLayers() {
        // Aquí se pueden agregar capas WMS del catastro de Costa Rica
        // Ejemplo de capa WMS (comentado hasta tener la URL correcta):
        /*
        const catastralLayer = new ol.layer.Tile({
            source: new ol.source.TileWMS({
                url: 'URL_DEL_SERVICIO_WMS_CATASTRAL',
                params: {
                    'LAYERS': 'catastro:parcelas',
                    'TILED': true,
                    'SRS': 'EPSG:8908'
                },
                serverType: 'geoserver'
            })
        });
        map.addLayer(catastralLayer);
        */
    }

    // Hacer el mapa accesible globalmente para el resize
    window.map = map;

    // Log para verificar que el mapa se ha inicializado correctamente
    console.log('Mapa Catastral de Coto Brus inicializado');
    console.log('Centro del mapa (EPSG:8908):', sanVitoCoords);
    console.log('Proyección activa:', map.getView().getProjection().getCode());
});

// Función para redimensionar el mapa cuando cambie el tamaño de la ventana
window.addEventListener('resize', function() {
    setTimeout(() => {
        if (window.map && typeof window.map.updateSize === 'function') {
            window.map.updateSize();
        }
    }, 100);
});

// Función para crear el toggle de capa catastral
function createCatastralToggle(map, catastralLayer) {
    // Crear el contenedor del toggle
    const toggleContainer = document.createElement('div');
    toggleContainer.className = 'catastral-toggle-container';
    toggleContainer.style.position = 'absolute';
    toggleContainer.style.top = '180px';
    toggleContainer.style.right = '10px';
    toggleContainer.style.zIndex = '1000';

    // Botón toggle
    const toggleButton = document.createElement('button');
    toggleButton.className = 'catastral-toggle-btn active';
    toggleButton.innerHTML = '🗾';
    toggleButton.title = 'Activar/Desactivar Capa Catastral';

    // Estado inicial
    let isActive = true;

    // Event listener para toggle
    toggleButton.addEventListener('click', function() {
        isActive = !isActive;
        
        if (isActive) {
            // Activar capa catastral
            catastralLayer.setVisible(true);
            toggleButton.classList.add('active');
            toggleButton.style.backgroundColor = '#27ae60';
            toggleButton.style.color = '#fff';
            toggleButton.title = 'Desactivar Capa Catastral';
            console.log('Capa catastral activada');
        } else {
            // Desactivar capa catastral
            catastralLayer.setVisible(false);
            toggleButton.classList.remove('active');
            toggleButton.style.backgroundColor = '#e74c3c';
            toggleButton.style.color = '#fff';
            toggleButton.title = 'Activar Capa Catastral';
            
            // Limpiar finca seleccionada al desactivar
            if (window.selectedFincaFeature) {
                window.selectedFincaFeature.setStyle(undefined);
                window.selectedFincaFeature = null;
            }
            
            // Cerrar popup si está abierto
            const popup = map.getOverlays().getArray()[0];
            if (popup) {
                popup.setPosition(undefined);
            }
            
            console.log('Capa catastral desactivada');
        }
    });

    // Styling inicial (activo)
    toggleButton.style.backgroundColor = '#27ae60';
    toggleButton.style.color = '#fff';

    // Ensamblar el control
    toggleContainer.appendChild(toggleButton);

    // Agregar el control al mapa
    document.body.appendChild(toggleContainer);
}