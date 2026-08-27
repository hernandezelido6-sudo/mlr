# Lista de verificación de seguridad — Ruta Norte Transportes

- [x] Revisar el uso de secretos y retirar valores sensibles del cliente y del repositorio. No hay secretos ni archivos sensibles rastreados y la aplicación cliente no contiene credenciales de servidor.
- [x] Habilitar y verificar la arquitectura de servidor, autenticación y base de datos necesarias.
- [x] Configurar políticas de seguridad de datos y autorización por registro.
- [x] Implementar validación, sanitización y control de campos en todas las entradas.
- [x] Aplicar protección de sesión, límites de intentos y mitigación contra automatización.
- [x] Endurecer API, cargas de archivos, consultas y cabeceras de seguridad.
- [x] Verificar controles, documentar límites y guardar una versión segura del proyecto.
- [x] Resolver los conflictos posteriores a la ampliación y ejecutar comprobaciones y pruebas con éxito.
- [x] Generar, revisar y aplicar la migración de base de datos para solicitudes de cotización cifradas.
- [x] Validar en ejecución la interfaz de cotización sin sesión y el rechazo de la API no autenticada; la prueba OAuth con una sesión real queda opcional por requerir inicio de sesión del usuario.
- [x] Probar la interfaz de inicio de sesión y las respuestas de error sin sesión; el recorrido OAuth completo puede verificarse posteriormente desde una cuenta autorizada.
- [x] Añadir pruebas de integración del router para creación, lectura por dueño o administrador y bloqueo de operaciones no autorizadas; el cifrado autenticado se verifica en la capa de seguridad.
- [x] Integrar enlaces directos de WhatsApp en los puntos de conversión de la web.
- [x] Incorporar un mapa interactivo de zonas de cobertura y rutas de entrega orientativas desde Las Vegas.
- [x] Verificar el diseño responsive, la accesibilidad y los enlaces externos de las nuevas mejoras.
- [x] Probar las rutas seleccionables y la actualización del trayecto visible mediante datos de ruta y revisión visual del planificador.
- [x] Verificar los enlaces externos de WhatsApp y Google Maps, junto con roles, etiquetas y navegación por teclado definidos para las rutas.
