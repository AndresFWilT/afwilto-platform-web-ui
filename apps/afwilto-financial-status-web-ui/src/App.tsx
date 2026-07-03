import { Routes, Route } from 'react-router-dom'
import { TransactionsProvider } from './context/TransactionsContext'
import { GoalsProvider } from './context/GoalsContext'
import { CreditsProvider } from './context/CreditsContext'
import AppLayout from './layouts/AppLayout'
import DashboardPage from './pages/dashboard/DashboardPage'
import IncomesPage from './pages/incomes/IncomesPage'
import ExpensesPage from './pages/expenses/ExpensesPage'
import GoalsPage from './pages/goals/GoalsPage'
import GoalDetailPage from './pages/goals/GoalDetailPage'
import CreditsPage from './pages/credits/CreditsPage'
import CreditDetailPage from './pages/credits/CreditDetailPage'
import DesignPage from './pages/design/DesignPage'
import './index.css'

export default function App() {
  return (
    <CreditsProvider>
      <GoalsProvider>
        <TransactionsProvider>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path=""            element={<DashboardPage />} />
              <Route path="incomes"     element={<IncomesPage />} />
              <Route path="expenses"    element={<ExpensesPage />} />
              <Route path="goals"       element={<GoalsPage />} />
              <Route path="goals/:id"   element={<GoalDetailPage />} />
              <Route path="credits"     element={<CreditsPage />} />
              <Route path="credits/:id" element={<CreditDetailPage />} />
              <Route path="design"      element={<DesignPage />} />
            </Route>
          </Routes>
        </TransactionsProvider>
      </GoalsProvider>
    </CreditsProvider>
  )
}
