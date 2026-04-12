## HNG14 Stage 0 Task

### Gender Classification API

This is a simple REST API that predicts the gender from a given name using the external API (Genderize.io at https://genderize.io) service.

### Tech Stack

- Node.js
- Express

- **GitHub Repository:** `https://github.com/MyITjournal/gender-api-task`
- **Live API Base URL:** `https://`

---

## Endpoint

### `GET /api/classify`

**Query Parameter**

| Parameter | Type   | Required | Description          |
| --------- | ------ | -------- | -------------------- |
| `name`    | string | Yes      | The name to identify |

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

**Response Fields**

| Field          | Type    | Description                                                   |
| -------------- | ------- | ------------------------------------------------------------- |
| `name`         | string  | The name that was queried                                     |
| `gender`       | string  | Predicted gender (`male` or `female`)                         |
| `probability`  | number  | Confidence score from Genderize.io (0–1)                      |
| `sample_size`  | number  | Number of data points used for the prediction                 |
| `is_confident` | boolean | `true` when `probability >= 0.7` **and** `sample_size >= 100` |
| `processed_at` | string  | UTC timestamp of when the request was processed (ISO 8601)    |

---

## Running Locally

```bash
# 1. Clone the repository
git clone https://github.com/MyITjournal/gender-api-task.git
cd <your-own-repo>

# 2. Install dependencies
npm install

# 3. Start the server
node index.js
```

The server starts on port `3000` by default.

Test it:

```bash
curl "http://localhost:3000/api/classify?name=Ada"
```

---

## Deployment (Vercel)
