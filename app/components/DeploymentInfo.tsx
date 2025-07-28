'use client';

import { useState, useEffect } from 'react';

interface DeploymentInfoProps {
  isVisible: boolean;
}

export default function DeploymentInfo({ isVisible }: DeploymentInfoProps) {
  const [deploymentData, setDeploymentData] = useState<{
    sha: string;
    branch: string;
    deployedAt: string;
    timeAgo: string;
  } | null>(null);

  useEffect(() => {
    if (isVisible) {
      // Fetch deployment info from our API
      fetch('/api/deployment-info')
        .then(res => res.json())
        .then(data => setDeploymentData(data))
        .catch(console.error);
    }
  }, [isVisible]);

  useEffect(() => {
    if (deploymentData?.deployedAt) {
      const updateTimeAgo = () => {
        const deployTime = new Date(deploymentData.deployedAt);
        const now = new Date();
        const diffMs = now.getTime() - deployTime.getTime();
        
        const minutes = Math.floor(diffMs / (1000 * 60));
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        let timeAgo;
        if (days > 0) {
          timeAgo = `${days}d ${hours % 24}h ago`;
        } else if (hours > 0) {
          timeAgo = `${hours}h ${minutes % 60}m ago`;
        } else if (minutes > 0) {
          timeAgo = `${minutes}m ago`;
        } else {
          timeAgo = 'Just now';
        }

        setDeploymentData(prev => prev ? { ...prev, timeAgo } : null);
      };

      updateTimeAgo();
      const interval = setInterval(updateTimeAgo, 60000); // Update every minute
      return () => clearInterval(interval);
    }
  }, [deploymentData?.deployedAt]);

  if (!isVisible || !deploymentData) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '1rem',
      right: '1rem',
      background: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '0.75rem 1rem',
      borderRadius: '0.5rem',
      fontSize: '0.75rem',
      fontFamily: 'monospace',
      zIndex: 1000,
      border: '1px solid #f97316',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
        <div style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: '#10b981'
        }} />
        <span style={{ color: '#f97316', fontWeight: 'bold' }}>LIVE</span>
      </div>
      <div style={{ color: '#d1d5db' }}>
        <div>Branch: <span style={{ color: '#fbbf24' }}>{deploymentData.branch}</span></div>
        <div>Commit: <span style={{ color: '#60a5fa' }}>{deploymentData.sha}</span></div>
        <div>Deployed: <span style={{ color: '#34d399' }}>{deploymentData.timeAgo}</span></div>
      </div>
    </div>
  );
}