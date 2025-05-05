// src/hooks/useConfirmationModal.ts
import { useState } from 'react';

interface UseConfirmationModalResult {
  isConfirmationOpen: boolean;
  itemToDelete: string | null;
  itemName: string | null;
  openConfirmationModal: (id: string, name?: string) => void;
  closeConfirmationModal: () => void;
  confirmDelete: () => void;
}

export const useConfirmationModal = (onConfirm: (id: string) => Promise<void> | void): UseConfirmationModalResult => {
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [itemName, setItemName] = useState<string | null>(null);

  const openConfirmationModal = (id: string, name?: string) => {
    setItemToDelete(id);
    setItemName(name || null);
    setIsConfirmationOpen(true);
  };

  const closeConfirmationModal = () => {
    setIsConfirmationOpen(false);
    setTimeout(() => {
      setItemToDelete(null);
      setItemName(null);
    }, 300); // Małe opóźnienie, aby animacja zamknięcia mogła się zakończyć
  };

  const confirmDelete = async () => {
    if (itemToDelete) {
      try {
        await onConfirm(itemToDelete);
      } catch (error) {
        console.error('Błąd podczas usuwania:', error);
      } finally {
        closeConfirmationModal();
      }
    }
  };

  return {
    isConfirmationOpen,
    itemToDelete,
    itemName,
    openConfirmationModal,
    closeConfirmationModal,
    confirmDelete
  };
};

export default useConfirmationModal;