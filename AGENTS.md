# FinanzasAngular - Project Documentation

## Overview

Personal finance management application built with Angular 19 and Supabase. Allows users to track income/expenses across multiple bank accounts, categorize transactions, import CSV bank statements, and visualize financial data through charts.

## Tech Stack

- **Framework**: Angular 19.2.0 (Standalone Components)
- **Backend**: Supabase (PostgreSQL + Auth)
- **Charts**: Chart.js 4.5.1
- **CSV Parsing**: PapaParse 5.5.3
- **Language**: TypeScript 5.7.2
- **Styling**: Custom CSS with CSS Variables

## Project Structure

```
src/
├── app/
│   ├── guards/
│   │   └── auth.guard.ts              # Route protection (functional guard)
│   ├── models/
│   │   ├── account.model.ts            # Account interface
│   │   ├── category.model.ts           # Category interface
│   │   └── movement.model.ts           # Movement interface
│   ├── services/
│   │   ├── auth.service.ts             # Supabase auth + client provider
│   │   ├── accounts.service.ts         # CRUD for accounts
│   │   ├── categories.service.ts       # CRUD for categories
│   │   └── movements.service.ts        # CRUD + bulk insert for movements
│   ├── components/
│   │   ├── login/                      # Login page
│   │   ├── register/                   # Registration page
│   │   └── dashboard/                  # Main app shell
│   │       ├── account-selector/       # Top nav with account dropdown
│   │       ├── account-manager/        # Sidebar account CRUD
│   │       ├── account-detail/         # Per-account drill-down view
│   │       ├── movement-form/          # Quick-add movement form
│   │       ├── movements-table/        # Movements data table
│   │       ├── movement-editor/        # Slide-in editor panel
│   │       ├── category-manager/       # Category pill manager
│   │       ├── sidebar-categoria/      # Sidebar category CRUD with inline edit
│   │       ├── filter-panel/           # Search/filter controls
│   │       ├── bar-chart/              # Bar chart (last 10 movements)
│   │       ├── pie-chart/              # Doughnut chart (expenses by category)
│   │       ├── csv-importer/           # CSV bank statement importer
│   │       └── monthly-summary/        # KPI cards with monthly stats
│   ├── app.component.ts                # Root component
│   ├── app.config.ts                   # App configuration
│   └── app.routes.ts                   # Route definitions
├── environments/
│   └── environment.ts                  # Supabase credentials
├── index.html                          # Entry HTML
├── main.ts                             # Bootstrap
└── styles.css                          # Global styles
```

## Database Schema (Supabase)

### `cuentas` (Accounts)
| Column     | Type     | Description                    |
|------------|----------|--------------------------------|
| id         | int8 PK  | Auto-increment ID              |
| nombre     | text     | Account name                   |
| tipo       | text     | Account type (Debito/Credito)  |
| color      | text     | UI color identifier            |
| user_id    | uuid FK  | Owner (auth.users)             |
| created_at | timestamptz | Creation timestamp          |

### `categorias` (Categories)
| Column     | Type     | Description                    |
|------------|----------|--------------------------------|
| id         | uuid PK  | UUID identifier                |
| nombre     | text     | Category name                  |
| tipo       | text     | Category type (ingreso/gasto)  |
| user_id    | uuid FK  | Owner (auth.users)             |
| created_at | timestamptz | Creation timestamp          |

### `movimientos` (Movements)
| Column       | Type     | Description                    |
|--------------|----------|--------------------------------|
| id           | uuid PK  | UUID identifier                |
| created_at   | timestamptz | Registration timestamp      |
| fecha        | date     | Effective date                 |
| concepto     | text     | Description                    |
| importe      | numeric  | Amount (positive=income, negative=expense) |
| Categoria_id | uuid FK  | Category reference             |
| user_id      | uuid FK  | Owner (auth.users)             |
| cuenta_id    | int8 FK  | Account reference              |

## Routing

| Path         | Component        | Guard      | Description           |
|--------------|------------------|------------|-----------------------|
| `/`          | redirect         | -          | Redirects to /login   |
| `/login`     | LoginComponent   | -          | Public login          |
| `/register`  | RegisterComponent| -          | Public registration   |
| `/dashboard` | DashboardComponent| authGuard | Protected main view   |
| `**`         | redirect         | -          | Wildcard to /login    |

## Services

### AuthService
- `signUp(email, pass)` - Register new user
- `signIn(email, pass)` - Login with credentials
- `getCurrentUser()` - Get authenticated user
- `getSupabaseClient()` - Raw Supabase client access

### MovementsService
- `getAll(cuentaId?)` - Fetch movements with joins
- `create(movement)` - Insert with auto user_id
- `update(id, payload)` - Update by ID
- `delete(id)` - Delete by ID
- `bulkInsert(movements)` - Batch import

### AccountsService
- `getAll()` - Fetch user accounts
- `create(nombre)` - Create new account
- `delete(id)` - Delete account

### CategoriesService
- `getAll()` - Fetch user categories
- `create(nombre)` - Create new category
- `update(id, nombre)` - Rename category
- `delete(id)` - Delete category

### ToastService
- `success(message)` - Green toast
- `error(message)` - Red toast
- `info(message)` - Blue toast
- `warning(message)` - Amber toast

### CategoryPredictionService
- `predictCategory(concepto, categories)` - Predict category from concept text
- `bulkPredict(movements, categories)` - Batch prediction for CSV imports

## Key Features

1. **Multi-account management** - Create/delete bank accounts
2. **Movement tracking** - Record income/expenses with categories
3. **CSV Import** - Import bank statements with auto-category prediction
4. **CSV Export** - Export filtered movements to CSV
5. **Charts** - Bar chart (trend) + Doughnut (expenses by category)
6. **Monthly Summary** - KPI cards showing income, expenses, balance, top category
7. **Filters** - Search by concept, category, type, max amount
8. **Inline editing** - Click category badge to change category
9. **Slide-in editor** - Edit/delete movements in side panel
10. **Responsive design** - Mobile-friendly layout

## Category Prediction

The CSV importer uses keyword-based prediction to auto-assign categories to imported movements. It analyzes the concept text and matches against known patterns:

- **Alimentacion**: supermercado, mercadona, lidl, carrefour, dia, alimentacion, comida, restaurante
- **Transporte**: gasolina, gasolinera, uber, taxi, metro, bus, renfe, parking, peaje
- **Ocio**: netflix, spotify, cine, teatro, concierto, amazon, steam
- **Servicios**: telefono, movistar, vodafone, orange, internet, luz, gas, agua, electricidad
- **Salud**: farmacia, hospital, medico, dentista, seguro medico
- **Ropa**: zara, h&m, nike, adidas, mango, pull&bear
- **Hogar**: ikea, leroy merlin, bricomart, ferreteria
- **Nomina**: nomina, salario, sueldo, transferencia

## Commands

```bash
npm start          # Start dev server (ng serve)
npm run build      # Production build
npm test           # Run unit tests
ng generate component <name>  # Generate new component
```

## Design System

- **Primary**: #0ea5e9 (Sky-500)
- **Success**: #10b981 (Emerald-500)
- **Danger**: #ef4444 (Red-500)
- **Warning**: #f59e0b (Amber-500)
- **Background**: #fafbfc
- **Surface**: #ffffff
- **Border**: #e2e8f0
- **Font**: DM Sans (body) + Space Grotesk (headings)
