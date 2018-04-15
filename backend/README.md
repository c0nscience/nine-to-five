## Database

```
docker run --name ntf-jdb -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=ntf-db -p 5434:5432 -d postgres
```

```
docker run --name ntf-mongodb -e MONGO_INITDB_ROOT_USERNAME=mongodb -e MONGO_INITDB_ROOT_PASSWORD=mongodb -e MONGO_INITDB_DATABASE=ntf-db -p 27017:27017 -d mongo

```

## Test Database

```
docker run --name test-ntf-jdb -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=test-ntf-db -p 5435:5432 -d postgres
```
