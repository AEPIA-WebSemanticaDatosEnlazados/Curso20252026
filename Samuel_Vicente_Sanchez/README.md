# Memoria de Trabajo: Transformación de Accidentes de Tráfico en Madrid a Linked Data

**Asignatura:** Web Semántica y Datos Enlazados  
**Curso:** 2025-2026  
**Autor:** Samuel Vicente Sánchez

---

## Índice
1. [Introducción](#1-introducción)
2. [Estructura del repositorio](#2-estructura-del-repositorio)
3. [Proceso de transformación](#3-proceso-de-transformación)
    * [a. Selección de la fuente de datos](#a-selección-de-la-fuente-de-datos)
    * [b. Análisis de los datos](#b-análisis-de-los-datos)
    * [c. Estrategia de nombrado](#c-estrategia-de-nombrado)
    * [d. Desarrollo del vocabulario](#d-desarrollo-del-vocabulario)
    * [e. Proceso de transformación en OpenRefine](#e-proceso-de-transformación-en-openrefine)
    * [f. Enlazado](#f-enlazado)
    * [g. Publicación](#g-publicación)
4. [Aplicación y explotación](#4-aplicación-y-explotación)
5. [Conclusiones](#5-conclusiones)
6. [Bibliografía](#6-bibliografía)

---

## 1. Introducción
Este proyecto documenta el proceso de transformación de un conjunto de datos abiertos sobre siniestralidad vial en la ciudad de Madrid hacia un formato de datos enlazados (Linked Data). El trabajo parte de una fuente tabular en CSV y culmina en dos resultados complementarios: un vocabulario ontológico en Turtle/OWL y un grafo RDF serializado también en Turtle.

El objetivo principal es aplicar de forma práctica el ciclo de vida de generación de Linked Data sobre un caso real de datos públicos urbanos. Para ello se ha trabajado sobre el dataset de accidentes de tráfico de Madrid correspondiente a 2024, realizando tareas de análisis, limpieza, modelado semántico, transformación y enlazado con una fuente externa de referencia. El resultado persigue mejorar la interoperabilidad del dato, facilitar su consulta semántica y dejar preparada una base reutilizable para futuras ampliaciones del grafo.

Para contextualizar el contenido del trabajo, el repositorio individual se organiza en torno a los principales artefactos generados durante el proceso de transformación:

```text
Samuel_Vicente_Sanchez/
├── README.md
├── data/
│   └── accidentes_trafico_madrid_2024.csv
├── ontology/
│   └── ontology.ttl
├── rdf/
│   └── accidentes_madrid_2024.ttl
└── transform/
  ├── cleaning_operations.json
  └── mapping_template.json
```

Esta estructura separa la fuente de datos original, los artefactos de limpieza y mapeo, el vocabulario ontológico y el RDF resultante. De este modo, el repositorio no sólo contiene la memoria explicativa, sino también la evidencia técnica de cada fase del trabajo.

Desde el punto de vista del repositorio, el trabajo no se limita a un documento descriptivo, sino que queda respaldado por artefactos concretos que evidencian cada fase del proceso:

* el fichero original de datos tabulares;
* las operaciones de limpieza realizadas en OpenRefine;
* la plantilla de mapeo RDF utilizada para la exportación;
* la ontología del dominio;
* y el RDF resultante generado a partir del proceso.

Esta memoria se ha redactado con un criterio deliberadamente técnico: no sólo describe la intención del proyecto, sino también el alcance real de lo que actualmente está modelado y publicado dentro del repositorio.

---

## 2. Estructura del repositorio
La función de cada elemento del repositorio es la siguiente:

* **`data/`** contiene la fuente de datos original utilizada como punto de partida del proyecto. En este caso se trabaja con el CSV de accidentes de tráfico de Madrid correspondientes al año 2024.
* **`transform/cleaning_operations.json`** recoge la secuencia de operaciones aplicadas en OpenRefine para normalizar parte de los datos antes de su exportación semántica. Es, por tanto, la evidencia reproducible del proceso de limpieza.
* **`transform/mapping_template.json`** almacena la configuración del mapeo RDF realizada con la extensión RDF Transform de OpenRefine. En este archivo se define qué columnas del CSV se convierten en sujetos, propiedades y objetos RDF.
* **`ontology/ontology.ttl`** contiene el vocabulario del dominio, implementado en Turtle con elementos OWL y referencias a vocabularios reutilizados. Aquí se formalizan las clases y propiedades del modelo conceptual.
* **`rdf/accidentes_madrid_2024.ttl`** es la serialización RDF generada a partir de los datos tabulares transformados. Representa el resultado material del proceso de conversión a Linked Data.

Esta organización permite separar con claridad los datos de origen, la lógica de transformación, el modelo semántico y el resultado final. Desde un punto de vista metodológico, esta separación es importante porque facilita la trazabilidad: cada afirmación del README puede contrastarse con un fichero concreto del repositorio.

---

## 3. Proceso de transformación

### a. Selección de la fuente de datos
La fuente seleccionada para este trabajo es el dataset **"Accidentes de tráfico de la Ciudad de Madrid. 2024"**, publicado a través del Portal de Datos Abiertos del Ayuntamiento de Madrid. Se trata de un conjunto de datos especialmente adecuado para un ejercicio de Web Semántica por tres motivos.

En primer lugar, posee un claro interés público. La siniestralidad vial es un ámbito directamente relacionado con la movilidad urbana, la seguridad ciudadana y la planificación municipal, por lo que su publicación en formatos reutilizables tiene valor tanto para la administración como para terceros.

En segundo lugar, presenta una estructura rica en dimensiones analíticas. Además de la identificación del accidente, el dataset incorpora información temporal, territorial, contextual y relativa a las personas implicadas, lo que abre la posibilidad de modelar relaciones entre eventos, lugares, condiciones meteorológicas y perfiles de implicados.

En tercer lugar, es una fuente apropiada para procesos de enlazado. La presencia de distritos como unidad territorial reconocible facilita la conexión con recursos externos de la LOD Cloud, algo fundamental para cumplir con los principios de Linked Data.

El responsable de la generación y mantenimiento de esta información es la **Policía Municipal de Madrid**, que registra los siniestros en los que existe intervención policial. El ámbito geográfico del dataset se limita al término municipal de Madrid y, en su versión de origen, la cobertura temporal trabajada en este proyecto corresponde al año **2024**.

### b. Análisis de los datos
El conjunto de datos se presenta originalmente en formato CSV, utilizando el carácter `;` como separador de campos. Uno de los aspectos más relevantes detectados en el análisis inicial es que la unidad de observación del fichero no es el accidente en sí mismo, sino la participación de una persona en un accidente. Esto significa que un mismo `num_expediente` puede aparecer repetido en varias filas, cada una asociada a distintos implicados, vehículos o condiciones registradas para el mismo siniestro.

Esta característica tiene consecuencias directas sobre el modelado semántico. Si el objetivo es representar el accidente como evento principal, resulta necesario distinguir entre el nivel del accidente y el nivel de las personas implicadas. Precisamente por ello la ontología del proyecto contempla clases separadas para el accidente y para los implicados, aunque el mapeo RDF materializado en el repositorio todavía no explota toda esa granularidad.

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

No obstante, es importante matizar el estado real de la implementación actual. En el repositorio, la plantilla de mapeo genera explícitamente URIs para los recursos de tipo `Accidente`, construidas a partir de `num_expediente`. En cambio, la relación territorial no se materializa todavía mediante recursos locales de tipo `Distrito`, sino mediante enlaces directos a entidades de Wikidata obtenidos en el proceso de reconciliación. Esta distinción es relevante porque el diseño conceptual del nombrado es más amplio que la exportación RDF actualmente disponible.

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

* **`schema.org`** para conceptos relacionados con lugar y dirección.
* **`FOAF`** para la caracterización general de personas implicadas.
* **`Dublin Core Terms`** para identificadores y fechas.
* **`WGS84 Geo`** para propiedades geográficas de latitud y longitud.

Esta reutilización aporta interoperabilidad y evita reinventar conceptos ya estandarizados. Al mismo tiempo, el espacio de nombres propio `acc:` permite conservar un modelo adaptado al dominio concreto del proyecto.

#### Alcance real del vocabulario frente al RDF publicado
Uno de los aspectos más importantes para entender el repositorio es distinguir entre lo que **la ontología permite expresar** y lo que **el RDF exportado actualmente está expresando de forma efectiva**.

La ontología modela un escenario relativamente rico, con accidentes, implicados, vehículos, estado meteorológico y coordenadas. Sin embargo, la plantilla de mapeo RDF presente en `transform/mapping_template.json` exporta por ahora un subconjunto mucho más reducido del modelo:

* tipo del recurso como `acc:Accidente`;
* número de expediente;
* fecha del accidente;
* dirección textual;
* enlace al distrito reconciliado en Wikidata.

Desde una perspectiva profesional, esta diferencia no es un problema, pero sí debe documentarse con claridad. El vocabulario representa la intención semántica completa del proyecto, mientras que el RDF publicado constituye una primera materialización parcial de ese diseño.

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
El resultado es un grafo RDF centrado en el recurso `Accidente`, con identificación propia, fecha normalizada, dirección textual y conexión territorial mediante Wikidata. Este enfoque tiene una ventaja clara: permite obtener rápidamente un grafo limpio, navegable y enlazado, aun cuando el modelado completo del dominio todavía no haya sido desplegado en su totalidad.

### f. Enlazado
El enlazado externo constituye uno de los puntos más valiosos del proyecto. En lugar de mantener los distritos únicamente como literales de texto, el proceso de reconciliación en OpenRefine ha permitido asociarlos con entidades identificables en Wikidata. Desde la perspectiva de Linked Data, esto aporta dos beneficios inmediatos.

Por un lado, reduce la ambigüedad semántica. El valor textual `Hortaleza`, por ejemplo, deja de ser una cadena susceptible de variaciones ortográficas y pasa a estar vinculado a una entidad externa estable.

Por otro lado, abre la posibilidad de federar o enriquecer la información en futuras etapas, ya que el accidente queda conectado con un nodo reconocido de la Web de Datos.

Conviene, sin embargo, precisar cómo se refleja este enlazado en el repositorio. En el RDF publicado, la reconciliación no se materializa mediante un recurso local de distrito enlazado con `owl:sameAs`, sino mediante una relación directa desde el accidente hacia la URI de Wikidata a través de `acc:ocurrioEnDistrito`. Es decir, el grafo actual opta por enlazar directamente con la entidad externa en lugar de crear primero una entidad local intermedia.

Esta solución es perfectamente válida para una primera publicación y, de hecho, simplifica el modelo exportado. Como posible evolución futura, podría considerarse la creación de recursos locales de tipo `Distrito` y la vinculación de éstos con Wikidata, lo que haría más explícita la separación entre la capa local y la capa externa del conocimiento.

### g. Publicación
El repositorio contiene dos elementos fundamentales para una publicación semántica: el vocabulario (`ontology.ttl`) y el conjunto de datos transformado (`accidentes_madrid_2024.ttl`). Desde el punto de vista documental, esto significa que el proyecto ya dispone de una base suficiente para ser cargado en un triple store o para ser servido desde una infraestructura de publicación RDF.

No obstante, también es importante delimitar el alcance actual: en el repositorio no se incluyen todavía configuraciones de despliegue, scripts de carga ni una instancia operativa de un servidor SPARQL como Apache Jena Fuseki. Por tanto, la publicación debe entenderse en este momento como un resultado técnicamente exportable y preparado para ser servido, pero no como una infraestructura ya desplegada.

Esta precisión mejora la calidad de la memoria porque separa claramente el estado actual del proyecto de las posibilidades de evolución inmediata.

---

## 4. Aplicación y explotación

*Pendiente de confirmación de desarrollos anteriores para completar esta sección.*

Aunque el repositorio no incluye todavía un conjunto formal de consultas SPARQL almacenadas como artefactos independientes, el RDF generado permite ya varios escenarios básicos de explotación.

En su estado actual, el grafo soporta consultas orientadas a responder, entre otras, las siguientes preguntas:

* ¿Qué accidentes aparecen registrados en una determinada fecha o intervalo de fechas?
* ¿Qué accidentes están vinculados a un distrito concreto?
* ¿Cuántos accidentes se han asociado a cada entidad territorial enlazada?
* ¿Qué localizaciones textuales aparecen con mayor frecuencia en el conjunto transformado?

Dado que el RDF exportado materializa los accidentes como recursos y enlaza cada uno de ellos con una URI territorial externa, el modelo ya es suficiente para realizar agregaciones por distrito y filtros temporales. A modo ilustrativo, una consulta SPARQL coherente con el RDF del repositorio podría ser la siguiente:

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

También es posible plantear consultas temporales sencillas a partir de `acc:fechaAccidente`:

```sparql
PREFIX acc: <http://madrid.accidentes.linkeddata.es/ontology#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>

SELECT ?accidente ?fecha ?direccion
WHERE {
  ?accidente a acc:Accidente ;
             acc:fechaAccidente ?fecha ;
             acc:direccion ?direccion .
  FILTER(?fecha >= "2024-06-01"^^xsd:date && ?fecha <= "2024-06-30"^^xsd:date)
}
ORDER BY ?fecha
```

Desde una perspectiva de explotación, la principal limitación no es de calidad del RDF existente, sino de alcance del mapeo actual. Como no se están exportando todavía propiedades relativas a tipo de accidente, vehículo, sexo, rango de edad, lesividad o meteorología, preguntas analíticas sobre esos aspectos no pueden resolverse aún directamente sobre el grafo publicado, aunque sí están respaldadas por la fuente original y, en parte, por el vocabulario ontológico definido.

En consecuencia, el proyecto se encuentra en una situación interesante: ya ofrece un resultado RDF real y utilizable, pero conserva un margen claro de crecimiento hacia un grafo más expresivo sin necesidad de rediseñar por completo la base conceptual.

---

## 5. Conclusiones

*Pendiente de finalizar trabajo para completar esta sección.*

El proyecto demuestra que un dataset tabular de ámbito municipal puede transformarse en un recurso semántico coherente mediante una cadena de trabajo relativamente compacta: análisis de la fuente, limpieza en OpenRefine, definición de un vocabulario, mapeo RDF y enlazado con una fuente externa.

Uno de los principales logros del trabajo es haber dejado trazabilidad entre todas las fases del proceso. No sólo se dispone del RDF final, sino también de los artefactos que explican cómo se ha llegado a él. Esto aporta valor metodológico, ya que la transformación no queda descrita de forma abstracta, sino sustentada por ficheros verificables dentro del propio repositorio.

Al mismo tiempo, la revisión detallada del proyecto permite identificar con claridad su estado de madurez actual. La ontología define un dominio más rico que el que hoy se materializa en el RDF exportado, lo que sugiere una evolución natural del trabajo: ampliar el mapeo para incorporar más dimensiones ya presentes en la fuente, especialmente las relativas a implicados, vehículos, meteorología y geolocalización.

En definitiva, el repositorio ya contiene una base sólida de Linked Data sobre accidentes de tráfico en Madrid, con una primera capa de interconexión externa mediante Wikidata. Su principal fortaleza reside en que el modelo conceptual, los pasos de transformación y el resultado RDF están alineados y documentados, incluso cuando la publicación actual represente todavía una versión parcial del potencial total del dataset.

---

## 6. Bibliografía

*Pendiente de finalizar trabajo para completar esta sección.*

* Portal de Datos Abiertos del Ayuntamiento de Madrid.
* Especificación RDF del W3C.
* Apuntes de teoría de "Web Semántica y Datos Enlazados", curso 2025-2026.