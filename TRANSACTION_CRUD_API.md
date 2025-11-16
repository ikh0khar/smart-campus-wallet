# Transaction CRUD Operations API

Complete CRUD (Create, Read, Update, Delete) operations for transactions.

## Endpoints

### 1. Create Transaction
**POST** `/api/transactions`

Create a new transaction.

**Request Body:**
```json
{
  "transactionId": "T0201",
  "userId": "U001",
  "merchant": "Starbucks",
  "category": "Dining",
  "amount": 5.75,
  "paymentMethod": "Dining Dollars",
  "location": "Campus Center",
  "date": "2025-11-15T10:30:00Z"
}
```

**Required Fields:**
- `transactionId` - Unique transaction identifier
- `userId` - User ID
- `merchant` - Merchant/store name
- `category` - Transaction category
- `amount` - Transaction amount (must be >= 0)
- `paymentMethod` - Payment method used
- `date` - Transaction date (ISO format)

**Optional Fields:**
- `location` - Transaction location

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Transaction created successfully",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "transactionId": "T0201",
    "userId": "U001",
    "type": "purchase",
    "amount": 5.75,
    "category": "food",
    "description": "Starbucks",
    "location": "Campus Center",
    "paymentMethod": "Dining Dollars",
    "date": "2025-11-15T10:30:00.000Z"
  }
}
```

**Error Responses:**
- `400` - Missing required fields or invalid amount
- `409` - Transaction with this transactionId already exists
- `500` - Server error

**Note:** User balance is automatically updated when a transaction is created (balance decreases by transaction amount).

---

### 2. Get Single Transaction
**GET** `/api/transactions/:id`

Get a single transaction by MongoDB `_id` or `transactionId`.

**Parameters:**
- `id` - MongoDB `_id` or `transactionId`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "transactionId": "T0201",
    "userId": "U001",
    "type": "purchase",
    "amount": 5.75,
    "category": "food",
    "description": "Starbucks",
    "location": "Campus Center",
    "paymentMethod": "Dining Dollars",
    "date": "2025-11-15T10:30:00.000Z"
  }
}
```

**Error Responses:**
- `404` - Transaction not found
- `500` - Server error

---

### 3. Update Transaction
**PUT** `/api/transactions/:id`

Update an existing transaction. All fields are optional - only provided fields will be updated.

**Parameters:**
- `id` - MongoDB `_id` or `transactionId`

**Request Body (all fields optional):**
```json
{
  "merchant": "Updated Merchant",
  "category": "Books",
  "amount": 25.99,
  "paymentMethod": "Credit Card",
  "location": "Bookstore",
  "date": "2025-11-16T14:00:00Z"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Transaction updated successfully",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "transactionId": "T0201",
    "userId": "U001",
    "type": "purchase",
    "amount": 25.99,
    "category": "books",
    "description": "Updated Merchant",
    "location": "Bookstore",
    "paymentMethod": "Credit Card",
    "date": "2025-11-16T14:00:00.000Z"
  }
}
```

**Error Responses:**
- `400` - Invalid amount (< 0)
- `404` - Transaction not found
- `500` - Server error

**Note:** If the `amount` is updated, the user balance is automatically adjusted (difference is added back to balance).

---

### 4. Delete Transaction
**DELETE** `/api/transactions/:id`

Delete a transaction.

**Parameters:**
- `id` - MongoDB `_id` or `transactionId`

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Transaction deleted successfully",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "transactionId": "T0201",
    "userId": "U001",
    "amount": 5.75
  }
}
```

**Error Responses:**
- `404` - Transaction not found
- `500` - Server error

**Note:** User balance is automatically updated when a transaction is deleted (amount is added back to balance).

---

## Example Usage

### Create Transaction
```bash
curl -X POST http://localhost:5000/api/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "transactionId": "T0201",
    "userId": "U001",
    "merchant": "Starbucks",
    "category": "Dining",
    "amount": 5.75,
    "paymentMethod": "Dining Dollars",
    "location": "Campus Center",
    "date": "2025-11-15T10:30:00Z"
  }'
```

### Get Transaction
```bash
# By MongoDB _id
curl http://localhost:5000/api/transactions/507f1f77bcf86cd799439011

# By transactionId
curl http://localhost:5000/api/transactions/T0201
```

### Update Transaction
```bash
curl -X PUT http://localhost:5000/api/transactions/T0201 \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 6.50,
    "merchant": "Updated Starbucks"
  }'
```

### Delete Transaction
```bash
curl -X DELETE http://localhost:5000/api/transactions/T0201
```

---

## Features

✅ **Full CRUD Operations**
- Create, Read, Update, Delete transactions

✅ **Flexible ID Lookup**
- Find by MongoDB `_id` or `transactionId`

✅ **Automatic User Balance Updates**
- Balance decreases when transaction is created
- Balance adjusts when transaction amount is updated
- Balance increases when transaction is deleted

✅ **Validation**
- Required field validation
- Amount validation (must be >= 0)
- Duplicate transactionId prevention

✅ **Error Handling**
- Proper HTTP status codes
- Descriptive error messages
- Graceful handling of user balance updates

---

## Complete Transaction API

All available transaction endpoints:

- `GET    /api/transactions` - Get all transactions (with filters)
- `GET    /api/transactions/:id` - Get single transaction
- `GET    /api/transactions/summary` - Get spending summary
- `GET    /api/transactions/categories` - Get category breakdown
- `GET    /api/transactions/trends` - Get spending trends
- `POST   /api/transactions` - Create new transaction
- `PUT    /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction

