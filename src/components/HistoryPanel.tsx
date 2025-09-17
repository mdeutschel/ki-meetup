'use client';

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  Stack,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  IconButton,
  Tooltip,
  Chip,
  TextField,
  InputAdornment,
  Collapse,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
} from '@mui/material';
import {
  History,
  Search,
  Delete,
  Restore,
  ExpandMore,
  ExpandLess,
  FilterList,
  Download,
  Clear,
  CalendarToday,
} from '@mui/icons-material';
import { type HistoryPanelProps, type PromptHistory } from '@/types';
import { formatCost } from '@/lib/pricing';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

const HistoryPanel: React.FC<HistoryPanelProps> = ({
  history,
  onSelectPrompt,
  isLoading,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedItem, setSelectedItem] = useState<PromptHistory | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [filterBy, setFilterBy] = useState<'all' | 'successful' | 'failed'>('all');

  // Filter and search history
  const filteredHistory = history.filter(item => {
    const matchesSearch = searchTerm === '' || 
      item.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.response1?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.response2?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = filterBy === 'all' ||
      (filterBy === 'successful' && item.response1 && item.response2) ||
      (filterBy === 'failed' && (!item.response1 || !item.response2));

    return matchesSearch && matchesFilter;
  });

  const handleSelectPrompt = (prompt: PromptHistory) => {
    onSelectPrompt(prompt);
    setSelectedItem(prompt);
  };

  const handleShowDetails = (item: PromptHistory) => {
    setSelectedItem(item);
    setShowDetails(true);
  };

  const totalCost = history.reduce((sum, item) => sum + (item.cost1 || 0) + (item.cost2 || 0), 0);

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardHeader
        title={
          <Box display="flex" alignItems="center" gap={1}>
            <History color="primary" />
            <Typography variant="h6">
              Prompt-Historie
            </Typography>
            <Chip 
              label={`${history.length} Einträge`}
              size="small"
              variant="outlined"
            />
          </Box>
        }
        action={
          <Tooltip title={isExpanded ? 'Minimieren' : 'Erweitern'}>
            <IconButton onClick={() => setIsExpanded(!isExpanded)}>
              {isExpanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          </Tooltip>
        }
        sx={{ pb: 1 }}
      />

      <Collapse in={isExpanded}>
        <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', pt: 0 }}>
          {/* Summary Stats */}
          <Box sx={{ mb: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
            <Stack direction="row" spacing={3} justifyContent="center">
              <Box textAlign="center">
                <Typography variant="h6" color="primary.main">
                  {history.length}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Anfragen
                </Typography>
              </Box>
              <Box textAlign="center">
                <Typography variant="h6" color="warning.main">
                  {formatCost(totalCost)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Gesamtkosten
                </Typography>
              </Box>
              <Box textAlign="center">
                <Typography variant="h6" color="success.main">
                  {history.length > 0 ? formatCost(totalCost / history.length) : '$0.00'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Ø pro Anfrage
                </Typography>
              </Box>
            </Stack>
          </Box>

          {/* Search and Filter */}
          <Stack spacing={2} sx={{ mb: 2 }}>
            <TextField
              size="small"
              placeholder="Historie durchsuchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
                endAdornment: searchTerm && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchTerm('')}>
                      <Clear />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Stack direction="row" spacing={1}>
              <Chip
                label="Alle"
                size="small"
                color={filterBy === 'all' ? 'primary' : 'default'}
                onClick={() => setFilterBy('all')}
                clickable
              />
              <Chip
                label="Erfolgreich"
                size="small"
                color={filterBy === 'successful' ? 'success' : 'default'}
                onClick={() => setFilterBy('successful')}
                clickable
              />
              <Chip
                label="Fehlgeschlagen"
                size="small"
                color={filterBy === 'failed' ? 'error' : 'default'}
                onClick={() => setFilterBy('failed')}
                clickable
              />
            </Stack>
          </Stack>

          {/* History List */}
          {isLoading ? (
            <Box textAlign="center" py={4}>
              <Typography color="text.secondary">
                Lade Historie...
              </Typography>
            </Box>
          ) : filteredHistory.length === 0 ? (
            <Alert severity="info">
              {searchTerm || filterBy !== 'all' 
                ? 'Keine Einträge gefunden. Versuche andere Suchbegriffe oder Filter.'
                : 'Noch keine Historie vorhanden. Starte deine erste Anfrage!'
              }
            </Alert>
          ) : (
            <List sx={{ flexGrow: 1, overflow: 'auto', p: 0 }}>
              {filteredHistory.map((item, index) => (
                <HistoryItem
                  key={item.id}
                  item={item}
                  isSelected={selectedItem?.id === item.id}
                  onSelect={() => handleSelectPrompt(item)}
                  onShowDetails={() => handleShowDetails(item)}
                />
              ))}
            </List>
          )}

          {/* Action Buttons */}
          <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Stack direction="row" spacing={1} justifyContent="space-between">
              <Button
                startIcon={<Download />}
                size="small"
                variant="outlined"
                onClick={() => {/* Handle export */}}
                disabled={history.length === 0}
              >
                Export
              </Button>
              <Button
                startIcon={<Delete />}
                size="small"
                variant="outlined"
                color="error"
                onClick={() => {/* Handle clear all */}}
                disabled={history.length === 0}
              >
                Alle löschen
              </Button>
            </Stack>
          </Box>
        </CardContent>
      </Collapse>

      {/* Details Dialog */}
      <HistoryDetailsDialog
        open={showDetails}
        item={selectedItem}
        onClose={() => setShowDetails(false)}
        onRestore={() => {
          if (selectedItem) {
            handleSelectPrompt(selectedItem);
            setShowDetails(false);
          }
        }}
      />
    </Card>
  );
};

// History Item Component
const HistoryItem: React.FC<{
  item: PromptHistory;
  isSelected: boolean;
  onSelect: () => void;
  onShowDetails: () => void;
}> = ({ item, isSelected, onSelect, onShowDetails }) => {
  const hasResponses = item.response1 && item.response2;
  const totalCost = (item.cost1 || 0) + (item.cost2 || 0);

  return (
    <ListItem 
      disablePadding
      sx={{ 
        mb: 1,
        border: 1,
        borderColor: isSelected ? 'primary.main' : 'divider',
        borderRadius: 1,
        bgcolor: isSelected ? 'primary.50' : 'background.paper',
      }}
    >
      <ListItemButton 
        onClick={onSelect}
        sx={{ 
          flexDirection: 'column',
          alignItems: 'stretch',
          p: 2,
        }}
      >
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
          <Typography variant="caption" color="text.secondary">
            {format(new Date(item.createdAt), 'dd.MM.yyyy HH:mm', { locale: de })}
          </Typography>
          <Stack direction="row" spacing={0.5}>
            {hasResponses ? (
              <Chip label="✓" size="small" color="success" />
            ) : (
              <Chip label="✗" size="small" color="error" />
            )}
            <Tooltip title="Details anzeigen">
              <IconButton 
                size="small" 
                onClick={(e) => {
                  e.stopPropagation();
                  onShowDetails();
                }}
              >
                <ExpandMore fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        </Box>

        {/* Content Preview */}
        <Typography 
          variant="body2" 
          sx={{ 
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            mb: 1,
          }}
        >
          {item.content}
        </Typography>

        {/* Footer */}
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={1}>
            <Chip 
              label={item.model1} 
              size="small" 
              variant="outlined"
              sx={{ fontSize: '0.7rem' }}
            />
            <Chip 
              label={item.model2} 
              size="small" 
              variant="outlined"
              sx={{ fontSize: '0.7rem' }}
            />
          </Stack>
          <Typography variant="caption" color="warning.main" fontWeight={500}>
            {formatCost(totalCost)}
          </Typography>
        </Box>
      </ListItemButton>
    </ListItem>
  );
};

// History Details Dialog
const HistoryDetailsDialog: React.FC<{
  open: boolean;
  item: PromptHistory | null;
  onClose: () => void;
  onRestore: () => void;
}> = ({ open, item, onClose, onRestore }) => {
  if (!item) return null;

  const totalCost = (item.cost1 || 0) + (item.cost2 || 0);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">
            Prompt-Details
          </Typography>
          <Chip 
            label={format(new Date(item.createdAt), 'dd.MM.yyyy HH:mm', { locale: de })}
            size="small"
            icon={<CalendarToday />}
          />
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={3}>
          {/* Original Prompt */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Original Prompt
            </Typography>
            <Box 
              sx={{ 
                p: 2, 
                bgcolor: 'background.default', 
                borderRadius: 1,
                border: 1,
                borderColor: 'divider'
              }}
            >
              <Typography variant="body2">
                {item.content}
              </Typography>
            </Box>
          </Box>

          {/* Models Used */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Verwendete Modelle
            </Typography>
            <Stack direction="row" spacing={2}>
              <Chip label={item.model1} color="primary" />
              <Chip label={item.model2} color="secondary" />
            </Stack>
          </Box>

          {/* Responses */}
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <Box flex={1}>
              <Typography variant="subtitle2" gutterBottom>
                {item.model1} Antwort
              </Typography>
              <Box 
                sx={{ 
                  p: 2, 
                  bgcolor: 'background.default', 
                  borderRadius: 1,
                  border: 1,
                  borderColor: 'divider',
                  maxHeight: 200,
                  overflow: 'auto'
                }}
              >
                <Typography variant="body2">
                  {item.response1 || 'Keine Antwort erhalten'}
                </Typography>
              </Box>
              {item.cost1 && (
                <Typography variant="caption" color="warning.main" sx={{ mt: 1, display: 'block' }}>
                  Kosten: {formatCost(item.cost1)}
                </Typography>
              )}
            </Box>

            <Box flex={1}>
              <Typography variant="subtitle2" gutterBottom>
                {item.model2} Antwort
              </Typography>
              <Box 
                sx={{ 
                  p: 2, 
                  bgcolor: 'background.default', 
                  borderRadius: 1,
                  border: 1,
                  borderColor: 'divider',
                  maxHeight: 200,
                  overflow: 'auto'
                }}
              >
                <Typography variant="body2">
                  {item.response2 || 'Keine Antwort erhalten'}
                </Typography>
              </Box>
              {item.cost2 && (
                <Typography variant="caption" color="warning.main" sx={{ mt: 1, display: 'block' }}>
                  Kosten: {formatCost(item.cost2)}
                </Typography>
              )}
            </Box>
          </Stack>

          {/* Total Cost */}
          <Box textAlign="center" sx={{ pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Typography variant="h6" color="warning.main">
              Gesamtkosten: {formatCost(totalCost)}
            </Typography>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          Schließen
        </Button>
        <Button 
          onClick={onRestore} 
          variant="contained" 
          startIcon={<Restore />}
        >
          Prompt wiederverwenden
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default HistoryPanel;
