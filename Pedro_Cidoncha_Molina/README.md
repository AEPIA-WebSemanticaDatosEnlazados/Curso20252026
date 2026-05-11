# Transformación de Bienes de Interés Cultural (BIC) de Castilla y León a Linked Data

**Asignatura:** Web Semántica y Datos Enlazados

**Autor:** Pedro Cidoncha Molina

---

## 1. Introducción

El objetivo fundamental de este proyecto es la generación de un **Grafo de Conocimiento (Knowledge Graph)** interoperable a partir del registro de Bienes de Interés Cultural (BIC) inmuebles de la Comunidad Autónoma de Castilla y León.

La gestión del patrimonio histórico genera habitualmente silos de información en formatos no interoperables. Mediante la aplicación de principios de **Linked Data**, este trabajo transforma datos tabulares y geográficos en un modelo semántico (RDF), enriqueciéndolos con fuentes externas como Wikidata. Esto permite realizar consultas complejas y análisis geoespaciales que superan las capacidades de las bases de datos tradicionales.

## 2. Proceso de Transformación

### 2.1. Selección de la fuente de datos

Se ha seleccionado el conjunto de datos oficial de **"Bienes de Interés Cultural"** del Portal de Datos Abiertos de la Junta de Castilla y León.

* **Origen:** [Datos Abiertos JCyL](https://datosabiertos.jcyl.es/web/jcyl/set/es/cultura-ocio/bienes-inmuebles/1284872768044).
* **Dataset original:** Distribuido originalmente como ESRI Shapefile (.shp / .dbf).
* **Ámbito:** Castilla y León (España).

### 2.2. Análisis de los datos

Los datos manejados son de naturaleza mixta: alfanuméricos (nombres, fechas, códigos) y geoespaciales (coordenadas). Originalmente, el formato `.dbf` presentaba tipos de datos `String` para etiquetas y `Numeric` para identificadores internos.

* **Licencia de origen:** Los datos se publican bajo la licencia **IGCYL-NC** (Uso no comercial).
* **Justificación de licencia resultante:** Para mantener la coherencia con la fuente original y proteger la autoría del enriquecimiento semántico, los datos transformados se publican bajo **CC-BY-NC 4.0**.

### 2.3. Estrategia de nombrado

Se ha definido una política de nombrado de URIs persistente y única para evitar colisiones en la Web de Datos:

* **URI Base de Recursos:** `http://patrimonio.jcyl.es/recurso/bic/{ID_UNICO}`.
* **Vocabulario local:** Los términos específicos no cubiertos por ontologías estándar se definen bajo el espacio de nombres `http://patrimonio.jcyl.es/ontology#`.

### 2.4. Desarrollo del vocabulario

Se ha implementado un vocabulario ligero en formato Turtle (`ontology.ttl`) que soporta íntegramente los datos de origen. En lugar de una ontología compleja, se ha priorizado la reutilización de vocabularios estándar del W3C para maximizar la interoperabilidad:

* `rdfs:label` para nombres oficiales.
* `geo:lat` y `geo:long` para la georreferenciación.
* `foaf:depiction` para recursos multimedia.
* `dcterms:date` para la cronología administrativa.

### 2.5. Ejecución del Proceso (ETL)

Se ha utilizado **OpenRefine** con la extensión RDF Transform debido a su capacidad para manejar grandes volúmenes de datos y su soporte para lenguajes de expresión como **GREL**.

1. **Limpieza:** Se aplicó un script GREL para corregir errores de codificación (*mojibake*) y normalizar caracteres especiales (ñ, tildes).
2. **Scraping:** Se parsearon las fichas web oficiales de la Junta para recuperar fechas de declaración que faltaban en el dataset original.
3. **Adecuación:** Se normalizaron los textos a mayúsculas y se eliminaron columnas redundantes sin valor semántico.
4. **Reproducibilidad:** Todo el historial de operaciones de transformación ha sido exportado y guardado en el archivo `scripts/script_limpieza.json`. Esto permite auditar y replicar íntegramente el proceso de curación de datos sobre el dataset original.

### 2.6. Enlazado (Linked Open Data)

El enriquecimiento se realizó mediante la reconciliación de la columna de nombres con **Wikidata**. Mediante la propiedad `owl:sameAs`, se han generado enlaces a las entidades de Wikidata, permitiendo recuperar coordenadas geográficas y fotografías de Wikimedia Commons.

Adicionalmente, para asegurar una alta disponibilidad de acceso a la nube LOD, la arquitectura de la aplicación web implementa un mecanismo híbrido: utiliza la URI de `owl:sameAs` como fuente primaria de enlazado y, en caso de ausencia, construye dinámicamente URIs de búsqueda en Wikipedia basadas en el `rdfs:label` del recurso.

### 2.7. Publicación

Para la explotación de los datos, el grafo resultante `BIC-CyL.ttl` se ha desplegado localmente mediante un servidor **Apache Jena Fuseki**. Este entorno proporciona un endpoint SPARQL que actúa como motor de consultas para la capa de visualización.

## 3. Aplicación y Explotación

### 3.1. Funcionalidades y Valor Añadido

La solución desarrollada es un visor cartográfico interactivo que aporta valor mediante:

* **Búsqueda Semántica:** Filtrado por etiquetas y categorías de monumento.
* **Geofencing Dinámico:** Herramienta SIG que permite al usuario seleccionar una zona personalizada en el mapa y recalcular estadísticas en tiempo real.
* **Análisis Visual:** Un dashboard (Chart.js) que muestra la distribución porcentual de categorías según la vista actual del mapa.

### 3.2. Implementación de Consultas SPARQL

La aplicación web recupera la información de los monumentos, su georreferenciación y metadatos externos mediante una consulta SPARQL optimizada:

```sparql
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX geo: <http://www.w3.org/2003/01/geo/wgs84_pos#>
PREFIX foaf: <http://xmlns.com/foaf/0.1/>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX dc: <http://purl.org/dc/terms/>
PREFIX owl: <http://www.w3.org/2002/07/owl#>

SELECT DISTINCT ?nombre ?latitud ?longitud ?enlaceFoto ?tipo ?fecha ?enlaceFuente ?enlaceWikidata
WHERE {
  ?monumento rdfs:label ?nombre .
  ?monumento geo:lat ?latitud .
  ?monumento geo:long ?longitud .
  
  OPTIONAL { ?monumento rdf:type ?tipo . }
  OPTIONAL { ?monumento dc:date ?fecha . }
  OPTIONAL { ?monumento foaf:homepage ?enlaceFuente . }
  OPTIONAL { ?monumento owl:sameAs ?enlaceWikidata . }
  OPTIONAL { 
    ?monumento foaf:depiction ?nombreFoto .
    BIND(CONCAT("https://commons.wikimedia.org/wiki/Special:FilePath/", ENCODE_FOR_URI(STR(?nombreFoto))) AS ?enlaceFoto)
  }
  
  # Filtro espacial Bounding Box (Castilla y León)
  FILTER (xsd:float(?latitud) > 40.05 && xsd:float(?latitud) < 43.30 && xsd:float(?longitud) > -7.25 && xsd:float(?longitud) < -1.70)
  
  # Filtros de exclusión para depuración de ruido geográfico limítrofe
  FILTER (!(xsd:float(?latitud) < 41.02 && xsd:float(?longitud) > -3.95 && xsd:float(?longitud) < -3.00))
  FILTER (!(xsd:float(?latitud) < 40.74 && xsd:float(?longitud) > -4.15 && xsd:float(?longitud) < -3.85))
  FILTER (!(xsd:float(?latitud) < 41.25 && xsd:float(?longitud) > -2.90 && xsd:float(?longitud) < -2.70))
  FILTER (!(xsd:float(?latitud) < 41.40 && xsd:float(?longitud) > -2.00 && xsd:float(?longitud) < -1.70))
  FILTER (!(xsd:float(?latitud) > 42.15 && xsd:float(?latitud) < 42.60 && xsd:float(?longitud) > -3.05 && xsd:float(?longitud) < -1.70))
  FILTER (!(xsd:float(?latitud) > 42.75 && xsd:float(?latitud) < 43.30 && xsd:float(?longitud) > -3.05 && xsd:float(?longitud) < -1.70))
  FILTER (!(xsd:float(?latitud) > 43.00 && xsd:float(?longitud) > -4.10 && xsd:float(?longitud) < -3.85))
  FILTER (!(xsd:float(?latitud) > 43.10 && xsd:float(?longitud) > -3.85 && xsd:float(?longitud) < -3.40))
}
LIMIT 1000

```

**Justificación técnica de la consulta:** 
1. **Calidad de datos espaciales:** Se ha implementado un filtrado espacial mediante múltiples cláusulas `FILTER`. Esto permite definir un *Bounding Box* general para Castilla y León y excluir de forma precisa las coordenadas que corresponden a comunidades limítrofes (como Madrid, Cantabria, País Vasco o La Rioja). Esta técnica depura el ruido geográfico originado en la reconciliación con Wikidata directamente en el motor SPARQL, garantizando que el frontend solo renderice instancias correctas.
2. **Integridad y compatibilidad:** Se utiliza `DISTINCT` para evitar duplicidades producidas por el cruce de grafos durante el enlazado, y `ENCODE_FOR_URI` para asegurar que las URLs de imágenes multimedia con caracteres especiales sean interpretadas correctamente por el navegador.

## 4. Estructura del Repositorio

* 📁 `app/`: Cliente web interactivo (HTML, JS, CSS).
* 📁 `data/`: Datasets en formato original (.dbf) y procesado (.csv).
* 📁 `images/`: Capturas de pantalla de la aplicación.
* 📁 `metadata/`: Descripción VoID/DCAT del dataset para su descubrimiento por máquinas.
* 📁 `ontology/`: Definiciones del vocabulario local en Turtle (`ontology.ttl`).
* 📁 `rdf/`: Producto final serializado (`BIC-CyL.ttl`).
* 📁 `scripts/`: Historial de operaciones JSON para asegurar la reproducibilidad del proceso ETL.

## 5. Instrucciones de Despliegue y Ejecución

Para replicar el entorno de ejecución y visualizar la aplicación web localmente, es necesario:

**1. Despliegue del Servidor Semántico (Apache Jena Fuseki)**
* Descargar e iniciar Apache Jena Fuseki.
* En la interfaz de administración (habitualmente `http://localhost:3030`), crear un nuevo dataset.
* **IMPORTANTE:** El nombre del dataset debe ser exactamente `bic_cyl` (para que coincida con el endpoint configurado en la aplicación cliente).
* Seleccionar el tipo de dataset como **Persistent (TDB2)** para mayor eficiencia.
* Cargar el archivo `rdf/BIC-CyL.ttl` dentro de este nuevo dataset.

**2. Ejecución de la Aplicación Web**
* Se puede abrir directamente dando doble clic en el archivo `app/index.html`.
* Como segunda opción se puede iniciar un servidor local (por ejemplo, con Python: `python -m http.server 8000` desde la raíz del proyecto) y acceder a `http://localhost:8000/app/index.html` para evitar problemas de CORS.

## 6. Conclusiones

El proyecto demuestra que es posible transformar datos administrativos aislados en un Grafo de Conocimiento dinámico. La integración de tecnologías como OpenRefine y Jena Fuseki permite no solo la limpieza de datos, sino su conversión en un recurso útil para el análisis patrimonial y la toma de decisiones basada en datos enlazados.

## 7. Bibliografía

* **W3C (2014).** *RDF 1.1 Concepts and Abstract Syntax*.
* **W3C (2013).** *SPARQL 1.1 Query Language*.
* **W3C (2014).** *Data Catalog Vocabulary (DCAT)*.
* **Junta de Castilla y León.** *Portal de Datos Abiertos*.