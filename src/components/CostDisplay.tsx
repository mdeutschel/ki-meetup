'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Stack,
  Chip,
  LinearProgress,
  Tooltip,
  IconButton,
  Collapse,
  Alert,
  Divider,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  MonetizationOn,
  Info,
  ExpandMore,
  ExpandLess,
  Calculate,
  CompareArrows,
} from '@mui/icons-material';
import { type CostDisplayProps, type CostCalculation } from '@/types';
import { formatCost, formatTokens } from '@/lib/pricing';
import { getModelConfig } from '@/lib/models';

const CostDisplay: React.FC<CostDisplayProps> = ({
  calculation,
  modelName,
  isLive = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [animatedCost, setAnimatedCost] = useState(0);

  // Animate cost changes for live updates
  useEffect(() => {
    if (isLive) {
      const interval = setInterval(() => {
        setAnimatedCost(prev => {
          const diff = calculation.totalCost - prev;
          return prev + diff * 0.3; // Smooth animation
        });
      }, 50);

      return () => clearInterval(interval);
    } else {
      setAnimatedCost(calculation.totalCost);
    }
  }, [calculation.totalCost, isLive]);

  const costLevel = getCostLevel(calculation.totalCost);

  return (
    <Card 
      sx={{ 
        border: 1,
        borderColor: isLive ? 'warning.main' : 'divider',
        transition: 'all 0.3s ease-in-out',
        '&:hover': {
          borderColor: 'primary.main',
          transform: 'translateY(-1px)',
          boxShadow: 2,
        }
      }}
    >
      <CardContent>
        <Stack spacing={2}>
          {/* Header */}
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={1}>
              <MonetizationOn 
                color={isLive ? 'warning' : 'primary'} 
                sx={{ 
                  animation: isLive ? 'pulse 1.5s ease-in-out infinite' : 'none',
                  '@keyframes pulse': {
                    '0%': { opacity: 1 },
                    '50%': { opacity: 0.7 },
                    '100%': { opacity: 1 },
                  }
                }}
              />
              <Typography variant="h6" component="h3">
                {modelName}
              </Typography>
              {isLive && (
                <Chip 
                  label="Live" 
                  size="small" 
                  color="warning" 
                  variant="filled"
                  sx={{ fontSize: '0.7rem' }}
                />
              )}
            </Box>
            
            <IconButton 
              onClick={() => setIsExpanded(!isExpanded)}
              size="small"
            >
              {isExpanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          </Box>

          {/* Main Cost Display */}
          <Box textAlign="center">
            <Typography 
              variant="h4" 
              component="div" 
              color={costLevel.color}
              fontWeight="bold"
              sx={{ 
                transition: 'all 0.3s ease-in-out',
                fontFamily: 'monospace',
              }}
            >
              {formatCost(isLive ? animatedCost : calculation.totalCost)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Gesamtkosten
            </Typography>
          </Box>

          {/* Cost Level Indicator */}
          <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
            {costLevel.icon}
            <Typography variant="body2" color={costLevel.color} fontWeight={500}>
              {costLevel.label}
            </Typography>
          </Box>

          {/* Progress Bar for Live Updates */}
          {isLive && (
            <LinearProgress 
              variant="indeterminate" 
              color="warning"
              sx={{ 
                height: 3,
                borderRadius: 1.5,
                backgroundColor: 'warning.light',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: 'warning.main',
                }
              }}
            />
          )}

          {/* Quick Stats */}
          <Stack direction="row" spacing={2} justifyContent="center">
            <Tooltip title="Input Tokens">
              <Chip
                label={`${formatTokens(calculation.inputTokens)} in`}
                size="small"
                variant="outlined"
                color="info"
              />
            </Tooltip>
            
            <Tooltip title="Output Tokens">
              <Chip
                label={`${formatTokens(calculation.outputTokens)} out`}
                size="small"
                variant="outlined"
                color="success"
              />
            </Tooltip>
          </Stack>

          {/* Detailed Breakdown */}
          <Collapse in={isExpanded}>
            <Box>
              <Divider sx={{ my: 2 }} />
              <CostBreakdown calculation={calculation} />
            </Box>
          </Collapse>
        </Stack>
      </CardContent>
    </Card>
  );
};

// Cost Breakdown Component
const CostBreakdown: React.FC<{ calculation: CostCalculation }> = ({ calculation }) => {
  return (
    <Stack spacing={2}>
      <Typography variant="subtitle2" gutterBottom>
        Kostenaufschlüsselung
      </Typography>
      
      <Stack spacing={1}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="body2" color="text.secondary">
            Input ({formatTokens(calculation.inputTokens)} tokens)
          </Typography>
          <Typography variant="body2" fontWeight={500}>
            {formatCost(calculation.inputCost)}
          </Typography>
        </Box>
        
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="body2" color="text.secondary">
            Output ({formatTokens(calculation.outputTokens)} tokens)
          </Typography>
          <Typography variant="body2" fontWeight={500}>
            {formatCost(calculation.outputCost)}
          </Typography>
        </Box>
        
        <Divider />
        
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="body2" fontWeight={600}>
            Gesamt
          </Typography>
          <Typography variant="body2" fontWeight={600} color="warning.main">
            {formatCost(calculation.totalCost)}
          </Typography>
        </Box>
      </Stack>
      
      {/* Cost per Token Info */}
      <Alert severity="info" icon={<Calculate />}>
        <Typography variant="caption">
          Diese Berechnung basiert auf den aktuellen API-Preisen. 
          Tatsächliche Kosten können aufgrund von Rabatten oder Preisänderungen variieren.
        </Typography>
      </Alert>
    </Stack>
  );
};

// Dual Cost Comparison Component
export const DualCostDisplay: React.FC<{
  cost1: CostCalculation;
  cost2: CostCalculation;
  model1Name: string;
  model2Name: string;
  isLive?: boolean;
}> = ({ cost1, cost2, model1Name, model2Name, isLive = false }) => {
  const totalCost = cost1.totalCost + cost2.totalCost;
  const savings = Math.abs(cost1.totalCost - cost2.totalCost);
  const cheaperModel = cost1.totalCost < cost2.totalCost ? model1Name : model2Name;
  const hasSavings = savings > 0.000001; // Avoid floating point comparison issues

  return (
    <Box>
      {/* Summary Card */}
      <Card sx={{ mb: 3, bgcolor: 'primary.50', border: 1, borderColor: 'primary.main' }}>
        <CardContent>
          <Stack spacing={2}>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Typography variant="h6" color="primary.main">
                Kosten-Vergleich
              </Typography>
              {isLive && (
                <Chip 
                  label="Live-Update" 
                  size="small" 
                  color="primary" 
                  variant="filled"
                />
              )}
            </Box>
            
            <Stack direction="row" spacing={4} alignItems="center" justifyContent="center">
              <Box textAlign="center">
                <Typography variant="h4" fontWeight="bold" color="primary.main">
                  {formatCost(totalCost)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Gesamtkosten
                </Typography>
              </Box>
              
              {hasSavings && (
                <>
                  <CompareArrows color="primary" />
                  <Box textAlign="center">
                    <Typography variant="h6" color="success.main" fontWeight="bold">
                      {formatCost(savings)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Ersparnis mit {cheaperModel}
                    </Typography>
                  </Box>
                </>
              )}
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {/* Individual Cost Displays */}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
        <Box flex={1}>
          <CostDisplay
            calculation={cost1}
            modelName={model1Name}
            isLive={isLive}
          />
        </Box>
        
        <Box flex={1}>
          <CostDisplay
            calculation={cost2}
            modelName={model2Name}
            isLive={isLive}
          />
        </Box>
      </Stack>

      {/* Cost Efficiency Analysis */}
      {hasSavings && (
        <CostEfficiencyAnalysis 
          cost1={cost1}
          cost2={cost2}
          model1Name={model1Name}
          model2Name={model2Name}
        />
      )}
    </Box>
  );
};

// Cost Efficiency Analysis Component
const CostEfficiencyAnalysis: React.FC<{
  cost1: CostCalculation;
  cost2: CostCalculation;
  model1Name: string;
  model2Name: string;
}> = ({ cost1, cost2, model1Name, model2Name }) => {
  const efficiency1 = cost1.outputTokens / cost1.totalCost;
  const efficiency2 = cost2.outputTokens / cost2.totalCost;
  const moreEfficient = efficiency1 > efficiency2 ? model1Name : model2Name;
  const efficiencyDiff = Math.abs(efficiency1 - efficiency2);

  return (
    <Card sx={{ mt: 3 }} variant="outlined">
      <CardContent>
        <Typography variant="subtitle1" gutterBottom>
          Effizienz-Analyse
        </Typography>
        
        <Alert severity="info">
          <Typography variant="body2">
            <strong>{moreEfficient}</strong> ist effizienter und produziert{' '}
            <strong>{Math.round(efficiencyDiff)}</strong> mehr Tokens pro Dollar.
          </Typography>
        </Alert>
        
        <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
          <Box flex={1}>
            <Typography variant="caption" color="text.secondary">
              {model1Name} Effizienz
            </Typography>
            <Typography variant="body2">
              {Math.round(efficiency1)} tokens/$
            </Typography>
          </Box>
          
          <Box flex={1}>
            <Typography variant="caption" color="text.secondary">
              {model2Name} Effizienz
            </Typography>
            <Typography variant="body2">
              {Math.round(efficiency2)} tokens/$
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};

// Session Cost Tracker Component
export const SessionCostTracker: React.FC<{
  sessionCosts: Array<{ modelName: string; cost: number; timestamp: Date }>;
  onReset: () => void;
}> = ({ sessionCosts, onReset }) => {
  const totalSessionCost = sessionCosts.reduce((sum, item) => sum + item.cost, 0);
  const requestCount = sessionCosts.length;

  return (
    <Card variant="outlined" sx={{ mt: 2 }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
            Session-Übersicht
          </Typography>
          <IconButton onClick={onReset} size="small">
            <Info />
          </IconButton>
        </Box>
        
        <Stack direction="row" spacing={3}>
          <Box>
            <Typography variant="h5" color="primary.main" fontWeight="bold">
              {formatCost(totalSessionCost)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Session-Kosten
            </Typography>
          </Box>
          
          <Box>
            <Typography variant="h5" color="info.main" fontWeight="bold">
              {requestCount}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Anfragen
            </Typography>
          </Box>
          
          <Box>
            <Typography variant="h5" color="success.main" fontWeight="bold">
              {requestCount > 0 ? formatCost(totalSessionCost / requestCount) : '$0.00'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Ø pro Anfrage
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};

// Utility Functions
const getCostLevel = (cost: number) => {
  if (cost < 0.001) {
    return {
      label: 'Sehr günstig',
      color: 'success.main' as const,
      icon: <TrendingDown color="success" />,
    };
  } else if (cost < 0.01) {
    return {
      label: 'Günstig',
      color: 'info.main' as const,
      icon: <TrendingDown color="info" />,
    };
  } else if (cost < 0.1) {
    return {
      label: 'Moderat',
      color: 'warning.main' as const,
      icon: <TrendingUp color="warning" />,
    };
  } else {
    return {
      label: 'Teuer',
      color: 'error.main' as const,
      icon: <TrendingUp color="error" />,
    };
  }
};

export default CostDisplay;
