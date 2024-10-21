# serverSupportFinanceAI
# FinanceAI API Documentation

## Base URL
All endpoints are relative to: `http://localhost:5000/api`

## Authentication
Most endpoints require authentication. Include the JWT token in the Authorization header:
`Authorization: Bearer <your_jwt_token>`

## Endpoints

### 1. User Authentication

#### Register a new user
- **POST** `/auth/register`
- **Body**:
  ```json
  {
    "username": "string",
    "email": "string",
    "password": "string"
  }
  ```
- **Response**: User object or error message

#### Login
- **POST** `/auth/login`
- **Body**:
  ```json
  {
    "email": "string",
    "password": "string"
  }
  ```
- **Response**: JWT token or error message

### 2. Transactions

#### Get Transactions
- **GET** `/finance/transactions`
- **Query Parameters**:
  - `startDate` (optional): ISO date string
  - `endDate` (optional): ISO date string
  - `category` (optional): string
  - `page` (optional): number (default: 1)
  - `limit` (optional): number (default: 10)
- **Response**: List of transactions, pagination info

#### Add Transaction
- **POST** `/finance/transactions`
- **Body**:
  ```json
  {
    "amount": number,
    "type": "income" | "expense",
    "category": "string",
    "description": "string",
    "date": "ISO date string" (optional)
  }
  ```
- **Response**: Created transaction object

#### Update Transaction
- **PUT** `/finance/transactions/:id`
- **Body**: Same as Add Transaction
- **Response**: Updated transaction object

#### Delete Transaction
- **DELETE** `/finance/transactions/:id`
- **Response**: Success message

### 3. Budgets

#### Get Budgets
- **GET** `/finance/budgets`
- **Response**: List of budgets

#### Create Budget
- **POST** `/finance/budgets`
- **Body**:
  ```json
  {
    "category": "string",
    "amount": number,
    "period": "weekly" | "monthly" | "yearly"
  }
  ```
- **Response**: Created budget object

#### Update Budget
- **PUT** `/finance/budgets/:id`
- **Body**: Same as Create Budget
- **Response**: Updated budget object

#### Delete Budget
- **DELETE** `/finance/budgets/:id`
- **Response**: Success message

### 4. Financial Analysis

#### Get Spending Summary
- **GET** `/finance/spending-summary`
- **Query Parameters**:
  - `startDate` (optional): ISO date string
  - `endDate` (optional): ISO date string
- **Response**: Summary of spending by category

#### Compare Budget to Actual
- **GET** `/finance/budget-comparison`
- **Query Parameters**:
  - `month`: number (1-12)
  - `year`: number
- **Response**: Comparison of budgeted vs actual spending

#### Generate Financial Report
- **GET** `/finance/financial-report`
- **Query Parameters**:
  - `startDate`: ISO date string
  - `endDate`: ISO date string
- **Response**: Comprehensive financial report

### 5. AI-Powered Insights

#### Get AI Financial Advice
- **GET** `/finance/ai-advice`
- **Response**: AI-generated financial advice and insights

#### Detect Fraud and Anomalies
- **GET** `/finance/detect-anomalies`
- **Query Parameters**:
  - `lookbackDays` (optional): number (default: 30)
- **Response**: List of detected anomalies and fraud risks

#### Get Credit Score
- **GET** `/finance/credit-score`
- **Response**: AI-generated credit score and assessment

#### Get Financial Goals
- **GET** `/finance/financial-goals`
- **Response**: AI-generated financial goals (short-term, medium-term, long-term)

#### Get Investment Recommendations
- **GET** `/finance/investment-recommendations`
- **Response**: AI-generated investment recommendations

### 6. Utility Endpoints

#### Generate Mock Data
- **POST** `/finance/generate-mock-data`
- **Response**: Confirmation of mock data generation

## Error Responses
All endpoints may return error responses in the following format:
```json
{
  "error": "Error message",
  "details": "Detailed error information (if available)"
}
```

Status codes:
- 200: Successful operation
- 201: Resource created successfully
- 400: Bad request (e.g., invalid input)
- 401: Unauthorized (authentication required)
- 404: Resource not found
- 500: Internal server error


#With the actual json body filled in:
# FinanceAI API Documentation with Example Data

## Base URL
All endpoints are relative to: `http://localhost:5000/api`

## Authentication
Most endpoints require authentication. Include the JWT token in the Authorization header:
`Authorization: Bearer <your_jwt_token>`

## Endpoints with Example Data

### 1. User Authentication

#### Register a new user
- **POST** `/auth/register`
- **Body**:
  ```json
  {
    "username": "johnsmith",
    "email": "john.smith@example.com",
    "password": "SecurePass123!"
  }
  ```

#### Login
- **POST** `/auth/login`
- **Body**:
  ```json
  {
    "email": "john.smith@example.com",
    "password": "SecurePass123!"
  }
  ```

### 2. Transactions

#### Add Transaction
- **POST** `/finance/transactions`
- **Body**:
  ```json
  {
    "amount": 75.50,
    "type": "expense",
    "category": "Groceries",
    "description": "Weekly grocery shopping",
    "date": "2024-03-15T10:30:00Z"
  }
  ```

#### Update Transaction
- **PUT** `/finance/transactions/:id`
- **Body**:
  ```json
  {
    "amount": 80.25,
    "type": "expense",
    "category": "Groceries",
    "description": "Weekly grocery shopping + household items",
    "date": "2024-03-15T10:30:00Z"
  }
  ```

### 3. Budgets

#### Create Budget
- **POST** `/finance/budgets`
- **Body**:
  ```json
  {
    "category": "Groceries",
    "amount": 400,
    "period": "monthly"
  }
  ```

#### Update Budget
- **PUT** `/finance/budgets/:id`
- **Body**:
  ```json
  {
    "category": "Groceries",
    "amount": 450,
    "period": "monthly"
  }
  ```

### 4. Financial Analysis

#### Compare Budget to Actual
- **GET** `/finance/budget-comparison`
- **Query Parameters**:
  ```
  month=3&year=2024
  ```

#### Generate Financial Report
- **GET** `/finance/financial-report`
- **Query Parameters**:
  ```
  startDate=2024-01-01T00:00:00Z&endDate=2024-03-31T23:59:59Z
  ```

### 5. AI-Powered Insights

#### Detect Fraud and Anomalies
- **GET** `/finance/detect-anomalies`
- **Query Parameters**:
  ```
  lookbackDays=30
  ```

### 6. Utility Endpoints

#### Generate Mock Data
- **POST** `/finance/generate-mock-data`
- No body required

## Testing Instructions

1. Start with registering a new user using the provided example data.
2. Log in with the registered user to obtain a JWT token.
3. For all subsequent requests, include the JWT token in the Authorization header.
4. Test each endpoint using the provided example data, adjusting as necessary for your specific use case.
5. For GET requests with query parameters, append the parameters to the URL as shown in the examples.
6. For POST and PUT requests, send the example JSON in the request body.

Remember to replace `:id` in update and delete endpoints with actual IDs from your database.

## Error Handling

If you encounter any errors, check the response body for detailed error messages. Common status codes include:

- 400: Bad Request (check your input data)
- 401: Unauthorized (make sure you're including a valid JWT token)
- 404: Not Found (the resource you're trying to access doesn't exist)
- 500: Internal Server Error (there's an issue on the server side)
