'use client';

import React from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Stack,
  Avatar,
  Tooltip,
  SelectChangeEvent,
} from '@mui/material';
import { 
  SmartToy, 
  Speed, 
  AttachMoney, 
  Psychology,
  OpenInNew 
} from '@mui/icons-material';
import { type ModelConfig, type ModelSelectorProps } from '@/types';
import { ALL_MODELS, MODEL_PROVIDERS } from '@/lib/models';
import { formatCost } from '@/lib/pricing';

const ModelSelector: React.FC<ModelSelectorProps> = ({
  value,
  onChange,
  label,
  availableModels = ALL_MODELS,
  disabled = false,
}) => {
  const handleChange = (event: SelectChangeEvent<string>) => {
    const selectedValue = event.target.value;
    onChange(selectedValue === '' ? null : selectedValue);
  };

  const selectedModel = value ? availableModels.find(m => m.id === value) : null;

  return (
    <Card 
      sx={{ 
        height: '100%',
        border: selectedModel ? 2 : 1,
        borderColor: selectedModel ? 'primary.main' : 'divider',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          borderColor: 'primary.light',
          transform: 'translateY(-2px)',
          boxShadow: 4,
        }
      }}
    >
      <CardContent>
        <Stack spacing={2}>
          {/* Header */}
          <Box display="flex" alignItems="center" gap={1}>
            <SmartToy color="primary" />
            <Typography variant="h6" component="h3">
              {label}
            </Typography>
          </Box>

          {/* Model Selection */}
          <FormControl fullWidth disabled={disabled}>
            <InputLabel id={`${label}-select-label`}>Model auswählen</InputLabel>
            <Select
              labelId={`${label}-select-label`}
              value={value || ''}
              onChange={handleChange}
              label="Model auswählen"
              sx={{ mb: 1 }}
            >
              <MenuItem value="">
                <em>Kein Model ausgewählt</em>
              </MenuItem>
              
              {MODEL_PROVIDERS.map(provider => (
                <Box key={provider.id}>
                  <MenuItem disabled sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                    {provider.name}
                  </MenuItem>
                  {provider.models
                    .filter(model => availableModels.some(am => am.id === model.id))
                    .map(model => (
                      <MenuItem 
                        key={model.id} 
                        value={model.id}
                        sx={{ pl: 4 }}
                      >
                        <Box display="flex" alignItems="center" gap={2} width="100%">
                          <Avatar 
                            sx={{ 
                              width: 24, 
                              height: 24, 
                              bgcolor: provider.id === 'openai' ? 'success.main' : 'secondary.main',
                              fontSize: 12
                            }}
                          >
                            {provider.name.charAt(0)}
                          </Avatar>
                          <Box flexGrow={1}>
                            <Typography variant="body2" fontWeight={500}>
                              {model.displayName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatCost(model.pricing.input)}/{formatCost(model.pricing.output)} per 1K tokens
                            </Typography>
                          </Box>
                        </Box>
                      </MenuItem>
                    ))}
                </Box>
              ))}
            </Select>
          </FormControl>

          {/* Selected Model Info */}
          {selectedModel && (
            <ModelInfoCard model={selectedModel} />
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

// Model Info Card Component
const ModelInfoCard: React.FC<{ model: ModelConfig }> = ({ model }) => {
  const provider = MODEL_PROVIDERS.find(p => p.id === model.provider);
  
  return (
    <Box 
      sx={{ 
        p: 2, 
        bgcolor: 'background.default', 
        borderRadius: 2,
        border: 1,
        borderColor: 'divider'
      }}
    >
      <Stack spacing={2}>
        {/* Model Header */}
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar 
              sx={{ 
                bgcolor: model.provider === 'openai' ? 'success.main' : 'secondary.main',
                width: 32,
                height: 32
              }}
            >
              {provider?.name.charAt(0)}
            </Avatar>
            <Box>
              <Typography variant="subtitle1" fontWeight={600}>
                {model.displayName}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {provider?.name}
              </Typography>
            </Box>
          </Box>
          
          <Chip 
            label={model.supportsStreaming ? 'Streaming' : 'Batch'}
            size="small"
            color={model.supportsStreaming ? 'success' : 'default'}
            variant="outlined"
          />
        </Box>

        {/* Model Stats */}
        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Tooltip title="Input Cost per 1K tokens">
            <Chip
              icon={<AttachMoney />}
              label={`Input: ${formatCost(model.pricing.input)}`}
              size="small"
              variant="outlined"
              color="info"
            />
          </Tooltip>
          
          <Tooltip title="Output Cost per 1K tokens">
            <Chip
              icon={<AttachMoney />}
              label={`Output: ${formatCost(model.pricing.output)}`}
              size="small"
              variant="outlined"
              color="warning"
            />
          </Tooltip>
          
          <Tooltip title="Maximum Context Window">
            <Chip
              icon={<Psychology />}
              label={`${(model.maxTokens / 1000).toFixed(0)}K tokens`}
              size="small"
              variant="outlined"
              color="primary"
            />
          </Tooltip>
        </Stack>

        {/* Performance Indicator */}
        <Box>
          <Typography variant="caption" color="text.secondary" gutterBottom>
            Preis-Leistungs-Verhältnis
          </Typography>
          <PerformanceIndicator model={model} />
        </Box>
      </Stack>
    </Box>
  );
};

// Performance Indicator Component
const PerformanceIndicator: React.FC<{ model: ModelConfig }> = ({ model }) => {
  // Simple scoring based on pricing (lower is better for cost)
  const getPerformanceScore = () => {
    const totalCost = model.pricing.input + model.pricing.output;
    
    if (totalCost < 0.002) return { score: 'Excellent', color: 'success' as const };
    if (totalCost < 0.01) return { score: 'Good', color: 'info' as const };
    if (totalCost < 0.05) return { score: 'Moderate', color: 'warning' as const };
    return { score: 'Premium', color: 'error' as const };
  };

  const { score, color } = getPerformanceScore();

  return (
    <Box display="flex" alignItems="center" gap={1}>
      <Speed fontSize="small" color={color} />
      <Typography variant="body2" color={`${color}.main`} fontWeight={500}>
        {score}
      </Typography>
    </Box>
  );
};

// Dual Model Selector Component
export const DualModelSelector: React.FC<{
  model1: string | null;
  model2: string | null;
  onModel1Change: (model: string | null) => void;
  onModel2Change: (model: string | null) => void;
  disabled?: boolean;
}> = ({ 
  model1, 
  model2, 
  onModel1Change, 
  onModel2Change, 
  disabled = false 
}) => {
  return (
    <Stack 
      direction={{ xs: 'column', md: 'row' }} 
      spacing={3}
      sx={{ mb: 4 }}
    >
      <Box flex={1}>
        <ModelSelector
          value={model1}
          onChange={onModel1Change}
          label="Model 1"
          availableModels={ALL_MODELS}
          disabled={disabled}
        />
      </Box>
      
      <Box 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          minWidth: 60
        }}
      >
        <Typography 
          variant="h4" 
          color="primary.main" 
          sx={{ 
            transform: { xs: 'rotate(90deg)', md: 'none' },
            fontSize: { xs: '2rem', md: '2.5rem' }
          }}
        >
          VS
        </Typography>
      </Box>
      
      <Box flex={1}>
        <ModelSelector
          value={model2}
          onChange={onModel2Change}
          label="Model 2"
          availableModels={ALL_MODELS}
          disabled={disabled}
        />
      </Box>
    </Stack>
  );
};

// Model Comparison Component
export const ModelComparison: React.FC<{
  model1Id: string | null;
  model2Id: string | null;
}> = ({ model1Id, model2Id }) => {
  if (!model1Id || !model2Id) return null;

  const model1 = ALL_MODELS.find(m => m.id === model1Id);
  const model2 = ALL_MODELS.find(m => m.id === model2Id);

  if (!model1 || !model2) return null;

  const compareMetric = (value1: number, value2: number, lowerIsBetter = true) => {
    if (value1 === value2) return 'equal';
    if (lowerIsBetter) {
      return value1 < value2 ? 'model1' : 'model2';
    } else {
      return value1 > value2 ? 'model1' : 'model2';
    }
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Model-Vergleich
        </Typography>
        
        <Stack spacing={2}>
          {/* Cost Comparison */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Kosten-Vergleich (pro 1K tokens)
            </Typography>
            <Stack direction="row" spacing={4}>
              <Box flex={1}>
                <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                  <Typography variant="body2" color="text.secondary">
                    Input: {formatCost(model1.pricing.input)}
                  </Typography>
                  {compareMetric(model1.pricing.input, model2.pricing.input) === 'model1' && 
                    <Chip label="Günstiger" size="small" color="success" />
                  }
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="body2" color="text.secondary">
                    Output: {formatCost(model1.pricing.output)}
                  </Typography>
                  {compareMetric(model1.pricing.output, model2.pricing.output) === 'model1' && 
                    <Chip label="Günstiger" size="small" color="success" />
                  }
                </Box>
              </Box>
              <Box flex={1}>
                <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                  <Typography variant="body2" color="text.secondary">
                    Input: {formatCost(model2.pricing.input)}
                  </Typography>
                  {compareMetric(model1.pricing.input, model2.pricing.input) === 'model2' && 
                    <Chip label="Günstiger" size="small" color="success" />
                  }
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="body2" color="text.secondary">
                    Output: {formatCost(model2.pricing.output)}
                  </Typography>
                  {compareMetric(model1.pricing.output, model2.pricing.output) === 'model2' && 
                    <Chip label="Günstiger" size="small" color="success" />
                  }
                </Box>
              </Box>
            </Stack>
          </Box>

          {/* Context Window Comparison */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Context Window
            </Typography>
            <Stack direction="row" spacing={4}>
              <Box flex={1}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="body2" color="text.secondary">
                    {(model1.maxTokens / 1000).toFixed(0)}K tokens
                  </Typography>
                  {compareMetric(model1.maxTokens, model2.maxTokens, false) === 'model1' && 
                    <Chip label="Größer" size="small" color="info" />
                  }
                </Box>
              </Box>
              <Box flex={1}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="body2" color="text.secondary">
                    {(model2.maxTokens / 1000).toFixed(0)}K tokens
                  </Typography>
                  {compareMetric(model1.maxTokens, model2.maxTokens, false) === 'model2' && 
                    <Chip label="Größer" size="small" color="info" />
                  }
                </Box>
              </Box>
            </Stack>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default ModelSelector;
