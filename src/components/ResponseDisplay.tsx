'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  Stack,
  Chip,
  IconButton,
  Tooltip,
  Avatar,
  Fade,
  LinearProgress,
  Collapse,
  Alert,
  Divider,
} from '@mui/material';
import {
  ContentCopy,
  Download,
  Fullscreen,
  Refresh,
  CheckCircle,
  ErrorOutline,
  Speed,
  Timer,
} from '@mui/icons-material';
import { type ResponseDisplayProps, type ChatResponse } from '@/types';
import { formatCost, formatTokens } from '@/lib/pricing';
import { getModelConfig } from '@/lib/models';
import { animations } from '@/lib/theme';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useTheme } from '@/components/providers/ThemeProvider';

const ResponseDisplay: React.FC<ResponseDisplayProps> = ({
  response,
  isStreaming,
  modelConfig,
  onCopy,
}) => {
  const [copySuccess, setCopySuccess] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const { mode } = useTheme();
  const contentRef = useRef<HTMLDivElement>(null);
  const [startTime] = useState(Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);

  // Timer for streaming
  useEffect(() => {
    if (!isStreaming) return;
    
    const interval = setInterval(() => {
      setElapsedTime(Date.now() - startTime);
    }, 100);

    return () => clearInterval(interval);
  }, [isStreaming, startTime]);

  // Auto-scroll during streaming
  useEffect(() => {
    if (isStreaming && contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [response?.content, isStreaming]);

  const handleCopy = async () => {
    if (!response?.content) return;
    
    try {
      await navigator.clipboard.writeText(response.content);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
      if (onCopy) onCopy();
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };

  const handleDownload = () => {
    if (!response?.content) return;
    
    const blob = new Blob([response.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${modelConfig.displayName}_response_${new Date().toISOString()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const milliseconds = ms % 1000;
    return `${seconds}.${Math.floor(milliseconds / 100)}s`;
  };

  const provider = modelConfig.provider;
  const isComplete = Boolean(response && !isStreaming);
  const hasError = Boolean(response?.error);

  return (
    <Card 
      sx={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        border: 2,
        borderColor: isStreaming 
          ? 'primary.main' 
          : hasError 
            ? 'error.main' 
            : isComplete 
              ? 'success.main' 
              : 'divider',
        transition: 'all 0.3s ease-in-out',
        ...animations.fadeIn,
      }}
    >
      {/* Header */}
      <CardHeader
        avatar={
          <Avatar 
            sx={{ 
              bgcolor: provider === 'openai' ? 'success.main' : 'secondary.main',
              width: 40,
              height: 40
            }}
          >
            {modelConfig.displayName.charAt(0)}
          </Avatar>
        }
        title={
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="h6" component="h3">
              {modelConfig.displayName}
            </Typography>
            <StatusChip 
              isStreaming={isStreaming} 
              hasError={hasError} 
              isComplete={isComplete} 
            />
          </Box>
        }
        subheader={
          <Stack direction="row" spacing={1} alignItems="center" mt={0.5}>
            <Typography variant="caption" color="text.secondary">
              {provider === 'openai' ? 'OpenAI' : 'Anthropic'}
            </Typography>
            {isStreaming && (
              <>
                <Chip 
                  icon={<Timer />}
                  label={formatDuration(elapsedTime)}
                  size="small"
                  variant="outlined"
                  color="primary"
                />
              </>
            )}
            {response && (
              <>
                <Chip 
                  label={`${formatTokens(response.tokens.total)} tokens`}
                  size="small"
                  variant="outlined"
                />
                <Chip 
                  label={formatCost(response.cost)}
                  size="small"
                  variant="outlined"
                  color="warning"
                />
              </>
            )}
          </Stack>
        }
        action={
          <Stack direction="row" spacing={0.5}>
            <Tooltip title={copySuccess ? 'Kopiert!' : 'Kopieren'}>
              <IconButton 
                onClick={handleCopy}
                disabled={!response?.content}
                color={copySuccess ? 'success' : 'default'}
              >
                <ContentCopy />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Als Text herunterladen">
              <IconButton 
                onClick={handleDownload}
                disabled={!response?.content}
              >
                <Download />
              </IconButton>
            </Tooltip>
            
            <Tooltip title={isExpanded ? 'Minimieren' : 'Vollbild'}>
              <IconButton 
                onClick={() => setIsExpanded(!isExpanded)}
                disabled={!response?.content}
              >
                <Fullscreen />
              </IconButton>
            </Tooltip>
          </Stack>
        }
        sx={{ pb: 1 }}
      />

      {/* Streaming Progress */}
      {isStreaming && (
        <Box sx={{ px: 2, pb: 1 }}>
          <LinearProgress 
            variant="indeterminate" 
            sx={{ 
              height: 2,
              borderRadius: 1,
              '& .MuiLinearProgress-bar': {
                animation: 'streaming 1.5s ease-in-out infinite',
              },
              '@keyframes streaming': {
                '0%': { transform: 'translateX(-100%)' },
                '50%': { transform: 'translateX(0%)' },
                '100%': { transform: 'translateX(100%)' }
              }
            }}
          />
        </Box>
      )}

      {/* Content */}
      <CardContent 
        sx={{ 
          flexGrow: 1, 
          pt: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Error Display */}
        <Collapse in={!!hasError}>
          <Alert 
            severity="error" 
            icon={<ErrorOutline />}
            sx={{ mb: 2 }}
          >
            <Typography variant="body2">
              {response?.error || 'Ein unbekannter Fehler ist aufgetreten'}
            </Typography>
          </Alert>
        </Collapse>

        {/* Response Content */}
        <Box 
          ref={contentRef}
          sx={{ 
            flexGrow: 1,
            overflow: 'auto',
            minHeight: 200,
            maxHeight: isExpanded ? '70vh' : 400,
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
            p: 2,
            bgcolor: 'background.default',
            transition: 'max-height 0.3s ease-in-out',
          }}
        >
          {!response?.content && !isStreaming && (
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ 
                textAlign: 'center',
                py: 4,
                fontStyle: 'italic'
              }}
            >
              Warte auf Antwort...
            </Typography>
          )}

          {(response?.content || isStreaming) && (
            <MarkdownRenderer 
              content={response?.content || ''} 
              isStreaming={isStreaming}
              theme={mode}
            />
          )}
        </Box>

        {/* Response Stats */}
        {response && !hasError && (
          <ResponseStats response={response} modelConfig={modelConfig} />
        )}
      </CardContent>
    </Card>
  );
};

// Status Chip Component
const StatusChip: React.FC<{
  isStreaming: boolean;
  hasError: boolean;
  isComplete: boolean;
}> = ({ isStreaming, hasError, isComplete }) => {
  if (hasError) {
    return (
      <Chip 
        icon={<ErrorOutline />}
        label="Fehler"
        size="small"
        color="error"
        variant="filled"
      />
    );
  }

  if (isStreaming) {
    return (
      <Chip 
        icon={<Speed />}
        label="Streaming..."
        size="small"
        color="primary"
        variant="filled"
        sx={{ 
          '& .MuiChip-icon': {
            animation: 'spin 1s linear infinite',
          },
          '@keyframes spin': {
            '0%': { transform: 'rotate(0deg)' },
            '100%': { transform: 'rotate(360deg)' }
          }
        }}
      />
    );
  }

  if (isComplete) {
    return (
      <Chip 
        icon={<CheckCircle />}
        label="Fertig"
        size="small"
        color="success"
        variant="filled"
      />
    );
  }

  return (
    <Chip 
      label="Bereit"
      size="small"
      variant="outlined"
    />
  );
};

// Markdown Renderer Component
const MarkdownRenderer: React.FC<{
  content: string;
  isStreaming: boolean;
  theme: 'light' | 'dark';
}> = ({ content, isStreaming, theme }) => {
  return (
    <Box sx={{ '& > *': { mb: 1 } }}>
      <ReactMarkdown
        components={{
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';
            
            if (!inline && language) {
              return (
                <SyntaxHighlighter
                  style={theme === 'dark' ? oneDark : oneLight}
                  language={language}
                  PreTag="div"
                  {...props}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              );
            }
            
            return (
              <Box
                component="code"
                sx={{
                  bgcolor: 'action.hover',
                  px: 0.5,
                  py: 0.25,
                  borderRadius: 0.5,
                  fontSize: '0.875em',
                  fontFamily: 'monospace',
                }}
                {...props}
              >
                {children}
              </Box>
            );
          },
          blockquote({ children }) {
            return (
              <Box
                sx={{
                  borderLeft: 4,
                  borderColor: 'primary.main',
                  pl: 2,
                  py: 1,
                  bgcolor: 'action.hover',
                  borderRadius: '0 4px 4px 0',
                  fontStyle: 'italic',
                }}
              >
                {children}
              </Box>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
      
      {/* Streaming Cursor */}
      {isStreaming && (
        <Box
          component="span"
          sx={{
            display: 'inline-block',
            width: 2,
            height: '1em',
            bgcolor: 'primary.main',
            ml: 0.5,
            ...animations.typing,
          }}
        />
      )}
    </Box>
  );
};

// Response Stats Component
const ResponseStats: React.FC<{
  response: ChatResponse;
  modelConfig: any;
}> = ({ response, modelConfig }) => {
  return (
    <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
      <Stack direction="row" spacing={2} flexWrap="wrap">
        <Box>
          <Typography variant="caption" color="text.secondary">
            Input Tokens
          </Typography>
          <Typography variant="body2" fontWeight={500}>
            {formatTokens(response.tokens.input)}
          </Typography>
        </Box>
        
        <Box>
          <Typography variant="caption" color="text.secondary">
            Output Tokens
          </Typography>
          <Typography variant="body2" fontWeight={500}>
            {formatTokens(response.tokens.output)}
          </Typography>
        </Box>
        
        <Box>
          <Typography variant="caption" color="text.secondary">
            Gesamtkosten
          </Typography>
          <Typography variant="body2" fontWeight={500} color="warning.main">
            {formatCost(response.cost)}
          </Typography>
        </Box>
        
        <Box>
          <Typography variant="caption" color="text.secondary">
            Finish Reason
          </Typography>
          <Typography variant="body2" fontWeight={500}>
            {response.finishReason}
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
};

// Dual Response Display Component
export const DualResponseDisplay: React.FC<{
  response1: ChatResponse | null;
  response2: ChatResponse | null;
  isStreaming1: boolean;
  isStreaming2: boolean;
  model1Config: any;
  model2Config: any;
  onCopy1?: () => void;
  onCopy2?: () => void;
}> = ({
  response1,
  response2,
  isStreaming1,
  isStreaming2,
  model1Config,
  model2Config,
  onCopy1,
  onCopy2,
}) => {
  const totalCost = (response1?.cost || 0) + (response2?.cost || 0);
  const isAnyStreaming = isStreaming1 || isStreaming2;

  return (
    <Box>
      {/* Summary Header */}
      {(response1 || response2) && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">
                Vergleichsergebnisse
              </Typography>
              <Stack direction="row" spacing={2} alignItems="center">
                <Chip 
                  label={`Gesamtkosten: ${formatCost(totalCost)}`}
                  color="warning"
                  variant="outlined"
                />
                {isAnyStreaming && (
                  <Chip 
                    icon={<Speed />}
                    label="Verarbeitung läuft..."
                    color="primary"
                    variant="filled"
                  />
                )}
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Dual Display */}
      <Stack 
        direction={{ xs: 'column', lg: 'row' }} 
        spacing={3}
        sx={{ minHeight: 500 }}
      >
        <Box flex={1}>
          <ResponseDisplay
            response={response1}
            isStreaming={isStreaming1}
            modelConfig={model1Config}
            onCopy={onCopy1}
          />
        </Box>
        
        <Box flex={1}>
          <ResponseDisplay
            response={response2}
            isStreaming={isStreaming2}
            modelConfig={model2Config}
            onCopy={onCopy2}
          />
        </Box>
      </Stack>
    </Box>
  );
};

export default ResponseDisplay;
