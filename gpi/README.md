# Nine To Five - Go API

This is the golang implementation of the nine to five API.

# Setup

Add the following environment variables to their configuration templates:

* `Go Test`:
    ```properties
    DB_URI=mongodb://localhost:27018/ntf-db-test
    DB_NAME=ntf-db-test
    ```
* `Go Build`:
    ```properties
    DB_URI=mongodb://localhost:27017/ntf-db
    DB_NAME=ntf-db
    ```

These settings set up every new test run you create while developing.

Run `docker compose up -d` in the projects root folder to spin up the development environment.

Furthermore, add all sub-directories as separate modules in IntelliJ.