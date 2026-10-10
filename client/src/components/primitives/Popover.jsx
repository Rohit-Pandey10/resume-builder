import React, { useState, useRef, useEffect } from 'react';
import { clsx } from 'clsx';

/**
 * Popover primitive — click-to-toggle floating panel.
 * Handles click-outside dismissal.
 *
 * Usage:
 *   <Popover
 *     trigger={<Button>Open</Button>}
 *     align="right"   // 'left' | 'right'
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
  onOpenChange,
  children,
  className,
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;

  const ref = useRef(null);

  const setOpen = React.useCallback((val) => {
    if (isControlled) {
      onOpenChange?.(val);
    } else {
      setInternalOpen(val);
    }
  }, [isControlled, onOpenChange]);

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
            ...(align === 'right' ? { right: 0 } : { left: 0 }),
            ...(width ? { width } : {}),
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
        'jr-menu-item',
        active && 'jr-menu-item-active',
        danger && 'jr-menu-item-danger',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

/**
 * Visual divider between menu item groups.
 */
export function MenuDivider() {
  return <div className="jr-menu-divider" />;
}
