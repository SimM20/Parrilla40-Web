# Documentación legal y condiciones de publicación

Revisión: 29 de octubre de 2026. Las seis páginas legales ES/EN son borradores revisables de acuerdo con la implementación prevista. No equivalen a una certificación de cumplimiento ni acreditan trámites externos.

## Datos confirmados y datos faltantes

El usuario confirmó responsable **Parrilla40.SA** y domicilio **Av gelly y obes 2267, Recoleta, CABA, 1425, Argentina**. No se infiere CUIT, representación ni constancia societaria. Antes de publicar debe verificarse la denominación y habilitarse un canal de privacidad atendido.

Región del proyecto original de encuesta y emails confirmada en el Dashboard: **us-west-2 (Oregon, Estados Unidos)**, organización Parri. El usuario habilitó acceso en el Dashboard y se aplicó/verificó la migración; la conexión MCP inicial no tenía permiso. Aún faltan términos/DPA de la cuenta, subproveedores, hosting, registros y respaldos. La web sólo recopila emails; el equipo enviará el aviso manualmente.

## Base normativa investigada

- [Ley 25.326, texto actualizado](https://www.argentina.gob.ar/normativa/nacional/ley-25326-64790/actualizacion): minimización y finalidad, información previa, consentimiento, seguridad, derechos y destrucción cuando el dato deja de ser necesario. Arts. 4–6, 9–10, 14–16 y 21 según la operación.
- [Decreto reglamentario 1558/2001, texto actualizado](https://www.argentina.gob.ar/normativa/nacional/70368/actualizacion): alcance de bancos privados y consentimiento revocable, entre otros aspectos. No tratar la marca o un formulario sin fines de lucro como exención automática.
- [AAIP: obligaciones del responsable](https://www.argentina.gob.ar/aaip/datospersonales/responsables/obligaciones) y [trámites de registro](https://www.argentina.gob.ar/aaip/datospersonales/tramites): revisar y realizar la inscripción del responsable y de las bases alcanzadas; la inscripción de uno no sustituye la de las otras. No afirmar registro efectuado sin constancia.
- [AAIP: derechos](https://www.argentina.gob.ar/aaip/datospersonales/derechos): canal operativo y constancia de recepción. Acceso en 10 días corridos; rectificación, actualización o supresión en 5 días hábiles; las excepciones de conservación requieren fundamento concreto.
- [AAIP: transferencias internacionales](https://www.argentina.gob.ar/transferencias-internacionales): identificar destinos y revisar adecuación o mecanismo aplicable. Las cláusulas modelo de la Disposición 60/2016 y Resolución 198/2023 son opciones; el DPA europeo de un proveedor no prueba por sí solo que se cumplió el régimen argentino.
- [Resolución AAIP 47/2018](https://www.argentina.gob.ar/normativa/nacional/resoluci%C3%B3n-47-2018-312662/texto): medidas de seguridad recomendadas. Verificar accesos del equipo, respaldo/restauración, eliminación, incidentes y proveedores, además de controles del código.
- [DPA de Supabase](https://supabase.com/legal/customer-resources/data-processing-addendum): confirmar aceptación, alcance contractual y subencargados de la cuenta real. Su existencia en línea no acredita firma, región ni configuración de este proyecto.

Argentina es el marco inicial por la operación informada. No se afirma que una traducción al inglés active automáticamente obligaciones extranjeras. La [guía territorial del EDPB](https://www.edpb.europa.eu/sites/default/files/files/file1/edpb_guidelines_3_2018_territorial_scope_after_public_consultation_en_0.pdf) requiere estudiar establecimiento, oferta dirigida y seguimiento en la UE. Documentar mercados y convocatoria reales antes de concluir aplicabilidad del RGPD; si corresponde, ampliar bases jurídicas, avisos, contratos y derechos. Evaluar otras jurisdicciones sólo con hechos de alcance, no por la mera accesibilidad mundial.

## Política de conservación propuesta

La propuesta documentada es revisar cada mes los datos y retirar encuestas individuales a los 12 meses de su envío, conservando sólo resúmenes verdaderamente disociados. Los históricos se preservan durante esta migración; revisar su finalidad, antigüedad y necesidad antes de una purga separada autorizada. Esa preservación técnica no habilita conservación indefinida de datos personales.

Para nuevas altas: eliminar email y datos de consentimiento al retirar el alta, a los 30 días de enviar el único aviso, o a los 12 meses del alta, lo que suceda primero. Renovar un propósito requiere nuevo consentimiento. Estos plazos son decisiones propuestas para este sitio, no plazos legales universales. La publicación queda pendiente de asignar un operador y probar un procedimiento real de revisión y eliminación, incluidos exportaciones y restauraciones. No hay una tarea automática de purga acreditada por crear esta documentación.

Los registros técnicos y copias del hosting/CDN/Supabase requieren plazos verificados con cada proveedor. No inventar un tiempo de eliminación de respaldos. Tras restaurar un backup, aplicar nuevamente las bajas antes de habilitar un envío.

El ranking del evento preexistente usa otro proyecto Supabase y muestra nombre/alias, mejor recaudación y cantidad de partidas; la captura se hace desde una rama del juego, fuera de este formulario. Confirmar información y permiso de publicación allí, derechos y retención de esa lista. Esta entrega no agrega captura ni cambia sus datos. No declarar que absolutamente todas las bases del sitio son anónimas por haber separado la encuesta.

## Consentimiento y bajas

El email se registra fuera de la encuesta en una base independiente, sin UUID de respuestas. Se exige casilla vacía inicialmente y finalidad específica de un aviso sobre disponibilidad de wishlist en Steam. Se guarda la versión del consentimiento y fecha. No utilizar para promociones, cesión comercial, vinculación con respuestas ni avisos de otro alcance.

El enlace/código secreto de retirada debe permitir borrar el alta mediante una operación del servidor; nunca incluir email o token en query string ni registrar el token en texto plano en la base. Se guarda su hash. Probar bajas, reintentos y duplicados sin revelar si un email ya existe. Una prueba del código no demuestra titularidad del buzón: antes de habilitar envío real decidir y verificar confirmación del correo (doble opt-in recomendado), entregar baja funcional también en el mensaje y excluir direcciones históricas sin consentimiento comprobable para este fin. No enviar un email a las direcciones históricas para pedir consentimiento sin evaluar primero la legitimidad de ese contacto.

Sin código de baja, debe existir un canal de privacidad con verificación proporcional de titularidad. No pedir copias de identidad como requisito automático para borrar un email. La consulta a la AAIP no sustituye el canal del responsable. Los borradores conservan visible que falta completar ese canal.

Para recuperar operaciones sin respuesta tras recargar o cambiar de idioma, la sesión de la pestaña conserva temporalmente las tres respuestas pendientes de la encuesta junto a su UUID y estado, y por separado el email y token de un alta pendiente. El contenido pendiente se retira al recibir confirmación. Si nunca llega, dura hasta terminar la sesión o borrar ese almacenamiento, sujeto a restauración de sesiones del navegador. No se persisten en localStorage ni se vinculan ambos registros. El texto abierto no se guarda como borrador antes de iniciar el envío. Revisar en un dispositivo compartido y con almacenamiento bloqueado; una recarga sin sessionStorage puede perder la recuperación. El recibo confirmado debe guardarse o descargarse porque ya no queda su token en el almacenamiento de sesión.

## Checklist previo a publicación

- [ ] Verificar la denominación Parrilla40.SA y el domicilio informados; completar correo atendido en ES/EN.
- [ ] Confirmar región, proveedores y destinos de datos, DPA y mecanismo de transferencia argentino; actualizar privacidad ES/EN con los hechos.
- [ ] Resolver registro del responsable y bases ante AAIP y conservar constancias, cuando corresponda.
- [x] Migración aditiva aplicada en el proyecto original; guardado/retirada y lectura pública denegada verificados. Cuatro respuestas históricas preservadas; datos de QA retirados.
- [ ] Mantener históricos protegidos; evaluar consentimiento previo sin reutilizar listas antiguas para finalidades nuevas.
- [ ] Verificar aviso de privacidad y autorización de publicación en el juego para el ranking del evento y resolver su plazo de conservación y atención de derechos.
- [ ] Probar consentimiento no premarcado, alta sin encuesta, encuesta sin email, errores, duplicados, retirada y eliminación efectivas.
- [ ] Probar recuperación del mismo envío tras timeout y recarga/cambio de idioma; comprobar borrado de respuestas/email/token temporales al confirmar y coherencia de la información ES/EN de almacenamiento.
- [ ] Asignar operador y procedimiento de derechos con recepción registrada y plazos; incluir datos de contacto en políticas.
- [ ] Ejecutar y documentar la retención propuesta o ajustar los borradores a plazos reales acordados y aplicados.
- [ ] Verificar hosting/CDN/logs/respaldos y procedimiento de incidentes. Revisar cookies en el despliegue real.
- [ ] Definir el procedimiento del equipo para el envío manual del único aviso: consulta de consentimientos vigentes, respeto de bajas y finalidad, canal de baja en el mensaje y eliminación de copias de la lista. No se requiere integrar un proveedor de envío en el sitio.
- [ ] Confirmar mercados/reclutamiento y obligaciones internacionales que correspondan.
- [ ] Revisar versiones legales finales, establecer fecha de vigencia real y retirar la etiqueta de borrador/noindex sólo después de resolver estos puntos.

No hace falta un banner de cookies para suplir documentación incompleta. La implementación inspeccionada no instala analítica o publicidad; almacena preferencias funcionales. Si se incorporan tecnologías o proveedores nuevos, volver a evaluar información y consentimiento antes de activarlos.
