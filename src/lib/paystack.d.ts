declare module "@paystack/inline-js" {
  interface PaystackPopTransaction {
    reference: string;
    trans: string;
    status: string;
    message: string;
  }

  interface PaystackPopupCallbacks {
    onSuccess?: (transaction: PaystackPopTransaction) => void;
    onCancel?: () => void;
    onLoad?: () => void;
    onOpen?: () => void;
    onElementsMount?: (elements: unknown) => void;
  }

  interface PaystackNewTransactionOptions {
    key: string;
    email: string;
    amount: number;
    currency?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    customerCode?: string;
    channels?: string[];
    metadata?: Record<string, unknown>;
    reference?: string;
    label?: string;
    plan?: string;
    subaccount?: string;
    split_code?: string;
    onClose?: () => void;
    onSuccess?: (transaction: PaystackPopTransaction) => void;
    onLoad?: () => void;
  }

  export default class PaystackPop {
    static isLoaded(): boolean;
    newTransaction(options: PaystackNewTransactionOptions): void;
    resumeTransaction(accessCode: string, callbacks?: PaystackPopupCallbacks): void;
    cancelTransaction(id: string | { id: string }): void;
    preloadTransaction(options: PaystackNewTransactionOptions): () => void;
    checkout(options: PaystackNewTransactionOptions): Promise<PaystackPopTransaction>;
    paymentRequest(options: {
      container: string;
      email?: string;
      amount?: number;
      currency?: string;
      key: string;
      styles?: Record<string, unknown>;
      onLoad?: () => void;
      onSuccess?: (transaction: PaystackPopTransaction) => void;
      onCancel?: () => void;
    }): Promise<unknown>;
    static CHANNELS: Record<string, string>;
    static CURRENCIES: Record<string, string>;
  }
}
