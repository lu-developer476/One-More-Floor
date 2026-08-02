# Checks requeridos de `main`

La protección de rama es **configuración manual del repositorio** y no queda activada por estos archivos. Antes de fusionar un PR, GitHub debe exigir exactamente:

- **Validate project**
- **Browser acceptance**

Además se recomienda activar **Require branches to be up to date**, **Require conversation resolution**, bloquear force pushes y bloquear la eliminación de `main`. El workflow no fusiona ramas ni sustituye la revisión de los resultados reales.
