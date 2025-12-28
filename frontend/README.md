# KareoQ Frontend

React + TypeScript single-page app.

- Guest UI: song request form
- Admin UI: queue management (password gate)

## Screenshots

![Guest request form](../docs/RequestForm.png)

![Admin login](../docs/Login.png)

![Admin dashboard](../docs/AdminDashboard.png)

## Configuration

Create `frontend/.env`:

```env
REACT_APP_BACKEND_URL=http://localhost:8000
REACT_APP_ADMIN_PASSWORD=your_secure_password
```

## Routes

- Guest UI: http://localhost:3000/
- Admin UI: http://localhost:3000/#admin

## Scripts

- `npm start` - start the dev server
- `npm run build` - production build to `frontend/build/`
- `npm test` - CRA test runner

## Source layout

`src/` is intentionally small and component-driven:

- `App.tsx` chooses guest vs admin view
- `SongRequestForm.tsx` guest request form
- `AdminDashboard.tsx` admin queue UI
- `useToast.tsx` toast hook (paired with `ToastProvider.tsx`)
