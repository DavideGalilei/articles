## Case 1: Blog views

### Running
```shell
docker compose up --build
```

P.S. The docker compose configuration uses a `tmpfs` volume for the database, so the data will be lost when the container is stopped.
