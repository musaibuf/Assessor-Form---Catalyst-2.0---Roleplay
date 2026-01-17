import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Container,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Box,
  Paper,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Divider,
  Alert,
  CircularProgress,
  createTheme,
  ThemeProvider,
  CssBaseline,
  Select,
  MenuItem,
  InputLabel
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import PersonAddIcon from '@mui/icons-material/PersonAdd';

// --- Theme Configuration ---
const theme = createTheme({
  palette: {
    primary: {
      main: '#F57C00',
      light: '#FF9800',
      dark: '#E65100',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#1F2937',
    },
    background: {
      default: '#F3F4F6',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h5: { fontWeight: 600, color: '#E65100' },
    h4: { fontWeight: 700 },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { 
          borderRadius: 8, 
          paddingTop: 12, 
          paddingBottom: 12, 
          fontWeight: 'bold',
          boxShadow: '0 4px 6px rgba(245, 124, 0, 0.25)'
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: { borderRadius: 16, boxShadow: '0 10px 30px rgba(0,0,0,0.08)' },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { borderRadius: 16 },
      },
    },
  },
});

// --- Data Configuration ---
const COGNITIVE_BEHAVIORS = [
  "Problem Solving",
  "Asking the Right Questions",
  "Listening Skills",
  "Decision-Making Skills",
  "Strategic Sales & Marketing Approach",
  "Social Media"
];

const INTERPERSONAL_BEHAVIORS = [
  "Communication Skills",
  "Building a Positive Environment",
  "Organization Skills & Team Management"
];

const REGIONS = ['Karachi', 'Lahore', 'Islamabad', 'Multan'];

function App() {
  // --- State ---
  const [csvData, setCsvData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [step, setStep] = useState(0); 
  
  // Inputs
  const [cnicInput, setCnicInput] = useState('');
  const [assessorName, setAssessorName] = useState(''); // <--- NEW STATE
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [scores, setScores] = useState({});
  const [comments, setComments] = useState({ cognitive: '', interpersonal: '' });
  
  // Manual Entry State
  const [manualForm, setManualForm] = useState({
    name: '',
    cnic: '',
    dealership: '',
    region: ''
  });
  
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- 1. Load CSV ---
  useEffect(() => {
    const fetchCSV = async () => {
      try {
        const response = await axios.get('/data/participant.csv');
        const parsedData = parseCSV(response.data);
        setCsvData(parsedData);
        setLoading(false);
      } catch (err) {
        console.error("Error loading CSV:", err);
        setError("Failed to load database.");
        setLoading(false);
      }
    };
    fetchCSV();
  }, []);

  const parseCSV = (text) => {
    const lines = text.trim().split(/\r\n|\n/);
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]+/g, ''));
    const result = [];
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const row = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
      const obj = {};
      headers.forEach((header, index) => {
        let val = row[index] ? row[index].trim() : '';
        if (val.startsWith('"') && val.endsWith('"')) {
          val = val.slice(1, -1);
        }
        obj[header] = val;
      });
      result.push(obj);
    }
    return result;
  };

  // --- Handlers ---
  const formatCNIC = (val) => {
    val = val.replace(/\D/g, ''); 
    if (val.length > 13) val = val.slice(0, 13); 
    if (val.length > 5 && val.length <= 12) {
      val = `${val.slice(0, 5)}-${val.slice(5)}`;
    } else if (val.length > 12) {
      val = `${val.slice(0, 5)}-${val.slice(5, 12)}-${val.slice(12)}`;
    }
    return val;
  };

  const handleCnicChange = (e) => {
    setCnicInput(formatCNIC(e.target.value));
  };

  const handleSearch = () => {
    setError('');
    const cnicRegex = /^\d{5}-\d{7}-\d{1}$/;
    if (!cnicRegex.test(cnicInput)) {
      setError('Invalid Format. Required: xxxxx-xxxxxxx-x');
      return;
    }
    const found = csvData.find(p => p.cnic === cnicInput);
    if (found) {
      setSelectedParticipant(found);
      setStep(1); 
    } else {
      setError('CNIC not found in database.');
      setSelectedParticipant(null);
    }
  };

  // --- Manual Entry Handlers ---
  const handleManualChange = (field, value) => {
    if (field === 'cnic') {
      value = formatCNIC(value);
    }
    setManualForm(prev => ({ ...prev, [field]: value }));
  };

  const submitManualEntry = () => {
    const { name, cnic, dealership, region } = manualForm;
    
    if (!name || !dealership || !region || !assessorName.trim()) { // Check Assessor Name
      setError("Please fill in all fields, including Assessor Name.");
      return;
    }
    
    const cnicRegex = /^\d{5}-\d{7}-\d{1}$/;
    if (!cnicRegex.test(cnic)) {
      setError('Invalid CNIC Format. Required: xxxxx-xxxxxxx-x');
      return;
    }

    setSelectedParticipant({
      name,
      cnic,
      dealership,
      region
    });
    setError('');
    setStep(2); 
  };

  // --- Assessment Handlers ---
  const handleScoreChange = (behavior, value) => {
    setScores(prev => ({ ...prev, [behavior]: value }));
    if (formError) setFormError('');
  };

  const handleCommentChange = (section, value) => {
    setComments(prev => ({ ...prev, [section]: value }));
    if (formError) setFormError('');
  };

  const handleSubmit = async () => {
    const allBehaviors = [...COGNITIVE_BEHAVIORS, ...INTERPERSONAL_BEHAVIORS];
    const missingScores = allBehaviors.filter(b => !scores[b]);
    
    if (missingScores.length > 0) {
      setFormError(`Please grade all behaviors. Missing: ${missingScores.length}`);
      window.scrollTo(0, 0);
      return;
    }

    if (!comments.cognitive.trim() || !comments.interpersonal.trim()) {
      setFormError("Comments are mandatory for both sections.");
      return;
    }

    setIsSubmitting(true);
    
    try {
      await axios.post('https://assessor-form-roleplay-backend.onrender.com/api/submit', {
        assessorName: assessorName, // <--- SEND ASSESSOR NAME
        participant: selectedParticipant,
        scores: scores,
        comments: comments
      });

      setStep(3); 
    } catch (err) {
      console.error("Error submitting form:", err);
      setFormError("Failed to save data. Please check your internet connection.");
      window.scrollTo(0, 0);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setStep(0);
    setCnicInput('');
    setAssessorName(''); // Reset Assessor Name
    setSelectedParticipant(null);
    setScores({});
    setComments({ cognitive: '', interpersonal: '' });
    setManualForm({ name: '', cnic: '', dealership: '', region: '' });
    setFormError('');
    setError('');
  };

  // --- Components ---

  const LogoHeader = () => (
    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
      <img src="/logo.png" alt="Carnelian Logo" style={{ maxHeight: '80px', objectFit: 'contain' }} />
    </Box>
  );

  // Step 0: Search
  const renderSearch = () => (
    <Card sx={{ maxWidth: 500, mx: 'auto', mt: 10, p: 3 }}>
      <CardContent>
        <LogoHeader />
        <Typography variant="h5" gutterBottom align="center" sx={{ mb: 3 }}>
          Roleplay Assessor Portal
        </Typography>
        
        <Box sx={{ mt: 2 }}>
          <TextField
            fullWidth
            label="Enter Participant CNIC"
            variant="outlined"
            value={cnicInput}
            onChange={handleCnicChange}
            placeholder="xxxxx-xxxxxxx-x"
            helperText="Format: xxxxx-xxxxxxx-x" 
            InputProps={{ style: { fontSize: '1.2rem', letterSpacing: '2px' } }}
          />
        </Box>
        
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        
        <Button 
          fullWidth 
          variant="contained" 
          size="large" 
          sx={{ mt: 4 }} 
          onClick={handleSearch}
          disabled={loading}
        >
          Search
        </Button>

        <Divider sx={{ my: 3 }}>OR</Divider>

        <Button 
          fullWidth 
          variant="outlined" 
          color="primary"
          size="large" 
          startIcon={<PersonAddIcon />}
          onClick={() => { setError(''); setStep(4); }}
        >
          Add New Participant
        </Button>
      </CardContent>
    </Card>
  );

  // Step 4: Manual Entry (New Participant)
  const renderManualEntry = () => (
    <Card sx={{ maxWidth: 600, mx: 'auto', mt: 8, p: 3 }}>
      <CardContent>
        <LogoHeader />
        <Typography variant="h5" gutterBottom align="center">Add New Participant</Typography>
        <Divider sx={{ my: 2, borderColor: '#F57C00' }} />

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
          {/* NEW: Assessor Name Field */}
          <TextField
            label="Assessor Name"
            fullWidth
            required
            value={assessorName}
            onChange={(e) => setAssessorName(e.target.value)}
            sx={{ backgroundColor: '#FFF3E0' }}
          />

          <TextField
            label="Full Name"
            fullWidth
            value={manualForm.name}
            onChange={(e) => handleManualChange('name', e.target.value)}
          />
          
          <TextField
            label="CNIC"
            fullWidth
            value={manualForm.cnic}
            onChange={(e) => handleManualChange('cnic', e.target.value)}
            placeholder="xxxxx-xxxxxxx-x"
            helperText="Format: xxxxx-xxxxxxx-x"
          />

          <TextField
            label="Dealership Name"
            fullWidth
            value={manualForm.dealership}
            onChange={(e) => handleManualChange('dealership', e.target.value)}
          />

          <FormControl fullWidth>
            <InputLabel>Region</InputLabel>
            <Select
              value={manualForm.region}
              label="Region"
              onChange={(e) => handleManualChange('region', e.target.value)}
            >
              {REGIONS.map((region) => (
                <MenuItem key={region} value={region}>{region}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {error && <Alert severity="error" sx={{ mt: 3 }}>{error}</Alert>}

        <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
          <Button variant="outlined" color="secondary" fullWidth onClick={() => { setError(''); setStep(0); }}>
            Cancel
          </Button>
          <Button variant="contained" fullWidth onClick={submitManualEntry}>
            Proceed to Assessment
          </Button>
        </Box>
      </CardContent>
    </Card>
  );

  // Step 1: Confirm (CSV Found)
  const renderConfirm = () => (
    <Card sx={{ maxWidth: 600, mx: 'auto', mt: 10, p: 3 }}>
      <CardContent>
        <LogoHeader />
        <Typography variant="h5" gutterBottom align="center">Participant Verification</Typography>
        <Divider sx={{ my: 2, borderColor: '#F57C00' }} />
        
        <Box sx={{ display: 'grid', gap: 1.5, mb: 3 }}>
          <Typography variant="body1" sx={{ fontSize: '1.1rem' }}><strong>Name:</strong> {selectedParticipant.name}</Typography>
          <Typography variant="body1" sx={{ fontSize: '1.1rem' }}><strong>CNIC:</strong> {selectedParticipant.cnic}</Typography>
          <Typography variant="body1" sx={{ fontSize: '1.1rem' }}><strong>Dealership:</strong> {selectedParticipant.dealership}</Typography>
          <Typography variant="body1" sx={{ fontSize: '1.1rem' }}><strong>Region:</strong> {selectedParticipant.region}</Typography>
        </Box>

        {/* NEW: Assessor Name Field */}
        <Box sx={{ mt: 2, mb: 2 }}>
            <TextField
                label="Enter Assessor Name"
                fullWidth
                required
                variant="filled"
                value={assessorName}
                onChange={(e) => {
                    setAssessorName(e.target.value);
                    setError('');
                }}
                sx={{ backgroundColor: '#FFF3E0' }}
            />
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
          <Button variant="outlined" color="secondary" fullWidth onClick={() => setStep(0)}>Cancel</Button>
          <Button 
            variant="contained" 
            fullWidth 
            onClick={() => {
                if(!assessorName.trim()) {
                    setError("Please enter Assessor Name to proceed.");
                    return;
                }
                setStep(2);
            }}
          >
            Proceed
          </Button>
        </Box>
      </CardContent>
    </Card>
  );

  // Step 2: Assessment Form
  const renderForm = () => (
    <Paper sx={{ maxWidth: 900, mx: 'auto', mt: 4, p: 4, mb: 10 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <img src="/logo.png" alt="Logo" style={{ height: '50px' }} />
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="caption" display="block" color="textSecondary">ASSESSOR: {assessorName}</Typography>
          <Typography variant="h6" color="primary">{selectedParticipant.name}</Typography>
        </Box>
      </Box>
      <Divider sx={{ mb: 4 }} />

      {formError && (
        <Alert severity="error" sx={{ mb: 3, fontSize: '1rem' }} variant="filled">
          {formError}
        </Alert>
      )}

      {/* Cognitive */}
      <Box sx={{ backgroundColor: '#FFF3E0', p: 2, borderRadius: 2, borderLeft: '6px solid #F57C00' }}>
        <Typography variant="h6" color="primary">1. Cognitive Skills (C)</Typography>
      </Box>
      {COGNITIVE_BEHAVIORS.map((behavior, index) => (
        <Box key={index} sx={{ mt: 3, mb: 2, pl: 2 }}>
          <FormControl component="fieldset" fullWidth error={formError && !scores[behavior]}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
              <FormLabel component="legend" sx={{ color: '#333', fontWeight: '500', fontSize: '1rem', flex: 1, minWidth: '200px' }}>
                {behavior} <span style={{color: 'red'}}>*</span>
              </FormLabel>
              <RadioGroup row name={behavior} value={scores[behavior] || ''} onChange={(e) => handleScoreChange(behavior, e.target.value)} sx={{ flexShrink: 0 }}>
                {[1, 2, 3, 4].map((val) => (
                  <FormControlLabel key={val} value={val.toString()} control={<Radio />} label={val.toString()} labelPlacement="bottom" sx={{ mx: 1.5 }} />
                ))}
              </RadioGroup>
            </Box>
          </FormControl>
          <Divider sx={{ mt: 1, opacity: 0.6 }} />
        </Box>
      ))}
      <TextField 
        fullWidth 
        multiline 
        rows={3} 
        label="Comments for Cognitive Skills" 
        variant="outlined" 
        required
        error={formError && !comments.cognitive.trim()}
        sx={{ mt: 2, mb: 5 }} 
        value={comments.cognitive} 
        onChange={(e) => handleCommentChange('cognitive', e.target.value)} 
      />

      {/* Interpersonal */}
      <Box sx={{ backgroundColor: '#FFF3E0', p: 2, borderRadius: 2, borderLeft: '6px solid #F57C00' }}>
        <Typography variant="h6" color="primary">2. Interpersonal Skills (I)</Typography>
      </Box>
      {INTERPERSONAL_BEHAVIORS.map((behavior, index) => (
        <Box key={index} sx={{ mt: 3, mb: 2, pl: 2 }}>
          <FormControl component="fieldset" fullWidth error={formError && !scores[behavior]}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
              <FormLabel component="legend" sx={{ color: '#333', fontWeight: '500', fontSize: '1rem', flex: 1, minWidth: '200px' }}>
                {behavior} <span style={{color: 'red'}}>*</span>
              </FormLabel>
              <RadioGroup row name={behavior} value={scores[behavior] || ''} onChange={(e) => handleScoreChange(behavior, e.target.value)} sx={{ flexShrink: 0 }}>
                {[1, 2, 3, 4].map((val) => (
                  <FormControlLabel key={val} value={val.toString()} control={<Radio />} label={val.toString()} labelPlacement="bottom" sx={{ mx: 1.5 }} />
                ))}
              </RadioGroup>
            </Box>
          </FormControl>
          <Divider sx={{ mt: 1, opacity: 0.6 }} />
        </Box>
      ))}
      <TextField 
        fullWidth 
        multiline 
        rows={3} 
        label="Comments for Interpersonal Skills" 
        variant="outlined" 
        required
        error={formError && !comments.interpersonal.trim()}
        sx={{ mt: 2, mb: 4 }} 
        value={comments.interpersonal} 
        onChange={(e) => handleCommentChange('interpersonal', e.target.value)} 
      />

      {formError && (
        <Typography color="error" align="center" sx={{ mb: 2, fontWeight: 'bold' }}>
          {formError}
        </Typography>
      )}

      <Button 
        variant="contained" 
        color="primary" 
        size="large" 
        fullWidth 
        onClick={handleSubmit}
        disabled={isSubmitting} 
        sx={{ py: 2, fontSize: '1.2rem', boxShadow: 3 }}
      >
        {isSubmitting ? "Saving..." : "Submit Assessment"}
      </Button>
    </Paper>
  );

  // Step 3: Success
  const renderSuccess = () => (
    <Card sx={{ maxWidth: 500, mx: 'auto', mt: 15, p: 4, textAlign: 'center' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          <CheckCircleOutlineIcon sx={{ fontSize: 80, color: '#F57C00' }} />
        </Box>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#1F2937' }}>
          Thank You!
        </Typography>
        <Typography variant="h6" sx={{ color: '#E65100', mb: 4 }}>
          Your response has been recorded.
        </Typography>
        <Button 
          variant="contained" 
          size="large" 
          fullWidth 
          onClick={resetForm}
          sx={{ borderRadius: 2, py: 1.5, fontSize: '1.1rem' }}
        >
          Assess Another Participant
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div style={{ minHeight: '100vh', paddingBottom: '20px' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 20 }}>
            <CircularProgress color="primary" size={60} />
          </Box>
        ) : (
          <>
            {step === 0 && renderSearch()}
            {step === 1 && renderConfirm()}
            {step === 4 && renderManualEntry()}
            {step === 2 && renderForm()}
            {step === 3 && renderSuccess()}
          </>
        )}
      </div>
    </ThemeProvider>
  );
}

export default App;