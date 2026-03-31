# Smokecigar — Quake MDL Vertex Tracker

Aplicación 100% client-side. No tiene componente servidor, salvo un script de desarrollo que sirve la página estáticamente.

## Inicio rápido

```bash
npm start
```

Esto levanta un servidor local para servir la página durante el desarrollo.

## Uso

1. **Arrastrar un fichero `.mdl`** de Quake 1 sobre la página.
2. Al cargar el modelo se muestran **3 paneles** (vistas del modelo). Haciendo clic en cualquiera de ellos se selecciona un vértice.
3. Se muestra un **rango de frames** para elegir qué frames incluir en la salida.
4. Se genera código de forma recurrente a partir de una **plantilla** editable en un `textarea`.

## Plantilla

La plantilla usa los marcadores `<num>` y `<vector>`, por ejemplo:

```
if ( self.frame==<num>)
    return <vector>;
else
```

Con los frames seleccionados, se expande a algo como:

```
if ( self.frame==1)
    return '3 4 2';
else
if ( self.frame==2)
    return '1 4 1';
else
if ( self.frame==3)
    return '2 5 3';
```

El último bloque **no** lleva `else` final.

## Notas

- Los vectores representan la **posición del vértice seleccionado** en cada frame, relativa al origen del modelo.
- La interfaz de la aplicación está en **inglés**.


## Formato MDL

Para trabajar con el formato `.mdl` de Quake 1 se recomienda:

- Apoyarse en **librerías de JavaScript existentes** que ya parsean el formato.
- Consultar documentación online sobre la especificación del formato.

> **Atención:** El formato `.mdl` varía entre versiones de Quake (1, 2, 3) y Half-Life. No son binariamente compatibles. Al leer documentación, verificar siempre que se refiere a **Quake 1** específicamente.