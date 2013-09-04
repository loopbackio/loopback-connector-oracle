--------------------------------------------------------
--  DDL for Table CUSTOMER
--------------------------------------------------------
DROP TABLE CUSTOMER CASCADE CONSTRAINTS PURGE;
CREATE TABLE CUSTOMER
  (
    ID                VARCHAR2(20) PRIMARY KEY,
    USERNAME          VARCHAR2(64),
    EMAIL             VARCHAR2(64),
    PASSWORD          VARCHAR2(64),
    NAME              VARCHAR2(40),
    MILITARY_AGENCY   VARCHAR2(20),
    REALM             VARCHAR2(64),
    EMAILVERIFIED     CHAR(1),
    VERIFICATIONTOKEN VARCHAR2(64),
    CREDENTIALS       VARCHAR2(64),
    CHALLENGES        VARCHAR2(64),
    STATUS            VARCHAR2(64),
    CREATED           DATE,
    LASTUPDATED       DATE
  );
DROP TABLE SESSION CASCADE CONSTRAINTS PURGE;
CREATE TABLE SESSION
  (
    ID  VARCHAR2(64) PRIMARY KEY,
    UID VARCHAR2(64),
    TTL NUMBER
  );
--------------------------------------------------------
--  DDL for Table LOCATION
--------------------------------------------------------
DROP TABLE LOCATION CASCADE CONSTRAINTS PURGE;
CREATE TABLE LOCATION
  (
    ID      VARCHAR2(20) PRIMARY KEY,
    STREET  VARCHAR2(20),
    CITY    VARCHAR2(20),
    ZIPCODE VARCHAR2(20),
    NAME    VARCHAR2(20),
    GEO     VARCHAR2(64)
  );
--------------------------------------------------------
--  DDL for Table PRODUCT
--------------------------------------------------------
DROP TABLE PRODUCT CASCADE CONSTRAINTS PURGE;
CREATE TABLE PRODUCT
  (
    ID              VARCHAR2(20) PRIMARY KEY,
    NAME            VARCHAR2(64),
    AUDIBLE_RANGE   NUMBER(12,2),
    EFFECTIVE_RANGE NUMBER(12,2),
    ROUNDS          NUMBER(10,0),
    EXTRAS          VARCHAR2(64),
    FIRE_MODES      VARCHAR2(64)
  );
--------------------------------------------------------
--  DDL for Table INVENTORY
--------------------------------------------------------
DROP TABLE INVENTORY CASCADE CONSTRAINTS PURGE;
CREATE TABLE INVENTORY
  (
    ID          VARCHAR2(20) PRIMARY KEY,
    PRODUCT_ID  VARCHAR2(20),
    LOCATION_ID VARCHAR2(20),
    AVAILABLE   NUMBER,
    TOTAL       NUMBER
  );
--------------------------------------------------------
--  DDL for Table RESERVATION
--------------------------------------------------------
DROP TABLE RESERVATION CASCADE CONSTRAINTS PURGE;
CREATE TABLE RESERVATION
  (
    ID           VARCHAR2(20),
    PRODUCT_ID   VARCHAR2(20),
    LOCATION_ID  VARCHAR2(20),
    CUSTOMER_ID  VARCHAR2(20),
    QTY          NUMBER,
    STATUS       VARCHAR2(20),
    RESERVE_DATE DATE,
    PICKUP_DATE  DATE,
    RETURN_DATE  DATE
  );
--------------------------------------------------------
--  Ref Constraints for Table INVENTORY
--------------------------------------------------------
ALTER TABLE INVENTORY ADD CONSTRAINT LOCATION_FK FOREIGN KEY
(
  LOCATION_ID
)
REFERENCES LOCATION
(
  ID
)
ENABLE;
ALTER TABLE INVENTORY ADD CONSTRAINT PRODUCT_FK FOREIGN KEY
(
  PRODUCT_ID
)
REFERENCES PRODUCT
(
  ID
)
ENABLE;
--------------------------------------------------------
--  Ref Constraints for Table RESERVATION
--------------------------------------------------------
ALTER TABLE RESERVATION ADD CONSTRAINT RESERVATION_CUSTOMER_FK FOREIGN KEY
(
  CUSTOMER_ID
)
REFERENCES CUSTOMER
(
  ID
)
ENABLE;
ALTER TABLE RESERVATION ADD CONSTRAINT RESERVATION_LOCATION_FK FOREIGN KEY
(
  LOCATION_ID
)
REFERENCES LOCATION
(
  ID
)
ENABLE;
ALTER TABLE RESERVATION ADD CONSTRAINT RESERVATION_PRODUCT_FK FOREIGN KEY
(
  PRODUCT_ID
)
REFERENCES PRODUCT
(
  ID
)
ENABLE;
CREATE OR REPLACE VIEW INVENTORY_VIEW
                AS
  SELECT P.name AS product,
    L.name      AS location,
    I.available
  FROM INVENTORY I,
    PRODUCT P,
    LOCATION L
  WHERE p.id = I.product_id
  AND l.id   = I.location_id;
