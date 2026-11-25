# South Indian Traditional Dishes – Run Instructions

## Prerequisites
- Visual Studio Code
- Node.js and npm
- Python 3.10 or above
- PostgreSQL

## Step 1: Clone the Repository

Open VS Code terminal and execute:

```bash
git clone https://github.com/hemalochini07-dotcom/South-indian-Traditional-Dishes.git
cd South-indian-Traditional-Dishes
```

## Step 2: Backend Setup

```bash
cd backend
python -m venv venv
```

Activate the virtual environment.

**Windows:**
```bash
venv\Scripts\activate
```

Install the required packages:

```bash
pip install -r requirements.txt
```

Configure the PostgreSQL database connection in the backend `.env` file.

Start the backend server:

```bash
uvicorn main:app --reload
```

Backend URL: http://127.0.0.1:8000

API Documentation: http://127.0.0.1:8000/docs

## Step 3: Frontend Setup

Open a second terminal in VS Code.

```bash
cd frontend
npm install
npm run dev
```

Frontend URL: http://localhost:5173

## Step 4: Run the Application

1. Ensure PostgreSQL is running.
2. Start the backend server in the first terminal.
3. Start the frontend server in the second terminal.
4. Open http://localhost:5173 in your browser.

The South Indian Traditional Dishes application is now ready to use.

## Note
- Configure the required database details before starting the backend.
  
