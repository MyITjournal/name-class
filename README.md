## HNG14 Stage 1 Task

### Introduction

This is a Simple REST API that accepts a name, queries three external prediction APIs (Genderize, Agify, Nationalize) in parallel, aggregates the results, applies classification logic, and persists the profile in a PostgreSQL database.

### Tech Stack

- Node.js + Express
- PostgreSQL (`pg`)

- **GitHub Repository:** `https://github.com/MyITjournal/hng14-task2`
- **Live API Base URL:** `https://classifynames.vercel.app/`

---

## Project Structure

```
├──index.js                      ← local dev entry point
├──server.js                     ← Vercel entry point
├──src/
    ├──app.js                    ← Express setup + route mounting
    ├──db/
        ├──index.js              ← pg pool + table auto-init
    ├──helpers/
        ├──helperFunctions.js    ← determineAgeGroup, formatProfile, ├──handleUpstreamError
    ├──routes/
        ├──classify.js           ← GET /api/classify
        ├──profiles.js           ← GET /api/profiles + POST /api/profiles

```

---

## Endpoints

### `GET /`

Health check:

```json
{ "status": "OK", "message": "Name Classification API is running" }
```

---

### `GET /api/classify`

Predicts gender for a name using Genderize.io. Stateless — no data is stored.

**Query Parameter**

| Parameter | Type   | Required | Description          |
| --------- | ------ | -------- | -------------------- |
| `name`    | string | Yes      | The name to classify |

**Example Request**

```
GET /api/classify?name=James
```

**Success Response** — `200 OK`

```json
{
  "status": "success",
  "data": {
    "name": "James",
    "gender": "male",
    "probability": 0.99,
    "sample_size": 12345,
    "is_confident": true,
    "processed_at": "2026-04-12T10:00:00.000Z"
  }
}
```

---

### `POST /api/profiles`

Calls Genderize, Agify, and Nationalize in parallel for the given name, applies classification logic, stores the result in the database, and returns the profile.

**Request Body**

```json
{ "name": "ella" }
```

**Success Response (new record)** — `201 Created`

```json
{
  "status": "success",
  "data": {
    "id": "b3f9c1e2-7d4a-4c91-9c2a-1f0a8e5b6d12",
    "name": "ella",
    "gender": "female",
    "gender_probability": 0.99,
    "sample_size": 1234,
    "age": 46,
    "age_group": "adult",
    "country_id": "NG",
    "country_probability": 0.85,
    "created_at": "2026-04-01T12:00:00.000Z"
  }
}
```

**Success Response (existing record)** — `200 OK`

```json
{
  "status": "success",
  "message": "Profile already exists",
  "data": { ... }
}
```

**Response Fields**

| Field                 | Type   | Description                                                         |
| --------------------- | ------ | ------------------------------------------------------------------- |
| `id`                  | string | UUID v7                                                             |
| `name`                | string | Submitted name                                                      |
| `gender`              | string | `male` or `female`                                                  |
| `gender_probability`  | number | Genderize confidence score (0–1)                                    |
| `sample_size`         | number | Genderize data points used                                          |
| `age`                 | number | Estimated age from Agify                                            |
| `age_group`           | string | `child` (0–12), `teenager` (13–19), `adult` (20–59), `senior` (60+) |
| `country_id`          | string | Country code (highest probability)                                  |
| `country_probability` | number | Nationalize confidence score (0–1)                                  |
| `created_at`          | string | UTC ISO 8601 timestamp                                              |

---

### `GET /api/profiles`

Returns all stored profiles. Supports optional filters via query parameters.

**Query Parameters (all optional)**

| Parameter    | Type   | Description                                                  |
| ------------ | ------ | ------------------------------------------------------------ |
| `gender`     | string | Filter by gender (e.g. `male`, `female`)                     |
| `age_group`  | string | Filter by age group (`child`, `teenager`, `adult`, `senior`) |
| `country_id` | string | Filter by country code (e.g. `NG`, `US`)                     |

**Example Requests**

```
GET /api/profiles
GET /api/profiles?gender=female
GET /api/profiles?age_group=adult&country_id=NG
```

**Success Response** — `200 OK`

```json
{
  "status": "success",
  "data": [
    {
      "id": "...",
      "name": "ella",
      "gender": "female",
      ...
    }
  ]
}
```

---

## Error Responses

All errors follow the same structure:

```json
{ "status": "error", "message": "<description>" }
```

| Status | Condition                                  |
| ------ | ------------------------------------------ |
| `400`  | Missing or empty `name`                    |
| `422`  | `name` is not a string                     |
| `404`  | External API returned no usable prediction |
| `502`  | External prediction service unreachable    |
| `500`  | Internal server error                      |

---

## Running Locally

```bash
# 1. Clone the repository
git clone https://github.com/MyITjournal/gender-api-task.git
cd your-folder

# 2. Install dependencies
npm install

# 3. Configure environment variables
```

DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_NAME='HNG14_Task2'
DATABASE_URL=postgresql://postgres:@your_password@localhost:5432/db_name
DATABASE_SSL=false

```

# 4. Start the server
node index.js
```

The server starts on port `3000` by default. The `profiles` table is created automatically on startup.

**Testing:**

```bash
# Health check
curl http://localhost:3000/

# Gender classify
curl "http://localhost:3000/api/classify?name=Ada"

# Create a profile
curl -X POST http://localhost:3000/api/profiles \
  -H "Content-Type: application/json" \
  -d '{"name": "ella"}'

# List all profiles
curl http://localhost:3000/api/profiles

# Filter profiles
curl "http://localhost:3000/api/profiles?gender=female&age_group=adult"
```

---

## Deployment (Vercel)

Set the following environment variables in your Vercel project settings:

| Variable       | Description                                         |
| -------------- | --------------------------------------------------- |
| `DATABASE_URL` | PostgreSQL connection string                        |
| `DATABASE_SSL` | Set to `true` for hosted providers (Supabase, Neon) |

Live URL: `https://classifynames.vercel.app`
