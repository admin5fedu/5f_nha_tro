import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import UsersList from './pages/users/UsersList';
import UserDetail from './pages/users/UserDetail';
import UserForm from './pages/users/UserForm';
import BranchesList from './pages/branches/BranchesList';
import BranchDetail from './pages/branches/BranchDetail';
import BranchForm from './pages/branches/BranchForm';
import RoomsList from './pages/rooms/RoomsList';
import RoomDetail from './pages/rooms/RoomDetail';
import RoomForm from './pages/rooms/RoomForm';
import TenantsList from './pages/tenants/TenantsList';
import TenantDetail from './pages/tenants/TenantDetail';
import TenantForm from './pages/tenants/TenantForm';
import ContractsList from './pages/contracts/ContractsList';
import ContractDetail from './pages/contracts/ContractDetail';
import ContractForm from './pages/contracts/ContractForm';
import AccountsList from './pages/accounts/AccountsList';
import AccountDetail from './pages/accounts/AccountDetail';
import AccountForm from './pages/accounts/AccountForm';
import AssetsList from './pages/assets/AssetsList';
import AssetDetail from './pages/assets/AssetDetail';
import AssetForm from './pages/assets/AssetForm';
import ImagesList from './pages/images/ImagesList';
import ImageDetail from './pages/images/ImageDetail';
import ImageForm from './pages/images/ImageForm';
import ServicesList from './pages/services/ServicesList';
import ServiceDetail from './pages/services/ServiceDetail';
import ServiceForm from './pages/services/ServiceForm';
import VehiclesList from './pages/vehicles/VehiclesList';
import VehicleDetail from './pages/vehicles/VehicleDetail';
import VehicleForm from './pages/vehicles/VehicleForm';
import InvoicesList from './pages/invoices/InvoicesList';
import InvoiceDetail from './pages/invoices/InvoiceDetail';
import InvoiceForm from './pages/invoices/InvoiceForm';
import FinancialCategoriesList from './pages/financial-categories/FinancialCategoriesList';
import FinancialCategoryDetail from './pages/financial-categories/FinancialCategoryDetail';
import FinancialCategoryForm from './pages/financial-categories/FinancialCategoryForm';
import TransactionsList from './pages/transactions/TransactionsList';
import TransactionDetail from './pages/transactions/TransactionDetail';
import TransactionForm from './pages/transactions/TransactionForm';
import ProfitLossReport from './pages/reports/ProfitLossReport';
import AccountsReceivableReport from './pages/reports/AccountsReceivableReport';
import RevenueAnalysisReport from './pages/reports/RevenueAnalysisReport';
import CashflowDetailReport from './pages/reports/CashflowDetailReport';
import SettingsDetail from './pages/settings/SettingsDetail';
import SettingsForm from './pages/settings/SettingsForm';
import RolesList from './pages/roles/RolesList';
import RoleDetail from './pages/roles/RoleDetail';
import RoleForm from './pages/roles/RoleForm';
import PermissionsManager from './pages/permissions/PermissionsManager';
import TasksList from './pages/tasks/TasksList';
import TaskDetail from './pages/tasks/TaskDetail';
import TaskForm from './pages/tasks/TaskForm';
import MeterReadingsList from './pages/meter-readings/MeterReadingsList';
import MeterReadingDetail from './pages/meter-readings/MeterReadingDetail';
import MeterReadingForm from './pages/meter-readings/MeterReadingForm';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { SettingsProvider } from './context/SettingsContext';
import { PermissionProvider } from './context/PermissionContext';
import SupabaseTodos from './pages/integrations/SupabaseTodos';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <PermissionProvider>
          <NotificationProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="users" element={<UsersList />} />
              <Route path="users/new" element={<UserForm />} />
              <Route path="users/:id" element={<UserDetail />} />
              <Route path="users/:id/edit" element={<UserForm />} />
              <Route path="branches" element={<BranchesList />} />
              <Route path="branches/new" element={<BranchForm />} />
              <Route path="branches/:id" element={<BranchDetail />} />
              <Route path="branches/:id/edit" element={<BranchForm />} />
              <Route path="rooms" element={<RoomsList />} />
              <Route path="rooms/new" element={<RoomForm />} />
              <Route path="rooms/:id" element={<RoomDetail />} />
              <Route path="rooms/:id/edit" element={<RoomForm />} />
              <Route path="tenants" element={<TenantsList />} />
              <Route path="tenants/new" element={<TenantForm />} />
              <Route path="tenants/:id" element={<TenantDetail />} />
              <Route path="tenants/:id/edit" element={<TenantForm />} />
              <Route path="contracts" element={<ContractsList />} />
              <Route path="contracts/new" element={<ContractForm />} />
              <Route path="contracts/:id" element={<ContractDetail />} />
              <Route path="contracts/:id/edit" element={<ContractForm />} />
              <Route path="accounts" element={<AccountsList />} />
              <Route path="accounts/new" element={<AccountForm />} />
              <Route path="accounts/:id" element={<AccountDetail />} />
              <Route path="accounts/:id/edit" element={<AccountForm />} />
              <Route path="assets" element={<AssetsList />} />
              <Route path="assets/new" element={<AssetForm />} />
              <Route path="assets/:id" element={<AssetDetail />} />
              <Route path="assets/:id/edit" element={<AssetForm />} />
              <Route path="images" element={<ImagesList />} />
              <Route path="images/new" element={<ImageForm />} />
              <Route path="images/:id" element={<ImageDetail />} />
              <Route path="images/:id/edit" element={<ImageForm />} />
              <Route path="services" element={<ServicesList />} />
              <Route path="services/new" element={<ServiceForm />} />
              <Route path="services/:id" element={<ServiceDetail />} />
              <Route path="services/:id/edit" element={<ServiceForm />} />
              <Route path="vehicles" element={<VehiclesList />} />
              <Route path="vehicles/new" element={<VehicleForm />} />
              <Route path="vehicles/:id" element={<VehicleDetail />} />
              <Route path="vehicles/:id/edit" element={<VehicleForm />} />
              <Route path="invoices" element={<InvoicesList />} />
              <Route path="invoices/new" element={<InvoiceForm />} />
              <Route path="invoices/:id" element={<InvoiceDetail />} />
              <Route path="invoices/:id/edit" element={<InvoiceForm />} />
              <Route path="financial-categories" element={<FinancialCategoriesList />} />
              <Route path="financial-categories/new" element={<FinancialCategoryForm />} />
              <Route path="financial-categories/:id" element={<FinancialCategoryDetail />} />
              <Route path="financial-categories/:id/edit" element={<FinancialCategoryForm />} />
              <Route path="transactions" element={<TransactionsList />} />
              <Route path="transactions/new" element={<TransactionForm />} />
              <Route path="transactions/:id" element={<TransactionDetail />} />
              <Route path="transactions/:id/edit" element={<TransactionForm />} />
              <Route path="reports/profit-loss" element={<ProfitLossReport />} />
              <Route path="reports/accounts-receivable" element={<AccountsReceivableReport />} />
              <Route path="reports/revenue" element={<RevenueAnalysisReport />} />
              <Route path="reports/cashflow" element={<CashflowDetailReport />} />
              <Route path="settings" element={<SettingsDetail />} />
              <Route path="settings/edit" element={<SettingsForm />} />
              <Route path="roles" element={<RolesList />} />
              <Route path="roles/new" element={<RoleForm />} />
              <Route path="roles/:id" element={<RoleDetail />} />
              <Route path="roles/:id/edit" element={<RoleForm />} />
              <Route path="permissions" element={<PermissionsManager />} />
              <Route path="roles/:roleId/permissions" element={<PermissionsManager />} />
              <Route path="tasks" element={<TasksList />} />
              <Route path="tasks/new" element={<TaskForm />} />
              <Route path="tasks/:id" element={<TaskDetail />} />
              <Route path="tasks/:id/edit" element={<TaskForm />} />
              <Route path="meter-readings" element={<MeterReadingsList />} />
              <Route path="meter-readings/new" element={<MeterReadingForm />} />
              <Route path="meter-readings/:id" element={<MeterReadingDetail />} />
              <Route path="meter-readings/:id/edit" element={<MeterReadingForm />} />
              <Route path="integrations/supabase/todos" element={<SupabaseTodos />} />
            </Route>
          </Routes>
        </Router>
          </NotificationProvider>
        </PermissionProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}

export default App;
