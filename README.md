## Asteroid Oracle Connector

The Oracle adapter for JugglingDB.

## Installation

You need to download and install Oracle instant client from following links:

http://www.oracle.com/technetwork/database/features/instant-client/index-097480.html

1. Instant Client Package - Basic: All files required to run OCI, OCCI, and JDBC-OCI applications
2. Instant Client Package - SDK: Additional header files and an example makefile for developing Oracle applications with Instant Client

One patch is required for Windows:

http://www.oracle.com/technetwork/database/occidownloads-083553.html

3. OCCI for Visual Studio 2010 - Visual C++10 (VS 2010)[Windows 64-bit/Windows 32-bit]


<ul>
<li>Please make sure you download the correct packages for your system architecture, such as 64 bit vs 32 bit
<li>Unzip the files 1 and 2 into the same directory, such as /opt/instantclient_11_2 or c:\instantclient_11_2_11_2
<li>Unzip the Windows OCCI patch into the vc10 sub directory, such as c:\instantclient_11_2\vc10
</ul>


On MacOS or Linux:

1. Set up the following environment variables

MacOS/Linux:

    export OCI_HOME=<directory of Oracle instant client>
    export OCI_LIB_DIR=$OCI_HOME
    export OCI_INCLUDE_DIR=$OCI_HOME/sdk/include

2. Create the following symbolic links

MacOS:

    cd $OCI_LIB_DIR
    ln -s libclntsh.dylib.11.1 libclntsh.dylib
    ln -s libocci.dylib.11.1 libocci.dylib

Linux:

    cd $OCI_LIB_DIR
    ln -s libclntsh.so.11.1 libclntsh.so 
    ln -s libocci.so.11.1 libocci.so 

3. Configure the dynamic library path

MacOS:

    export DYLD_LIBRARY_PATH=$OCI_LIB_DIR

On Windows, you need to set the environment variables:

    OCI_INCLUDE_DIR=c:\instclient_11_2\sdk\include
    OCI_LIB_DIR=c:\instantclient_11_2\vc10

And append the OCI path to the PATH environment variable:

    Path=...;c:\instantclient_11_2\vc10;c:\instantclient_11_2

**Please make sure c:\instantclient_11_2\vc10 comes before c:\instantclient_11_2**

## Usage

## Running tests

    npm test


