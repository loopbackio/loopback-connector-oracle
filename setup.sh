#!/bin/bash

set -eux
set -o pipefail

### Shell script to spin up a "$DOCKER_CLI" container for oracle.

## color codes
RED='\033[1;31m'
GREEN='\033[1;32m'
YELLOW='\033[1;33m'
CYAN='\033[1;36m'
PLAIN='\033[0m'

## variables
ORACLE_CONTAINER="oracle_free_db"
HOST="localhost"
PORT=1521
DATABASE="FREEPDB1"
USER="TEST"
PASSWORD="0raclep4ss"
SYS_PASSWORD='0raclep4ss'
if [ ! -z "${1:-}" ]; then
    HOST="$1"
fi
if [ ! -z "${2:-}" ]; then
    PORT="$2"
fi
if [ ! -z "${3:-}" ]; then
    USER="$3"
fi
if [ ! -z "${4:-}" ]; then
    PASSWORD="$4"
fi

if [ -z "${DOCKER_CLI:-}" ]; then
    if [ "$(command -v podman)" ]; then
        DOCKER_CLI='podman'
    else
        DOCKER_CLI='docker'
    fi
fi

## check if "$DOCKER_CLI" exists
printf "\n${RED}>> Checking for ${DOCKER_CLI}${PLAIN} ${GREEN}...${PLAIN}"
"$DOCKER_CLI" -v > /dev/null 2>&1
PODMAN_EXISTS=$?
if [ "$PODMAN_EXISTS" -ne 0 ]; then
    printf "\n\n${CYAN}Status: ${PLAIN}${RED}"$DOCKER_CLI" not found. Terminating setup.${PLAIN}\n\n"
    exit 1
fi
printf "\n${CYAN}Found ${DOCKER_CLI}. Moving on with the setup.${PLAIN}\n"

if [ -z "${SKIP_DB_CONTAINER_CREATION:-}" ]; then
    ## cleaning up previous builds
    printf "\n${RED}>> Finding old builds and cleaning up${PLAIN} ${GREEN}...${PLAIN}"
    "$DOCKER_CLI" rm -f $ORACLE_CONTAINER > /dev/null 2>&1
    printf "\n${CYAN}Clean up complete.${PLAIN}\n"

    ## pull latest oracle image
    printf "\n${RED}>> Pulling latest oracle image${PLAIN} ${GREEN}...${PLAIN}"
    "$DOCKER_CLI" pull container-registry.oracle.com/database/free:latest >/dev/null 2>&1
    printf "\n${CYAN}Image successfully built.${PLAIN}\n"

    ## run the oracle container
    printf "\n${RED}>> Starting the oracle container${PLAIN} ${GREEN}...${PLAIN}\n"
    "$DOCKER_CLI" run \
                  --name $ORACLE_CONTAINER \
                  --rm \
                  -p $PORT:1521 \
                  -e "ORACLE_PWD=$SYS_PASSWORD" \
                  -d container-registry.oracle.com/database/free:latest \
                  >/dev/null 2>&1

    ## Wait for oracle database container to be ready
    OUTPUT=1
    TIMEOUT=300
    TIME_PASSED=0
    WAIT_STRING="."
    START_MESSAGE="DATABASE IS READY TO USE!"
    printf "${RED}Waiting for database to be ready${PLAIN} ${GREEN}...${PLAIN}"
    while [ "$OUTPUT" -ne 0 ] && [ "$TIMEOUT" -gt 0 ]
    do
        "$DOCKER_CLI" logs ${ORACLE_CONTAINER} 2>&1 | grep "${START_MESSAGE}" > /dev/null
        OUTPUT=$?
        sleep 1s
        let "TIME_PASSED = $TIME_PASSED + 1"

        if [ "${TIME_PASSED}" -eq 5 ]; then
            printf "${GREEN}${WAIT_STRING}${PLAIN}"
            TIME_PASSED=0
        fi
    done

    if [ "$TIMEOUT" -lt 0 ]; then
        printf "\n${RED}Failed to start container successfully. Terminating setup ...${PLAIN}\n"
        exit 1
    else
        printf "\n${CYAN}Container is up and running.${PLAIN}\n"
    fi
fi

## export the schema to the oracle database
printf "\n${RED}>> Exporting schema to database${PLAIN} ${GREEN}...${PLAIN}\n"
## copy over our db seed file
"$DOCKER_CLI" cp ./test/tables.sql "$ORACLE_CONTAINER:/home/" > /dev/null 2>&1

##make user, give it privileges, and copy sql file to container
CREATEUSER="$(cat <<EOF
CREATE USER ${USER} IDENTIFIED by "${PASSWORD}";
GRANT CONNECT, RESOURCE, DBA TO ${USER};
GRANT CREATE SESSION TO ${USER};
GRANT UNLIMITED TABLESPACE TO ${USER};
EOF
)"

touch podmanusercreate.sql && echo "$CREATEUSER" > podmanusercreate.sql
"$DOCKER_CLI" cp podmanusercreate.sql "$ORACLE_CONTAINER:/home/" > /dev/null 2>&1
rm podmanusercreate.sql
## run create user script
"$DOCKER_CLI" exec -t "$ORACLE_CONTAINER" /bin/sh -c "echo exit | sqlplus sys/${SYS_PASSWORD}@//${HOST}:${PORT}/${DATABASE} as sysdba @/home/podmanusercreate.sql" > /dev/null 2>&1


## variables needed to health check export schema
OUTPUT=$?
TIMEOUT=120
TIME_PASSED=0
WAIT_STRING="."

printf "\n${GREEN}Waiting for database to respond with updated schema $WAIT_STRING${PLAIN}"
while [ "$OUTPUT" -ne 0 ] && [ "$TIMEOUT" -gt 0 ]
    do
        "$DOCKER_CLI" exec -t "$ORACLE_CONTAINER" /bin/sh -c "echo exit | sqlplus ${USER}/{$PASSWORD}@//${HOST}:${PORT}/${DATABASE} @/home/tables.sql" > /dev/null 2>&1
        OUTPUT=$?
        sleep 1s
        TIMEOUT=$((TIMEOUT - 1))
        TIME_PASSED=$((TIME_PASSED + 1))
        if [ "$TIME_PASSED" -eq 5 ]; then
            printf "${GREEN}.${PLAIN}"
            TIME_PASSED=0
        fi
    done

if [ "$TIMEOUT" -le 0 ]; then
    printf "\n\n${CYAN}Status: ${PLAIN}${RED}Failed to export schema. Terminating setup.${PLAIN}\n\n"
    exit 1
fi
printf "\n${CYAN}Successfully exported schema to database.${PLAIN}\n"


## set env variables for running test
printf "\n${RED}>> Setting env variables to run test${PLAIN} ${GREEN}...${PLAIN}"
export ORACLE_HOST=$HOST
export ORACLE_PORT=$PORT
export ORACLE_USER=$USER
export ORACLE_PASSWORD=$PASSWORD
export ORACLE_DATABASE=$DATABASE
export loopback_dev__oracle__user=$USER
export loopback_dev__oracle__password=$PASSWORD
export loopback_dev__oracle__database=$DATABASE
export loopback_test__oracle__user=$USER
export loopback_test__oracle__password=$PASSWORD
export loopback_test__oracle__database=$DATABASE
printf "\n${CYAN}Env variables set.${PLAIN}\n"

printf "\n${CYAN}Status: ${PLAIN}${GREEN}Set up completed successfully.${PLAIN}\n"
printf "\n${CYAN}Instance url: ${YELLOW}oracle://$USER:$PASSWORD@$HOST/$DATABASE${PLAIN}\n"
printf "\n${CYAN}To run the test suite:${PLAIN} ${YELLOW}npm test${PLAIN}\n\n"
