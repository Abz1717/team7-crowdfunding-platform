export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  type: "deposit" | "withdraw";
  status: "pending" | "completed" | "failed";
  payment_method: "card" | "bank_account";
  created_at: string;
  updated_at: string;
}

export interface CreateTransactionData {
  amount: number;
  type: "deposit" | "withdraw";
  payment_method: "card" | "bank_account";
}

export interface DepositData {
  amount: number;
  cardNumber: string;
  cardExpiry: string;
  cardCvv: string;
  cardName: string;
}

export interface WithdrawData {
  amount: number;
  bankAccountNumber: string;
  bankSortCode: string;
  bankAccountName: string;
}
