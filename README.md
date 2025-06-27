# Posusko lito

Posusko lito je aplikacija za upravljanje i prikaz događaja u stvarnom vremenu.  
Koristi Apache Kafka, Redis i Docker za backend, te React za frontend.  
Podržava korisničku registraciju, prijavu i upravljanje događajima.

---

## Tehnologije

- **Apache Kafka** – sustav za obradu i prijenos poruka
- **Redis** – in-memory baza za pohranu podataka
- **Docker** – za kontejnerizaciju aplikacije
- **Flask (Python)** – backend API i logika
- **React (JavaScript)** – frontend korisničko sučelje

---

## Pokretanje aplikacije

1. Kloniraj repozitorij i uđi u direktorij projekta.
2. Pokreni Docker kontejnere (backend, frontend, Kafka, Redis, itd.):

```bash
docker-compose up --build
```
