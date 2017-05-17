#!/bin/bash

### Shell script to spin up a docker container for oracle.

## color codes
RED='\033[1;31m'
GREEN='\033[1;32m'
YELLOW='\033[1;33m'
CYAN='\033[1;36m'
PLAIN='\033[0m'

## variables
ORACLE_CONTAINER="oracle_c"
HOST="localhost"
PORT=1521
DATABASE="XE"
USER="system"
PASSWORD="oracle"
if [ "$1" ]; then
    HOST=$1
fi
if [ "$2" ]; then
    PORT=$2
fi


## check if docker exists
printf "\n${RED}>> Checking for docker${PLAIN} ${GREEN}...${PLAIN}"
docker -v > /dev/null 2>&1
DOCKER_EXISTS=$?
if [ "$DOCKER_EXISTS" -ne 0 ]; then
    printf "\n\n${CYAN}Status: ${PLAIN}${RED}Docker not found. Terminating setup.${PLAIN}\n\n"
    exit 1
fi
printf "\n${CYAN}Found docker. Moving on with the setup.${PLAIN}\n"

## cleaning up previous builds
printf "\n${RED}>> Finding old builds and cleaning up${PLAIN} ${GREEN}...${PLAIN}"
docker rm -f $ORACLE_CONTAINER > /dev/null 2>&1
printf "\n${CYAN}Clean up complete.${PLAIN}\n"

## pull latest oracle image
printf "\n${RED}>> Pulling latest oracle image${PLAIN} ${GREEN}...${PLAIN}"
docker pull sath89/oracle-xe-11g:latest > /dev/null 2>&1
printf "\n${CYAN}Image successfully built.${PLAIN}\n"

## run the oracle container
printf "\n${RED}>> Starting the oracle container${PLAIN} ${GREEN}...${PLAIN}\n"
docker run --name $ORACLE_CONTAINER -p $PORT:1521 -d sath89/oracle-xe-11g:latest > /dev/null 2>&1

##wait for orale database container to be ready
OUTPUT=1
TIMEOUT=300
TIME_PASSED=0
WAIT_STRING="."
START_MESSAGE="Database ready to use."
printf "${RED}Waiting for database to be ready${PLAIN} ${GREEN}...${PLAIN}"
while [ "$OUTPUT" -ne 0 ] && [ "$TIMEOUT" -gt 0 ]
  do
    docker logs ${ORACLE_CONTAINER} 2>&1 | grep "${START_MESSAGE}" > /dev/null
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


## export the schema to the oracle database
printf "\n${RED}>> Exporting schema to database${PLAIN} ${GREEN}...${PLAIN}\n"
## copy over our db seed file
docker cp ./test/tables.sql $ORACLE_CONTAINER:/home/ > /dev/null 2>&1
## variables needed to health check export schema
OUTPUT=$?
TIMEOUT=120
TIME_PASSED=0
WAIT_STRING="."

printf "\n${GREEN}Waiting for database to respond with updated schema $WAIT_STRING${PLAIN}"
while [ "$OUTPUT" -ne 0 ] && [ "$TIMEOUT" -gt 0 ]
    do
        docker exec -it $ORACLE_CONTAINER /bin/sh -c "echo exit | sqlplus ${USER}/{$PASSWORD}@//${HOST}:${PORT}/${DATABASE} @/home/tables.sql" > /dev/null 2>&1
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
printf "\n${CYAN}Env variables set.${PLAIN}\n"

printf "\n${CYAN}Status: ${PLAIN}${GREEN}Set up completed successfully.${PLAIN}\n"
printf "\n${CYAN}Instance url: ${YELLOW}oracle://$USER:$PASSWORD@$HOST/$DATABASE${PLAIN}\n"
printf "\n${CYAN}To run the test suite:${PLAIN} ${YELLOW}npm test${PLAIN}\n\n"
