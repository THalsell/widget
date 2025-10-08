'use client';

import { useState } from 'react';
import DonationModal from './DonationModal';
import type { DonationCause } from '@/lib/types';

interface DonationButtonProps {
  siteId: string;
  organizationName?: string;
  causes?: DonationCause[];
  buttonText?: string;
  buttonClassName?: string;
  position?: 'bottom-right' | 'bottom-left' | 'inline';
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
}

export default function DonationButton({
  siteId,
  organizationName = 'Organization',
  causes,
  buttonText = 'Donate',
  buttonClassName,
  position = 'inline',
  onSuccess,
  onError,
}: DonationButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSuccess = (data: any) => {
    if (onSuccess) {
      onSuccess(data);
    }
  };

  const handleError = (error: string) => {
    if (onError) {
      onError(error);
    }
  };

  // Position-specific styles
  const getPositionStyles = () => {
    switch (position) {
      case 'bottom-right':
        return 'fixed bottom-6 right-6 z-40';
      case 'bottom-left':
        return 'fixed bottom-6 left-6 z-40';
      case 'inline':
      default:
        return '';
    }
  };

  // Default button styles
  const defaultButtonStyles = `
    px-6 py-3 rounded-lg font-medium text-white
    bg-blue-600 hover:bg-blue-700 active:bg-blue-800
    transition-all duration-200
    shadow-lg hover:shadow-xl
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
  `;

  return (
    <>
      <button
        onClick={handleOpenModal}
        className={buttonClassName || `${defaultButtonStyles} ${getPositionStyles()}`}
        aria-label="Open donation form"
      >
        {buttonText}
      </button>

      <DonationModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        siteId={siteId}
        organizationName={organizationName}
        causes={causes}
        onSuccess={handleSuccess}
        onError={handleError}
      />
    </>
  );
}
