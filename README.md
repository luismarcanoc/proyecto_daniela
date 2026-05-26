# Proyecto Daniela

Aplicación web para analizar lotes de producción de panadería, detectar cuellos de botella, sugerir cambios operativos y ejecutar simulaciones Monte Carlo individuales o grupales.

## Funciones

- Registro de lotes con amasadora y horno separados.
- Registro independiente de laminadora (`3-6 min`) y sobadora (`4-7 min`), con tiempo en minutos o selección `No aplica`.
- Alertas por rangos de proceso y por equipos no disponibles.
- Análisis individual y análisis grupal de hasta 30 lotes guardados.
- Modelo de fermentadora compartida: cada lote equivale a un carrito, con 18 puestos totales y 3 posiciones de condiciones ideales que se liberan dinámicamente.
- Tiempo total de proceso por lote y variables de Monte Carlo visibles en la pantalla.
- Registro de merma con catálogo de defectos del pan y gráficos individual/conjunto.
- Registro de merma habilitado únicamente para lotes con información completa.
- Exportación del registro a una base Excel `.xls`, incluyendo agua/hielo y únicamente la fecha del lote.

## Desarrollo

```bash
npm install
npm run dev
```

## Despliegue en Vercel

El proyecto usa Next.js App Router y no requiere configuración especial. En Vercel, importa este repositorio y usa los comandos por defecto:

- Build command: `npm run build`
- Output: automático para Next.js
