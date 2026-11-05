import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AlertCircle, CheckCircle2, Loader2, Search } from "lucide-react";
import { EMAIL_TABLE_NAVY, InfoTile } from "../../components/common/EmailTable";
import { ReasonSelect } from "../../components/common/ReasonSelect";
import { REQUEST_TYPES, isBlockedLine, lookupOracleOrder, newCaseLine, todayStr, type CaseKind, type OracleOrder, type RequestType, type SsdSoeCase } from "./ssdSoeData";
import { addCases } from "./ssdSoeStore";
import { FieldLabel, Modal, primaryBtn, RED, secondaryBtn } from "./ssdSoeUi";

const CSR = { name: "Arman Singh", tag: "AS", email: "arman.singh@keysight.com" };

// CSR-initiated case: search the order in Oracle, pick the lines, say what the customer is asking for.
export function CreateCaseModal({ defaultKind, existingCaseNos, onClose, onCreated }: { defaultKind: CaseKind; existingCaseNos: string[]; onClose: () => void; onCreated: (caseNo: string) => void }) {
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [order, setOrder] = useState<OracleOrder | null>(null);
  const [kind, setKind] = useState<CaseKind>(defaultKind);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [requestType, setRequestType] = useState("");
  const [request, setRequest] = useState("");

  const search = () => {
    if (!query.trim() || searching) return;
    setSearching(true);
    setNotFound(false);
    setTimeout(() => {
      const found = lookupOracleOrder(query);
      setSearching(false);
      setOrder(found);
      setNotFound(!found);
      setPicked(new Set());
    }, 700);
  };
  const reset = () => { setOrder(null); setNotFound(false); setPicked(new Set()); setQ(""); };

  const [q, setQ] = useState("");
  const visible = useMemo(() => (order ? order.lines.filter((o) => !q.trim() || `${o.line} ${o.partNumber} ${o.factory} ${o.flowStatus}`.toLowerCase().includes(q.trim().toLowerCase())) : []), [order, q]);
  const selectable = visible.filter((o) => !isBlockedLine(o));
  const toggle = (id: string) => setPicked((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const valid = Boolean(order) && picked.size > 0 && Boolean(requestType) && Boolean(request.trim());

  const create = () => {
    if (!order || !valid) return;
    let n = 218100 + existingCaseNos.length;
    while (existingCaseNos.includes(String(n))) n++;
    const caseNo = String(n);
    const c: SsdSoeCase = {
      caseNo,
      kind,
      source: "Customer",
      status: "New",
      orderNo: order.orderNo,
      orderStatus: order.orderStatus,
      customerPo: order.customerPo,
      customer: order.customer,
      ou: order.ou,
      region: order.region,
      destination: order.destination,
      requester: CSR.email,
      csr: CSR.email,
      fieldEngineer: "",
      crddType: order.crddType,
      crddDate: order.crddDate,
      dateSubmitted: todayStr(),
      dateClosed: "",
      originalRequest: request.trim(),
      totalPriceUsd: order.totalPriceUsd,
      headerHold: "",
      linkedCase: "",
      ssdCaseNo: "",
      ssdCaseStatus: "",
      factory: order.lines.find((o) => picked.has(o.line))?.factory ?? "F03",
      lines: order.lines.filter((o) => picked.has(o.line)).map((o) => newCaseLine(o, requestType as RequestType, request.trim(), CSR.tag, CSR.name, CSR.email)),
    };
    addCases([c]);
    toast.success(`Case ${caseNo} created from order ${order.orderNo}`);
    onCreated(caseNo);
  };

  return (
    <Modal
      wide
      title="Create case"
      subtitle="Search the order in Oracle, then pick the lines the customer is asking about."
      onClose={onClose}
      footer={
        <>
          {order && !valid && <span className="mr-auto text-[12px]" style={{ color: RED }}>{picked.size === 0 ? "Select at least one line" : !requestType ? "Choose a request type" : "Describe the request"}</span>}
          <button onClick={onClose} className={secondaryBtn}>Cancel</button>
          <button disabled={!valid} onClick={create} className={primaryBtn(!valid)} style={{ backgroundColor: EMAIL_TABLE_NAVY }}>
            Create case{picked.size > 0 ? ` (${picked.size} line${picked.size === 1 ? "" : "s"})` : ""}
          </button>
        </>
      }
    >
      <FieldLabel required>Order number</FieldLabel>
      <div className="mt-1.5 flex items-center gap-2.5">
        <div className="relative flex-1 max-w-[340px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#97999B] pointer-events-none" />
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); if (order || notFound) reset(); }}
            onKeyDown={(e) => { if (e.key === "Enter") search(); }}
            placeholder="Oracle order number, e.g. 4668810"
            className="w-full h-[36px] pl-9 pr-3 rounded-[8px] border bg-white text-[12.5px] text-[#262626] placeholder:text-[#97999B] outline-none focus:border-[#30578D] transition-colors"
            style={{ borderColor: notFound ? RED : "#E2E6E9" }}
            autoFocus
          />
        </div>
        <button disabled={!query.trim() || searching} onClick={search} className={primaryBtn(!query.trim() || searching)} style={{ backgroundColor: EMAIL_TABLE_NAVY }}>
          {searching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />} Search Oracle
        </button>
      </div>
      {notFound && (
        <p className="flex items-center gap-1.5 text-[12px] mt-2" style={{ color: RED }}>
          <AlertCircle size={13} /> No order {query.trim()} was found in Oracle. Check the number (7 digits) and try again.
        </p>
      )}

      {order && (
        <div className="mt-5 flex flex-col gap-5">
          <div className="rounded-[8px] border border-[#E2E6E9]">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#E2E6E9] bg-[#F7F7F7] rounded-t-[8px]">
              <p className="flex items-center gap-2 text-[13px] font-bold text-[#262626]"><CheckCircle2 size={14} className="text-[#468657]" /> Order {order.orderNo} found in Oracle</p>
              <button onClick={() => { setQuery(""); reset(); }} className="text-[12px] font-semibold hover:underline cursor-pointer" style={{ color: EMAIL_TABLE_NAVY }}>Change order</button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-4 px-4 py-3.5">
              <InfoTile label="Customer" value={order.customer} />
              <InfoTile label="Customer PO" value={order.customerPo} />
              <InfoTile label="Order status" value={order.orderStatus} />
              <InfoTile label="Region" value={order.region} />
              <InfoTile label="Operating unit" value={order.ou} />
              <InfoTile label="Destination" value={order.destination} />
              <InfoTile label="CRDD type" value={order.crddType} />
              <InfoTile label="Total price (USD)" value={order.totalPriceUsd} />
            </div>
          </div>

          <div>
            <FieldLabel required>Case type</FieldLabel>
            <div className="mt-1.5 inline-flex items-center p-0.5 rounded-[8px] border border-[#E2E6E9] bg-[#F7F7F8]">
              {([["SSD", "SSD change"], ["SOE", "SOE (sales order exception)"]] as const).map(([k, label]) => (
                <button
                  key={k}
                  onClick={() => setKind(k)}
                  className="px-3 h-[30px] rounded-[6px] text-[12.5px] font-semibold cursor-pointer transition-colors"
                  style={kind === k ? { backgroundColor: "#fff", color: EMAIL_TABLE_NAVY, boxShadow: "0 1px 2px rgba(0,0,0,0.08)" } : { color: "#666666" }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <FieldLabel required>Lines</FieldLabel>
            <p className="flex items-center gap-1.5 text-[12px] mt-1.5 mb-2.5" style={{ color: RED }}><AlertCircle size={13} /> Line items with SRT under 2 weeks for F01 / F48 will not be available for selection.</p>
            <div className="relative mb-2.5 max-w-[320px]">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#97999B] pointer-events-none" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search line, part number, factory, status" className="w-full h-[34px] pl-8 pr-3 rounded-[8px] border border-[#E2E6E9] bg-white text-[12.5px] text-[#262626] placeholder:text-[#97999B] outline-none focus:border-[#30578D] transition-colors" />
            </div>
            <div className="overflow-auto max-h-[240px] rounded-[8px] border border-[#E2E6E9]">
              <table className="w-full min-w-[760px] border-separate border-spacing-0 text-[12.5px]">
                <thead>
                  <tr className="bg-[#F7F7F7]">
                    <th className="sticky top-0 z-10 bg-[#F7F7F7] px-3 h-[38px] w-[40px] border-b border-[#DEDEDE]">
                      <input type="checkbox" checked={selectable.length > 0 && selectable.every((o) => picked.has(o.line))} onChange={() => setPicked(selectable.every((o) => picked.has(o.line)) ? new Set() : new Set(selectable.map((o) => o.line)))} className="size-[15px] accent-[#30578D] cursor-pointer" aria-label="Select all lines" />
                    </th>
                    {["Line", "Part number", "Factory", "Booked date", "SSD", "Line flow status", "SRT"].map((h) => (
                      <th key={h} className="sticky top-0 z-10 bg-[#F7F7F7] px-3 h-[38px] text-left whitespace-nowrap border-b border-[#DEDEDE] text-[12px] font-semibold text-[#4D4D4D]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visible.length === 0 && (<tr><td colSpan={8} className="px-3 py-8 text-center text-[13px] text-[#97999B]">No lines match your search</td></tr>)}
                  {visible.map((o) => {
                    const blocked = isBlockedLine(o);
                    return (
                      <tr key={o.line} className={blocked ? "opacity-50" : picked.has(o.line) ? "bg-[#F5F9FE]" : "hover:bg-[#F7F9FC]"} title={blocked ? "SRT under 2 weeks for this factory" : undefined}>
                        <td className="px-3 py-2 text-center border-b border-[#DEDEDE]">
                          <input type="checkbox" disabled={blocked} checked={picked.has(o.line)} onChange={() => toggle(o.line)} className="size-[15px] accent-[#30578D] cursor-pointer disabled:cursor-not-allowed" aria-label={`Select line ${o.line}`} />
                        </td>
                        <td className="px-3 py-2 border-b border-[#DEDEDE]">{o.line}</td>
                        <td className="px-3 py-2 border-b border-[#DEDEDE]">{o.partNumber}</td>
                        <td className="px-3 py-2 border-b border-[#DEDEDE]">{o.factory}</td>
                        <td className="px-3 py-2 border-b border-[#DEDEDE]">{o.bookedDate}</td>
                        <td className="px-3 py-2 border-b border-[#DEDEDE]">{o.ssd}</td>
                        <td className="px-3 py-2 border-b border-[#DEDEDE]">{o.flowStatus}</td>
                        <td className="px-3 py-2 border-b border-[#DEDEDE]">{o.srt}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <FieldLabel required>Request type</FieldLabel>
              <ReasonSelect value={requestType} onChange={setRequestType} options={REQUEST_TYPES} invalid={!requestType} placeholder="Please select" />
            </div>
            <div className="md:col-span-2">
              <FieldLabel required>What is the customer asking for?</FieldLabel>
              <textarea value={request} onChange={(e) => setRequest(e.target.value)} rows={3} className="mt-1.5 w-full px-3 py-2 rounded-[8px] border bg-[#F7F7F8] text-[12.5px] text-[#262626] outline-none focus:border-[#30578D] focus:bg-white transition-colors resize-y" style={{ borderColor: request.trim() ? "#E2E6E9" : RED }} />
            </div>
          </div>

        </div>
      )}
    </Modal>
  );
}
