# Transformación de Bienes de Interés Cultural (BIC) de Castilla y León a Linked Data

## 1. Introducción
El objetivo de este proyecto es la generación de un conjunto de datos enlazados (Linked Data) a partir del registro de Bienes de Interés Cultural (BIC) inmuebles ubicados en la Comunidad Autónoma de Castilla y León.

La gestión del patrimonio histórico genera una gran cantidad de información que, habitualmente, se encuentra aislada en silos de datos o formatos no interoperables. Mediante la transformación de estos datos a un modelo semántico (RDF) y su publicación siguiendo los principios de Linked Data, se pretende enriquecer la información original enlazándola con fuentes externas como Wikidata. Esto permite superar las limitaciones de las bases de datos tradicionales, posibilitando consultas complejas (e.g., "¿Qué monumentos existen en la provincia de Salamanca con coordenadas exactas?") y su explotación mediante aplicaciones de visualización geoespacial.

## 2. Fuente de Datos y Licencia

### 2.1. Selección de la fuente de datos
Para este trabajo se ha seleccionado el conjunto de datos oficial de **"Bienes de Interés Cultural"** proporcionado por el Portal de Datos Abiertos de la Junta de Castilla y León.

* **Origen:** [Datos Abiertos JCyL - Bienes inmuebles de interés cultural](https://datosabiertos.jcyl.es/web/jcyl/set/es/cultura-ocio/bienes-inmuebles/1284872768044)
* **Responsables del contenido:** 
   * Dirección General de Vivienda, Arquitectura, Ordenación del Territorio y Urbanismo (Consejería de Medio Ambiente, Vivienda y Ordenación del Territorio).
    * Dirección General de Patrimonio Cultural (Consejería de Cultura, Turismo y Deporte).
* **Dataset original:** Bienes de interés cultural (inmuebles) distribuido originalmente en formato ESRI Shapefile (.shp / .dbf).
* **Cobertura temporal:** 
    * Inicio de publicación: 1 de octubre de 2012.
    * Última actualización: 1 de mayo de 2019.
* **Ámbito geográfico:** Castilla y León (España).

### 2.2. Licencia
Los datos originales se publican bajo la **Licencia IGCYL-NC** (Uso no comercial). En consecuencia, para respetar los términos de reutilización, el dataset transformado y enriquecido resultante de este proyecto se publica bajo una licencia **CC-BY-NC 4.0** (Creative Commons Attribution-NonCommercial), permitiendo su reutilización siempre que se cite la fuente y no se persigan fines comerciales.

---

## 3. Proceso de Transformación (ETL Semántico)

El proceso de Extracción, Transformación y Carga (ETL) se ha realizado íntegramente mediante la herramienta **OpenRefine** (utilizando la extensión para modelado RDF). El flujo de trabajo se divide en las siguientes fases:

### 3.1. Preprocesamiento y Extracción
El paquete de descarga original incluía varios archivos propios de los Sistemas de Información Geográfica (GIS). Dado que la información alfanumérica relevante para la ontología residía en el fichero de atributos `.dbf`, se realizó una conversión inicial de formato a **CSV** para permitir su correcta ingesta y manipulación tabular en OpenRefine.

### 3.2. Limpieza y Normalización de Datos
Tras la importación del CSV, se detectaron problemas críticos de codificación (*mojibake*) en caracteres especiales. Para solucionarlo, se diseñó y aplicó un script basado en **GREL (Google Refine Expression Language)**. Esta transformación restaura las tildes y eñes, además de normalizar todos los campos de texto a mayúsculas para asegurar la consistencia del catálogo:

```GREL
// Corrección de codificación y normalización
value.replace('├æ', 'Ñ').replace('├▒', 'ñ').replace('├ü', 'Á').replace('├í', 'á')
     .replace('├ë', 'É').replace('├⌐', 'é').replace('├ì', 'Í').replace('├¡', 'í')
     .replace('├ô', 'Ó').replace('├│', 'ó').replace('├Ü', 'Ú').replace('├║', 'ú')
     .replace('├£', 'Ü').replace('├╝', 'ü').toUppercase()
```
Asimismo, se eliminaron columnas con códigos numéricos internos sin valor semántico y se aislaron variables clave como el código arqueológico.

### 3.3. Enriquecimiento mediante Web Scraping
El dataset original presentaba carencias en las fechas de protección. Para solventarlo, se implementó un proceso de extracción de datos (*Web Scraping*) directamente desde OpenRefine. Utilizando la columna que contenía la URL oficial del monumento (`url_pweb`), se realizó un parseo del código HTML de las fichas de la Junta de Castilla y León para recuperar la fecha de declaración real (`fecha_declaracion_web`).

### 3.4. Reconciliación con Wikidata (Linked Open Data)
El paso fundamental para convertir este catálogo en "Linked Data" fue la reconciliación de la columna de nombres contra el grafo de conocimiento de **Wikidata**. Este emparejamiento semántico permitió:
1. **Georreferenciación:** Extraer y separar en dos columnas numéricas las coordenadas geográficas exactas (`geo:lat`, `geo:long`), las cuales no estaban explícitas en el archivo CSV original.
2. **Enriquecimiento Multimedia:** Recuperar los enlaces a las fotografías de los monumentos (`foaf:depiction`).
3. **Interconectividad:** Vincular cada recurso local con su identificador global en la nube de datos enlazados (LOD Cloud) mediante la propiedad `owl:sameAs`.

### 3.5. Trazabilidad y Reproducibilidad (Script de Transformación JSON)
Para garantizar el rigor académico y la reproducibilidad técnica de este proyecto, se ha exportado el historial completo de operaciones de OpenRefine. Este script de transformación, guardado en formato **JSON**, registra cada limpieza, filtro, expresión GREL y reconciliación aplicada. Esto permite a cualquier investigador o auditor aplicar exactamente el mismo proceso ETL sobre el dataset crudo original de forma automatizada, obteniendo un resultado idéntico.

---

## 4. Modelado Semántico (Ontología y Mapeo RDF)

A partir de los datos limpios y enriquecidos, se procedió a la generación del Grafo de Conocimiento. Se ha diseñado un esqueleto de alineación RDF (Mapping) priorizando el uso de vocabularios estándar del W3C para garantizar la máxima interoperabilidad. 

* **URI Base del proyecto:** `http://patrimonio.jcyl.es/recurso/`

El mapeo de las columnas a propiedades semánticas se ha estructurado de la siguiente manera:

| Elemento Origen | Predicado RDF | Vocabulario | Descripción |
| :--- | :--- | :--- | :--- |
| **ID del Bien** | *Sujeto* (URI) | - | `<http://patrimonio.jcyl.es/recurso/bic/{ID}>` |
| **Nombre** | `rdfs:label` | RDFS | Nombre oficial del bien cultural. |
| **Categoría** | `rdf:type` | RDF | Clasificación del bien (Monumento, Yacimiento, etc.). |
| **Identificador**| `dcterms:identifier`| DCTERMS | Matrícula administrativa o código arqueológico. |
| **Fecha** | `dcterms:date` | DCTERMS | Fecha de declaración extraída mediante scraping. |
| **Página Web** | `foaf:homepage` | FOAF | URL de la ficha descriptiva en el portal institucional. |
| **Imagen** | `foaf:depiction` | FOAF | Fotografía del monumento obtenida vía Wikidata. |
| **Latitud** | `geo:lat` | GEO (WGS84)| Coordenada Y en formato decimal. |
| **Longitud** | `geo:long` | GEO (WGS84)| Coordenada X en formato decimal. |
| **Enlace LOD** | `owl:sameAs` | OWL | URI de conexión con la entidad equivalente en Wikidata. |

---

## 5. Estructura del Repositorio

El proyecto se organiza en la siguiente estructura de directorios para facilitar su comprensión y evaluación:

* 📁 `data/datos_originales/`: Contiene los ficheros fuente descargados del portal de datos abiertos (.shp, .dbf, etc.).
* 📁 `data/datos_limpios/`: Contiene el dataset en formato CSV estandarizado tras la fase de limpieza, scraping y reconciliación (previo a la semantización).
* 📁 `scripts/`: Contiene el archivo `script_limpieza.json` con el historial de operaciones de OpenRefine para la reproducibilidad del ETL.
* 📁 `rdf/`: Contiene el producto final del proyecto, `BIC-CyL.ttl`: el archivo serializado en formato **Turtle (.ttl)** con todas las tripletas del grafo.

## 6. Resultados y Siguientes Pasos
La ejecución de esta metodología ha dado como resultado un Grafo de Conocimiento robusto e interoperable. El dataset resultante está preparado para la fase final del proyecto: su ingesta en un servidor de bases de datos orientadas a grafos (Triplestore) como **Apache Jena Fuseki**. A partir de ese momento, la información patrimonial podrá ser interrogada mediante el lenguaje de consultas **SPARQL** e integrada en aplicaciones web de visualización en mapas.