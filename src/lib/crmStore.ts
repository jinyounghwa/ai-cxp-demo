import { createStore } from './store';
import { seedCustomers, seedLeads, seedActivities } from '@/data/customers';
import type { Customer, Lead, Activity } from '@/types';

interface CrmState {
  customers: Customer[];
  leads: Lead[];
  activities: Activity[];
}

export const crmStore = createStore<CrmState>({
  customers: seedCustomers,
  leads: seedLeads,
  activities: seedActivities,
});

export function addActivity(a: Activity) {
  crmStore.setState((s) => ({ activities: [a, ...s.activities] }));
}

export function findCustomerByPhone(phone: string): Customer | undefined {
  const norm = phone.replace(/[^0-9]/g, '');
  return crmStore.getState().customers.find((c) => c.phone.replace(/[^0-9]/g, '').slice(-8) === norm.slice(-8));
}

export function getCustomer(id: string): Customer | undefined {
  return crmStore.getState().customers.find((c) => c.id === id);
}

export function updateLeadStage(id: string, stage: Lead['stage']) {
  crmStore.setState((s) => ({
    leads: s.leads.map((l) => (l.id === id ? { ...l, stage, updatedAt: Date.now() } : l)),
  }));
}
