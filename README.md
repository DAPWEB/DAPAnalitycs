# DAP Website

Sitio web estático para GitHub Pages.

## Archivos

- `index.html`: estructura principal.
- `style.css`: diseño visual y responsive.
- `script.js`: menú móvil, navbar y animaciones.
- `README.md`: instrucciones.

## Cómo publicarlo en GitHub Pages

1. Crear un repositorio en GitHub, por ejemplo: `dap-web`.
2. Subir estos archivos directamente en la raíz del repositorio.
3. Entrar a `Settings > Pages`.
4. En `Build and deployment`, seleccionar:
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/root`
5. Guardar.
6. GitHub generará una liga como:
   `https://TU-USUARIO.github.io/dap-web/`

## Dominio personalizado

En `Settings > Pages > Custom domain` coloca tu dominio, por ejemplo:

`www.tudominio.com`

Luego configura el DNS del dominio con un registro CNAME:

- Tipo: CNAME
- Nombre: www
- Valor: TU-USUARIO.github.io

## Personalización rápida

Busca en `index.html` estos datos para cambiarlos:

- Nombre de contacto
- Teléfono
- Correo
- Textos de servicios
- Links de imágenes
