# agent-ic: демо-стенд для лабораторної

Увесь стенд піднімається однією командою `docker compose up`. Він складається з таких частин:

- **застосунок agent-ic:** конструктор AI-чат-агентів (NestJS + React);
- **СУБД PostgreSQL;**
- **генератор навантаження k6:** пише в базу через API, у реальному часі;
- **спостережуваність:** Prometheus, Grafana, Loki і Tempo.

Нічого не збирається на вашій машині. Образи застосунку вже опубліковані в GHCR, а LLM замінено локальним моком, тож ключі та інтернет (окрім першого завантаження образів) не потрібні.

## Вимоги

- Docker із Compose v2 (Docker Desktop, OrbStack або Docker Engine на Linux).
- Близько **2 ГБ вільної пам'яті** для Docker. Виміряно 1,7 ГБ на всі 16 контейнерів (див. [Ресурси](#ресурси)).
- Вільні порти **8080**, **3000** та **8025** на `127.0.0.1`.
- Браузер **Chrome або Firefox**. Cookie входу мають прапорець `Secure`, а ці браузери дозволяють його на `http://localhost`. Safari — ні.
- Образи застосунку зібрані лише під `linux/amd64`. На Apple Silicon вони працюють через емуляцію (Rosetta), трохи повільніше, але працюють.

## Запуск

```sh
cd demo
docker compose up -d --wait
```

Перший запуск триває кілька хвилин: Docker завантажує образи, потім `migrate` накочує міграції, а `seed` створює демо-дані. Наступні запуски займають близько 25 секунд. Коли команда повернеться, усі сервіси здорові, а k6 уже генерує трафік.

Без `-d --wait` теж працює (`docker compose up`), але тоді в терміналі будуть логи всіх контейнерів.

Якщо порт зайнятий, змініть його у `demo/.env` або перед запуском:

```sh
WEB_HOST_PORT=8088 PUBLIC_URL=http://localhost:8088 docker compose up -d --wait
```

`PUBLIC_URL` має збігатися з адресою в браузері, бо сервер авторизації перевіряє заголовок `Origin`.

## Адреси та входи

| Що              | Адреса                | Логін                            | Пароль               |
| --------------- | --------------------- | -------------------------------- | -------------------- |
| Застосунок      | http://localhost:8080 | `demo@local.agent-ic.pavlop.dev` | `demo-password-2026` |
| Grafana         | http://localhost:3000 | `admin`                          | `demo-grafana`       |
| Пошта (Mailpit) | http://localhost:8025 | —                                | —                    |

Prometheus, Loki, Tempo, Postgres і Redis назовні не опубліковані. До метрик, логів і трейсів можна дістатися лише через Grafana, тобто тільки після входу.

## Як стенд закриває вимоги

| #   | Вимога                                            | Чим закрито                                                                                                                                                                                                                                                                                                                                      | Де подивитися                                                                                                              |
| --- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| 0   | СУБД у Docker                                     | `postgres` (PostgreSQL 18 + pgvector)                                                                                                                                                                                                                                                                                                            | Grafana → Demo → **Postgres**                                                                                              |
| 1   | Генерація даних програмно, запис у реальному часі | `k6` ходить в API як справжній клієнт: логіниться, веде чати з шістьма агентами, зберігає версії промптів, редагує агента. Кожна дія пише рядки в базу.                                                                                                                                                                                          | Grafana → Demo → **Live writes**: таблиці «Latest messages», «Latest runs», «Latest prompt versions» оновлюються кожні 5 с |
| 2   | Збір метрик Prometheus                            | `prometheus` кожні 10 с опитує `/metrics` у `api` і `worker`, `postgres-exporter`, `redis-exporter` та самі сервіси спостережуваності. k6 пише свої метрики через remote-write.                                                                                                                                                                  | Grafana → Explore → Prometheus                                                                                             |
| 3   | Зберігання в TSDB Prometheus                      | вбудована TSDB, том `prometheus-data`, зберігання 24 год / 512 МБ                                                                                                                                                                                                                                                                                | там само                                                                                                                   |
| 4   | Відображення в Grafana                            | 7 дашбордів: Demo (**Live writes**, **Postgres**) і agent-ic (overview, HTTP and GraphQL, database, jobs and runs, queues)                                                                                                                                                                                                                       | Grafana → Dashboards                                                                                                       |
| 5   | Логи в Grafana Loki                               | `alloy` збирає stdout усіх контейнерів і відправляє в `loki`. Логи застосунку — це JSON із `traceId`, `runId` і `workspaceId`.                                                                                                                                                                                                                   | Grafana → Explore → Loki: `{service="worker"} \| json \| runId != ""`                                                      |
| 6   | Трейси в Grafana Tempo                            | OpenTelemetry SDK у `api` і `worker` → `otel-collector` → `tempo`. Один трейс на запит: GraphQL → черга → worker → крок агента → виклик LLM, разом зі спанами SQL і Redis.                                                                                                                                                                       | Grafana → Explore → Tempo, або клік по точці-exemplar на графіку латентності                                               |
| 7   | Сервер авторизації                                | модуль `identity` застосунку (NestJS + PostgreSQL): паролі на argon2, короткі JWT access-токени (15 хв), refresh-токени з ротацією та виявленням повторного використання, перевірка `Origin`, ліміти спроб входу, ролі у воркспейсі, ізоляція даних через Row Level Security у Postgres. Для Grafana — власний логін, анонімний доступ вимкнено. | див. [Перевірка авторизації](#перевірка-авторизації)                                                                       |
| 8   | Docker                                            | кожен компонент — окремий контейнер в одному `compose.yaml`                                                                                                                                                                                                                                                                                      | `docker compose ps`                                                                                                        |
| 9   | Черги повідомлень (необов'язково)                 | BullMQ на Redis між `api` і `worker` (запуск агента, доставка повідомлень, листи), плюс outbox у Postgres                                                                                                                                                                                                                                        | Grafana → agent-ic → **queues and workers**                                                                                |

Сервер авторизації в завданні пропонувався на Python + SQLite. Тут його роль виконує сервер авторизації самого застосунку, на NestJS + PostgreSQL: він робить те саме (лише авторизовані користувачі мають доступ), але є частиною реального продукту.

## Сценарій захисту (~10 хвилин)

1. **Застосунок.** Відкрийте http://localhost:8080 і увійдіть як `demo@…`. У воркспейсі **Flow examples** відкрийте агента **FAQ assistant** → **Test in simulator** і напишіть, наприклад, «Do you have oat milk?». Відповідь прийде за секунду-дві, а праворуч підсвітяться кроки флоу.

   Агенти з префіксом `Load ·` належать k6, їх краще не чіпати.

2. **Запис у базу наживо.** Grafana → Dashboards → Demo → **Live writes**. Тут видно:
   - запити k6 за секунду;
   - рядки, що пишуться в Postgres;
   - запуски агентів і виклики LLM.

   У таблиці «Latest messages» з'являються нові повідомлення, і серед них ваше з кроку 1.

3. **Навантаження.** У другому терміналі запустіть сплеск на 20 віртуальних користувачів:

   ```sh
   docker compose run --rm --no-deps k6 /scripts/run-burst.sh
   ```

   Протягом ~2,5 хв графіки на **Live writes** і **Postgres** піднімаються. Наприкінці k6 друкує підсумок.

4. **Метрика → трейс.** На панелі «Latency p95: client vs server» наведіть на точку-exemplar і натисніть **trace_id**. Відкриється трейс у Tempo: від `POST /api/graphql` до `chat gpt-6-luna` у worker, з усіма SQL-запитами.

   Те саме можна відкрити з колонки `trace_id` у таблиці «Latest runs».

5. **Трейс → логи.** У трейсі на спані натисніть **Logs for this span**. Loki покаже рядки логів саме цього запиту.

6. **Explore.** Кілька запитів для показу:
   - Loki: `{service=~"api|worker", level=~"warn|error"}` — попередження та помилки. Мок LLM навмисно відповідає 503 на ~3 % запитів, і застосунок перемикається на резервну модель.
   - Prometheus: `sum by (outcome) (rate(llm_calls_total[5m]))`, `rate(pg_stat_database_tup_inserted{datname="agent_ic"}[1m])`.

7. **Реєстрація.** На http://localhost:8080/auth/sign-up створіть нового користувача. Лист із підтвердженням прийде в Mailpit (http://localhost:8025). Посилання з листа підтверджує пошту й веде до створення воркспейсу.

8. **Авторизація.** Див. наступний розділ.

## Перевірка авторизації

```sh
# Grafana без входу → редірект на сторінку логіну
curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' http://localhost:3000/d/demo-live-writes

# API без токена → UNAUTHENTICATED
curl -s http://localhost:8080/api/graphql -H 'content-type: application/json' \
  -d '{"query":"{ myWorkspaces { workspace { id } } }"}'

# неправильний пароль: 5 разів 401, далі 429 (ліміт спроб)
for i in 1 2 3 4 5 6 7; do
  curl -s -o /dev/null -w '%{http_code} ' -X POST http://localhost:8080/api/auth/login \
    -H 'content-type: application/json' -H 'origin: http://localhost:8080' \
    -d '{"email":"someone@example.com","password":"wrong-password"}'
done; echo

# запит з чужого сайту → 403 CROSS_ORIGIN_REQUEST
curl -s -X POST http://localhost:8080/api/auth/login -H 'content-type: application/json' \
  -H 'origin: http://evil.example' -d '{"email":"x@y.z","password":"whatever-123"}'

# Prometheus назовні недоступний
curl -s -m 3 http://localhost:9090 || echo "не доступний"
```

Для перевірки ліміту беріть вигадану адресу, а не `demo@…`. Ліміт рахується на адресу (5 спроб за хвилину, 20 за годину), і k6 теж входить під `demo@…`.

## Архітектура

```
                  браузер / k6
                       │ http://localhost:8080
                       ▼
                ┌─────────────┐
                │ web (nginx) │  SPA + проксі /api → api
                └──────┬──────┘
                       ▼
 ┌──────────┐   ┌─────────────┐   BullMQ   ┌──────────┐   ┌──────────┐
 │ postgres │◄──┤     api     ├───────────►│  worker  ├──►│ mock-llm │
 │          │◄──┤  (identity, │   redis    │ (агенти) │   └──────────┘
 └────┬─────┘   │   GraphQL)  │            └────┬─────┘
      │         └──────┬──────┘                 │
      │      метрики /metrics, трейси OTLP, логи stdout
      ▼                ▼                        ▼
 postgres-exporter   prometheus ◄── k6 (remote-write)
 redis-exporter      otel-collector ──► tempo
                     alloy (docker logs) ──► loki
                              │
                              ▼
                   grafana (http://localhost:3000)
```

- **Одноразові сервіси.** `migrate` і `seed` відпрацьовують і завершуються з кодом 0. `seed` ідемпотентний, тож повторний `up` нічого не дублює.
- **k6.** Сценарій `load/steady.js` працює по колу, по 12 хвилин за прогін. Він веде 6 чатів одночасно (`LOAD_RATE` повідомлень за секунду, за замовчуванням 1,5) і раз на 20 с редагує промпт та агента.
- **Мок LLM** (`mock-llm/server.mjs`) відповідає у форматах OpenAI та Anthropic. Він:
  - будує відповідь за JSON-схемою запиту;
  - додає затримку 200–900 мс (`MOCK_LATENCY_MS`);
  - на ~3 % запитів повертає 503 (`MOCK_FAILURE_RATE`).

## Налаштування

Усе лежить у `demo/.env`. Значення там демонстраційні, це не секрети.

| Змінна                                   | Що робить                                                                            |
| ---------------------------------------- | ------------------------------------------------------------------------------------ |
| `WEB_HOST_PORT`, `PUBLIC_URL`            | порт і адреса застосунку                                                             |
| `GRAFANA_HOST_PORT`, `MAILPIT_HOST_PORT` | порти Grafana і Mailpit                                                              |
| `LOAD_RATE`                              | повідомлень за секунду в постійному навантаженні; на слабкій машині зменште до `0.5` |
| `BURST_VUS`, `BURST_DURATION`            | розмір і тривалість сплеску                                                          |
| `MOCK_LATENCY_MS`, `MOCK_FAILURE_RATE`   | затримка й частка помилок мока LLM                                                   |
| `IMAGE_TAG`                              | версія образів застосунку                                                            |

## Ресурси

Виміряно `docker stats` після ~10 хвилин постійного навантаження й одного сплеску, на Apple Silicon (образи застосунку під емуляцією):

| Контейнер                                | Пам'ять       | Ліміт   |
| ---------------------------------------- | ------------- | ------- |
| worker                                   | 376 MiB       | 512 MiB |
| api                                      | 327 MiB       | 512 MiB |
| grafana                                  | 254 MiB       | 384 MiB |
| tempo                                    | 144 MiB       | 256 MiB |
| loki                                     | 123 MiB       | 256 MiB |
| prometheus                               | 113 MiB       | 320 MiB |
| postgres                                 | 95 MiB        | 256 MiB |
| alloy                                    | 76 MiB        | 192 MiB |
| otel-collector                           | 47 MiB        | 128 MiB |
| web                                      | 31 MiB        | 64 MiB  |
| mock-llm, redis, k6, mailpit, експортери | ~90 MiB разом |         |
| **Разом**                                | **~1,7 GiB**  |         |

Сплеск на 20 віртуальних користувачів (2,5 хв) дав:

- 847 повідомлень (5,6/с);
- 4 592 HTTP-запити, 0 помилок;
- латентність API p95: 44 мс;
- відповідь агента p95: 3,1 с.

## Зупинка

```sh
docker compose down      # зупинити, дані лишаються в томах
docker compose down -v   # зупинити й видалити всі дані
```

## Якщо щось не так

- **`docker compose ps -a`.** `migrate` і `seed` мають бути `exited (0)`, решта `healthy`.
- **Не входить у браузері.** Перевірте, що адреса в браузері дорівнює `PUBLIC_URL`, і що це Chrome або Firefox на `localhost` (не `127.0.0.1`).
- **Немає логів у Loki.** `alloy` читає логи через `/var/run/docker.sock`. Якщо ваш Docker не дає змонтувати сокет, логи не збираються, але все інше працює.
- **Слабка машина.** Зменште `LOAD_RATE` у `.env` і перезапустіть: `docker compose up -d k6`.
