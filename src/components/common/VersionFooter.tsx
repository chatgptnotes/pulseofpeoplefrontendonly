/**
 * Version Footer Component
 * Displays version number, last update date, and repository name
 * Auto-increments version with each git push
 * Version: 1.0
 * Date: 2025-11-13
 */

import React from 'react';
import { Box, Typography, Link } from '@mui/material';
import { GitHub as GitHubIcon } from '@mui/icons-material';

interface VersionFooterProps {
  fixed?: boolean; // Fix to bottom of page
  showGitHub?: boolean; // Show GitHub link
  compact?: boolean; // Compact mode
}

export default function VersionFooter({
  fixed = false,
  showGitHub = true,
  compact = false
}: VersionFooterProps) {
  // Version info - auto-incremented with git pushes
  const version = '1.0';
  const buildDate = new Date('2025-11-13').toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  const repoName = 'pulseofpeoplefrontendonly';
  const repoUrl = `https://github.com/chatgptnotes/${repoName}`;

  return (
    <Box
      component="footer"
      sx={{
        py: compact ? 1 : 2,
        px: 3,
        mt: 'auto',
        bgcolor: 'background.paper',
        borderTop: 1,
        borderColor: 'divider',
        ...(fixed && {
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
        }),
      }}
    >
      <Box
        sx={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: compact ? 'row' : { xs: 'column', md: 'row' },
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: compact ? 2 : 1,
        }}
      >
        {/* Version Info */}
        <Typography
          variant="caption"
          sx={{
            color: 'text.secondary',
            fontSize: compact ? '0.7rem' : '0.75rem',
            opacity: 0.7,
          }}
        >
          Version {version} • {buildDate} • {repoName}
        </Typography>

        {/* GitHub Link */}
        {showGitHub && (
          <Link
            href={repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              color: 'text.secondary',
              textDecoration: 'none',
              fontSize: compact ? '0.7rem' : '0.75rem',
              opacity: 0.7,
              transition: 'opacity 0.2s',
              '&:hover': {
                opacity: 1,
              },
            }}
          >
            <GitHubIcon sx={{ fontSize: compact ? 14 : 16 }} />
            <Typography variant="caption">View on GitHub</Typography>
          </Link>
        )}
      </Box>
    </Box>
  );
}

/**
 * Hook to get current version info
 * Useful for displaying version in other components
 */
export function useVersionInfo() {
  return {
    version: '1.0',
    buildDate: '2025-11-13',
    repoName: 'pulseofpeoplefrontendonly',
  };
}
