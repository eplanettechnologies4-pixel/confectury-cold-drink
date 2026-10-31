'use client';

import React from 'react';
import SalespersonDailyReportView from '@/components/reports/SalespersonDailyReportView';

export default function SalespersonReportPage() {
  return (
    <div className="space-y-6">
      <SalespersonDailyReportView isStandalone={true} />
    </div>
  );
}
