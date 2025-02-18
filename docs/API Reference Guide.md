
# API Reference Guide

## Introduction

This document provides a comprehensive reference for the API, detailing all available endpoints, request and response formats, parameters, and status codes. It is intended for developers and technical architects who are integrating with our API.

## Endpoints Overview

This section provides a high-level overview of the available API endpoints.

| Endpoint | Method | Description |
|---|---|---|
| `/example` | `GET` | Retrieves a list of example resources. |
| `/example/{id}` | `GET` | Retrieves a specific example resource by ID. |
| `/example` | `POST` | Creates a new example resource. |
| `/example/{id}` | `PUT` | Updates an existing example resource by ID. |
| `/example/{id}` | `DELETE` | Deletes an example resource by ID. |

## Request/Response Format

All API requests and responses use JSON (JavaScript Object Notation) as the data format.  The `Content-Type` header for requests should be set to `application/json`.

**Example Request Header:**

```
Content-Type: application/json
```

**Example Response Header:**

```
Content-Type: application/json
```

## Parameters

This section describes the different types of parameters used in the API.

*   **Path Parameters:**  These parameters are part of the URL path and are used to identify a specific resource.  They are denoted by curly braces `{}` in the endpoint definition.  For example, in `/example/{id}`, `id` is a path parameter.

*   **Query Parameters:** These parameters are appended to the URL after a question mark `?` and are used to filter, sort, or paginate results.  They are specified as key-value pairs, separated by ampersands `&`.  For example, `/example?limit=10&offset=0`.

*   **Request Body Parameters:** These parameters are included in the body of `POST`, `PUT`, and `PATCH` requests and are used to create or update resources.  The format of the request body is JSON.

**Example: Query Parameters**

To retrieve the first 10 examples, sorted by name, you would use the following URL:

```
/example?limit=10&offset=0&sort=name
```

## Status Codes

The API uses standard HTTP status codes to indicate the success or failure of a request.  Here's a summary of the most common status codes:

*   **200 OK:** The request was successful.
*   **201 Created:** A new resource was successfully created.
*   **204 No Content:** The request was successful, but there is no content to return.
*   **400 Bad Request:** The request was invalid or malformed.  The response body will typically contain more details about the error.
*   **401 Unauthorized:** The request requires authentication.
*   **403 Forbidden:** The user does not have permission to access the resource.
*   **404 Not Found:** The requested resource was not found.
*   **500 Internal Server Error:** An unexpected error occurred on the server.

## Example Endpoints

### GET /example

Retrieves a list of example resources.

**Request:**

```bash
curl -X GET https://api.example.com/example
```

**Response (200 OK):**

```json
[
  {
    "id": 1,
    "name": "Example 1",
    "description": "This is the first example."
  },
  {
    "id": 2,
    "name": "Example 2",
    "description": "This is the second example."
  }
]
```

### GET /example/{id}

Retrieves a specific example resource by ID.

**Request:**

```bash
curl -X GET https://api.example.com/example/1
```

**Response (200 OK):**

```json
{
  "id": 1,
  "name": "Example 1",
  "description": "This is the first example."
}
```

**Response (404 Not Found):**

```json
{
  "error": "Resource not found"
}
```

### POST /example

Creates a new example resource.

**Request:**

```bash
curl -X POST \
  https://api.example.com/example \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "New Example",
    "description": "This is a new example."
  }'
```

**Response (201 Created):**

```json
{
  "id": 3,
  "name": "New Example",
  "description": "This is a new example."
}
```

### PUT /example/{id}

Updates an existing example resource by ID.

**Request:**

```bash
curl -X PUT \
  https://api.example.com/example/1 \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Updated Example Name",
    "description": "This is an updated example."
  }'
```

**Response (200 OK):**

```json
{
  "id": 1,
  "name": "Updated Example Name",
  "description": "This is an updated example."
}
```

### DELETE /example/{id}

Deletes an example resource by ID.

**Request:**

```bash
curl -X DELETE https://api.example.com/example/1
```

**Response (204 No Content):**

(No content is returned)

## Error Examples

This section provides examples of common error responses.

**400 Bad Request:**

```json
{
  "error": "Invalid input",
  "message": "The 'name' field is required."
}
```

**401 Unauthorized:**

```json
{
  "error": "Unauthorized",
  "message": "Invalid API key."
}
```

**500 Internal Server Error:**

```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred."
}
```
