import React, { useState, useRef, useEffect } from 'react';
import { clsx } from 'clsx';

/**
 * Popover primitive — click-to-toggle floating panel.
 * Handles click-outside dismissal.
 *
 * Usage:
 *   <Popover
 *     trigger={<Button>Open</Button>}
 *     align="right"   // 'left' | 'right' | 'end' | 'start'
 *     width={240}
 *   >
 *     <MenuItem onClick={...}>Action 1</MenuItem>
 *   </Popover>
 */
export default function Popover({
  trigger,
  align = 'left',
  width,
  open: controlledOpen,
  isOpen: controlledIsOpen,
  onOpenChange,
  children,
  className,
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined || controlledIsOpen !== undefined;
  const effectiveControlled = controlledOpen !== undefined ? controlledOpen : controlledIsOpen;
  const isOpen = isControlled ? effectiveControlled : internalOpen;

  const ref = useRef(null);

  const setOpen = React.useCallback(
    (val) => {
      if (isControlled) {
        onOpenChange?.(val);
      } else {
        setInternalOpen(val);
      }
    },
    [isControlled, onOpenChange]
  );

  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen, setOpen]);

  const isAlignRight = align === 'right' || align === 'end';

  return (
    <div className="relative inline-block" ref={ref}>
      {/* Trigger */}
      <div onClick={() => setOpen(!isOpen)} style={{ cursor: 'pointer' }}>
        {trigger}
      </div>

      {/* Panel */}
      {isOpen && (
        <div
          className={clsx('jr-popover', className)}
          style={{
            top: 'calc(100% + 4px)',
            ...(isAlignRight ? { right: 0 } : { left: 0 }),
            ...(width ? { width } : {}),
            zIndex: 50,
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * Menu item inside a Popover.
 */
export function MenuItem({
  icon,
  active,
  danger,
  children,
  className,
  ...props
}) {
  return (
    <button
      type="button"
      className={clsx(
        'jr-menu-item flex items-center gap-2 w-full text-left text-xs px-2.5 py-1.5 rounded transition-colors',
        active && 'jr-menu-item-active',
        danger && 'jr-menu-item-danger',
        className
      )}
      style={{
        color: danger ? 'var(--color-danger)' : 'var(--color-text-1)',
      }}
      {...props}
    >
      {icon && <span className="flex-shrink-0" style={{ color: 'var(--color-text-3)' }}>{icon}</span>}
      <span className="flex-1 truncate">{children}</span>
    </button>
  );
}

/**
 * Visual divider between menu item groups.
 */
export function MenuDivider() {
  return <div className="jr-menu-divider" />;
}
