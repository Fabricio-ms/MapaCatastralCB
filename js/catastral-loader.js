// Módulo de carga optimizada de datos catastrales
// Este archivo reemplaza la carga HTTP tradicional con carga optimizada

class CatastralDataLoader {
    constructor() {
        this.dataCache = null;
        this.loadingPromise = null;
    }

    // Carga optimizada con chunking y streaming
    async loadCatastralData() {
        if (this.dataCache) {
            return this.dataCache;
        }

        if (this.loadingPromise) {
            return this.loadingPromise;
        }

        this.loadingPromise = this.performOptimizedLoad();
        return this.loadingPromise;
    }

    async performOptimizedLoad() {
        try {
            console.log('🚀 Iniciando carga optimizada de datos catastrales...');
            
            // Usar fetch con streaming para archivos grandes
            const response = await fetch('Data/catastral_completo.geojson');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Leer como stream para mejor performance con archivos grandes
            const reader = response.body.getReader();
            const chunks = [];
            let receivedLength = 0;

            while (true) {
                const { done, value } = await reader.read();
                
                if (done) break;
                
                chunks.push(value);
                receivedLength += value.length;
                
                // Mostrar progreso cada 1MB
                if (receivedLength % (1024 * 1024) === 0) {
                    console.log(`📦 Cargado: ${(receivedLength / 1024 / 1024).toFixed(1)}MB`);
                }
            }

            // Concatenar chunks
            const allChunks = new Uint8Array(receivedLength);
            let position = 0;
            for (const chunk of chunks) {
                allChunks.set(chunk, position);
                position += chunk.length;
            }

            // Decodificar y parsear
            const jsonString = new TextDecoder().decode(allChunks);
            this.dataCache = JSON.parse(jsonString);
            
            console.log(`✅ Datos catastrales cargados: ${this.dataCache.features.length} features`);
            return this.dataCache;

        } catch (error) {
            console.error('❌ Error cargando datos catastrales:', error);
            throw error;
        }
    }

    // Pre-procesar datos para optimizar renderizado
    preprocessFeatures(features, zoom = 12) {
        if (!features) return [];

        return features.map(feature => {
            // Agregar metadatos de optimización sin modificar geometría
            feature.properties._renderZoom = zoom;
            feature.properties._area = this.calculateApproximateArea(feature.geometry);
            return feature;
        });
    }

    // Calcular área aproximada para optimizaciones de renderizado
    calculateApproximateArea(geometry) {
        if (!geometry || !geometry.coordinates) return 0;
        
        // Cálculo simple de área para optimización (no modifica geometría)
        if (geometry.type === 'Polygon') {
            const ring = geometry.coordinates[0];
            if (ring.length < 3) return 0;
            
            let area = 0;
            for (let i = 0; i < ring.length - 1; i++) {
                area += (ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1]);
            }
            return Math.abs(area) / 2;
        }
        
        return 0;
    }

    // Filtrar features por viewport para carga incremental
    getVisibleFeatures(extent, zoom) {
        if (!this.dataCache) return [];

        return this.dataCache.features.filter(feature => {
            // Filtro básico por extent para mejor performance
            if (feature.geometry && feature.geometry.type === 'Polygon') {
                const coords = feature.geometry.coordinates[0];
                if (coords && coords.length > 0) {
                    const bounds = this.getBounds(coords);
                    return this.intersects(bounds, extent);
                }
            }
            return true;
        });
    }

    getBounds(coordinates) {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        
        for (const coord of coordinates) {
            minX = Math.min(minX, coord[0]);
            maxX = Math.max(maxX, coord[0]);
            minY = Math.min(minY, coord[1]);
            maxY = Math.max(maxY, coord[1]);
        }
        
        return [minX, minY, maxX, maxY];
    }

    intersects(bounds1, bounds2) {
        return !(bounds1[2] < bounds2[0] || 
                 bounds1[0] > bounds2[2] || 
                 bounds1[3] < bounds2[1] || 
                 bounds1[1] > bounds2[3]);
    }
}

// Instancia global del loader optimizado
window.catastralLoader = new CatastralDataLoader();