# Memoria de Trabajo: Transformación de Accidentes de Tráfico en Madrid a Linked Data

**Asignatura:** Web Semántica y Datos Enlazados  
**Curso:** 2025-2026  
**Autor:** Samuel Vicente Sánchez

---

## Índice
1. [Introducción](#1-introducción)
2. [Proceso de transformación](#2-proceso-de-transformación)
    * [a. Selección de la fuente de datos](#a-selección-de-la-fuente-de-datos)
    * [b. Análisis de los datos](#b-análisis-de-los-datos)
    * [c. Estrategia de nombrado](#c-estrategia-de-nombrado)
    * [d. Desarrollo del vocabulario](#d-desarrollo-del-vocabulario)
    * [e. Proceso de transformación en OpenRefine](#e-proceso-de-transformación-en-openrefine)
    * [f. Enlazado](#f-enlazado)
    * [g. Publicación](#g-publicación)
3. [Aplicación y explotación](#3-aplicación-y-explotación)
4. [Conclusiones](#4-conclusiones)
5. [Bibliografía](#5-bibliografía)

---

## 1. Introducción

Este proyecto documenta el proceso íntegro de transformación de un conjunto de datos abiertos sobre siniestralidad vial en la ciudad de Madrid (año 2024) hacia un formato de Grafo de Conocimiento (Knowledge Graph). El objetivo principal es aplicar de forma rigurosa y práctica el ciclo de vida de generación de Linked Data, elevando el nivel de madurez de los datos mediante tecnologías semánticas estandarizadas por el W3C (RDF, OWL y SPARQL).

Para lograr este objetivo, se han llevado a cabo las siguientes fases metodológicas:
1. **Análisis y Modelado Conceptual:** Desarrollo de un vocabulario ontológico (`.ttl`) basado en la reutilización de estándares consolidados (`schema`, `xsd`, `geo`).
2. **ETL Semántico (Limpieza y Transformación):** Adecuación de la calidad del dato para resolver inconsistencias y valores nulos.
3. **Enlazado (Linking):** Reconciliación de entidades espaciales (distritos) con la nube de datos enlazados (LOD Cloud) mediante identificadores globales de **Wikidata**.
4. **Publicación y Explotación:** Despliegue del grafo resultante en un servidor semántico para su interrogación y consumo a través de un cuadro de mando analítico.

### Estructura del Repositorio y Trazabilidad

Desde un punto de vista metodológico, el proyecto exige que el proceso no solo sea descriptivo, sino auditable y reproducible. Por ello, el repositorio se ha organizado separando estrictamente los datos de origen, la lógica de transformación, el modelo conceptual, el resultado semántico y su capa de explotación:

```text
Samuel_Vicente_Sanchez/
├── README.md                          <-- Memoria técnica detallada del proyecto
├── app/
│   └── index.html                     <-- Aplicación web cliente para la explotación de los datos
├── data/
│   └── accidentes_trafico_madrid_2024.csv <-- Fuente de datos original (Raw data)
├── metadata/
│   └── dataset_metadata.ttl           <-- Archivo con metadatos VoID y DCAT
├── images/
│   ├── dashboard.jpg                  <-- Captura del panel principal de métricas
│   └── buscador.jpg                   <-- Captura del buscador de expedientes
├── ontology/
│   └── ontology.ttl                   <-- Vocabulario ontológico del dominio (OWL/Turtle)
├── rdf/
│   └── accidentes_madrid_2024.ttl     <-- Grafo de conocimiento final serializado en Turtle
└── transform/
    ├── cleaning_operations.json       <-- Historial de operaciones GREL para la limpieza de datos
    └── mapping_template.json          <-- Plantilla de configuración del esqueleto RDF
```

La función de cada directorio dentro de la arquitectura del proyecto es la siguiente:

* **`data/`**: Contiene la fuente tabular original. Sirve como punto de partida inmutable (*ground truth*) para todo el proceso de ingeniería de datos.
* **`transform/`**: Almacena los artefactos que garantizan la reproducibilidad del proceso. El archivo `cleaning_operations.json` recoge la secuencia de normalización aplicada en OpenRefine, mientras que `mapping_template.json` guarda el mapeo que convierte las columnas del CSV en sujetos, predicados y objetos RDF utilizando la extensión *RDF Transform*.
* **`ontology/`**: Formaliza el modelo de conocimiento conceptual mediante clases y propiedades, sirviendo como contrato semántico para la estructuración de las instancias.
* **`rdf/`**: Contiene el *Data Dump* resultante (con más de 100.000 tripletas transformadas). Representa la cristalización del trabajo de transformación a formato Turtle.
* **`app/` e `images/`**: Comprenden la capa de explotación práctica del grafo. Contienen el código fuente de una aplicación cliente capaz de consumir el Endpoint SPARQL local, así como evidencias visuales (`dashboard.jpg` y `buscador.jpg`) de su correcta ejecución. Esto garantiza la evaluación objetiva del trabajo en caso de indisponibilidad del entorno local del evaluador.

Esta arquitectura asegura que cada fase explicada en esta memoria esté respaldada por una evidencia técnica concreta, permitiendo la trazabilidad completa desde la celda original del CSV hasta la tripleta RDF consultada en la aplicación web.

---

## 2. Proceso de transformación

### a. Selección de la fuente de datos
La fuente seleccionada para este trabajo es el dataset **"Accidentes de tráfico de la Ciudad de Madrid. 2024"**, publicado a través del Portal de Datos Abiertos del Ayuntamiento de Madrid. Se trata de un conjunto de datos especialmente adecuado para un ejercicio de Web Semántica por tres motivos.

En primer lugar, posee un claro interés público. La siniestralidad vial es un ámbito directamente relacionado con la movilidad urbana, la seguridad ciudadana y la planificación municipal, por lo que su publicación en formatos reutilizables tiene valor tanto para la administración como para terceros.

En segundo lugar, presenta una estructura rica en dimensiones analíticas. Además de la identificación del accidente, el dataset incorpora información temporal, territorial, contextual y relativa a las personas implicadas, lo que abre la posibilidad de modelar relaciones entre eventos, lugares, condiciones meteorológicas y perfiles de implicados.

En tercer lugar, es una fuente apropiada para procesos de enlazado. La presencia de distritos como unidad territorial reconocible facilita la conexión con recursos externos de la LOD Cloud, algo fundamental para cumplir con los principios de Linked Data.

El responsable de la generación y mantenimiento de esta información es la **Policía Municipal de Madrid**, que registra los siniestros en los que existe intervención policial. El ámbito geográfico del dataset se limita al término municipal de Madrid y, en su versión de origen, la cobertura temporal trabajada en este proyecto corresponde al año **2024**.

### b. Análisis de los datos
El conjunto de datos se presenta originalmente en formato CSV, utilizando el carácter `;` como separador de campos. Uno de los aspectos más relevantes detectados en el análisis inicial es que la unidad de observación del fichero no es el accidente en sí mismo, sino la participación de una persona en un accidente. Esto significa que un mismo `num_expediente` puede aparecer repetido en varias filas, cada una asociada a distintos implicados, vehículos o condiciones registradas para el mismo siniestro.

Esta característica tiene consecuencias directas sobre el modelado semántico. Si el objetivo es representar el accidente como evento principal, resulta necesario distinguir entre el nivel del accidente y el nivel de las personas implicadas. Precisamente por ello, la ontología del proyecto contempla clases separadas para el accidente y para los implicados, aunque el mapeo RDF materializado en el repositorio todavía no explota toda esa granularidad.

**Estructura y tipología de datos**

La tabla siguiente resume los campos disponibles en la fuente, junto con su naturaleza y su utilidad dentro del proceso de transformación:

| Campo | Tipo de dato | Descripción |
| :--- | :--- | :--- |
| `num_expediente` | String | Identificador alfanumérico del accidente. Es la clave principal para agrupar filas pertenecientes al mismo siniestro. |
| `fecha` | Date | Fecha del siniestro en formato `DD/MM/YYYY`. Se normaliza posteriormente a `xsd:date`. |
| `hora` | Time | Hora del accidente en formato `HH:MM:SS`. Permite análisis temporales de mayor detalle. |
| `localizacion` | String | Descripción textual de la ubicación del accidente. |
| `numero` | String | Número de portal o referencia posicional asociada a la localización. |
| `cod_distrito` | Integer | Código administrativo del distrito. Es un buen candidato para identificar territorialmente el recurso. |
| `distrito` | String | Nombre oficial del distrito de Madrid donde se localiza el accidente. |
| `tipo_accidente` | String | Tipología del siniestro. |
| `estado_meteorológico` | String | Estado meteorológico declarado en el momento del accidente. |
| `tipo_vehiculo` | String | Tipo de vehículo asociado a la fila. |
| `tipo_persona` | String | Rol de la persona implicada. |
| `rango_edad` | String | Franja de edad del implicado. |
| `sexo` | String | Sexo de la persona implicada. |
| `cod_lesividad` | Float | Código numérico de lesividad. |
| `lesividad` | String | Descripción textual de la gravedad de las lesiones. |
| `coordenada_x_utm` | Float | Coordenada X en sistema UTM. |
| `coordenada_y_utm` | Float | Coordenada Y en sistema UTM. |
| `positiva_alcohol` | Boolean/String | Valor binario en origen expresado como `S` o `N`, susceptible de normalización booleana. |
| `positiva_droga` | Float/String | Campo con abundancia de valores vacíos y normalización más incompleta. |

**Problemas identificados en la fuente de origen**

Durante la revisión de la fuente se detectaron varios problemas que justifican una fase previa de depuración:

1. **Codificación y calidad textual.** Algunos valores pueden presentar artefactos derivados de inconsistencias de codificación. Esto afecta a la calidad del literal y puede comprometer búsquedas, reconciliación y generación de URIs limpias.
2. **Valores nulos y celdas vacías.** Existen atributos con una presencia significativa de ausencias, especialmente en campos como `lesividad` o `positiva_droga`. En un entorno semántico esto obliga a decidir cuidadosamente cuándo sustituir por un valor controlado y cuándo omitir la tripleta.
3. **Heterogeneidad léxica.** La localización y ciertas categorías pueden presentar diferencias de escritura, abreviaturas o convenciones administrativas que dificultan la normalización automática.
4. **Desajuste entre granularidad tabular y granularidad conceptual.** La existencia de varias filas por accidente requiere decidir si el RDF resultante representa filas individuales o accidentes agregados. El diseño del proyecto opta por representar el accidente como recurso principal.
5. **Información geoespacial todavía no materializada.** Aunque el dataset contiene coordenadas UTM y la ontología prevé propiedades geográficas, el mapeo RDF actual no incorpora todavía esa transformación al grafo publicado.

**Análisis de licencias**

El Ayuntamiento de Madrid publica esta información bajo las condiciones de reutilización de la información del sector público, con obligación de atribución de la fuente. A partir de ese marco, y siguiendo las pautas del trabajo de la asignatura, se ha considerado apropiado publicar los datos transformados bajo una licencia **Creative Commons Attribution 4.0 International (CC BY 4.0)**.

Esta decisión es coherente con el carácter abierto del dataset, preserva el reconocimiento de la fuente original y facilita la reutilización académica o técnica del resultado semántico. Además, encaja con el objetivo del proyecto: favorecer la interoperabilidad y el reaprovechamiento del conocimiento generado a partir de datos públicos.

### c. Estrategia de nombrado
Para garantizar la estabilidad de los identificadores y mantener una separación clara entre esquema e instancias, se ha adoptado una estrategia de nombrado basada en dos espacios diferenciados:

1. **Dominio base del proyecto:** `http://madrid.accidentes.linkeddata.es/`
2. **Espacio del vocabulario:** `http://madrid.accidentes.linkeddata.es/ontology#`
3. **Espacio de recursos:** `http://madrid.accidentes.linkeddata.es/resource/`

La decisión de utilizar **Hash URIs (`#`)** para el vocabulario responde a un criterio práctico: el esquema ontológico es reducido y puede recuperarse como un único documento. En cambio, para las instancias se emplean **Slash URIs (`/`)**, lo que favorece la extensibilidad futura del conjunto de datos y una publicación más natural de recursos individuales.

Los patrones de URI definidos en el README original siguen siendo válidos como convención general:

* Accidentes: `.../resource/Accidente/[num_expediente]`
* Distritos: `.../resource/Distrito/[cod_distrito]`

### d. Desarrollo del vocabulario
El vocabulario del proyecto se ha implementado en el archivo `ontology/ontology.ttl`, utilizando sintaxis Turtle y elementos OWL. El modelo combina términos propios del dominio con la reutilización de vocabularios bien establecidos, siguiendo una estrategia habitual en ingeniería ontológica: crear sólo aquello que no está ya bien resuelto por ontologías ampliamente adoptadas.

#### Conceptualización
Del análisis del dataset se derivan varias entidades principales:

* **`Accidente`**, como evento central del modelo.
* **`Distrito`**, como entidad territorial de referencia.
* **`Vehiculo`**, para representar el medio de transporte involucrado.
* **`Implicado`**, como persona asociada al siniestro.
* **`EstadoMeteorologico`**, como categoría contextual del accidente.

Además, la ontología define propiedades de objeto y de datos que estructuran las relaciones entre estas clases. Entre las propiedades de objeto destacan:

* `ocurrioEnDistrito`
* `tieneEstadoMeteorologico`
* `involucraVehiculo`
* `tieneImplicado`

Y entre las propiedades de datos se formalizan, entre otras:

* `numExpediente`
* `fechaAccidente`
* `horaAccidente`
* `direccion`
* `rangoEdad`
* `genero`
* `lesividad`
* `positivaAlcohol`
* `latitud`
* `longitud`

#### Reutilización de vocabularios externos
La ontología reutiliza términos de varios vocabularios consolidados:

* `schema` (`http://schema.org/`) para conceptos relacionados con lugar y dirección.

* `foaf` (`http://xmlns.com/foaf/0.1/`) para la caracterización general de personas implicadas.

* `geo` (`http://www.w3.org/2003/01/geo/wgs84_pos#`) para propiedades geográficas de latitud y longitud.

* `vcard` (`http://www.w3.org/2006/vcard/ns#`) para formatos de localización estructurada.

* `xsd` (`http://www.w3.org/2001/XMLSchema#`) para el tipado estricto de los datos literales.

Esta reutilización aporta interoperabilidad y evita reinventar conceptos ya estandarizados. Al mismo tiempo, el espacio de nombres propio `acc:` permite conservar un modelo adaptado al dominio concreto del proyecto.

#### Instanciación del modelo
Uno de los aspectos metodológicos más importantes para entender el repositorio es distinguir entre lo que **la ontología permite expresar** y lo que **el RDF exportado actualmente está expresando de forma efectiva**.

La ontología modela un escenario semántico rico y completo, diseñado para albergar accidentes, implicados, vehículos, estado meteorológico y coordenadas. Sin embargo, la plantilla de mapeo RDF presente en `transform/mapping_template.json` exporta por ahora el *core* fundamental del modelo:

* Sujeto de tipo `acc:Accidente`.
* `acc:numExpediente` asociado a un literal.
* `acc:fechaAccidente` tipado formalmente como `xsd:date`.
* `acc:direccion` textual.
* `acc:ocurrioEnDistrito` enlazado a la URI reconciliada de Wikidata.

Desde una perspectiva de ingeniería, esta diferencia es habitual y planificada. El vocabulario representa el contrato semántico y la arquitectura del sistema, mientras que el RDF publicado constituye una primera iteración ágil y funcional de ese diseño, dejando la puerta abierta a futuras ampliaciones del grafo sin necesidad de refactorizar la ontología base.

### e. Proceso de transformación en OpenRefine
La transformación de los datos tabulares se ha realizado con **OpenRefine**, apoyándose en dos artefactos guardados en el repositorio: el historial de limpieza (`cleaning_operations.json`) y la plantilla de mapeo RDF (`mapping_template.json`). Esto aporta reproducibilidad al proceso y permite justificar con precisión qué cambios se han aplicado realmente.

#### Operaciones de limpieza registradas
Del análisis del archivo `transform/cleaning_operations.json` se desprenden las siguientes operaciones principales:

1. **Normalización de la fecha.** La columna `fecha` se transforma desde el formato original `dd/MM/yyyy` a `yyyy-MM-dd`, lo que permite exportarla correctamente como `xsd:date`.
2. **Conversión booleana de alcohol.** La columna `positiva_alcohol` se recodifica de `S` y `N` a `true` y `false`.
3. **Creación de URI de accidente.** Se añade una nueva columna `URI_Accidente` concatenando el dominio base con el valor de `num_expediente`.
4. **Sustitución de vacíos en categorías.** Los campos `tipo_accidente`, `estado_meteorológico` y `tipo_vehiculo` se normalizan para evitar vacíos, unificando el valor final en torno al literal `Desconocido` cuando procede.
5. **Tratamiento parcial de `positiva_droga`.** Se recoge una transformación específica para convertir el valor `1` a `true`, lo que evidencia que este atributo requeriría una estrategia de normalización más completa si se incorporase al RDF.
6. **Reconciliación de distritos.** La columna `distrito` se reconcilia contra Wikidata usando el servicio `https://wikidata.reconci.link/en/api`, restringido al tipo `district of Madrid` (`Q3032114`).

Estas operaciones muestran que la limpieza se ha orientado principalmente a garantizar una exportación semántica consistente en aquellos atributos que sí iban a formar parte del grafo final.

#### Mapeo RDF aplicado
La plantilla `transform/mapping_template.json` permite reconstruir el alcance exacto de la exportación RDF. En ella se define que el sujeto de cada registro sea el valor de `URI_Accidente`, tipado como `acc:Accidente`, y que se generen las siguientes propiedades:

* `acc:numExpediente` a partir de `num_expediente`;
* `acc:fechaAccidente` a partir de `fecha` con tipo `xsd:date`;
* `acc:direccion` a partir de `localizacion`;
* `acc:ocurrioEnDistrito` apuntando directamente a la URI reconciliada de Wikidata para el distrito.

Esto significa que el RDF final no replica todos los campos del CSV, sino sólo aquellos que forman parte del mapeo efectivamente configurado. También implica que, aunque el proyecto identifica categorías como vehículo, persona implicada, sexo, lesividad o estado meteorológico, dichas dimensiones todavía no están materializadas en la exportación disponible en `rdf/accidentes_madrid_2024.ttl`.

#### Resultado de la transformación
El resultado es un grafo RDF centrado en el recurso `Accidente`, con identificación propia, fecha normalizada, dirección textual y conexión territorial mediante Wikidata. 

Es crucial destacar un hito técnico en la exportación: debido a la desnormalización del CSV original (donde un mismo accidente abarcaba múltiples filas por cada implicado), el motor RDF de OpenRefine, apoyado en la URI única del expediente, agrupó automáticamente las entidades. Esto ha permitido transformar unas ~50.000 filas tabulares en un grafo optimizado y sin redundancias de **103.490 tripletas**. Además, la serialización se ejecutó utilizando el modo **Turtle (stream)** para garantizar el rendimiento y evitar desbordamientos de memoria (*Out of Memory*) durante la generación del *Data Dump*. Este enfoque tiene una ventaja clara: permite obtener rápidamente un grafo limpio, navegable y enlazado, aun cuando el modelado completo del dominio todavía no haya sido desplegado en su totalidad.

### f. Enlazado
El enlazado externo constituye uno de los puntos más valiosos del proyecto. En lugar de mantener los distritos únicamente como literales de texto, el proceso de reconciliación en OpenRefine ha permitido asociarlos con entidades identificables en Wikidata. Desde la perspectiva de Linked Data, esto aporta dos beneficios inmediatos.

Por un lado, reduce la ambigüedad semántica. El valor textual `Hortaleza`, por ejemplo, deja de ser una cadena susceptible de variaciones ortográficas y pasa a estar vinculado a una entidad externa estable. En la práctica, esto se logró extrayendo dinámicamente el identificador reconciliado mediante la expresión GREL `"https://www.wikidata.org/entity/" + cell.recon.match.id` en la configuración de la extensión RDF Transform.

Por otro lado, abre la posibilidad de federar o enriquecer la información en futuras etapas, ya que el accidente queda conectado con un nodo reconocido de la Web de Datos (LOD Cloud).

En el RDF publicado, la reconciliación no se materializa mediante un recurso local de distrito enlazado con `owl:sameAs`, sino mediante una relación directa desde el accidente hacia la URI de Wikidata a través de `acc:ocurrioEnDistrito`. Es decir, el grafo actual opta por enlazar directamente con la entidad externa en lugar de crear primero una entidad local intermedia.

Esta solución es perfectamente válida para una primera publicación y, de hecho, simplifica el modelo exportado. Como posible evolución futura, podría considerarse la creación de recursos locales de tipo `Distrito` y la vinculación de éstos con Wikidata, lo que haría más explícita la separación entre la capa local y la capa externa del conocimiento.

### g. Publicación
Para la validación, acceso y explotación de los datos, el grafo resultante ha sido desplegado en un servidor de bases de datos de grafos (Triplestore). Se ha utilizado **Apache Jena Fuseki**, ejecutado en un entorno local, para servir el archivo Turtle y habilitar un punto de acceso (Endpoint) estándar.

**Detalles del despliegue:**
* **Herramienta:** Apache Jena Fuseki.
* **Motor de almacenamiento:** TDB2 (Persistent Dataset), elegido por su eficiencia en la gestión de memoria al indexar grafos de tamaño medio/grande.
* **Endpoint SPARQL:** `http://127.0.0.1:3030/accidentes_madrid/query`

A través de esta interfaz, el dataset expone los datos de accidentalidad para ser interrogados mediante lenguaje SPARQL, permitiendo resoluciones analíticas y agregaciones dinámicas que consumirán las aplicaciones cliente descritas en la siguiente fase. Adicionalmente, el grafo completo (`accidentes_madrid_2024.ttl`) se encuentra versionado en el repositorio dentro del directorio `rdf/` para su libre descarga y reutilización.

**Publicación de Metadatos (VoID / DCAT):**
Como buena práctica fundamental en la Web Semántica, la publicación no se limita al grafo en sí, sino que se acompaña de sus metadatos descriptivos. En el directorio `metadata/` se incluye el archivo `dataset_metadata.ttl`, implementado utilizando los vocabularios **VoID** (Vocabulary of Interlinked Datasets) y **DCAT** (Data Catalog Vocabulary). Este archivo documenta de forma legible para máquinas las estadísticas del dataset (número de tripletas), su autoría, la licencia (CC BY 4.0), y el punto de acceso SPARQL, facilitando su descubrimiento por agentes automatizados y catálogos de datos abiertos.

---

## 3. Aplicación y explotación

La transformación de este dataset a formato Linked Data no constituye un fin en sí mismo, sino el sustrato tecnológico necesario para habilitar aplicaciones inteligentes, escalables y descentralizadas. Para materializar el consumo de este Grafo de Conocimiento y demostrar la viabilidad del proyecto, se ha diseñado e implementado un prototipo funcional denominado **"Madrid Siniestralidad Semántica (SmartMobility)"**.

### Arquitectura de la Aplicación Cliente
En el directorio `app/` se incluye el desarrollo de una aplicación web cliente (`index.html`) construida bajo un enfoque *Single Page Application* (SPA). Esta interfaz actúa como capa de explotación visual y analítica, conectándose de forma asíncrona (vía JavaScript Vanilla) al Endpoint SPARQL local desplegado en Apache Jena Fuseki (`http://127.0.0.1:3030/accidentes_madrid/query`).

El diseño de la interfaz se ha implementado utilizando Tailwind CSS para garantizar una experiencia de usuario moderna, limpia y responsiva. La aplicación demuestra cómo una arquitectura desacoplada puede consumir datos semánticos en tiempo real sin depender de un *backend* relacional tradicional. Además, al estar los distritos enlazados a Wikidata, la aplicación abre la puerta a futuras integraciones federadas (por ejemplo, obteniendo la población del distrito en tiempo real desde Wikidata para calcular métricas de siniestralidad per cápita).

### Funcionalidades y Consultas SPARQL (Demostración de Viabilidad)
La aplicación web se estructura en dos módulos principales, cada uno alimentado por una consulta SPARQL específica diseñada para extraer valor del grafo:

**1. Dashboard Analítico (Agregación Estadística y Ranking)**
Este módulo presenta una visión macroscópica de la siniestralidad. Utilizando la librería *Chart.js*, renderiza un gráfico interactivo con el *Top* de distritos con mayor número de incidentes. Para alimentar este componente, la aplicación lanza una consulta que demuestra la capacidad del motor semántico para resolver funciones de agregación (`COUNT`, `GROUP BY`) agrupando por las URIs reconciliadas:

```sparql
PREFIX acc: <http://madrid.accidentes.linkeddata.es/ontology#>

SELECT ?distrito (COUNT(?accidente) AS ?totalAccidentes)
WHERE {
  ?accidente a acc:Accidente ;
             acc:ocurrioEnDistrito ?distrito .
}
GROUP BY ?distrito
ORDER BY DESC(?totalAccidentes)
```

**2. Buscador y Extracción de Detalle (Filtrado Dinámico)**
El segundo módulo simula la necesidad de un analista o ciudadano de consultar el detalle específico de los incidentes. La interfaz incluye una tabla de resultados que muestra las fechas, los expedientes y las direcciones. A modo de ejemplo, la siguiente consulta extrae los últimos siniestros ocurridos en el distrito de "Retiro", filtrando dinámicamente mediante el identificador global de Wikidata (`wd:Q2002296`). Adicionalmente, la interfaz web permite al usuario hacer clic en el distrito para navegar directamente a su entidad en la Web de Datos.

```sparql
PREFIX acc: <http://madrid.accidentes.linkeddata.es/ontology#>

SELECT ?fecha ?numExpediente ?direccion
WHERE {
  ?accidente a acc:Accidente ;
             acc:ocurrioEnDistrito <https://www.wikidata.org/entity/Q2002296> ;
             acc:fechaAccidente ?fecha ;
             acc:numExpediente ?numExpediente ;
             acc:direccion ?direccion .
}
ORDER BY DESC(?fecha)
LIMIT 10
```

### Evidencias Visuales y Plan de Contingencia
Con el objetivo de certificar el correcto funcionamiento de la aplicación y garantizar su auditabilidad en entornos donde no sea posible ejecutar el servidor local, se aportan evidencias visuales de la explotación de los datos.

Dentro del directorio `images/`, se adjuntan capturas de pantalla de alta resolución que certifican el correcto funcionamiento de la aplicación consumiendo el grafo RDF:
* **`images/dashboard.jpg`**: Evidencia la correcta renderización del panel de control, la integración con *Chart.js* y la visualización de los datos estadísticos devueltos por la consulta de agregación.
* **`images/buscador.jpg`**: Muestra la interfaz de búsqueda y la tabla de expedientes detallados, confirmando que la aplicación parsea y formatea correctamente los literales (`xsd:date`, `String`) y las URIs provenientes del Endpoint.

---

## 4. Conclusiones

La realización de este proyecto ha permitido recorrer de forma práctica y rigurosa el ciclo de vida completo para la generación, publicación y explotación de Datos Enlazados (Linked Data). Partiendo de un conjunto de datos tabulares tradicionales, correspondientes al Nivel 3 en el esquema de Tim Berners-Lee, se ha logrado una mejora radical de la interoperabilidad mediante su transformación de CSV a RDF. Esta evolución, respaldada por el diseño de una ontología propia y la reutilización de vocabularios estándar (`schema`, `xsd`, `geo`, `foaf`), ha dotado a los datos de una semántica explícita, logrando que la información deje de ser una tabla plana para convertirse en una red interconectada de conceptos plenamente comprensible por máquinas.

Un hito fundamental en este proceso ha sido el enriquecimiento del grafo mediante su integración con la LOD Cloud, elevando el dataset al Nivel 4 (y parcialmente 5) de madurez. La reconciliación de las entidades territoriales con Wikidata no solo ha solucionado los problemas de ambigüedad textual inherentes a la toponimia de los distritos, sino que ha conectado la información municipal con un hub de conocimiento global. Esta decisión de diseño arquitectónico es clave, ya que establece la infraestructura semántica necesaria para habilitar el cruce de datos mediante consultas federadas en el futuro.

Desde la perspectiva de la ingeniería de datos, el proceso ETL semántico supuso la superación de importantes barreras técnicas y de escalabilidad. La adopción de OpenRefine junto con la extensión *RDF Transform*, sumada a la aplicación de técnicas de serialización continua (*Turtle stream*), resultó determinante para ejecutar con éxito la desnormalización tabular. Esto permitió transformar aproximadamente 50.000 filas en más de 100.000 tripletas consolidadas sin sufrir bloqueos de memoria (Out-of-Memory). Adicionalmente, el proyecto ha consolidado la adopción de buenas prácticas en la fase de publicación, garantizando no solo la generación del grafo, sino también su correcta documentación y la instanciación de metadatos descriptivos mediante los vocabularios VoID y DCAT.

Finalmente, el proyecto ha culminado con la demostración empírica de su viabilidad tecnológica y su potencial analítico. El despliegue del Triplestore mediante Apache Jena Fuseki, junto con el desarrollo de una capa cliente (*Single Page Application* en HTML/JS), evidencia que el modelo es ágil y consultable en tiempo real. Mediante la ejecución de sentencias SPARQL, se ha comprobado la eficiencia de utilizar una arquitectura desacoplada para resolver agregaciones complejas y filtrados dinámicos, sirviendo todo este ecosistema como una base tecnológica sólida y escalable para futuras iniciativas de *Smart City* en el Ayuntamiento de Madrid.

### Líneas de trabajo futuro

Como consideración final y línea de trabajo futuro, es importante destacar que la exportación RDF publicada en este repositorio representa una primera iteración deliberadamente acotada. Su objetivo principal ha sido validar el flujo completo del dato —desde la extracción hasta su explotación mediante SPARQL— y demostrar la viabilidad de la arquitectura propuesta. No obstante, el esfuerzo invertido en la fase de modelado ontológico y en las operaciones de limpieza en OpenRefine ha dejado el terreno preparado para instanciar elementos mucho más complejos. 

Dimensiones analíticas que actualmente han quedado fuera del alcance de la materialización semántica —como la resolución avanzada de valores nulos e inconsistentes en el campo `positiva_droga`, la generación de tripletas geoespaciales explícitas (coordenadas X/Y) o la desagregación de los accidentes en entidades individuales para vehículos y personas implicadas— pueden incorporarse fácilmente en futuras ejecuciones del proceso ETL. Esto garantiza que el diseño adoptado es altamente escalable, permitiendo enriquecer la granularidad del Grafo de Conocimiento de forma progresiva sin necesidad de refactorizar el contrato semántico base.


---

## 5. Bibliografía y Recursos

Para la elaboración de este proyecto, el diseño del modelo ontológico y la ejecución técnica de las transformaciones, se han utilizado las siguientes referencias y herramientas:

**Fuentes de Datos y Conocimiento**
* **Ayuntamiento de Madrid (2024).** *Portal de Datos Abiertos: Accidentes de tráfico de la Ciudad de Madrid*. Recuperado de: [https://datos.madrid.es](https://datos.madrid.es)
* **Wikidata.** *Base de conocimiento libre y colaborativa*. Utilizada para el servicio de reconciliación de entidades espaciales (distritos). Recuperado de: [https://www.wikidata.org](https://www.wikidata.org)

**Estándares y Vocabularios (W3C)**
* **W3C (2014).** *RDF 1.1 Concepts and Abstract Syntax*. Recuperado de: [https://www.w3.org/TR/rdf11-concepts/](https://www.w3.org/TR/rdf11-concepts/)
* **W3C (2013).** *SPARQL 1.1 Query Language*. Recuperado de: [https://www.w3.org/TR/sparql11-query/](https://www.w3.org/TR/sparql11-query/)
* **W3C (2012).** *OWL 2 Web Ontology Language*. Recuperado de: [https://www.w3.org/TR/owl2-overview/](https://www.w3.org/TR/owl2-overview/)
* **W3C (2014).** *Data Catalog Vocabulary (DCAT)*. Recuperado de: [https://www.w3.org/TR/vocab-dcat/](https://www.w3.org/TR/vocab-dcat/)
* **W3C (2011).** *Describing Linked Datasets with the VoID Vocabulary*. Recuperado de: [https://www.w3.org/TR/void/](https://www.w3.org/TR/void/)

**Herramientas y Software**
* **OpenRefine (v3.10) & Comunidad.** Herramienta de limpieza y transformación de datos. Documentación oficial disponible en: [https://openrefine.org/](https://openrefine.org/)
* **AtesComp / RDF Transform.** Extensión para la exportación de grafos RDF desde OpenRefine. Repositorio: [https://github.com/AtesComp/rdf-transform](https://github.com/AtesComp/rdf-transform)
* **Apache Software Foundation.** *Apache Jena Fuseki*. Servidor Triplestore y endpoint SPARQL. Recuperado de: [https://jena.apache.org/documentation/fuseki2/](https://jena.apache.org/documentation/fuseki2/)

**Referencias Académicas**
* Material docente, guías prácticas y diapositivas de la asignatura *"Web Semántica y Datos Enlazados"* (Curso 2025-2026).