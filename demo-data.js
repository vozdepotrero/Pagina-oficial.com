/*
 * VOZ DE POTRERO — DATOS DE DEMOSTRACIÓN
 * ---------------------------------------------------------------
 * Todo lo que hay acá es MATERIAL DE EJEMPLO para diseñar y probar la interfaz.
 * No son noticias, personas, programas ni sponsors reales de Voz de Potrero.
 * Se usa solo cuando el servidor no tiene HubSpot configurado (o no responde).
 * Cada registro lleva demo:true y la web muestra un aviso visible.
 * Para reemplazarlo: cargá contenido real en HubSpot (ver INSTRUCCIONES.md).
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.VDP_DEMO = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  const lorem = (extra) =>
    'Este es un texto de demostración para probar la maqueta del artículo. No describe hechos reales ni fue publicado por Voz de Potrero.\n\n' +
    'Cuando cargues contenido real desde HubSpot, este bloque se reemplaza automáticamente por el cuerpo de la nota.\n\n' +
    '## Subtítulo de ejemplo\n\n' +
    (extra || 'Los párrafos se separan con una línea en blanco y los subtítulos se escriben con «## » al principio de la línea.');

  return {
    demo: true,
    categories: [
      { slug: 'cobertura', name: 'Coberturas' },
      { slug: 'entrevistas', name: 'Entrevistas' },
      { slug: 'analisis', name: 'Análisis' },
      { slug: 'comunidad', name: 'Comunidad' }
    ],
    news: [
      { id: 'demo-n1', slug: 'demo-nota-de-cobertura', title: 'Nota de ejemplo: así se verá una cobertura', excerpt: 'Texto de demostración para probar tarjetas, filtros y la página individual de cada artículo.', body: lorem(), category: 'cobertura', tags: ['demo'], date: '2026-09-28', image: '', author: 'Redacción (demo)', status: 'published', demo: true },
      { id: 'demo-n2', slug: 'demo-entrevista-modelo', title: 'Entrevista de ejemplo con un protagonista', excerpt: 'Registro demostrativo: probá el buscador escribiendo «entrevista» o filtrando por categoría.', body: lorem(), category: 'entrevistas', tags: ['demo', 'entrevista'], date: '2026-09-21', image: '', author: 'Redacción (demo)', status: 'published', demo: true },
      { id: 'demo-n3', slug: 'demo-analisis-tactico', title: 'Análisis de ejemplo: un partido leído desde el costado de la cancha', excerpt: 'Otro registro de prueba. Sirve para ver la paginación y el orden por fecha.', body: lorem(), category: 'analisis', tags: ['demo'], date: '2026-09-14', image: '', author: 'Redacción (demo)', status: 'published', demo: true },
      { id: 'demo-n4', slug: 'demo-comunidad-barrio', title: 'Historia de comunidad de ejemplo', excerpt: 'Registro demostrativo sobre contenidos de la comunidad del proyecto.', body: lorem(), category: 'comunidad', tags: ['demo'], date: '2026-09-07', image: '', author: 'Redacción (demo)', status: 'published', demo: true },
      { id: 'demo-n5', slug: 'demo-cobertura-dos', title: 'Segunda cobertura de ejemplo', excerpt: 'Más texto de prueba para comprobar el diseño de la grilla en celulares y computadoras.', body: lorem(), category: 'cobertura', tags: ['demo'], date: '2026-08-30', image: '', author: 'Redacción (demo)', status: 'published', demo: true },
      { id: 'demo-n6', slug: 'demo-entrevista-dos', title: 'Segunda entrevista de ejemplo', excerpt: 'Registro de prueba que no corresponde a ninguna entrevista real.', body: lorem(), category: 'entrevistas', tags: ['demo'], date: '2026-08-23', image: '', author: 'Redacción (demo)', status: 'published', demo: true }
    ],
    programs: [
      { id: 'demo-p1', slug: 'demo-programa-uno', name: 'Programa de ejemplo 1', description: 'Descripción de demostración. Acá va la presentación real del programa cuando la cargues en HubSpot.', hosts: 'Conductores a confirmar', schedule: 'Día y horario a confirmar', link: '', demo: true },
      { id: 'demo-p2', slug: 'demo-programa-dos', name: 'Programa de ejemplo 2', description: 'Segundo registro demostrativo para probar la grilla de programas.', hosts: 'Conductores a confirmar', schedule: 'Día y horario a confirmar', link: '', demo: true },
      { id: 'demo-p3', slug: 'demo-programa-tres', name: 'Programa de ejemplo 3', description: 'Tercer registro demostrativo. Reemplazalo por contenido real.', hosts: 'Conductores a confirmar', schedule: 'Día y horario a confirmar', link: '', demo: true }
    ],
    videos: [
      { id: 'demo-v1', title: 'Video de ejemplo 1', kind: 'video', url: '', thumb: '', date: '2026-09-25', description: 'Sin enlace real. Cuando cargues una URL oficial de YouTube, la web mostrará el reproductor.', demo: true },
      { id: 'demo-v2', title: 'Cobertura de ejemplo 1', kind: 'cobertura', url: '', thumb: '', date: '2026-09-18', description: 'Registro demostrativo de una cobertura.', demo: true },
      { id: 'demo-v3', title: 'Video de ejemplo 2', kind: 'video', url: '', thumb: '', date: '2026-09-10', description: 'Registro demostrativo.', demo: true },
      { id: 'demo-v4', title: 'Cobertura de ejemplo 2', kind: 'cobertura', url: '', thumb: '', date: '2026-09-02', description: 'Registro demostrativo.', demo: true }
    ],
    team: [
      { id: 'demo-t1', name: 'Integrante de ejemplo', role: 'Rol a definir', bio: 'Biografía de demostración. Solo se publica información autorizada por cada persona.', photo: '', order: 1, demo: true },
      { id: 'demo-t2', name: 'Integrante de ejemplo', role: 'Rol a definir', bio: 'Biografía de demostración.', photo: '', order: 2, demo: true },
      { id: 'demo-t3', name: 'Integrante de ejemplo', role: 'Rol a definir', bio: 'Biografía de demostración.', photo: '', order: 3, demo: true }
    ],
    sponsors: []
  };
});
