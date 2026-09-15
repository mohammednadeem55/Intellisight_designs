import { useCallback, useEffect, useState } from "react";

// Mock data for the Order Creation step — the read-only Order Summary/Ship To/Documents cards, the
// shipping-instructions text shown in its modal, and the initial values for the editable Quote fields.
export type OrderCreationContact = { name: string; email: string; phone: string };
export type OrderCreationData = {
  shipTo: { company: string; address: string; cityState: string; country: string };
  orderSummary: { requestDate: string; salesOrderOwner: string; billTo: OrderCreationContact; shipTo: OrderCreationContact };
  shippingInstructions: string;
  documents: { name: string; size: string }[];
  // Oracle EBS booking is a separate, manual step from this page — these reflect its last-known state,
  // not something edited here.
  salesOrderNumber: string;
  oracleStatus: string;
  quoteFields: {
    poNumber: string;
    edeliveryEmail: string;
    billToAccount: string;
    billToAddress: string;
    shipToAccount: string;
    shipToAddress: string;
    endUseAccount: string;
    endUseAddress: string;
    quoteNumber: string;
    quoteVersion: string;
    shipToCity: string;
    accountName: string;
    contactName: string;
    email: string;
    phone: string;
  };
};

const MOCK_ORDER_CREATION: OrderCreationData = {
  shipTo: {
    company: "MACOM Technology Solutions Inc.",
    address: "100 Chelmsford Street",
    cityState: "Lowell, MA 01851",
    country: "United States",
  },
  orderSummary: {
    requestDate: "05 Aug 2026",
    salesOrderOwner: "Jagdish K.",
    billTo: { name: "Julie Magner", email: "julie.magner@keysight.com", phone: "+1 (978) 656-2500" },
    shipTo: { name: "野中 良美", email: "y-nonaka@keisokuki-land.co.jp", phone: "03-3255-9920" },
  },
  shippingInstructions: `Ship via FCA (Free Carrier) terms to the freight forwarder listed below. Freight forwarder must be notified at least 48 hours before the scheduled pickup date.

Freight Forwarder: Nippon Express Co., Ltd.
Contact: logistics@nipponexpress.co.jp
Pickup Window: 09:00–17:00 JST, Mon–Fri

Special handling: Fragile — calibration equipment. Do not stack. Keep upright at all times.`,
  documents: [{ name: "Order_Summary.pdf", size: "1.4 MB" }],
  salesOrderNumber: "SO-0048213",
  oracleStatus: "Pending Sync",
  quoteFields: {
    poNumber: "4100126306",
    edeliveryEmail: "",
    billToAccount: "Abbott Laboratories",
    billToAddress: "100 Abbott Park Road, Abbott Park, IL 60064, United States",
    shipToAccount: "MACOM Technology Solutions Inc.",
    shipToAddress: "100 Chelmsford Street, Lowell, MA 01851, United States",
    endUseAccount: "",
    endUseAddress: "",
    quoteNumber: "",
    quoteVersion: "1",
    shipToCity: "東京都昭島市",
    accountName: "Abbott Laboratories",
    contactName: "野中 良美",
    email: "y-nonaka@keisokuki-land.co.jp",
    phone: "03-3255-9920",
  },
};

// The one place that knows how to get an order's creation data for a given email. Swap the body below
// for the real call once the endpoint exists — every consumer goes through useOrderCreation(), so this
// is the only edit needed:
//
//   async function fetchOrderCreation(emailId: string, signal: AbortSignal): Promise<OrderCreationData> {
//     const res = await fetch(`/api/emails/${encodeURIComponent(emailId)}/order-creation`, { signal });
//     if (!res.ok) {
//       throw new Error(`Failed to load order creation data (${res.status} ${res.statusText})`);
//     }
//     const body: unknown = await res.json();
//     // TODO: validate `body`'s shape once the response contract is final.
//     return body as OrderCreationData;
//   }
async function fetchOrderCreation(_emailId: string, _signal: AbortSignal): Promise<OrderCreationData> {
  return MOCK_ORDER_CREATION;
}

// Loading/error/reload state around fetchOrderCreation. Re-fetches whenever `emailId` changes, and uses
// AbortController so a stale request is actually cancelled rather than just ignored.
export function useOrderCreation(emailId: string) {
  const [data, setData] = useState<OrderCreationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setData(null);
    setError(null);
    fetchOrderCreation(emailId, controller.signal)
      .then(rows => setData(rows))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return; // superseded by unmount/reload/emailId change
        setError(err instanceof Error ? err.message : "Failed to load order creation data");
      });
    return () => controller.abort();
  }, [emailId, reloadToken]);

  const reload = useCallback(() => setReloadToken(t => t + 1), []);

  return { data, loading: data === null && error === null, error, reload };
}
