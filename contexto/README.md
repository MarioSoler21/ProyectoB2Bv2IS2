# Contexto del proyecto

Memoria de trabajo de Pedidly: qué se pidió, qué se hizo, por qué y qué falta.
Sirve para que cualquier persona del equipo (o Claude, en una conversación
nueva) retome el trabajo sin tener que reconstruir la historia.

| Archivo | Qué tiene |
|---|---|
| [`bitacora.md`](bitacora.md) | Registro por fecha: lo que se pidió y lo que se hizo, con ramas y commits. Lo más nuevo arriba. |
| [`decisiones.md`](decisiones.md) | Decisiones de diseño y de negocio, con el motivo. Para no volver a discutir lo ya resuelto. |
| [`pendientes.md`](pendientes.md) | Lo que falta hacer, ordenado por prioridad. Se tacha o se borra al terminar. |
| [`revision-comercial.md`](revision-comercial.md) | Revisión de Pedidly desde 10 tipos de distribuidora: qué falta para que paguen. Es la base del roadmap. |

## Cómo se mantiene

- **Al terminar una tarea**, agregar una entrada arriba de todo en `bitacora.md`:
  qué se pidió, qué se hizo, archivos/ramas tocados y cómo quedó (hecho,
  sin probar, pendiente de algo).
- **Si se tomó una decisión** que alguien podría cuestionar después, anotarla en
  `decisiones.md` con su motivo.
- **Si algo queda a medias o aparece algo nuevo por hacer**, sumarlo a
  `pendientes.md`; si se terminó, sacarlo de ahí.
- Escribir en español, corto y concreto. Nada de claves, contraseñas, correos
  ni datos de clientes reales.
