import { createContext, useContext, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, GripVertical, Layers, Plus, Trash2, X, type LucideIcon } from "lucide-react";
import { EMAIL_TABLE_NAVY } from "./EmailTable";

// A reusable AND/OR condition-group builder — same shape as tools like react-query-builder (a group has a
// combinator plus a list of children, each either a rule or a nested group), but hand-built to match this
// app's own dropdown/pill/button chrome instead of pulling in a third-party library and re-skinning it.
// First used by Email Templates' "Exceptions" tab, kept generic (fields/operators are all caller-supplied)
// so any other admin-rule screen can drop in the same builder later.

export type ConditionOperator = "is" | "is not" | "is one of" | "is not one of" | "contains" | "is empty" | "is not empty";

export const CONDITION_OPERATORS: ConditionOperator[] = ["is", "is not", "is one of", "is not one of", "contains", "is empty", "is not empty"];

// Operators that hold zero/one/many values — drives which value input renders for a rule. "contains" is
// multi too (matches if the field contains ANY of the given values), same as "is one of" — a rule like
// "Language contains English, French" is an OR across substrings, not a single fixed string.
const MULTI_VALUE_OPERATORS: ConditionOperator[] = ["is one of", "is not one of", "contains"];
const NO_VALUE_OPERATORS: ConditionOperator[] = ["is empty", "is not empty"];

export type ConditionFieldOption = {
  key: string;
  label: string;
  /** Values offered in the value picker — omit for a free-text field (value renders as a plain input). */
  options?: string[];
};

export type ConditionRule = {
  id: string;
  kind: "rule";
  /** Empty string until the caller picks a field — lets a freshly-added rule render with nothing selected. */
  field: string;
  operator: ConditionOperator;
  values: string[];
};

export type ConditionGroup = {
  id: string;
  kind: "group";
  combinator: "AND" | "OR";
  children: ConditionNode[];
};

export type ConditionNode = ConditionRule | ConditionGroup;

// Tree-wide helpers for cross-group drag-and-drop — a plain per-group reorder (splice within one array)
// can't move a condition into a different group or pull one out, since each group only ever sees its own
// children. These instead operate on the whole root tree by node id, so a node can be found, detached from
// wherever it currently lives, and reinserted into any other group's children.
function findNodeById(group: ConditionGroup, id: string): ConditionNode | null {
  for (const child of group.children) {
    if (child.id === id) return child;
    if (child.kind === "group") {
      const found = findNodeById(child, id);
      if (found) return found;
    }
  }
  return null;
}

function containsNodeId(group: ConditionGroup, id: string): boolean {
  if (group.id === id) return true;
  return group.children.some((c) => c.kind === "group" && containsNodeId(c, id));
}

function removeNodeById(group: ConditionGroup, id: string): { tree: ConditionGroup; removed: ConditionNode | null } {
  let removed: ConditionNode | null = null;
  const children: ConditionNode[] = [];
  for (const child of group.children) {
    if (removed === null && child.id === id) {
      removed = child;
      continue;
    }
    if (child.kind === "group") {
      const result = removeNodeById(child, id);
      if (result.removed) removed = result.removed;
      children.push(result.tree);
    } else {
      children.push(child);
    }
  }
  return { tree: { ...group, children }, removed };
}

function insertNodeInto(group: ConditionGroup, targetGroupId: string, index: number, node: ConditionNode): ConditionGroup {
  if (group.id === targetGroupId) {
    const children = [...group.children];
    children.splice(Math.min(Math.max(index, 0), children.length), 0, node);
    return { ...group, children };
  }
  return {
    ...group,
    children: group.children.map((c) => (c.kind === "group" ? insertNodeInto(c, targetGroupId, index, node) : c)),
  };
}

let idSeed = 0;
function nextId(prefix: string): string {
  idSeed += 1;
  return `${prefix}-${Date.now()}-${idSeed}`;
}

// "is one of" is the default operator, not "is" — nearly every real exception rule (the Operating Unit
// examples, the SOA-by-email spreadsheet) matches against a set of values, so a fresh condition should
// already show the multi-value pill input rather than making the user switch the operator first to get it.
export function createConditionRule(field = ""): ConditionRule {
  return { id: nextId("rule"), kind: "rule", field, operator: "is one of", values: [] };
}

export function createConditionGroup(combinator: ConditionGroup["combinator"] = "AND"): ConditionGroup {
  return { id: nextId("group"), kind: "group", combinator, children: [] };
}

// True once every rule in the tree (recursively) has a field chosen and, where the operator needs one, a
// value — used to gate a parent form's submit button so an empty/half-filled rule can't be saved.
export function isConditionTreeComplete(node: ConditionNode): boolean {
  if (node.kind === "rule") {
    if (!node.field) return false;
    if (NO_VALUE_OPERATORS.includes(node.operator)) return true;
    return node.values.length > 0 && node.values.every((v) => v.trim() !== "");
  }
  return node.children.length > 0 && node.children.every(isConditionTreeComplete);
}

// Best-effort projection of a condition tree onto flat field -> values pairs, ignoring AND/OR structure —
// used to seed simple toolbar dropdowns/checkboxes from a saved filter that can't represent arbitrary
// boolean nesting. Multiple rules on the same field (e.g. one in each branch of an OR) union their values.
export function flattenConditionValues(node: ConditionNode, into: Record<string, string[]> = {}): Record<string, string[]> {
  if (node.kind === "rule") {
    if (node.field && node.values.length > 0) {
      into[node.field] = Array.from(new Set([...(into[node.field] ?? []), ...node.values]));
    }
    return into;
  }
  for (const child of node.children) flattenConditionValues(child, into);
  return into;
}

// Inverse of the above, for forking a saved filter from the current flat dropdown/checkbox state — always
// a single flat AND-of-"is one of" group, since that's all a fork out of flat fields can faithfully express
// (any richer AND/OR structure the original predefined filter had is intentionally not preserved).
export function buildFlatConditionGroup(fieldValues: Record<string, string[] | undefined>): ConditionGroup {
  const rules = Object.entries(fieldValues)
    .filter((entry): entry is [string, string[]] => (entry[1]?.length ?? 0) > 0)
    .map(([field, values]) => ({ ...createConditionRule(field), operator: "is one of" as ConditionOperator, values }));
  return { ...createConditionGroup("AND"), children: rules };
}

// Plain-English summary for a read-only context (a listing row, a confirmation dialog) — e.g.
// "Operating Unit is one of GBS-OU-2613, ILS-OU-1213 AND Bill To Country is IE".
export function summarizeConditionTree(node: ConditionNode, fields: ConditionFieldOption[]): string {
  if (node.kind === "rule") {
    const label = fields.find((f) => f.key === node.field)?.label ?? node.field ?? "Field";
    if (NO_VALUE_OPERATORS.includes(node.operator)) return `${label} ${node.operator}`;
    return `${label} ${node.operator} ${node.values.join(", ")}`;
  }
  if (node.children.length === 0) return "";
  const parts = node.children.map((c) => {
    const summary = summarizeConditionTree(c, fields);
    return c.kind === "group" && c.children.length > 1 ? `(${summary})` : summary;
  });
  return parts.filter(Boolean).join(` ${node.combinator} `);
}

// Small self-contained portal dropdown — same pattern used throughout the app (fixed-position panel
// measured off the trigger button, closes on outside click/scroll/resize) — kept local since this file has
// no other shared select component to reuse without creating a circular/awkward cross-file dependency.
function InlineSelect({
  value,
  options,
  onChange,
  placeholder = "Select…",
  width = 170,
}: {
  value: string;
  options: string[];
  onChange: (v: string) => void;
  placeholder?: string;
  width?: number;
}) {
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<{ top: number; left: number; width: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const toggleOpen = () => {
    if (!open) {
      const r = btnRef.current?.getBoundingClientRect();
      if (r) setRect({ top: r.bottom + 4, left: r.left, width: Math.max(r.width, width) });
    }
    setOpen((v) => !v);
  };

  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      const target = e.target;
      if (target instanceof Node && (panelRef.current?.contains(target) || btnRef.current?.contains(target))) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  return (
    <div className="relative">
      <button
        ref={btnRef}
        onClick={toggleOpen}
        className="flex items-center justify-between gap-1.5 h-[36px] px-3 rounded-[6px] border border-[#e5e7eb] bg-white hover:bg-[#F7F7F7] cursor-pointer text-left transition-colors"
        style={{ width }}
      >
        <span className={`text-[13px] truncate ${value ? "text-[#262626]" : "text-[#97999B]"}`}>{value || placeholder}</span>
        <ChevronDown size={13} className={`shrink-0 text-[#97999B] transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && rect && createPortal(
        <div
          ref={panelRef}
          className="fixed bg-white border border-[#E2E6E9] rounded-[8px] shadow-lg z-[9999] py-1 max-h-[240px] overflow-y-auto"
          style={{ top: rect.top, left: rect.left, width: rect.width }}
        >
          {options.length === 0 ? (
            <p className="px-3 py-2 text-[12px] text-[#97999B]">No options</p>
          ) : (
            options.map((opt) => (
              <button
                key={opt}
                onClick={() => { onChange(opt); setOpen(false); }}
                className={`w-full text-left px-3 py-1.5 text-[12.5px] cursor-pointer transition-colors ${
                  opt === value ? "font-semibold text-[#30578D] bg-[#EAF1FB]" : "text-[#4D4D4D] hover:bg-[#F7F7F7]"
                }`}
              >
                {opt}
              </button>
            ))
          )}
        </div>,
        document.body
      )}
    </div>
  );
}

// Free-typed pill input for "is one of" / "is not one of" — type + Enter/comma to add a value, Backspace on
// empty to pop the last one. Offers `suggestions` (the field's known options, if any) as a click-to-add list
// while still allowing anything typed, since exception values (e.g. an OU code) may not always be
// pre-enumerated.
function ValuePillInput({
  values,
  onChange,
  suggestions,
  placeholder = "Type a value, press Enter to add",
}: {
  values: string[];
  onChange: (v: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
}) {
  const [draft, setDraft] = useState("");
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<{ top: number; left: number; width: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const commit = (raw?: string) => {
    const trimmed = (raw ?? draft).trim().replace(/,+$/, "");
    if (trimmed && !values.includes(trimmed)) onChange([...values, trimmed]);
    setDraft("");
  };
  const removeAt = (i: number) => onChange(values.filter((_, idx) => idx !== i));

  const openSuggestions = () => {
    const r = ref.current?.getBoundingClientRect();
    if (r) setRect({ top: r.bottom + 4, left: r.left, width: r.width });
    setOpen(true);
  };

  // Portaled + fixed-position (not absolute) — a caller may embed this inside a scrollable container (a
  // modal, a panel), and an absolutely-positioned dropdown gets clipped by that container's overflow the
  // moment the field is anywhere near its bottom edge, which is exactly why suggestions were vanishing.
  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      const target = e.target;
      // panelRef, not just ref — the suggestion list is portaled to document.body, so it's never a DOM
      // descendant of the wrapper (ref) despite being nested there in the React tree. Checking only `ref`
      // meant every click on a suggestion registered as an "outside" click: this handler closed the panel
      // on mousedown, before the button's own onClick (which commits the value) ever got to fire — so no
      // suggestion could ever actually be selected.
      if (target instanceof Node && (ref.current?.contains(target) || panelRef.current?.contains(target))) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  const availableSuggestions = (suggestions ?? []).filter((s) => !values.includes(s) && s.toLowerCase().includes(draft.trim().toLowerCase()));

  return (
    <div className="relative flex-1 min-w-[220px]" ref={ref}>
      <div className="flex items-center gap-1.5 flex-wrap min-h-[36px] px-2.5 py-1.5 rounded-[6px] border border-[#e5e7eb] bg-white focus-within:border-[#30578D] transition-colors">
        {values.map((v, i) => (
          <span key={i} className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-[6px] bg-[#EAF1FB] text-[12px] font-medium text-[#30578D]">
            {v}
            <button onClick={() => removeAt(i)} className="text-[#30578D]/70 hover:text-[#30578D] cursor-pointer">
              <X size={10} />
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => { setDraft(e.target.value); openSuggestions(); }}
          onFocus={openSuggestions}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") { e.preventDefault(); commit(); }
            else if (e.key === "Backspace" && draft === "" && values.length > 0) removeAt(values.length - 1);
          }}
          placeholder={values.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[100px] h-[24px] text-[13px] text-[#262626] placeholder:text-[#97999B] outline-none bg-transparent"
        />
      </div>
      {open && rect && availableSuggestions.length > 0 && createPortal(
        <div
          ref={panelRef}
          className="fixed bg-white border border-[#E2E6E9] rounded-[8px] shadow-lg z-[9999] py-1 max-h-[180px] overflow-y-auto"
          style={{ top: rect.top, left: rect.left, width: rect.width }}
        >
          {availableSuggestions.map((s) => (
            <button
              key={s}
              onClick={() => commit(s)}
              className="w-full text-left px-3 py-1.5 text-[12.5px] text-[#4D4D4D] hover:bg-[#F7F7F7] cursor-pointer transition-colors"
            >
              {s}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}

// Icon-only by default (keeps every row compact), expands to reveal its label on hover — a `max-w-0` →
// `max-w-[...]` transition on the label span, the standard CSS-only way to do this without measuring text.
// Lets "Add Condition"/"Add Group" live right next to each row's delete button (insert a sibling right
// after this one) without three permanently-labeled buttons competing for space on every row.
function HoverExpandButton({ icon: Icon, label, onClick }: { icon: LucideIcon; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title={label}
      className="group/hb flex items-center h-[36px] px-2.5 rounded-[6px] text-[#97999B] hover:text-[#30578D] hover:bg-[#EAF1FB]/50 cursor-pointer transition-colors shrink-0"
    >
      <Icon size={14} className="shrink-0" />
      <span className="max-w-0 group-hover/hb:max-w-[150px] group-hover/hb:pl-1.5 overflow-hidden whitespace-nowrap text-[12px] font-semibold transition-all duration-200">
        {label}
      </span>
    </button>
  );
}

function ConditionRuleRow({
  rule,
  fields,
  onChange,
  onRemove,
  onAddConditionAfter,
  onAddGroupAfter,
}: {
  rule: ConditionRule;
  fields: ConditionFieldOption[];
  onChange: (next: ConditionRule) => void;
  onRemove: () => void;
  onAddConditionAfter: () => void;
  onAddGroupAfter: () => void;
}) {
  const fieldDef = fields.find((f) => f.key === rule.field);
  const needsValue = !NO_VALUE_OPERATORS.includes(rule.operator);
  const isMulti = MULTI_VALUE_OPERATORS.includes(rule.operator);

  // Each condition gets its own row card (not just bare floating controls) — a soft background + padding
  // so one condition reads as one distinct, scannable unit rather than a loose cluster of dropdowns.
  return (
    <div className="flex items-center gap-2.5 flex-wrap bg-white border border-[#E5E7EB] rounded-[8px] px-3 py-2.5">
      <InlineSelect
        value={fieldDef?.label ?? ""}
        options={fields.map((f) => f.label)}
        onChange={(label) => {
          const picked = fields.find((f) => f.label === label);
          onChange({ ...rule, field: picked?.key ?? "", values: [] });
        }}
        placeholder="Field"
        width={190}
      />
      <InlineSelect
        value={rule.operator}
        options={CONDITION_OPERATORS}
        onChange={(op) => onChange({ ...rule, operator: op as ConditionOperator, values: [] })}
        width={150}
      />
      {needsValue && (
        isMulti ? (
          <ValuePillInput values={rule.values} onChange={(values) => onChange({ ...rule, values })} suggestions={fieldDef?.options} />
        ) : fieldDef?.options ? (
          <InlineSelect value={rule.values[0] ?? ""} options={fieldDef.options} onChange={(v) => onChange({ ...rule, values: [v] })} placeholder="Value" width={220} />
        ) : (
          <input
            value={rule.values[0] ?? ""}
            onChange={(e) => onChange({ ...rule, values: [e.target.value] })}
            placeholder="Value"
            className="flex-1 min-w-[220px] h-[36px] px-3 rounded-[6px] border border-[#e5e7eb] bg-white text-[13px] text-[#262626] placeholder:text-[#97999B] outline-none focus:border-[#30578D] transition-colors"
          />
        )
      )}
      <div className="flex items-center gap-0.5 shrink-0 ml-auto">
        <HoverExpandButton icon={Plus} label="Add Condition" onClick={onAddConditionAfter} />
        <HoverExpandButton icon={Layers} label="Add Group" onClick={onAddGroupAfter} />
        <button
          onClick={onRemove}
          title="Remove condition"
          className="flex items-center justify-center size-[36px] shrink-0 rounded-[6px] text-[#97999B] hover:bg-[#FAEBEB] hover:text-[#BA1C1C] cursor-pointer transition-colors"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

// Nesting depth reads through background shading instead of a colored border — each level a little cooler
// / darker than its parent. Clamped (not repeated/cycled) past the last stop, since going back to a lighter
// tint at deep nesting would read as depth decreasing rather than increasing.
const GROUP_DEPTH_BACKGROUNDS = ["#EFF1F5", "#E6E9EF", "#DDE1E9"];

// Which node id is being dragged, plus the tree-wide move operation, live in one Context provided once at
// the root. Reorder used to be local state inside each ConditionGroupEditor instance (an index into that
// instance's own children array), which meant a condition could only ever be reordered among its own
// siblings — there was no way to drag it into a different group, or pull it back out of one. moveNode
// instead works on the full tree: detach the dragged node by id from wherever it currently lives, then
// splice it into the target group's children — so any row anywhere is a valid drop target for it.
const ConditionDragContext = createContext<{
  draggedId: string | null;
  setDraggedId: (id: string | null) => void;
  moveNode: (targetGroupId: string, index: number) => void;
} | null>(null);

function ConditionGroupEditor({
  group,
  fields,
  onChange,
  onRemove,
  isRoot = false,
  depth = 0,
}: {
  group: ConditionGroup;
  fields: ConditionFieldOption[];
  onChange: (next: ConditionGroup) => void;
  onRemove?: () => void;
  isRoot?: boolean;
  depth?: number;
}) {
  const dragCtx = useContext(ConditionDragContext)!;

  const updateChild = (id: string, next: ConditionNode) => {
    onChange({ ...group, children: group.children.map((c) => (c.id === id ? next : c)) });
  };
  const removeChild = (id: string) => {
    onChange({ ...group, children: group.children.filter((c) => c.id !== id) });
  };
  const addRule = () => onChange({ ...group, children: [...group.children, createConditionRule()] });
  const addGroup = () => onChange({ ...group, children: [...group.children, createConditionGroup(group.combinator === "AND" ? "OR" : "AND")] });
  const insertAfter = (idx: number, node: ConditionNode) => {
    const next = [...group.children];
    next.splice(idx + 1, 0, node);
    onChange({ ...group, children: next });
  };

  // Native-HTML5-drag pattern (no library), same as the column manager's "Sort Columns" tab, but the actual
  // move now goes through the shared ConditionDragContext instead of splicing this instance's own children
  // array — that's what lets a row be dropped into a different group, or dropped here after being dragged
  // out of a nested one. These two bits of state are purely local/visual (which row is currently hovered,
  // and whether the pointer is over this group's own body rather than any specific row inside it).
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [containerDragOver, setContainerDragOver] = useState(false);
  const endDrag = () => {
    dragCtx.setDraggedId(null);
    setDragOverId(null);
    setContainerDragOver(false);
  };

  const background = isRoot ? "#F7F8FA" : GROUP_DEPTH_BACKGROUNDS[Math.min(depth - 1, GROUP_DEPTH_BACKGROUNDS.length - 1)];

  // Root gets the lightest tone so the whole condition tree reads as one contained unit inside the page's
  // white card; each nested level steps to a slightly deeper shade, so depth is visible at a glance without
  // a colored border competing with the (also-navy) drag-and-drop indicators.
  return (
    <div
      className={`flex flex-col gap-3 border rounded-[8px] transition-colors ${isRoot ? "p-4" : "p-3"} ${
        containerDragOver && dragCtx.draggedId && dragCtx.draggedId !== group.id ? "border-[#30578D] border-dashed" : "border-[#E2E6E9]"
      }`}
      style={{ backgroundColor: background }}
      onDragOver={(e) => { e.preventDefault(); setContainerDragOver(true); }}
      onDragLeave={() => setContainerDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        dragCtx.moveNode(group.id, group.children.length);
        endDrag();
      }}
    >
      <div className="flex items-center gap-2.5">
        <span className="inline-flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wide text-[#97999B]">
          <Layers size={12} /> {isRoot ? "Main Group" : "Nested Group"}
        </span>
        <div className="inline-flex items-center gap-0.5 p-0.5 rounded-[6px] bg-[#F1F2F4] shrink-0">
          {(["AND", "OR"] as const).map((c) => (
            <button
              key={c}
              onClick={() => onChange({ ...group, combinator: c })}
              className={`px-3 py-1.5 rounded-[5px] text-[11.5px] font-bold uppercase tracking-wide cursor-pointer transition-colors ${
                group.combinator === c ? "text-white" : "text-[#97999B] hover:text-[#4D4D4D]"
              }`}
              style={group.combinator === c ? { backgroundColor: EMAIL_TABLE_NAVY } : undefined}
            >
              {c}
            </button>
          ))}
        </div>
        {/* This cluster always means "add inside this group" — same wiring whether the group is empty or
            already has children, and the same at root or nested. It used to switch to "insert a sibling
            after this whole group" once populated, but that silent meaning-change was exactly why adding a
            second condition into a nested group stopped working: the button people reached for no longer
            added inside at all. Each row still carries its own "insert after me" buttons for that case. */}
        <div className="flex items-center gap-0.5 shrink-0 ml-auto">
          <HoverExpandButton icon={Plus} label="Add Condition" onClick={addRule} />
          <HoverExpandButton icon={Layers} label="Add Group" onClick={addGroup} />
          {!isRoot && (
            <button
              onClick={onRemove}
              title="Remove group"
              className="flex items-center justify-center size-[32px] shrink-0 rounded-[6px] text-[#97999B] hover:bg-[#FAEBEB] hover:text-[#BA1C1C] cursor-pointer transition-colors"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      {group.children.length > 0 && (
        <div className="flex flex-col gap-3">
          {group.children.map((child, idx) => {
            const isDragging = dragCtx.draggedId === child.id;
            const showDropLine = dragOverId === child.id && dragCtx.draggedId !== null && dragCtx.draggedId !== child.id;
            return (
              <div
                key={child.id}
                className="relative"
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragOverId(child.id); }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  dragCtx.moveNode(group.id, idx);
                  endDrag();
                }}
              >
                {/* Insertion-point indicator — a thin blue line with a leading dot, floating above the row
                    rather than being the row's own border, so it reads as "drop here, between rows" instead
                    of blending into the row card's own edge. */}
                {showDropLine && (
                  <div className="absolute -top-[7px] left-8 right-0 h-[2px] rounded-full bg-[#30578D] z-10">
                    <span className="absolute top-1/2 -left-[5px] -translate-y-1/2 size-[7px] rounded-full bg-[#30578D]" />
                  </div>
                )}
                {/* draggable lives on just the grip, not the whole row — a draggable container can swallow
                    clicks on its own buttons (a stray pixel of mouse movement reads as drag-start instead of
                    a click), which is exactly what was breaking the per-row Add Condition/Add Group buttons.
                    stopPropagation on this row's own onDragOver/onDrop keeps the group-level "drop into me"
                    handler (below) from also firing when the drop actually landed on a specific row. */}
                <div className={`flex items-start gap-1.5 rounded-[8px] transition-opacity ${isDragging ? "opacity-40" : "opacity-100"}`}>
                  <span
                    draggable
                    onDragStart={(e) => { e.stopPropagation(); dragCtx.setDraggedId(child.id); }}
                    onDragEnd={endDrag}
                    className="flex items-center justify-center h-[36px] shrink-0 text-[#D9D9D6] hover:text-[#97999B] cursor-grab active:cursor-grabbing transition-colors"
                    title="Drag to reorder"
                  >
                    <GripVertical size={14} />
                  </span>
                  <div className="flex-1 min-w-0">
                    {child.kind === "rule" ? (
                      <ConditionRuleRow
                        rule={child}
                        fields={fields}
                        onChange={(next) => updateChild(child.id, next)}
                        onRemove={() => removeChild(child.id)}
                        onAddConditionAfter={() => insertAfter(idx, createConditionRule())}
                        onAddGroupAfter={() => insertAfter(idx, createConditionGroup(group.combinator === "AND" ? "OR" : "AND"))}
                      />
                    ) : (
                      <ConditionGroupEditor
                        group={child}
                        fields={fields}
                        onChange={(next) => updateChild(child.id, next)}
                        onRemove={() => removeChild(child.id)}
                        depth={depth + 1}
                      />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Root entry point — a group with no remove affordance (the tree always has exactly one root) and no
// left-border indent, so it reads as the page's own content rather than a nested block.
export function ConditionBuilder({
  value,
  onChange,
  fields,
}: {
  value: ConditionGroup;
  onChange: (next: ConditionGroup) => void;
  fields: ConditionFieldOption[];
}) {
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const moveNode = (targetGroupId: string, index: number) => {
    if (!draggedId) return;
    const draggedNode = findNodeById(value, draggedId);
    if (!draggedNode) return;
    // Refuse to drop a group into itself or into one of its own descendants — that would orphan the part of
    // the tree being dragged.
    if (draggedNode.kind === "group" && (draggedNode.id === targetGroupId || containsNodeId(draggedNode, targetGroupId))) return;
    const { tree: withoutNode, removed } = removeNodeById(value, draggedId);
    if (!removed) return;
    onChange(insertNodeInto(withoutNode, targetGroupId, index, removed));
  };

  return (
    <ConditionDragContext.Provider value={{ draggedId, setDraggedId, moveNode }}>
      <ConditionGroupEditor group={value} fields={fields} onChange={onChange} isRoot />
    </ConditionDragContext.Provider>
  );
}
