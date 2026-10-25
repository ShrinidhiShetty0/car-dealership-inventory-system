# AutoStock — Car Dealership Inventory System

AutoStock is a full-stack car dealership inventory management application developed as part of the Incubyte TDD Kata. It provides vehicle inventory management, user authentication, search and filtering, purchasing, and administrator controls.

## Features

- **User authentication:** User registration and login using JWT.
- **Role-based access:** Regular users can browse and purchase vehicles. Administrators can add, update, delete, and restock vehicles.
- **Vehicle inventory:** Manage vehicle make, model, category, price in INR, and quantity in stock.
- **Search and filtering:** Search vehicles by make, model, category, and price range.
- **Purchase management:** Purchasing decreases stock, and purchases are prevented when stock is unavailable.
- **Restocking:** Administrators can increase the stock quantity of existing vehicles.

## Technology Stack

| Layer | Technology |
|---|---|
| Backend | Python, FastAPI |
| Database | SQLite, SQLAlchemy |
| Authentication | JWT, pwdlib |
| Frontend | React 18, Vite, Tailwind CSS |
| Testing | pytest, FastAPI TestClient |

## Project Structure

```text
car-dealership-complete/
├── backend/
│   ├── app.py
│   ├── create_admin.py
│   ├── database.py
│   ├── models.py
│   ├── requirements.txt
│   ├── test_app.py
│   └── test_vehicles.py
├── frontend/
│   ├── src/
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
├── screenshots/
├── .gitignore
├── PROMPTS.md
└── README.md
```

## Prerequisites

- Python 3.12
- Node.js 18 or later
- npm

## Installation and Setup

### 1. Backend Setup

Open a terminal at the project root.

Create and activate a virtual environment:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

Install the dependencies:

```powershell
python -m pip install -r requirements.txt
```

### Create an Administrator Account

Run the following command:

```powershell
python create_admin.py
```

Enter the requested username, email, and password when prompted. The password is not displayed while typing.

If the account already exists, use the existing administrator account instead.

### Start the Backend Server

```powershell
python -m uvicorn app:app --reload --host 127.0.0.1 --port 8000
```

The API server runs at:

http://127.0.0.1:8000

Interactive API documentation is available at:

http://127.0.0.1:8000/docs

Keep the backend terminal running.

### 2. Frontend Setup

Open a second terminal at the project root:

```powershell
cd frontend
npm install
npm run dev
```

Open the frontend in your browser:

http://localhost:5173

## Application Usage

1. Register a regular user or create an administrator account.
2. Log in using the appropriate credentials.
3. Administrators can add, update, delete, and restock vehicles.
4. Authenticated users can view, search, and filter vehicle inventory.
5. Users can purchase available vehicles.
6. Verify that stock decreases after a successful purchase and that purchasing is prevented when stock reaches zero.

## API Endpoints

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register a new user |
| POST | `/api/auth/login` | Public | Authenticate and obtain a JWT |
| GET | `/api/vehicles` | Authenticated | List vehicles |
| GET | `/api/vehicles/search` | Authenticated | Search and filter vehicles |
| POST | `/api/vehicles` | Admin | Add a vehicle |
| PUT | `/api/vehicles/{id}` | Admin | Update vehicle details |
| DELETE | `/api/vehicles/{id}` | Admin | Delete a vehicle |
| POST | `/api/vehicles/{id}/purchase` | Authenticated | Purchase a vehicle and decrease stock |
| POST | `/api/vehicles/{id}/restock` | Admin | Increase vehicle stock |

## Running the Tests

Activate the backend virtual environment and navigate to the `backend` directory:

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
python -m pytest -v
```

### Test Results

The recorded test run reported:

- **13 tests passed**
- **0 tests failed**
- Execution time: approximately 4.38 seconds
- One deprecation warning

Run the test suite again before submission and update this section if the results change.

## Screenshots

Screenshots of the running application should be stored in the `screenshots/` directory.

Include screenshots of the following features:

- Application homepage and inventory dashboard
- Administrator inventory management
- Vehicle search results
- Purchase and stock update
- FastAPI interactive API documentation

Add screenshots using Markdown image references. For example:

```markdown
![AutoStock homepage](screenshots/homepage.png)
```

Ensure that each referenced image exists in the repository.

## My AI Usage

### AI Tools Used

AI tools used during the development and review of this project included ChatGPT and Grok, where applicable.

### How AI Was Used

AI assistance was used for development and learning activities, including:

- Reviewing backend API functionality against the assignment requirements.
- Assisting with frontend implementation and React component design.
- Reviewing API integration and authentication flows.
- Explaining automated test results and helping troubleshoot environment setup.
- Assisting with README documentation and submission preparation.

The specific contributions of each AI tool should be described accurately based on the actual development history.

### Reflection

AI assistance helped accelerate implementation, troubleshooting, and documentation. Reviewing generated suggestions, running automated tests, and manually checking the application were important parts of the development process.

AI-generated suggestions were used as assistance rather than accepted without review. The project was tested iteratively to verify the main application workflows.

## Test-Driven Development and Version Control

The project includes automated backend tests using pytest and FastAPI TestClient.

The assignment expects a Red-Green-Refactor development process and descriptive Git commits. Commit history should accurately reflect the work performed. Do not claim that tests were written before implementation unless the history supports that claim.

For commits where AI tools were used, follow the assignment's AI co-authorship requirements and identify the relevant AI tool in the commit trailer.

## Submission Checklist

- [ ] Public Git repository link
- [ ] README with setup instructions
- [ ] Actual application screenshots
- [ ] Test report showing the final test results
- [ ] Root-level `PROMPTS.md` containing raw, unedited AI chat logs or public chat links
- [ ] Accurate AI usage disclosure
- [ ] Appropriate AI co-author trailers on relevant commits
- [ ] No committed passwords, secrets, or unnecessary virtual environment files

## License

This project was developed as part of a technical assessment and TDD Kata.
