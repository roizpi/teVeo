DROP DATABASE teveo;
CREATE DATABASE teveo;
USE teveo;

CREATE TABLE IF NOT EXISTS USUARIOS(
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    foto        LONGTEXT NOT NULL,
    nick        VARCHAR(30) NOT NULL,
            CONSTRAINT USU_UK UNIQUE(nick),
    password    CHAR(60),
    firstName   VARCHAR(30) NOT NULL,
    lastName    VARCHAR(60) NOT NULL,
    email       VARCHAR(90) NOT NULL,
            CONSTRAINT USU_EMA_UK UNIQUE(email),
    fechaNac    DATE NOT NULL,
    sexo        ENUM('H','M') NOT NULL,
    ubicacion   VARCHAR(30),
    telefono    INTEGER(9),
    authMethod  ENUM("LOCAL","FACEBOOK","TWITTER") DEFAULT 'LOCAL' NOT NULL
)ENGINE=INNODB CHARSET=LATIN1 COMMENT="Tabla de Usuario";

CREATE TABLE IF NOT EXISTS SOLICITUDES_AMISTAD(
    idUsuSolicitador    BIGINT UNSIGNED NOT NULL,
            CONSTRAINT SOLI_USU1_FK FOREIGN KEY(idUsuSolicitador)
                    REFERENCES USUARIOS(id)
                        ON DELETE CASCADE
                        ON UPDATE CASCADE,
    idUsuSolicitado     BIGINT UNSIGNED NOT NULL,
            CONSTRAINT SOLI_USU2_FK FOREIGN KEY(idUsuSolicitado)
                    REFERENCES USUARIOS(id)
                        ON DELETE CASCADE
                        ON UPDATE CASCADE,
    CONSTRAINT SOL_PK PRIMARY KEY(idUsuSolicitador,idUsuSolicitado),
    mensaje             VARCHAR(60) NOT NULL,
    fecha               TIMESTAMP NOT NULL,
    status              ENUM("ACEPTADA","RECHAZADA","PENDIENTE") DEFAULT 'PENDIENTE' NOT NULL
)ENGINE=INNODB CHARSET=LATIN1 COMMENT="Tabla de Solicitudes de Amistad";

CREATE TABLE IF NOT EXISTS GRUPOS(
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(90) NOT NULL,
    creacion    TIMESTAMP NOT NULL
)ENGINE=INNODB CHARSET=LATIN1 COMMENT="Tabla de Grupos";

CREATE TABLE IF NOT EXISTS USUARIOS_GRUPOS(
    idGrupo   BIGINT UNSIGNED NOT NULL,
        CONSTRAINT USUG_IDG_FK FOREIGN KEY(idGrupo)
            REFERENCES GRUPOS(id)
                ON DELETE CASCADE
                ON UPDATE CASCADE,
    idUsuario BIGINT UNSIGNED NOT NULL,
        CONSTRAINT USUG_IDU_FK FOREIGN KEY(idUsuario)
            REFERENCES USUARIOS(id)
                ON DELETE CASCADE
                ON UPDATE CASCADE
)ENGINE=INNODB CHARSET=LATIN1 COMMENT="Usuario Grupos";

CREATE TABLE IF NOT EXISTS CONVERSACIONES(
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    creacion    TIMESTAMP NOT NULL,
    name        VARCHAR(90) NOT NULL
)ENGINE=INNODB CHARSET=LATIN1 COMMENT="Tabla de Conversaciones";



CREATE TABLE IF NOT EXISTS MENSAJES(
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    status      ENUM("LEIDO","NOLEIDO") DEFAULT "NOLEIDO" NOT NULL,
    type        ENUM("TEXT","IMG") DEFAULT "TEXT" NOT NULL,
    creacion    VARCHAR(30) NOT NULL,
    user        BIGINT UNSIGNED NOT NULL,
        CONSTRAINT MEN_USER_FK FOREIGN KEY(user) REFERENCES USUARIOS(id)
                ON DELETE CASCADE
                ON UPDATE CASCADE,
    conversacion BIGINT UNSIGNED NOT NULL,
        CONSTRAINT MEN_CON_FK FOREIGN KEY(conversacion) REFERENCES CONVERSACIONES(id)
                ON DELETE CASCADE
                ON UPDATE CASCADE
)ENGINE=INNODB CHARSET=LATIN1 COMMENT="Tabla de Mensajes";

CREATE TABLE IF NOT EXISTS MENSAJES_TEXT(
    id          BIGINT UNSIGNED PRIMARY KEY,
        CONSTRAINT ME_TE FOREIGN KEY(id) REFERENCES MENSAJES(id) 
          ON DELETE CASCADE
          ON UPDATE CASCADE,
    text        TEXT NOT NULL
)ENGINE=INNODB CHARSET=LATIN1 COMMENT="Tabla de Mensajes de texto";

INSERT INTO MENSAJES(type,creacion,user,conversacion)
VALUES ("TEXT",CURRENT_TIMESTAMP,4,1);

INSERT INTO MENSAJES_TEXT(id,text)
VALUES (1,"Nuevo mensaje");

CREATE TABLE IF NOT EXISTS MENSAJES_IMG(
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        CONSTRAINT ME_IMG FOREIGN KEY(id) REFERENCES MENSAJES(id)
          ON DELETE CASCADE
          ON UPDATE CASCADE,
    folder      VARCHAR(60) NOT NULL,
    name        CHAR(22) NOT NULL,
    format      ENUM('jpg', 'png', 'gif','jpeg') NOT NULL DEFAULT 'png',
    caption     VARCHAR(20)
)ENGINE=INNODB CHARSET=LATIN1 COMMENT="Tabla de Mensajes de Imagen";


CREATE TABLE IF NOT EXISTS CONVERSACIONES_NORMALES(
    id          BIGINT UNSIGNED PRIMARY KEY,
        CONSTRAINT CONN_FK FOREIGN KEY(id) REFERENCES CONVERSACIONES(id)
                ON DELETE CASCADE
                ON UPDATE CASCADE,
    user_one    BIGINT UNSIGNED NOT NULL,
        CONSTRAINT CON_USERONE_FK FOREIGN KEY(user_one) REFERENCES USUARIOS(id)
                ON DELETE CASCADE
                ON UPDATE CASCADE,
    user_two    BIGINT UNSIGNED NOT NULL,
        CONSTRAINT CON_USERTWO_FK FOREIGN KEY(user_two) REFERENCES USUARIOS(id)
                ON DELETE CASCADE
                ON UPDATE CASCADE
)ENGINE=INNODB CHARSET=LATIN1 COMMENT="Tabla de Conversaciones Simples entre dos usuarios";

CREATE TABLE IF NOT EXISTS CONVERSACIONES_GRUPALES(
    id          BIGINT UNSIGNED PRIMARY KEY,
        CONSTRAINT CONG_FK FOREIGN KEY(id) REFERENCES CONVERSACIONES(id)
                ON DELETE CASCADE
                ON UPDATE CASCADE,
    idGrupo   BIGINT UNSIGNED NOT NULL,
        CONSTRAINT CONG_IDG_FK FOREIGN KEY(idGrupo)
            REFERENCES GRUPOS(id)
                ON DELETE CASCADE
                ON UPDATE CASCADE    
)ENGINE=INNODB CHARSET=LATIN1 COMMENT="Tabla de Conversaciones Grupales";


CREATE TABLE IF NOT EXISTS CONTACTOS(
    idContacto      BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    descripcion     VARCHAR(90) NOT NULL,
    idUsuario       BIGINT UNSIGNED NOT NULL,
            CONSTRAINT CONT_IDU_FK FOREIGN KEY(idUsuario) 
                    REFERENCES USUARIOS(id)
                        ON DELETE CASCADE
                        ON UPDATE CASCADE,
    idRepresentado  BIGINT UNSIGNED NOT NULL,
            CONSTRAINT CONT_IDR_FK FOREIGN KEY(idRepresentado)
                    REFERENCES USUARIOS(id)
                        ON DELETE CASCADE
                        ON UPDATE CASCADE,
    CONSTRAINT CON_UK UNIQUE(idUsuario,idRepresentado),
    destacado       BOOLEAN DEFAULT FALSE NOT NULL
)ENGINE=INNODB CHARSET=LATIN1 COMMENT="Tabla de contactos";


CREATE TABLE IF NOT EXISTS LLAMADAS(
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    type        ENUM("LLAMADA DE VOZ","VIDEOLLAMADA") NOT NULL,
    name        VARCHAR(60) NOT NULL,
    emisor      BIGINT UNSIGNED NOT NULL,
        CONSTRAINT LLA_EMI_FK FOREIGN KEY(emisor) REFERENCES USUARIOS(id)
                ON DELETE CASCADE
                ON UPDATE CASCADE,
    receptor    BIGINT UNSIGNED NOT NULL,
        CONSTRAINT LLA_REC_FK FOREIGN KEY(receptor) REFERENCES USUARIOS(id)
                ON DELETE CASCADE
                ON UPDATE CASCADE,
    timestamp   TIMESTAMP NOT NULL,
    CONSTRAINT LLA_UK UNIQUE(emisor,receptor,timestamp),
    duracion    VARCHAR(60),
    status      ENUM("ESTABLECIDA","NOESTABLECIDA","RECHAZADA") DEFAULT "ESTABLECIDA" NOT NULL
)ENGINE=INNODB CHARSET=LATIN1 COMMENT="Tabla de llamadas";


CREATE TABLE IF NOT EXISTS attempts(
    ip VARCHAR(60) PRIMARY KEY,
    count TINYINT(1) UNSIGNED NOT NULL,
    expiredate TIMESTAMP NOT NULL
)ENGINE=INNODB CHARSET=LATIN1 COMMENT="Tabla de intentos de acceso";

DELIMITER ;
 
DROP FUNCTION IF EXISTS urlencode;
 
DELIMITER |
 
CREATE FUNCTION URLENCODE(str VARCHAR(4096) CHARSET utf8) RETURNS VARCHAR(4096) CHARSET utf8
DETERMINISTIC
CONTAINS SQL
BEGIN
   -- the individual character we are converting in our loop
   -- NOTE: must be VARCHAR even though it won't vary in length
   -- CHAR(1), when used with SUBSTRING, made spaces '' instead of ' '
   DECLARE sub VARCHAR(1) CHARSET utf8;
   -- the ordinal value of the character (i.e. ñ becomes 50097)
   DECLARE val BIGINT DEFAULT 0;
   -- the substring index we use in our loop (one-based)
   DECLARE ind INT DEFAULT 1;
   -- the integer value of the individual octet of a character being encoded
   -- (which is potentially multi-byte and must be encoded one byte at a time)
   DECLARE oct INT DEFAULT 0;
   -- the encoded return string that we build up during execution
   DECLARE ret VARCHAR(4096) DEFAULT '';
   -- our loop index for looping through each octet while encoding
   DECLARE octind INT DEFAULT 0;
 
   IF ISNULL(str) THEN
      RETURN NULL;
   ELSE
      SET ret = '';
      -- loop through the input string one character at a time - regardless
      -- of how many bytes a character consists of
      WHILE ind <= CHAR_LENGTH(str) DO
         SET sub = MID(str, ind, 1);
         SET val = ORD(sub);
         -- these values are ones that should not be converted
         -- see http://tools.ietf.org/html/rfc3986
         IF NOT (val BETWEEN 48 AND 57 OR     -- 48-57  = 0-9
                 val BETWEEN 65 AND 90 OR     -- 65-90  = A-Z
                 val BETWEEN 97 AND 122 OR    -- 97-122 = a-z
                 -- 45 = hyphen, 46 = period, 95 = underscore, 126 = tilde
                 val IN (45, 46, 95, 126)) THEN
            -- This is not an "unreserved" char and must be encoded:
            -- loop through each octet of the potentially multi-octet character
            -- and convert each into its hexadecimal value
            -- we start with the high octect because that is the order that ORD
            -- returns them in - they need to be encoded with the most significant
            -- byte first
            SET octind = OCTET_LENGTH(sub);
            WHILE octind > 0 DO
               -- get the actual value of this octet by shifting it to the right
               -- so that it is at the lowest byte position - in other words, make
               -- the octet/byte we are working on the entire number (or in even
               -- other words, oct will no be between zero and 255 inclusive)
               SET oct = (val >> (8 * (octind - 1)));
               -- we append this to our return string with a percent sign, and then
               -- a left-zero-padded (to two characters) string of the hexadecimal
               -- value of this octet)
               SET ret = CONCAT(ret, '%', LPAD(HEX(oct), 2, 0));
               -- now we need to reset val to essentially zero out the octet that we
               -- just encoded so that our number decreases and we are only left with
               -- the lower octets as part of our integer
               SET val = (val & (POWER(256, (octind - 1)) - 1));
               SET octind = (octind - 1);
            END WHILE;
         ELSE
            -- this character was not one that needed to be encoded and can simply be
            -- added to our return string as-is
            SET ret = CONCAT(ret, sub);
         END IF;
         SET ind = (ind + 1);
      END WHILE;
   END IF;
   RETURN ret;
END;
  
|
 
DELIMITER ;

