import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  FormControlLabel,
  Checkbox,
  Alert
} from '@mui/material';

interface EditVersionNamingDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (versionName: string | null) => void;
}

const EditVersionNamingDialog: React.FC<EditVersionNamingDialogProps> = ({
  open,
  onClose,
  onConfirm
}) => {
  const [versionName, setVersionName] = useState('');
  const [useAutoName, setUseAutoName] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    setVersionName('');
    setUseAutoName(false);
    setError(null);
    onClose();
  };

  const handleConfirm = () => {
    if (!useAutoName && !versionName.trim()) {
      setError('Please enter a version name or select auto-naming');
      return;
    }

    const finalName = useAutoName ? null : versionName.trim();
    onConfirm(finalName);
    handleClose();
  };

  const handleAutoNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUseAutoName(event.target.checked);
    if (event.target.checked) {
      setVersionName('');
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <Typography variant="h6">Save Current Version</Typography>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Typography variant="body1" gutterBottom>
            Would you like to give this version a custom name?
          </Typography>
          
          <FormControlLabel
            control={
              <Checkbox
                checked={useAutoName}
                onChange={handleAutoNameChange}
                color="primary"
              />
            }
            label="Use automatic naming (Unnamed Version N)"
            sx={{ mt: 2, mb: 2 }}
          />
          
          {!useAutoName && (
            <TextField
              fullWidth
              label="Version Name"
              value={versionName}
              onChange={(e) => setVersionName(e.target.value)}
              placeholder="Enter a descriptive name for this version"
              variant="outlined"
              sx={{ mt: 2 }}
            />
          )}
          
          {useAutoName && (
            <Alert severity="info" sx={{ mt: 2 }}>
              The system will automatically name this version as "Unnamed Version N" where N is the next available number.
            </Alert>
          )}
          
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleClose}>
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          disabled={!useAutoName && !versionName.trim()}
          color="primary"
        >
          Save Version
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditVersionNamingDialog;
