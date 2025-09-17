'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Card,
  CardContent,
  TextField,
  Button,
  Box,
  Typography,
  Stack,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  LinearProgress,
  Fade,
  Collapse,
} from '@mui/material';
import {
  Send,
  Clear,
  ContentPaste,
  History,
  AutoAwesome,
  Speed,
  MonetizationOn,
} from '@mui/icons-material';
import { type PromptInputProps } from '@/types';
import { estimatePromptCost, formatCost, formatTokens } from '@/lib/pricing';
import { getModelConfig } from '@/lib/models';
import { getApproximateTokenCount } from '@/lib/tokenizer';

const PromptInput: React.FC<PromptInputProps> = ({
  value,
  onChange,
  onSubmit,
  isSubmitting,
  error,
}) => {
  const [charCount, setCharCount] = useState(0);
  const [tokenCount, setTokenCount] = useState(0);
  const [showEstimate, setShowEstimate] = useState(false);
  const textFieldRef = useRef<HTMLTextAreaElement>(null);

  // Character and token count tracking
  useEffect(() => {
    setCharCount(value.length);
    setTokenCount(getApproximateTokenCount(value));
    setShowEstimate(value.length > 50);
  }, [value]);

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(event.target.value);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (value.trim() && !isSubmitting) {
      onSubmit();
    }
  };

  const handleClear = () => {
    onChange('');
    textFieldRef.current?.focus();
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      onChange(value + text);
      textFieldRef.current?.focus();
    } catch (error) {
      console.error('Paste failed:', error);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      handleSubmit(event as any);
    }
  };

  const maxChars = 10000;
  const isNearLimit = charCount > maxChars * 0.8;
  const isOverLimit = charCount > maxChars;

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <Stack spacing={2}>
            {/* Header */}
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Typography variant="h6" component="h3">
                Prompt eingeben
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <Chip
                  label={`${charCount}/${maxChars} chars`}
                  size="small"
                  color={isOverLimit ? 'error' : isNearLimit ? 'warning' : 'default'}
                  variant="outlined"
                />
                <Chip
                  label={`${formatTokens(tokenCount)} tokens`}
                  size="small"
                  color="primary"
                  variant="outlined"
                  icon={<Speed />}
                />
                <Tooltip title="Zwischenablage einfügen">
                  <IconButton size="small" onClick={handlePaste}>
                    <ContentPaste />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Prompt löschen">
                  <IconButton 
                    size="small" 
                    onClick={handleClear}
                    disabled={!value.trim()}
                  >
                    <Clear />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Box>

            {/* Text Input */}
            <TextField
              inputRef={textFieldRef}
              multiline
              rows={6}
              fullWidth
              placeholder="Beschreibe deine Aufgabe oder stelle eine Frage..."
              value={value}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              disabled={isSubmitting}
              error={!!error || isOverLimit}
              helperText={
                error || 
                (isOverLimit && 'Text ist zu lang') ||
                'Tipp: Drücke Ctrl/Cmd + Enter zum Senden'
              }
              sx={{
                '& .MuiOutlinedInput-root': {
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    boxShadow: 1,
                  },
                  '&.Mui-focused': {
                    boxShadow: 2,
                  },
                },
              }}
            />

            {/* Loading Progress */}
            {isSubmitting && (
              <Fade in={isSubmitting}>
                <Box>
                  <LinearProgress />
                  <Typography 
                    variant="caption" 
                    color="text.secondary" 
                    sx={{ mt: 0.5, display: 'block', textAlign: 'center' }}
                  >
                    Anfrage wird verarbeitet...
                  </Typography>
                </Box>
              </Fade>
            )}

            {/* Error Alert */}
            <Collapse in={!!error}>
              <Alert severity="error" onClose={() => {/* Handle error clear if needed */}}>
                {error}
              </Alert>
            </Collapse>

            {/* Cost Estimate */}
            <Collapse in={showEstimate && !isSubmitting}>
              <CostEstimateDisplay prompt={value} />
            </Collapse>

            {/* Action Buttons */}
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Stack direction="row" spacing={1}>
                <Button
                  startIcon={<History />}
                  variant="outlined"
                  size="small"
                  onClick={() => {/* Handle history */}}
                >
                  Historie
                </Button>
                <Button
                  startIcon={<AutoAwesome />}
                  variant="outlined"
                  size="small"
                  onClick={() => {/* Handle suggestions */}}
                >
                  Vorschläge
                </Button>
              </Stack>

              <Button
                type="submit"
                variant="contained"
                endIcon={<Send />}
                disabled={!value.trim() || isSubmitting || isOverLimit}
                sx={{
                  minWidth: 120,
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-1px)',
                    boxShadow: 4,
                  },
                }}
              >
                {isSubmitting ? 'Sende...' : 'Senden'}
              </Button>
            </Box>
          </Stack>
        </form>
      </CardContent>
    </Card>
  );
};

// Cost Estimate Component
const CostEstimateDisplay: React.FC<{ prompt: string }> = ({ prompt }) => {
  // Estimate costs for common models
  const estimates = [
    { modelId: 'gpt-4o-mini', name: 'GPT-4o Mini' },
    { modelId: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku' },
    { modelId: 'gpt-4o', name: 'GPT-4o' },
    { modelId: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet' },
  ].map(({ modelId, name }) => {
    const config = getModelConfig(modelId);
    if (!config) return null;
    
    const estimate = estimatePromptCost(prompt, modelId);
    return {
      name,
      cost: estimate.totalCost,
      inputTokens: estimate.inputTokens,
      outputTokens: estimate.outputTokens,
      provider: config.provider,
    };
  }).filter((estimate): estimate is NonNullable<typeof estimate> => estimate !== null);

  if (estimates.length === 0) return null;

  return (
    <Card variant="outlined" sx={{ bgcolor: 'background.default' }}>
      <CardContent sx={{ py: 2 }}>
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <MonetizationOn color="primary" fontSize="small" />
          <Typography variant="subtitle2">
            Geschätzte Kosten (inkl. ~500 Token Antwort)
          </Typography>
        </Box>
        
        <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
          {estimates.map((estimate, index) => (
            <Tooltip
              key={index}
              title={`Input: ${formatTokens(estimate.inputTokens)} tokens, Output: ${formatTokens(estimate.outputTokens)} tokens`}
            >
              <Chip
                label={`${estimate.name}: ${formatCost(estimate.cost)}`}
                size="small"
                variant="outlined"
                color={estimate.provider === 'openai' ? 'success' : 'secondary'}
                icon={<Speed />}
              />
            </Tooltip>
          ))}
        </Stack>
        
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          * Schätzung basierend auf Prompt-Länge. Tatsächliche Kosten können variieren.
        </Typography>
      </CardContent>
    </Card>
  );
};

// Enhanced Prompt Input with Templates
export const PromptInputWithTemplates: React.FC<PromptInputProps & {
  templates?: Array<{ name: string; prompt: string; category: string }>;
  onTemplateSelect?: (template: string) => void;
}> = ({ templates = [], onTemplateSelect, ...props }) => {
  const [showTemplates, setShowTemplates] = useState(false);

  const defaultTemplates = [
    {
      name: 'Code Review',
      prompt: 'Bitte überprüfe den folgenden Code und gib Feedback zu Verbesserungen:\n\n```\n// Dein Code hier\n```',
      category: 'Entwicklung'
    },
    {
      name: 'Text Zusammenfassung',
      prompt: 'Fasse den folgenden Text in 3-5 Sätzen zusammen:\n\n',
      category: 'Analyse'
    },
    {
      name: 'Kreatives Schreiben',
      prompt: 'Schreibe eine kurze Geschichte über...',
      category: 'Kreativität'
    },
    {
      name: 'Problemlösung',
      prompt: 'Ich habe folgendes Problem und brauche einen strukturierten Lösungsansatz:\n\nProblem: ',
      category: 'Beratung'
    },
  ];

  const allTemplates = [...defaultTemplates, ...templates];

  const handleTemplateSelect = (template: string) => {
    props.onChange(template);
    setShowTemplates(false);
    if (onTemplateSelect) {
      onTemplateSelect(template);
    }
  };

  return (
    <Box>
      <PromptInput {...props} />
      
      {/* Template Selector */}
      <Collapse in={showTemplates}>
        <Card variant="outlined" sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="subtitle2" gutterBottom>
              Prompt-Vorlagen
            </Typography>
            <Stack spacing={1}>
              {allTemplates.map((template, index) => (
                <Button
                  key={index}
                  variant="outlined"
                  size="small"
                  onClick={() => handleTemplateSelect(template.prompt)}
                  sx={{ justifyContent: 'flex-start', textAlign: 'left' }}
                >
                  <Box>
                    <Typography variant="body2" fontWeight={500}>
                      {template.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {template.category}
                    </Typography>
                  </Box>
                </Button>
              ))}
            </Stack>
          </CardContent>
        </Card>
      </Collapse>

      <Box display="flex" justifyContent="center">
        <Button
          variant="text"
          size="small"
          onClick={() => setShowTemplates(!showTemplates)}
          sx={{ mb: 2 }}
        >
          {showTemplates ? 'Vorlagen ausblenden' : 'Prompt-Vorlagen anzeigen'}
        </Button>
      </Box>
    </Box>
  );
};

export default PromptInput;
