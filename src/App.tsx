import React, { useState, useEffect } from 'react';
import {
  Container,
  TextField,
  Typography,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Alert,
  Collapse,
  Switch,
  FormControlLabel
} from '@mui/material';
import { Add, Remove } from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';

const stages = ["W", "N1", "N2", "N3", "R"];
const events = ["Obstructive Apnea", "Central Apnea", "Mixed Apnea", "Obstructive Hypopnea", "Central Hypopnea", "Mixed Hypopnea"];

type EventCounts = {
  [key: string]: number;
};

type RowData = {
  stage: string;
  startTime: Date | null;
  endTime: Date | null;
  duration: number;
  events: EventCounts;
  active: boolean;
};

type DataState = RowData[];

const initialData: DataState = stages.map(stage => ({
  stage,
  startTime: null,
  endTime: null,
  duration: 0,
  events: events.reduce((acc, event) => ({ ...acc, [event]: 0 }), {} as EventCounts),
  active: true
}));

const App: React.FC = () => {
  const [data, setData] = useState<DataState>(initialData);
  const [ahi, setAhi] = useState<string | number>(0);
  const [totalEvents, setTotalEvents] = useState<number>(0);
  const [totalDuration, setTotalDuration] = useState<number>(0);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  const calculateAHI = (newData: DataState) => {
    const newWarnings: string[] = [];
    const totEvents = newData.reduce((sum, row) => sum + (row.active ? Object.values(row.events).reduce((a, b) => a + b, 0) : 0), 0);
    const totDuration = newData.reduce((sum, row) => row.stage !== "W" && row.active ? sum + row.duration : sum, 0);

    setTotalEvents(totEvents);
    setTotalDuration(totDuration);
    
    if (totDuration === 0) {
      newWarnings.push("Please enter some time asleep (ie not W!)");
    }
    if (totEvents === 0) {
      newWarnings.push("Please enter at least one respiratory event");
    }

    setWarnings(newWarnings);

    if (totDuration > 0 && totEvents > 0) {
      setAhi((totEvents / totDuration).toFixed(2));
    } else {
      setAhi("");
    }
  };

  const validateTimes = (newData: DataState) => {
    const newErrors: string[] = [];
    newData.forEach(row => {
      if (row.active && row.startTime && row.endTime && row.endTime <= row.startTime) {
        newErrors.push(`End Time cannot be earlier than Start Time for stage ${row.stage}`);
      }
    });
    setErrors(newErrors);
  };

  useEffect(() => {
    calculateAHI(data);
    validateTimes(data);
  }, [data]);

  const handleTimeChange = (value: Date | null, index: number, type: 'startTime' | 'endTime') => {
    const newData = [...data];
    newData[index][type] = value;

    if (newData[index].startTime && newData[index].endTime) {
      if (newData[index].endTime > newData[index].startTime) {
        const duration = (newData[index].endTime.getTime() - newData[index].startTime.getTime()) / (1000 * 60 * 60);
        newData[index].duration = duration;
        // Clear any existing error related to this stage
        setErrors(errors.filter(error => !error.includes(newData[index].stage)));
      } else {
        newData[index].duration = 0;
      }
    }
    setData(newData);
  };

  const handleEventChange = (index: number, event: string, increment: boolean) => {
    const newData = [...data];
    newData[index].events[event] += increment ? 1 : -1;
    if (newData[index].events[event] < 0) newData[index].events[event] = 0;
    setData(newData);
  };

  const toggleStageActive = (index: number) => {
    const newData = [...data];
    newData[index].active = !newData[index].active;

    if (!newData[index].active) {
      newData[index].startTime = null;
      newData[index].endTime = null;
      newData[index].duration = 0;
      newData[index].events = events.reduce((acc, event) => ({ ...acc, [event]: 0 }), {} as EventCounts);
      // Clear any existing warning and error related to this stage
      setWarnings(warnings.filter(warning => !warning.includes(newData[index].stage)));
      setErrors(errors.filter(error => !error.includes(newData[index].stage)));
    }
    setData(newData);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container>
        <Typography variant="h2" align="center" gutterBottom>Apnea-Hypopnea Index Calculator</Typography>
        
        {errors.map((error, index) => (
          <Collapse key={index} in={true}>
            <Alert severity="error" onClose={() => setErrors(errors.filter((_, i) => i !== index))}>
              {error}
            </Alert>
          </Collapse>
        ))}
        
        {warnings.map((warning, index) => (
          <Collapse key={index} in={true}>
            <Alert severity="warning" onClose={() => setWarnings(warnings.filter((_, i) => i !== index))}>
              {warning}
            </Alert>
          </Collapse>
        ))}

        {totalEvents > 0 && totalDuration > 0 && (
          <>
            <Typography variant="h3" align="center" gutterBottom>AHI: {ahi} </Typography>
            <Typography variant="subtitle1" align="center" gutterBottom>
              {`( respiratory events = ${totalEvents} / sleep duration = ${totalDuration.toFixed(2)} )`}
            </Typography>
          </>
        )}

        <TableContainer component={Paper}>
          <Table stickyHeader size="small" aria-label="AHI Table">
            <TableHead>
              <TableRow>
                <TableCell>Stage</TableCell>
                {stages.map((stage, stageIndex) => (
                  <TableCell key={stage} align="center">
                    {stage}
                    <FormControlLabel
                      control={
                        <Switch
                          checked={data[stageIndex].active}
                          onChange={() => toggleStageActive(stageIndex)}
                        />
                      }
                      label=""
                    />
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell>Start Time</TableCell>
                {data.map((row, rowIndex) => (
                  <TableCell key={`${row.stage}-start`} align="center">
                    <Box display="flex" alignItems="center">
                      <TimePicker
                        value={row.startTime}
                        onChange={(newValue) => handleTimeChange(newValue, rowIndex, 'startTime')}
                        slotProps={{ textField: { error: !!errors.find(error => error.includes(row.stage)), disabled: !row.active }}}
                        ampm={false}
                        minutesStep={5}
                      />
                    </Box>
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell>End Time</TableCell>
                {data.map((row, rowIndex) => (
                  <TableCell key={`${row.stage}-end`} align="center">
                    <Box display="flex" alignItems="center">
                      <TimePicker
                        value={row.endTime}
                        onChange={(newValue) => handleTimeChange(newValue, rowIndex, 'endTime')}
                        slotProps={{ textField: { error: !!errors.find(error => error.includes(row.stage)), disabled: !row.active }}}
                        ampm={false}
                        minutesStep={5}
                      />
                    </Box>
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell>Duration (hrs)</TableCell>
                {data.map((row) => (
                  <TableCell key={`${row.stage}-duration`} align="center">
                    {row.active ? row.duration.toFixed(2) : '-'}
                  </TableCell>
                ))}
              </TableRow>
              {events.map((event) => (
                <TableRow key={event}>
                  <TableCell>{event}</TableCell>
                  {data.map((row, rowIndex) => (
                    <TableCell key={`${row.stage}-${event}`} align="center">
                      <Box display="flex" alignItems="center" justifyContent="center">
                        <IconButton onClick={() => handleEventChange(rowIndex, event, false)} disabled={!row.active}>
                          <Remove />
                        </IconButton>
                        <Typography>{row.events[event]}</Typography>
                        <IconButton onClick={() => handleEventChange(rowIndex, event, true)} disabled={!row.active}>
                          <Add />
                        </IconButton>
                      </Box>
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Container>
    </LocalizationProvider>
  );
};

export default App;