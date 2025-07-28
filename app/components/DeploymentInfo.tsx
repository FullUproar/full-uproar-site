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
  const [hasNewDeployment, setHasNewDeployment] = useState(false);
  const [initialSha, setInitialSha] = useState<string | null>(null);
  const [deploymentTimes, setDeploymentTimes] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isVisible) {
      const fetchDeploymentInfo = () => {
        fetch('/api/deployment-info')
          .then(res => res.json())
          .then(data => {
            if (initialSha === null) {
              setInitialSha(data.sha);
            } else if (data.sha !== initialSha && data.sha !== deploymentData?.sha) {
              setHasNewDeployment(true);
            }
            
            // Store deployment time for this SHA if we haven't seen it before
            if (!deploymentTimes[data.sha]) {
              setDeploymentTimes(prev => ({
                ...prev,
                [data.sha]: data.deployedAt
              }));
            }
            
            // Use stored deployment time for this SHA
            setDeploymentData({
              ...data,
              deployedAt: deploymentTimes[data.sha] || data.deployedAt
            });
          })
          .catch(console.error);
      };

      // Initial fetch
      fetchDeploymentInfo();

      // Refresh every 15 seconds
      const refreshInterval = setInterval(fetchDeploymentInfo, 15000);
      return () => clearInterval(refreshInterval);
    }
  }, [isVisible, initialSha, deploymentData?.sha, deploymentTimes]);

  useEffect(() => {
    if (deploymentData?.deployedAt) {
      const updateTimeAgo = () => {
        const deployTime = new Date(deploymentData.deployedAt);
        const now = new Date();
        const diffMs = now.getTime() - deployTime.getTime();
        
        const seconds = Math.floor(diffMs / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        let timeAgo;
        if (days > 0) {
          timeAgo = `${days}d ${hours % 24}h ago`;
        } else if (hours > 0) {
          timeAgo = `${hours}h ${minutes % 60}m ago`;
        } else if (minutes > 0) {
          timeAgo = `${minutes}m ${seconds % 60}s ago`;
        } else if (seconds > 0) {
          timeAgo = `${seconds}s ago`;
        } else {
          timeAgo = 'Just now';
        }

        setDeploymentData(prev => prev ? { ...prev, timeAgo } : null);
      };

      updateTimeAgo();
      const interval = setInterval(updateTimeAgo, 1000); // Update every second
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
          background: hasNewDeployment ? '#ef4444' : '#10b981',
          animation: hasNewDeployment ? 'pulse 1s infinite' : 'none'
        }} />
        <span style={{ color: '#f97316', fontWeight: 'bold' }}>
          {hasNewDeployment ? 'NEW DEPLOYMENT' : 'LIVE'}
        </span>
      </div>
      <div style={{ color: '#d1d5db' }}>
        <div>Branch: <span style={{ color: '#fbbf24' }}>{deploymentData.branch}</span></div>
        <div>Commit: <span style={{ color: '#60a5fa' }}>{deploymentData.sha}</span></div>
        <div>Deployed: <span style={{ color: '#34d399' }}>{deploymentData.timeAgo}</span></div>
        {hasNewDeployment && (
          <div style={{ 
            marginTop: '0.5rem', 
            padding: '0.25rem 0.5rem', 
            background: '#ef4444', 
            color: 'white', 
            borderRadius: '0.25rem',
            fontSize: '0.65rem',
            fontWeight: 'bold'
          }}>
            ⚠️ Refresh page to see updates
          </div>
        )}
      </div>
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}