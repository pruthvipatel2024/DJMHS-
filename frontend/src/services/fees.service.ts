import api from './api';

export interface FeeInstallmentParams {
  isDefaulters?: boolean;
  standardId?: string;
  divisionId?: string;
  studentId?: string;
}

export interface FeeInstallment {
  id: string;
  title: string;
  amount: number;
  paidAmount: number;
  dueDate: string;
  status: 'PENDING' | 'PARTIALLY_PAID' | 'PAID';
  isOverdue?: boolean;
  studentId: string;
  student?: {
    grNumber: string;
    firstName: string;
    lastName: string;
    division?: {
      name: string;
      standard?: {
        name: string;
      };
    };
    parents?: Array<{
      parent: {
        phone: string;
      };
    }>;
  };
  payments?: FeePayment[];
}

export interface FeePayment {
  id: string;
  receiptNo: string;
  amount: number;
  paymentMethod: string;
  transactionId?: string;
  paymentDate: string;
}

export const FeeService = {
  getInstallments: async (params?: FeeInstallmentParams): Promise<FeeInstallment[]> => {
    const res = await api.get('/fees/installments', { params });
    return res.data.data || [];
  },

  collectPayment: async (payload: {
    feeInstallmentId: string;
    studentId: string;
    amount: number;
    paymentMethod: string;
    transactionId?: string;
  }): Promise<FeePayment> => {
    const res = await api.post('/fees/payments', payload);
    return res.data.data;
  },

  createFeeStructure: async (payload: any): Promise<any> => {
    const res = await api.post('/fees/structures', payload);
    return res.data.data;
  },
};

export default FeeService;
