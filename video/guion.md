# Guion · «¿Qué país de Latinoamérica aguanta una inundación brutal?»

- Formato: ranking (cuenta atrás del 4 al 1) y, como remate, el país que peor lo pasaría.
- Duración prevista: unos 52 s (150 palabras).
- Voz: Kokoro `ef_dora` (gratis).
- Final: comentar su país.
- Estilo: el de la plantilla (fondo casi negro con rejilla, brillo abajo, tarjetas blancas, verde para lo bueno y rojo para lo malo).
- Datos: INFORM Risk Mid 2026 v0.7.3 (Centro Común de Investigación de la Comisión Europea, 1 de septiembre de 2026). Ranking calculado en `datos/ranking.py` y guardado en `datos/ranking_latam.csv`.

| # | Voz | En pantalla |
|---|-----|-------------|
| 1 | Una inundación brutal golpea Latinoamérica. | Fotograma 0: una ola gigante cruza la pantalla y la cámara tiembla con el golpe. La protagonista (chubasquero amarillo) entra corriendo por la izquierda mientras sube el agua. |
| 2 | ¿Qué país la aguanta mejor? | La protagonista frena y mira arriba. Caen cuatro siluetas de países tapadas con «?». |
| 3 | Lo medimos con el índice Inform 2026 de la Comisión Europea. | Réplica de navegador con la web de INFORM. El cursor hace clic en «Descargar» y una hoja de cálculo se rellena fila a fila. |
| 4 | Tres datos: cuánta agua te cae, lo frágil que es la gente y cómo responde el país. | Panel con tres medidores que aparecen justo en «agua» (gota), «frágil» (personas) y «responde» (sirena). La cámara se aleja y enseña el mundo entero: un río une las cinco paradas. |
| 5 | Número cuatro: Cuba. | La cámara viaja siguiendo el río, que se dibuja a su paso. Silueta real de Cuba, el «#4» cae con un pop y un vecino con camiseta de los colores de su bandera saluda. |
| 6 | El riesgo de sus ríos es mínimo: medio punto sobre diez. | El medidor «Ríos» gira como un rodillo hasta 0,5/10 y se pone verde. |
| 7 | Su amenaza es el mar. | El mar sube alrededor de la isla y el medidor «Costa» rueda a 5,7/10 en rojo. El vecino da un paso atrás. |
| 8 | Número tres: Costa Rica. | La cámara se aleja para enseñar Cuba entera y viaja a Costa Rica. Aparece el «#3». |
| 9 | Es el país que mejor responde a una emergencia en toda la región. | Llega una camioneta de rescate y en un móvil cae la notificación «Alerta». La barra «Falta de respuesta» se queda en 2,2/10, en verde, con la etiqueta «la más baja de la región». La vecina levanta el pulgar. |
| 10 | Número dos: Chile. | Viaje largo con un poco de desenfoque. Silueta alargada de Chile con los Andes y el «#2». |
| 11 | Sus ríos bajan de los Andes con mucha fuerza. | Un río baja rugiendo de la cordillera y el medidor «Ríos» rueda a 5,5/10 en ámbar. |
| 12 | Pero si hay peligro, manda una alerta a todos los móviles de la zona. | Réplica de móvil: cae la notificación «ALERTA DE EMERGENCIA · SAE» y se encienden muchos móviles a la vez por toda la silueta. |
| 13 | Y el número uno: Uruguay. | Viaje largo con desenfoque y el «#1» con corona. |
| 14 | También se inunda. | El agua sube un poco alrededor del vecino uruguayo… |
| 15 | Pero tiene el riesgo de desastre más bajo de Latinoamérica: dos coma cinco sobre diez. | …y baja. Contador gigante que rueda hasta 2,5/10 mientras se dibuja una gráfica de barras de los 20 países, con Uruguay como la más baja, en verde. Golpe del clímax. |
| 16 | ¿Y el que peor lo pasaría? | La cámara se aleja hasta enseñar el mundo entero y viaja hacia el norte. El brillo de abajo pasa de verde a rojo. |
| 17 | Haití: su vulnerabilidad es de ocho coma tres sobre diez. | Silueta de Haití. El medidor «Vulnerabilidad» rueda a 8,3/10 en rojo y el agua sube hasta las rodillas del vecino, que se asusta. |
| 18 | Es el décimo país con más riesgo del mundo. | Una lista mundial sube como un rodillo y frena en «#10 Haití», resaltado en rojo. |
| 19 | Comenta tu país y te digo en qué puesto queda. | Zoom out final con el mundo entero y sus cinco paradas. Una caja de comentarios escribe «Mi país es…» letra a letra y la protagonista señala el botón de comentar. |

## De dónde sale cada dato (INFORM Mid 2026, escala de 0 a 10; menos es mejor)

| Frase | Dato | Valor |
|---|---|---|
| 6 | Cuba · inundación de río (River Flood) | 0,5 |
| 7 | Cuba · inundación costera (Coastal flood) | 5,7 |
| 9 | Costa Rica · falta de capacidad de respuesta (Lack of Coping Capacity), la más baja de los 20 países | 2,2 |
| 11 | Chile · inundación de río | 5,5 |
| 12 | Chile · Sistema de Alerta de Emergencia (SAE) de SENAPRED: envía la alerta por cell broadcast a todos los móviles de una zona georreferenciada | — |
| 14 | Uruguay · inundaciones de abril y mayo de 2024 con miles de desplazados (SINAE) | — |
| 15 | Uruguay · riesgo INFORM total, el más bajo de los 20 países | 2,5 |
| 17 | Haití · vulnerabilidad, la más alta de los 20 países | 8,3 |
| 18 | Haití · puesto mundial en el riesgo INFORM (1 = más riesgo, de 191 países) | 10 |

Cómo se ordena el ranking: con la misma fórmula de INFORM (media geométrica de amenaza × vulnerabilidad × falta de respuesta), pero contando como amenaza solo las inundaciones de río y de costa. Chile (3,92) y Costa Rica (3,93) quedan prácticamente empatados.
