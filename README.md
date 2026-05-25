# Proyecto Daniela

Aplicación web para analizar lotes de producción de panadería, detectar cuellos de botella, sugerir cambios operativos y ejecutar simulaciones Monte Carlo individuales o grupales.

## Funciones

- Registro de lotes con amasadora y horno separados.
- Alertas por rangos de proceso y por equipos no disponibles.
- Análisis individual y análisis grupal de hasta 30 lotes guardados.
- Modelo de fermentadora compartida: 18 carritos totales y 3 posiciones de condiciones ideales.
- Tiempo total de proceso por lote y variables de Monte Carlo visibles en la pantalla.
- Registro de merma con motivos y gráficos individual/conjunto.
- Exportación del registro a una base Excel `.xls`.

## Desarrollo

```bash
npm install
npm run dev
```

## Despliegue en Vercel

El proyecto usa Next.js App Router y no requiere configuración especial. En Vercel, importa este repositorio y usa los comandos por defecto:

- Build command: `npm run build`
- Output: automático para Next.js
