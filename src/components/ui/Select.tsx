"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/cn";
import { useI18n } from "@/i18n/I18nProvider";

export type SelectOption = {
  value: string;
  label: string;
  /** Second line, smaller (e.g. delivery fee) */
  hint?: string;
  icon?: React.ReactNode;
};

type Props = {
  options: SelectOption[];
  /** Controlled value */
  value?: string;
  /** Uncontrolled initial value */
  defaultValue?: string;
  onChange?: (value: string) => void;
  /** Form field name: the value is submitted through a hidden input */
  name?: string;
  id?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  /** Search box in the menu; on by default for long lists */
  searchable?: boolean;
  /** Wrapper (width) */
  className?: string;
  /** The visible field, e.g. a height like "h-11" */
  triggerClassName?: string;
  "aria-label"?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
};

const MENU_MAX_HEIGHT = 320;

/** The app-wide dropdown: replaces the native <select>, works in plain forms too. */
export function Select({
  options,
  value: valueProp,
  defaultValue = "",
  onChange,
  name,
  id,
  placeholder,
  required,
  disabled,
  searchable,
  className,
  triggerClassName,
  ...aria
}: Props) {
  const { t, dir } = useI18n();
  const autoId = useId();
  const triggerId = id ?? `select-${autoId}`;
  const listId = `${triggerId}-list`;

  const [inner, setInner] = useState(defaultValue);
  const value = valueProp ?? inner;
  const selected = options.find((o) => o.value === value);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [pos, setPos] = useState<{ left: number; width: number; top?: number; bottom?: number } | null>(null);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const typeahead = useRef({ text: "", at: 0 });

  const withSearch = searchable ?? options.length > 8;
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
    return options.filter((o) => norm(`${o.label} ${o.hint ?? ""}`).includes(norm(q)));
  }, [options, query]);

  const place = useCallback(() => {
    const r = triggerRef.current?.getBoundingClientRect();
    if (!r) return;
    const below = window.innerHeight - r.bottom;
    const width = Math.max(r.width, 200);
    // Line the menu up with the field's start edge (right edge in Arabic)
    const left = Math.max(8, Math.min(dir === "rtl" ? r.right - width : r.left, window.innerWidth - width - 8));
    if (below < Math.min(MENU_MAX_HEIGHT, 240) && r.top > below) {
      setPos({ left, width, bottom: window.innerHeight - r.top + 6 });
    } else {
      setPos({ left, width, top: r.bottom + 6 });
    }
  }, [dir]);

  function openMenu() {
    if (disabled) return;
    setQuery("");
    setActive(Math.max(0, options.findIndex((o) => o.value === value)));
    place();
    setOpen(true);
  }

  const close = useCallback((refocus = true) => {
    setOpen(false);
    if (refocus) triggerRef.current?.focus();
  }, []);

  function choose(option: SelectOption) {
    if (valueProp === undefined) setInner(option.value);
    if (option.value !== value) onChange?.(option.value);
    close();
  }

  // Keep the menu attached to the trigger; close on outside click
  useLayoutEffect(() => {
    if (!open) return;
    place();
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!menuRef.current?.contains(t) && !triggerRef.current?.contains(t)) close(false);
    };
    const onMove = (e: Event) => {
      if (e.target instanceof Node && menuRef.current?.contains(e.target)) return;
      place();
    };
    document.addEventListener("pointerdown", onDown);
    window.addEventListener("resize", onMove);
    window.addEventListener("scroll", onMove, true);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      window.removeEventListener("resize", onMove);
      window.removeEventListener("scroll", onMove, true);
    };
  }, [open, place, close]);

  useEffect(() => {
    if (open && withSearch) searchRef.current?.focus();
  }, [open, withSearch]);

  useEffect(() => {
    if (!open) return;
    menuRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        openMenu();
      }
      return;
    }
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActive((i) => Math.min(filtered.length - 1, i + 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActive((i) => Math.max(0, i - 1));
        break;
      case "Home":
        e.preventDefault();
        setActive(0);
        break;
      case "End":
        e.preventDefault();
        setActive(filtered.length - 1);
        break;
      case "Enter":
        e.preventDefault();
        if (filtered[active]) choose(filtered[active]);
        break;
      case " ":
        if (withSearch) break;
        e.preventDefault();
        if (filtered[active]) choose(filtered[active]);
        break;
      case "Escape":
        e.preventDefault();
        close();
        break;
      case "Tab":
        close(false);
        break;
      default:
        // Type the first letters to jump (menus without a search box)
        if (!withSearch && e.key.length === 1) {
          const now = Date.now();
          const t = typeahead.current;
          t.text = now - t.at < 700 ? t.text + e.key.toLowerCase() : e.key.toLowerCase();
          t.at = now;
          const i = filtered.findIndex((o) => o.label.toLowerCase().startsWith(t.text));
          if (i >= 0) setActive(i);
        }
    }
  }

  const activeId = open && filtered[active] ? `${listId}-${active}` : undefined;

  return (
    <span className={cn("relative inline-flex w-full", className)}>
      <button
        ref={triggerRef}
        id={triggerId}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={withSearch ? undefined : activeId}
        aria-label={aria["aria-label"]}
        aria-invalid={aria["aria-invalid"]}
        aria-describedby={aria["aria-describedby"]}
        disabled={disabled}
        onClick={() => (open ? close() : openMenu())}
        onKeyDown={onKeyDown}
        className={cn(
          "input flex cursor-pointer items-center gap-2.5 text-start transition hover:border-ink disabled:cursor-not-allowed disabled:opacity-60",
          open && "border-ink ring-2 ring-ink/15",
          aria["aria-invalid"] && "border-danger",
          triggerClassName,
        )}
      >
        {selected?.icon && <span className="flex shrink-0 text-ink">{selected.icon}</span>}
        <span className={cn("min-w-0 flex-1 truncate", !selected && "text-muted/80")}>
          {selected ? selected.label : (placeholder ?? t.select.choose)}
        </span>
        <ChevronDown className={cn("size-4 shrink-0 text-muted transition-transform", open && "rotate-180")} aria-hidden="true" />
      </button>

      {name && <input type="hidden" name={name} value={value} />}
      {required && (
        // Lets the browser block submit and point at the field while nothing is chosen
        <input
          tabIndex={-1}
          aria-hidden="true"
          required
          value={value}
          onChange={() => {}}
          className="pointer-events-none absolute bottom-0 start-4 h-px w-px opacity-0"
        />
      )}

      {open &&
        pos &&
        createPortal(
          <div
            ref={menuRef}
            dir={dir}
            style={{ left: pos.left, width: pos.width, top: pos.top, bottom: pos.bottom, maxHeight: MENU_MAX_HEIGHT }}
            className="animate-menu fixed z-[60] flex flex-col overflow-hidden rounded-xl border border-line bg-white shadow-xl ring-1 ring-black/5"
          >
            {withSearch && (
              <div className="relative border-b border-line p-2">
                <Search className="pointer-events-none absolute start-4.5 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
                <input
                  ref={searchRef}
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setActive(0);
                  }}
                  onKeyDown={onKeyDown}
                  placeholder={t.select.search}
                  aria-label={t.select.searchLabel}
                  aria-controls={listId}
                  aria-activedescendant={activeId}
                  className="h-10 w-full rounded-lg bg-ground ps-9 pe-3 text-[15px] outline-none focus:ring-2 focus:ring-ink/15"
                />
              </div>
            )}
            <ul id={listId} role="listbox" aria-labelledby={triggerId} className="overflow-y-auto p-1.5">
              {filtered.length === 0 && <li className="px-3 py-2.5 text-sm text-muted">{t.select.noResults}</li>}
              {filtered.map((o, i) => {
                const isSelected = o.value === value;
                return (
                  <li
                    key={o.value}
                    id={`${listId}-${i}`}
                    data-index={i}
                    role="option"
                    aria-selected={isSelected}
                    onPointerMove={() => setActive(i)}
                    onClick={() => choose(o)}
                    className={cn(
                      "flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2.5",
                      i === active && "bg-ground",
                      isSelected && "font-semibold",
                    )}
                  >
                    {o.icon && <span className="flex shrink-0">{o.icon}</span>}
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate">{o.label}</span>
                      {o.hint && <span className="truncate text-sm font-normal text-muted">{o.hint}</span>}
                    </span>
                    {isSelected && <Check className="size-4 shrink-0" aria-hidden="true" />}
                  </li>
                );
              })}
            </ul>
          </div>,
          document.body,
        )}
    </span>
  );
}
