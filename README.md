# Integración de contacto DAP

## Archivos para GitHub Pages

- `index.html`: sustituye al HTML actual.
- `style.css`: sustituye al CSS actual.
- `script.js`: sustituye al JavaScript actual.

En `script.js`, reemplaza:

```js
const DAP_CONTACT_API_URL = "COLOCA_AQUI_LA_URL_EXEC_DE_TU_WEBAPP";
```

por la URL terminada en `/exec` que Apps Script entregue al implementar la WebApp.

## Archivos para Google Apps Script

- `Code.gs`
- `Index.html`

### Base de datos

Archivo:

`199v8njv6c-oQepGwWt6Grf8hnaGxbm4L25mL20kO7Ig`

Hoja:

`BD_CONTACTO_WEB`

Encabezados A:I:

`ID | REGISTRO | NOMBRE | EMPRESA | CORREO | TELÉFONO | SERVICIO | MENSAJE | ESTATUS`

## Implementación

1. Crea un proyecto de Apps Script desde la cuenta que administrará DAP.
2. Pega `Code.gs`.
3. Crea un archivo HTML llamado exactamente `Index` y pega `Index.html`.
4. En Configuración del proyecto, usa zona horaria `America/Mexico_City`.
5. Ejecuta manualmente `dap_authorizeAndCheckAliases`.
6. Acepta los permisos.
7. Revisa el registro de ejecución y confirma que:
   - `contacto@dapanalytics.com` aparece dentro de `aliases`.
8. Implementa como aplicación web:
   - Ejecutar como: **Yo**
   - Quién tiene acceso: **Cualquier usuario**
9. Copia la URL `/exec` en `script.js`.
10. Sube los tres archivos de GitHub y prueba desde una ventana incógnita.

## Remitente contacto@dapanalytics.com

Para que Apps Script pueda usar:

```js
from: "contacto@dapanalytics.com"
```

esa dirección debe aparecer como alias autorizado en la cuenta que ejecuta el proyecto.

La firma visual no se toma automáticamente de Gmail. El diseño corporativo ya está construido dentro del `htmlBody` del correo.

