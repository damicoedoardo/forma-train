'use client';

import { useSyncExternalStore } from 'react';
import { cloudStatus, onCloudStatus, type CloudStatus } from '../client';

/** The cloud backup's status, for the screens. */
export function useCloudStatus(): CloudStatus {
  return useSyncExternalStore(onCloudStatus, cloudStatus, cloudStatus);
}
