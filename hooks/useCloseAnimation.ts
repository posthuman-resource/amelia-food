import { useState, useCallback } from "react";

export function useCloseAnimation(
  onClose: () => void,
  duration: number = 200,
): { closing: boolean; handleClose: () => void } {
  const [closing, setClosing] = useState(false);

  const handleClose = useCallback(() => {
    setClosing(true);
    setTimeout(() => {
      setClosing(false);
      onClose();
    }, duration);
  }, [onClose, duration]);

  return { closing, handleClose };
}
