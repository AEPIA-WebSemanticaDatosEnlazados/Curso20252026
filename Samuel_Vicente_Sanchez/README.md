# Memoria de Trabajo: Transformación de Accidentes de Tráfico en Madrid a Linked Data

**Asignatura:** Web Semántica y Datos Enlazados  
**Curso:** 2025-2026  
**Autor:** Samuel Vicente Sánchez

---

## Índice
1. [Introducción](#1-introducción)
2. [Proceso de transformación](#2-proceso-de-transformación)
    * [a. Selección de la fuente de datos](#a-selección-de-la-fuente-de-datos)
    * [b. Análisis de los datos](#b-analysis-de-los-datos)
    * [c. Estrategia de nombrado](#c-estrategia-de-nombrado)
    * [d. Desarrollo del vocabulario](#d-desarrollo-del-vocabulario)
    * [e. Proceso de transformación](#e-proceso-de-transformación)
    * [f. Enlazado](#f-enlazado)
    * [g. Publicación](#g-publicación)
3. [Aplicación y explotación](#3-aplicación-y-explotación)
4. [Conclusiones](#4-conclusiones)
5. [Bibliografía](#5-bibliografía)

---

## 1. Introducción
Este proyecto documenta el proceso de transformación de un conjunto de datos abiertos sobre siniestralidad vial en la ciudad de Madrid hacia un formato de datos enlazados (Linked Data). 

El objetivo principal es aplicar el ciclo de vida de generación de Linked Data, partiendo de una fuente de datos tabular y llegando a un grafo de conocimiento interconectado. Mediante el uso de tecnologías semánticas, buscamos dotar a la información de una estructura que permita consultas complejas y el enriquecimiento mediante fuentes externas como DBpedia, mejorando así la transparencia y utilidad de los datos públicos municipales.

---

## 2. Proceso de transformación

### a. Selección de la fuente de datos
La fuente de datos seleccionada para este proceso es el dataset denominado **"Accidentes de tráfico de la Ciudad de Madrid. 2024"**. Este conjunto de datos puede descargarse de forma oficial a través del Portal de Datos Abiertos del Ayuntamiento de Madrid mediante el siguiente enlace: [Accidentes Madrid (2024)](https://datos.madrid.es/dataset/300228-0-accidentes-trafico-detalle/downloads?hierarchy=2024). 

El responsable de la generación y mantenimiento de esta información es la **Policía Municipal de Madrid**, organismo encargado de registrar cada siniestro vial en el que existe intervención policial. El ámbito geográfico de los datos se circunscribe exclusivamente al término municipal de Madrid y, en cuanto al ámbito temporal, el dataset ofrece una granularidad diaria. Para este trabajo, se ha trabajado específicamente con la jerarquía correspondiente al año **2024**, aunque el portal mantiene registros históricos desde el año 2010. Este dataset es especialmente relevante ya que ofrece un desglose por cada persona implicada en el accidente, permitiendo un análisis detallado de la lesividad y los factores del entorno en el momento del impacto.

### b. Análisis de los datos
El conjunto de datos se presenta originalmente en formato CSV (valores separados por punto y coma `;`) y presenta un modelo de datos donde cada registro no representa un accidente único, sino la participación de un individuo en un siniestro. Esto implica que, para un mismo número de expediente, podemos encontrar múltiples filas dependiendo de si hubo varios conductores, peatones o pasajeros involucrados.

**Estructura y Tipología de Datos:**
La estructura de datos que se maneja se puede consultar en la siguente tabla, en la que se muestran todos los campos dosponibles, con su tipología y descripción del tipo de dato que representan:
| Campo | Tipo de Dato | Descripción |
| :--- | :--- | :--- |
| `num_expediente` | String | Identificador alfanumérico único del accidente. Crucial para agrupar múltiples filas de implicados en un solo evento. |
| `fecha` | Date | Fecha del siniestro (formato DD/MM/YYYY). Se transformará a `xsd:date` para facilitar filtros temporales. |
| `hora` | Time | Hora del accidente (formato HH:MM:SS). Representa el momento exacto del registro inicial. |
| `localizacion` | String | Descripción textual de la ubicación (vía principal o intersección de calles). |
| `numero` | String | Número de portal o punto kilométrico aproximado de la vía donde ocurrió el siniestro. |
| `cod_distrito` | Integer | Código administrativo de Madrid (1 a 21). Actúa como clave para el enlazado con DBpedia. |
| `distrito` | String | Nombre oficial del distrito municipal donde se localiza el siniestro. |
| `tipo_accidente` | String | Clasificación del suceso (ej: Atropello a persona, Colisión fronto-lateral, Caída). |
| `estado_meteorológico` | String | Condiciones ambientales en el momento del impacto (ej: Despejado, Lluvia débil, Granizo). |
| `tipo_vehiculo` | String | Categoría del vehículo implicado (ej: Turismo, Motocicleta > 125cc, Bicicleta). |
| `tipo_persona` | String | Rol del individuo en el accidente (ej: Conductor, Peatón, Pasajero). |
| `rango_edad` | String | Segmento de edad del implicado (ej: De 25 a 29 años). Útil para análisis demográficos. |
| `sexo` | String | Género del implicado (Hombre/Mujer). |
| `cod_lesividad` | Float | Código numérico que categoriza la gravedad de las heridas sufridas. |
| `lesividad` | String | Descripción de la gravedad (ej: Ingreso inferior a 24h, Sin asistencia sanitaria). |
| `coordenada_x_utm` | Float | Coordenada X en formato Universal Transversal de Mercator (Huso 30). |
| `coordenada_y_utm` | Float | Coordenada Y en formato Universal Transversal de Mercator. |
| `positiva_alcohol` | Boolean | Indica si el implicado dio positivo en la prueba de alcoholemia (S/N). |
| `positiva_droga` | Float | Indica presencia de estupefacientes. Presenta una alta tasa de valores nulos. |

**Problemas Identificados en la Fuente de Origen:**
Durante el análisis preliminar, se han identificado varios aspectos que requieren una limpieza profunda antes de la transformación semántica:
1. **Codificación de Caracteres:** Se detectan artefactos en el texto debido a una codificación inconsistente (habitualmente Latin-1 frente a UTF-8), lo que provoca errores en palabras con tildes como "Distrito de ChamartÃ­n" o "estado meteorolÃ³gico".
2. **Valores Nulos y Discrepancias:** Campos como `lesividad` o `positiva_droga` contienen una gran cantidad de celdas vacías o valores "NaN" que deben ser tratados como conocimiento ausente o valores por defecto.
3. **Inconsistencias en Nombres de Vías:** El campo `localizacion` presenta nombres de calles con variaciones en su escritura (uso de mayúsculas, abreviaturas o guiones), lo que dificulta la normalización necesaria para la creación de URIs persistentes.
4. **Transformación de Coordenadas:** Las coordenadas UTM proporcionadas no son directamente compatibles con los estándares de la Web Semántica (como GeoSPARQL o el vocabulario W3C Geo), por lo que será necesaria una conversión a Latitud/Longitud.

**Análisis de Licencias:**
El Ayuntamiento de Madrid publica esta información bajo los términos del aviso legal de su portal, el cual se basa en la Ley 37/2007 de reutilización de la información del sector público. Esta licencia permite la reproducción, distribución y transformación de los datos para fines comerciales o no, bajo la condición de citar siempre la fuente original (atribución). 

De acuerdo con las guías metodológicas del curso, se ha procedido a analizar la compatibilidad de esta licencia con la que se aplicará a los datos transformados. Dado que la fuente original impone una cláusula de atribución, se ha decidido que los datos enlazados resultantes se publiquen bajo una licencia **Creative Commons Atribución 4.0 Internacional (CC BY 4.0)**. Esta decisión está plenamente justificada ya que respeta los derechos del proveedor de datos (Policía Municipal / Ayuntamiento de Madrid), garantiza la transparencia y permite que futuros investigadores puedan realizar enlaces cruzados con este dataset sin restricciones legales adicionales, cumpliendo así con los estándares de apertura de la Web de Datos.

### c. Estrategia de nombrado
Para garantizar que los datos generados cumplan con los principios de Linked Data —especialmente el uso de URIs como nombres únicos y consultables— se ha definido un esquema de nombrado coherente y persistente. Se ha optado por separar claramente el modelo (vocabulario) de las instancias (datos) mediante el uso estratégico de *Hash* y *Slash* URIs.

1.  **Forma de las URIs:**
    * Se utilizarán **Hash URIs (#)** para los términos del vocabulario (clases y propiedades). Esto permite que, al solicitar cualquier término, el cliente reciba la definición completa del esquema en una sola transferencia HTTP, lo cual es óptimo para vocabularios de tamaño reducido.
    * Se utilizarán **Slash URIs (/)** para los individuos o recursos de datos. Esto facilita la escalabilidad y permite que el servidor gestione cada recurso de forma independiente mediante redirecciones 303 y negociación de contenido.
2.  **Dominio:** `http://madrid.accidentes.linkeddata.es/`.
3.  **Base para Vocabulario:** `http://madrid.accidentes.linkeddata.es/ontology#`.
4.  **Base para Recursos:** `http://madrid.accidentes.linkeddata.es/resource/`.
5.  **Patrones de Recursos:**
    * Accidentes: `.../resource/Accidente/[num_expediente]`.
    * Distritos: `.../resource/Distrito/[cod_distrito]`.

### d. Desarrollo del vocabulario
*Planteamiento:* Se desarrollará un vocabulario que defina los conceptos clave extraídos del CSV, tales como `Accidente`, `Vehiculo` y `Persona`. Para asegurar la interoperabilidad, se buscará el alineamiento con ontologías ampliamente aceptadas como **schema.org** para lugares (`schema:Place`) y **FOAF** para personas, además de vocabularios específicos de tiempo y geolocalización.

### e. Proceso de transformación
*Planteamiento:* Se utilizará la herramienta **OpenRefine** para realizar la limpieza de datos descrita en el apartado 2.b. Tras la adecuación de caracteres y tipos, se configurará el "esqueleto RDF" mapeando las columnas del CSV con los términos de nuestro vocabulario y se exportará el resultado en sintaxis **Turtle**.

### f. Enlazado
*Planteamiento:* Se llevarán a cabo tareas de enlazado externo mediante herramientas de reconciliación. El foco principal será la entidad `Distrito`, generando enlaces `owl:sameAs` hacia los recursos equivalentes en **DBpedia** para permitir el acceso a datos demográficos externos durante la fase de explotación.

### g. Publicación
*Planteamiento:* De forma opcional, se valorará la carga del grafo resultante en un servidor de datos como **Apache Jena Fuseki** para habilitar un punto de acceso SPARQL.

---

## 3. Aplicación y explotación
*Planteamiento:* En este apartado se explicarán las queries SPARQL diseñadas para responder a preguntas de interés (por ejemplo, accidentes en distritos con meteorología adversa) y, si procede, el código en Jena utilizado para la lectura y procesamiento del modelo.

---

## 4. Conclusiones
*Planteamiento:* Reflexión sobre la utilidad de los datos abiertos y la importancia de la normalización semántica en entornos urbanos.

---

## 5. Bibliografía
* Portal de Datos Abiertos del Ayuntamiento de Madrid.
* Especificación RDF del W3C.
* Apuntes de teoría de "Web Semántica y Datos Enlazados", 2025-2026.