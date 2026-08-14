interface PaystackPopSetup {
  key: string;
  email: string;
  amount: number;
  ref?: string;
  access_code?: string;
  currency?: string;
  plan?: string;
  metadata?: Record<string, unknown>;
  onClose?: () => void;
  callback?: (response: { reference: string; trans: string; status: string }) => void;
}

interface PaystackPop {
  setup: (config: PaystackPopSetup) => { openIframe: () => void };
}

interface Window {
  PaystackPop?: PaystackPop;
}
