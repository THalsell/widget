'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import DonationModal from '@/components/widget/DonationModal';
import type { DonationCause } from '@/lib/types';

function WidgetContent() {
  const searchParams = useSearchParams();
  const [config, setConfig] = useState({
    siteId: searchParams.get('siteId') || 'demo-site',
    organizationName: searchParams.get('organizationName') || 'Demo Organization',
    mode: searchParams.get('mode') || 'modal',
    theme: searchParams.get('theme') || 'light',
  });
  // Modal mode: start closed, wait for WIDGET_OPEN. Inline mode: start open
  const [isOpen, setIsOpen] = useState(searchParams.get('mode') === 'inline');
  const [causes, setCauses] = useState<DonationCause[]>([]);

  // Listen for configuration messages from parent window
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Security: In production, verify event.origin
      if (event.data.type === 'WIDGET_CONFIG') {
        setConfig((prev) => ({ ...prev, ...event.data.config }));

        // Set causes if provided
        if (event.data.config.causes) {
          setCauses(event.data.config.causes);
        }
      } else if (event.data.type === 'WIDGET_OPEN') {
        setIsOpen(true);
      } else if (event.data.type === 'WIDGET_CLOSE') {
        setIsOpen(false);
      }
    };

    window.addEventListener('message', handleMessage);

    // Notify parent that widget is ready
    window.parent.postMessage(
      {
        type: 'WIDGET_READY',
        widgetId: searchParams.get('widgetId'),
      },
      '*'
    );

    return () => window.removeEventListener('message', handleMessage);
  }, [searchParams]);

  // Fetch causes from config endpoint if not provided
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch(
          `/api/config?siteId=${encodeURIComponent(config.siteId)}`
        );
        const data = await response.json();

        if (data.success && data.data) {
          setCauses(data.data.causes || []);
          if (data.data.organizationName) {
            setConfig((prev) => ({
              ...prev,
              organizationName: data.data.organizationName,
            }));
          }
        }
      } catch (error) {
        console.error('Error fetching widget config:', error);
      }
    };

    if (causes.length === 0) {
      fetchConfig();
    }
  }, [config.siteId, causes.length]);

  type DonationResult = {
    intentId: string;
    amount: number;
    cause?: DonationCause | null;
    frequency: string;
  };

  const handleSuccess = (data: DonationResult) => {
    // Notify parent window of successful donation
    window.parent.postMessage(
      {
        type: 'WIDGET_DONATION_SUCCESS',
        data: {
          intentId: data.intentId,
          amount: data.amount,
          cause: data.cause,
          frequency: data.frequency,
        },
      },
      '*'
    );

    // Keep modal open to show success message
    // Parent can choose to close via WIDGET_CLOSE message
  };

  const handleError = (error: string) => {
    // Notify parent window of error
    window.parent.postMessage(
      {
        type: 'WIDGET_DONATION_ERROR',
        error,
      },
      '*'
    );
  };

  const handleClose = () => {
    setIsOpen(false);

    // Notify parent window
    window.parent.postMessage(
      {
        type: 'WIDGET_MODAL_CLOSED',
      },
      '*'
    );
  };

  return (
    <div
      className={`widget-container ${config.mode === 'inline' ? 'inline-mode' : 'modal-mode'}`}
      data-theme={config.theme}
    >
      <DonationModal
        isOpen={isOpen}
        onClose={handleClose}
        siteId={config.siteId}
        organizationName={config.organizationName}
        causes={causes.length > 0 ? causes : undefined}
        onSuccess={handleSuccess}
        onError={handleError}
      />
    </div>
  );
}

export default function WidgetPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      }
    >
      <WidgetContent />
    </Suspense>
  );
}
