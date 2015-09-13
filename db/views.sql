
CREATE VIEW USUARIOS_VIEW
AS
    SELECT  id,
            foto,
            CONCAT(
                UCASE(LEFT(firstName,1)),
                LCASE(SUBSTRING(firstName,2))
            ) AS firstName,
            CONCAT(
                UCASE(LEFT(lastName,1)),
                LCASE(SUBSTRING(lastName,2))
            ) AS lastname,
            CONCAT(
                CONCAT(
                    UCASE(LEFT(firstName,1)),
                    LCASE(SUBSTRING(firstName,2))
                ),
                " ",
                CONCAT(
                    UCASE(LEFT(lastName,1)),
                    LCASE(SUBSTRING(lastName,2))
                )
            ) AS name,
            date_format( now(), "%Y" ) - date_format(fechaNac, "%Y" ) - ( date_format( now(), "00-%m-%d") < date_format( fechaNac, "00-%m-%d" ) ) as edad,
            date_format(fechaNac,"%d/%m/%Y") AS fechaNac,
            sexo,
            ubicacion,
            email,
            telefono
    FROM USUARIOS;

CREATE VIEW CONTACTOS_VIEW
AS
    SELECT  idUsuario,idContacto,foto,firstName,lastName,name,email,telefono,sexo,edad,fechaNac,ubicacion,idRepresentado,descripcion
    FROM CONTACTOS C JOIN USUARIOS_VIEW U ON(C.idRepresentado = U.id);


CREATE VIEW SOLICITUDES_PENDIENTES
AS
    SELECT  foto,
            idUsuSolicitador as idSolicitador,
            idUsuSolicitado as idSolicitado,
            CONCAT(
                CONCAT(
                    UCASE(LEFT(firstName,1)),
                    LCASE(SUBSTRING(firstName,2))
                ),
                "  ",
                CONCAT(
                    UCASE(LEFT(lastName,1)),
                    LCASE(SUBSTRING(lastName,2))
                )
            ) AS userName,
            mensaje,
            DATE_FORMAT(fecha,"%d/%m/%Y %h:%i:%s") as fecha
    FROM USUARIOS U JOIN SOLICITUDES_AMISTAD S ON (U.id=S.idUsuSolicitador) 
    WHERE status = "PENDIENTE";


CREATE VIEW CONVERSACIONES_NORMALES_VIEW
AS
    SELECT C.id AS id,M.creacion as creacion,name,user_one,user_two,COUNT(M.id) AS MENSAJES
    FROM CONVERSACIONES C NATURAL JOIN CONVERSACIONES_NORMALES LEFT OUTER JOIN MENSAJES M ON(C.id = M.conversacion)
    GROUP BY C.id
    ORDER BY creacion DESC;


CREATE VIEW CONVERSACIONES_GRUPALES_VIEW
AS
    SELECT id,DATE_FORMAT(creacion,"%d/%m/%Y %h:%i:%s") AS creacion,name,idGrupo
    FROM CONVERSACIONES NATURAL JOIN CONVERSACIONES_GRUPALES;


CREATE VIEW MENSAJES_VIEW
AS
    SELECT 
            M.id AS id,
            URLENCODE(CONCAT(
                CONCAT(
                    UCASE(LEFT(firstName,1)),
                    LCASE(SUBSTRING(firstName,2))
                ),
                "  ",
                CONCAT(
                    UCASE(LEFT(lastName,1)),
                    LCASE(SUBSTRING(lastName,2))
                )
            )) AS userName,
            text,
            status,
            M.creacion AS creacion,
            user AS userId,
            M.conversacion AS idConv,
            URLENCODE(C.name) AS convName,
            user_one,
            user_two
    FROM USUARIOS U JOIN MENSAJES M ON(U.id = M.user) JOIN CONVERSACIONES C ON (M.conversacion=C.id) JOIN CONVERSACIONES_NORMALES CN ON(C.id = CN.id)
    ORDER BY creacion DESC;



            









            
            